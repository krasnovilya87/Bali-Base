import { useEffect, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { BookingRequest, Listing } from '../../types';
import { filterDeletedListings, getStoredData, rememberDeletedListingId, saveStoredData } from '../../data';
import {
  db,
  deleteDocument,
  getDocument,
  LISTINGS_COLLECTION,
  sanitizeListingForFirestore,
  setDocument,
  syncWithFirebase,
  testConnection
} from '../../firebase';
import { normalizeHousingListingForImport } from '../../components/admin-dashboard/importListingNormalizer';
import { moderateListing } from '../../utils/aiModerationClient';
import { AI_MODERATION_RULES } from '../../utils/aiModerationRules';
import { uniqueDocumentIdFromTitle } from '../../utils/documentIds';
import {
  applyGoogleReviewsCacheToListing,
  readGoogleReviewsCacheForListingOrPlace,
  requestListingCreateGoogleReviewsRefresh
} from '../../utils/googlePlacesReviewsClient';
import { useAuth } from '../../auth/AuthContext';
import { sanitizeMenuOverrides } from '../menu';
import { t } from '../../i18n';

const getHousingListingCollection = (listing: Listing) => {
  if (listing.category !== 'housing') {
    throw new Error(`Listings from L1 "${listing.category}" are not stored in ${LISTINGS_COLLECTION}`);
  }
  return LISTINGS_COLLECTION;
};

const mergeGoogleReviewsCacheIntoListings = async (listings: Listing[]) => {
  const listingsWithPlaceIds = listings.filter(listing =>
    listing.category === 'housing' &&
    !listing.googleReviewsUpdatedAt &&
    (!Array.isArray(listing.reviews) || listing.reviews.length === 0) &&
    Boolean(listing.googlePlaceId || listing.placeId)
  );

  if (listingsWithPlaceIds.length === 0) return listings;

  const cachedListings = await Promise.all(
    listingsWithPlaceIds.map(async listing => {
      try {
        const cachedResponse = await readGoogleReviewsCacheForListingOrPlace(listing);
        return sanitizeListingForFirestore(
          applyGoogleReviewsCacheToListing(listing, cachedResponse)
        ) as Listing;
      } catch (error) {
        console.warn('Failed to read Google reviews cache for listing:', listing.id, error);
        return listing;
      }
    })
  );
  const cachedById = new Map(cachedListings.map(listing => [listing.id, listing]));

  return listings.map(listing => cachedById.get(listing.id) || listing);
};

export const useListingsData = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [menuOverrides, setMenuOverrides] = useState<any>({ l1: {}, l2: {} });

  useEffect(() => {
    const loaded = getStoredData();
    const loadedBookings = loaded.bookings.filter(isBookingStored);
    setListings(loaded.listings);
    setBookings(loadedBookings);

    const savedOverrides = localStorage.getItem('bali_base_menu_overrides');
    if (savedOverrides) {
      try {
        const parsed = JSON.parse(savedOverrides);
        setMenuOverrides(sanitizeMenuOverrides(parsed));
      } catch (e) {
        console.error('Error parsing local menu overrides', e);
      }
    }

    const initFirebase = async () => {
      await testConnection();
      let syncPassed = false;
      try {
        const synced = await syncWithFirebase();
        const visibleListings = filterDeletedListings(
          await mergeGoogleReviewsCacheIntoListings(synced.listings)
        );
        const visibleBookings = synced.bookings.filter(isBookingStored);
        setListings(visibleListings);
        setBookings(visibleBookings);
        saveStoredData(visibleListings, visibleBookings);
        console.log('Firebase synced successfully');
        syncPassed = true;
      } catch (err) {
        console.error('Firebase synchronisation failed, running in local mode', err);
      }

      if (syncPassed) {
        try {
          const loadedOverrides = await getDocument('configs', 'menu_overrides');
          if (loadedOverrides) {
            const sanitized = sanitizeMenuOverrides(loadedOverrides);
            setMenuOverrides(sanitized);
            localStorage.setItem('bali_base_menu_overrides', JSON.stringify(sanitized));
          }
        } catch (err) {
          console.warn('Failed to fetch menu overrides from Firestore, using local cache/defaults', err);
        }
      }
    };
    initFirebase();
  }, []);

  const saveUpdatedState = (newListings: Listing[], newBookings: BookingRequest[]) => {
    const newVisibleBookings = newBookings.filter(isBookingStored);
    setListings(newListings);
    setBookings(newVisibleBookings);
    saveStoredData(newListings, newVisibleBookings);
  };

  const handleUpdateMenuOverrides = async (newOverrides: any) => {
    const sanitized = sanitizeMenuOverrides(newOverrides);
    setMenuOverrides(sanitized);
    localStorage.setItem('bali_base_menu_overrides', JSON.stringify(sanitized));
    try {
      await setDocument('configs', 'menu_overrides', sanitized);
    } catch (e) {
      console.error('Failed to sync menu overrides with Firestore', e);
    }
  };

  const handleToggleListingStatus = (id: string) => {
    const updated = listings.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'active' ? 'paused' : 'active';
        const nextItem = {
          ...item,
          status: nextStatus as Listing['status']
        };
        const listingForSave = nextStatus === 'active' && nextItem.category === 'housing'
          ? normalizeHousingListingForImport(nextItem, 0)
          : nextItem;
        const targetId = uniqueDocumentIdFromTitle(
          listingForSave.title,
          listings.filter(listing => listing.id !== item.id).map(listing => listing.id)
        );
        const finalListing = sanitizeListingForFirestore({ ...listingForSave, id: targetId }) as Listing;
        if (targetId !== item.id) deleteDocument(LISTINGS_COLLECTION, item.id);
        setDocument(LISTINGS_COLLECTION, targetId, finalListing);
        return finalListing;
      }
      return item;
    });
    saveUpdatedState(updated, bookings);
  };

  const refreshGoogleReviewsForListing = async (
    listing: Listing,
    purpose: 'listing_create' | 'listing_update'
  ) => {
    const placeId = listing.googlePlaceId || listing.placeId;
    if (!placeId) {
      console.warn('Google Places reviews refresh skipped: listing has no googlePlaceId/placeId.');
      return listing;
    }

    const reviewsResponse = await requestListingCreateGoogleReviewsRefresh({
      listingId: listing.id,
      placeId,
      googleReviewsUpdatedAt: listing.googleReviewsUpdatedAt,
      purpose
    });
    const refreshedListing = sanitizeListingForFirestore(
      applyGoogleReviewsCacheToListing(listing, reviewsResponse)
    ) as Listing;

    if (refreshedListing.googleReviewsUpdatedAt || refreshedListing.reviews?.length > 0) {
      return refreshedListing;
    }

    const cachedResponse = await readGoogleReviewsCacheForListingOrPlace(listing);

    return sanitizeListingForFirestore(
      applyGoogleReviewsCacheToListing(listing, cachedResponse)
    ) as Listing;
  };

  const handleUpdateListing = async (updatedListing: Listing) => {
    const listingForSave = updatedListing.category === 'housing'
      ? normalizeHousingListingForImport(updatedListing, 0)
      : updatedListing;
    const targetId = uniqueDocumentIdFromTitle(
      listingForSave.title,
      listings.filter(listing => listing.id !== updatedListing.id).map(listing => listing.id)
    );
    let finalListing = sanitizeListingForFirestore({ ...listingForSave, id: targetId }) as Listing;
    if (targetId !== updatedListing.id) {
      await deleteDocument(LISTINGS_COLLECTION, updatedListing.id);
    }

    const optimisticListings = listings.map(item =>
      item.id === updatedListing.id ? finalListing : item
    );
    saveUpdatedState(optimisticListings, bookings);

    await setDocument(LISTINGS_COLLECTION, targetId, finalListing);
    if (finalListing.status === 'rejected') {
      return;
    }

    finalListing = await refreshGoogleReviewsForListing(finalListing, 'listing_update');
    if (finalListing.googleReviewsUpdatedAt) {
      await setDocument(LISTINGS_COLLECTION, targetId, finalListing);
    }

    const updated = listings.map(item =>
      item.id === updatedListing.id ? finalListing : item
    );
    saveUpdatedState(updated, bookings);
  };

  const handleDeleteListing = (id: string) => {
    rememberDeletedListingId(id);
    const updated = listings.filter(item => item.id !== id);
    saveUpdatedState(updated, bookings);
    deleteDocument(LISTINGS_COLLECTION, id).catch(err => {
      console.error('Failed to delete listing from Firestore', err);
    });
  };

  const handleUpdateBookingStatus = (id: string, status: 'accepted' | 'declined') => {
    const updated = bookings.map(booking => {
      if (booking.id === id) {
        const nextBooking = {
          ...booking,
          status,
          declinedAt: status === 'declined' ? new Date().toISOString() : undefined
        };
        setDocument('bookings', booking.id, nextBooking);
        return nextBooking;
      }
      return booking;
    });
    saveUpdatedState(listings, updated);
  };

  const handleUpdateBooking = (updatedBooking: BookingRequest) => {
    const updated = bookings.map(booking => {
      if (booking.id === updatedBooking.id) {
        setDocument('bookings', updatedBooking.id, updatedBooking);
        return updatedBooking;
      }
      return booking;
    });
    saveUpdatedState(listings, updated);
  };

  const handleAddBooking = (newBooking: BookingRequest) => {
    const bookingCreatedAt = new Date(newBooking.createdAt).getTime();
    const listingActivityAt = Number.isFinite(bookingCreatedAt)
      ? newBooking.createdAt
      : new Date().toISOString();
    let touchedListing: Listing | undefined;
    const updatedListings = listings.map(listing => {
      if (listing.id !== newBooking.listingId) return listing;
      touchedListing = {
        ...listing,
        pushedAt: listingActivityAt
      };
      return touchedListing;
    });
    const updated = [newBooking, ...bookings];
    setDocument('bookings', newBooking.id, newBooking);
    if (touchedListing) {
      setDocument(LISTINGS_COLLECTION, touchedListing.id, sanitizeListingForFirestore(touchedListing));
    }
    saveUpdatedState(updatedListings, updated);
  };

  const handlePublishListing = async (newListing: Listing) => {
    const collectionPath = getHousingListingCollection(newListing);
    const listingId = uniqueDocumentIdFromTitle(
      newListing.title,
      listings.filter(listing => listing.id !== newListing.id).map(listing => listing.id)
    );
    let moderatedListing = newListing;
    try {
      const aiModeration = await moderateListing({ ...newListing, id: listingId });
      const failedCheck = aiModeration.checks.find(check => !check.passed);
      const failedRule = failedCheck
        ? AI_MODERATION_RULES.find(rule => rule.id === failedCheck.id)
        : undefined;
      const rejectionReason = failedRule
        ? t('EN', failedRule.rejectionReasonKey)
        : t('EN', 'admin.reject.reason.other');
      const shouldPublish = aiModeration.status === 'passed';
      moderatedListing = {
        ...newListing,
        aiModeration,
        isApproved: shouldPublish,
        isVerified: newListing.isVerified ?? false,
        status: shouldPublish ? 'active' : 'moderation',
        rejectionReason: shouldPublish ? undefined : rejectionReason,
        rejectionComment: undefined
      };
    } catch (error) {
      console.warn('AI moderation failed; listing was sent to manual review.', error);
      moderatedListing = {
        ...newListing,
        aiModeration: {
          status: 'error',
          checkedAt: new Date().toISOString(),
          checks: []
        },
        isApproved: false,
        isVerified: newListing.isVerified ?? false,
        status: 'moderation'
      };
    }

    let listingForSave = sanitizeListingForFirestore({
      ...moderatedListing,
      id: listingId,
      ownerId: user?.uid || moderatedListing.ownerId
    }) as Listing;
    const exists = listings.some(listing => listing.id === newListing.id);
    if (exists && listingForSave.id !== newListing.id) {
      await deleteDocument(collectionPath, newListing.id);
    }
    await setDocument(collectionPath, listingForSave.id, listingForSave);
    if (user?.uid) {
      await setDoc(doc(db, 'users', user.uid), {
        contactName: listingForSave.ownerName,
        contactPhone: listingForSave.whatsappNumber,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    const listingWithReviews = await refreshGoogleReviewsForListing(listingForSave, 'listing_create');
    if (listingWithReviews.googleReviewsUpdatedAt) {
      listingForSave = listingWithReviews;
      await setDocument(collectionPath, listingForSave.id, listingForSave);
    }

    const updated = exists
      ? listings.map(listing => listing.id === newListing.id ? listingForSave : listing)
      : [listingForSave, ...listings];
    saveUpdatedState(updated, bookings);
  };

  return {
    bookings,
    handleAddBooking,
    handleDeleteListing,
    handlePublishListing,
    handleToggleListingStatus,
    handleUpdateBooking,
    handleUpdateBookingStatus,
    handleUpdateListing,
    handleUpdateMenuOverrides,
    listings,
    menuOverrides
  };
};

function isBookingStored(booking: BookingRequest) {
  if (booking.status !== 'declined') return true;
  const declinedAt = booking.declinedAt || booking.createdAt;
  return Date.now() - new Date(declinedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}
