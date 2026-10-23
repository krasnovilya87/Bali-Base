import type { Listing } from '../types';
import { calculateNearbySpotsOnce, NEARBY_SEARCHES_PER_CALCULATION } from './nearbyPlaces';
import { loadGoogleUsageStats } from './googleUsageClient';
import { getHaversineDistance } from './geo';

// Listings that skipped the create wizard (bulk imports) get their nearby spots when an admin
// approves them, unless the month's Places nearby-search usage would pass 80% of the free cap.
const NEARBY_USAGE_LABEL = 'Places: nearby search';
const QUOTA_GUARD_SHARE = 0.8;

// Cloud Monitoring lags a few minutes; count this session's searches on top of it.
let sessionSearches = 0;

// Units of one complex share a title and location, so their nearby spots are copied instead of
// searched again. Generic titles ("2-Bedroom Villa in Canggu") repeat across the island, hence
// the distance check.
const SAME_OBJECT_MAX_KM = 0.5;
const calculatedThisSession: Listing[] = [];

const normalizeTitle = (title: string) => title.trim().toLowerCase();

const findSameObjectSpots = (listing: Listing, knownListings: Listing[]) => {
  const title = normalizeTitle(listing.title);
  const origin = listing.locationCoords!;
  return [...calculatedThisSession, ...knownListings].find(other =>
    other.id !== listing.id
    && other.nearbySpots?.length
    && other.locationCoords
    && normalizeTitle(other.title) === title
    && getHaversineDistance(origin, other.locationCoords) <= SAME_OBJECT_MAX_KM
  );
};

export type ApprovalNearbyResult = {
  listing: Listing;
  nearby: 'added' | 'copied' | 'empty' | 'not_needed' | 'skipped_quota' | 'skipped_error';
};

export const addNearbySpotsForApproval = async (
  listing: Listing,
  knownListings: Listing[] = []
): Promise<ApprovalNearbyResult> => {
  const supportsNearby = listing.category === 'housing' || listing.category === 'investments';
  if (!supportsNearby || !listing.locationCoords || listing.nearbySpots?.length) {
    return { listing, nearby: 'not_needed' };
  }

  const twin = findSameObjectSpots(listing, knownListings);
  if (twin) {
    return {
      listing: {
        ...listing,
        nearbySpots: twin.nearbySpots,
        nearbySpotsUpdatedAt: twin.nearbySpotsUpdatedAt || new Date().toISOString(),
        nearbySpotsStatus: 'ready',
        nearbySpotsError: undefined
      },
      nearby: 'copied'
    };
  }

  try {
    const usage = await loadGoogleUsageStats();
    const row = usage.rows.find(item => item.label === NEARBY_USAGE_LABEL);
    const projected = (row?.count || 0) + sessionSearches + NEARBY_SEARCHES_PER_CALCULATION;
    if (!row || projected > row.freeCap * QUOTA_GUARD_SHARE) return { listing, nearby: 'skipped_quota' };
  } catch (error) {
    console.warn('Google usage unavailable; nearby spots skipped for approval', error);
    return { listing, nearby: 'skipped_quota' };
  }

  try {
    sessionSearches += NEARBY_SEARCHES_PER_CALCULATION;
    const nearbySpots = await calculateNearbySpotsOnce(listing.locationCoords, listing.district, {
      includeRating: listing.category !== 'investments'
    });
    if (!nearbySpots.length) {
      return {
        listing: { ...listing, nearbySpotsStatus: 'empty', nearbySpotsError: 'Google Places returned no nearby spots' },
        nearby: 'empty'
      };
    }
    const withSpots: Listing = {
      ...listing,
      nearbySpots,
      nearbySpotsUpdatedAt: new Date().toISOString(),
      nearbySpotsStatus: 'ready',
      nearbySpotsError: undefined
    };
    calculatedThisSession.push(withSpots);
    return { listing: withSpots, nearby: 'added' };
  } catch (error) {
    console.warn('Nearby spots calculation failed during approval', error);
    return { listing, nearby: 'skipped_error' };
  }
};
