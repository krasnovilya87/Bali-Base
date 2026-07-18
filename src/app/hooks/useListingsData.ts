import { useEffect, useState } from 'react';
import { BookingRequest, Listing } from '../../types';
import { filterDeletedListings, getStoredData, rememberDeletedListingId, saveStoredData } from '../../data';
import {
  deleteDocument,
  getDocument,
  LISTINGS_COLLECTION,
  sanitizeListingForFirestore,
  setDocument,
  syncWithFirebase,
  testConnection
} from '../../firebase';
import { normalizeHousingListingForImport } from '../../components/admin-dashboard/importListingNormalizer';
import { uniqueDocumentIdFromTitle } from '../../utils/documentIds';
import { applyGoogleReviewsCacheToListing, requestListingCreateGoogleReviewsRefresh } from '../../utils/googlePlacesReviewsClient';
import { useAuth } from '../../auth/AuthContext';
import { sanitizeMenuOverrides } from '../menu';

const getHousingListingCollection = (listing: Listing) => {
  if (listing.category !== 'housing') {
    throw new Error(`Listings from L1 "${listing.category}" are not stored in ${LISTINGS_COLLECTION}`);
  }
  return LISTINGS_COLLECTION;
};

export const useListingsData = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [menuOverrides, setMenuOverrides] = useState<any>({ l1: {}, l2: {} });

  useEffect(() => {
    const loaded = getStoredData();
    setListings(loaded.listings);
    setBookings(loaded.bookings);

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
        const visibleListings = filterDeletedListings(synced.listings);
        setListings(visibleListings);
        setBookings(synced.bookings);
        saveStoredData(visibleListings, synced.bookings);
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
    setListings(newListings);
    setBookings(newBookings);
    saveStoredData(newListings, newBookings);
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

    return sanitizeListingForFirestore(
      applyGoogleReviewsCacheToListing(listing, reviewsResponse)
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

    await setDocument(LISTINGS_COLLECTION, targetId, finalListing);
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
        const nextBooking = { ...booking, status };
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
    const updated = [newBooking, ...bookings];
    setDocument('bookings', newBooking.id, newBooking);
    saveUpdatedState(listings, updated);
  };

  const handlePublishListing = async (newListing: Listing) => {
    const collectionPath = getHousingListingCollection(newListing);
    const listingId = uniqueDocumentIdFromTitle(
      newListing.title,
      listings.filter(listing => listing.id !== newListing.id).map(listing => listing.id)
    );
    let listingForSave = sanitizeListingForFirestore({
      ...newListing,
      id: listingId,
      ownerId: user?.uid || newListing.ownerId
    }) as Listing;
    const exists = listings.some(listing => listing.id === newListing.id);
    if (exists && listingForSave.id !== newListing.id) {
      await deleteDocument(collectionPath, newListing.id);
    }
    await setDocument(collectionPath, listingForSave.id, listingForSave);

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
