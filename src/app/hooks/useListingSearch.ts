import { useMemo } from 'react';
import { MOCK_GUIDES } from '../../data';
import { FilterState, Listing } from '../../types';
import { findDistrictByCoordsSync, getDefaultDistrictCoordsSync, getListingCoords, isPointInPolygon } from '../../utils/geo';
import { isListingFresh } from '../../utils/listingFreshness';

type MapPoint = { x: number; y: number };
export type SearchGuide = (typeof MOCK_GUIDES)[number];

const latLngToSvgPoint = (coords: { lat: number; lng: number }): MapPoint => ({
  x: Math.round(446.688 * coords.lng - 51241.25),
  y: Math.round(-515.132 * coords.lat - 4214.91)
});

const getListingMapPoint = (item: Listing): MapPoint => {
  const coords = getListingCoords(item);
  return latLngToSvgPoint(coords);
};

export interface ListingSearchSuggestions {
  housing: Listing[];
  transport: Listing[];
  guides: SearchGuide[];
}

interface UseListingSearchParams {
  listings: Listing[];
  currentL1: string;
  currentL2: string[];
  districtSearch: string[];
  customPoint: MapPoint | null;
  customRadius: number;
  customPolygon: MapPoint[] | null;
  searchTerm: string;
  filters: FilterState;
  sortBy: string;
  favoriteIds: Set<string>;
  checkInDate?: string;
  checkOutDate?: string;
}

const getSelectedDayCount = (checkInDate?: string, checkOutDate?: string) => {
  if (!checkInDate || !checkOutDate) return 1;
  const start = new Date(`${checkInDate}T00:00:00`);
  const end = new Date(`${checkOutDate}T00:00:00`);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

const getActiveDailyPrice = (item: Listing) => (
  item.hasDropPrice && item.dropPricePerDay ? item.dropPricePerDay : item.pricePerDay
);

const getComparablePrice = (item: Listing, selectedDayCount: number) => {
  const activeDailyPrice = getActiveDailyPrice(item);
  return activeDailyPrice * selectedDayCount;
};

export const useListingSearch = ({
  listings,
  currentL1,
  currentL2,
  districtSearch,
  customPoint,
  customRadius,
  customPolygon,
  searchTerm,
  filters,
  sortBy,
  favoriteIds,
  checkInDate,
  checkOutDate
}: UseListingSearchParams) => {
  const selectedDayCount = getSelectedDayCount(checkInDate, checkOutDate);
  const effectivePriceMax = filters.priceMax === 30000000
    ? Math.max(30000000, selectedDayCount * 1000000)
    : filters.priceMax;

  const filteredListings = useMemo(() => listings.filter(item => {
    if (item.status !== 'active') return false;
    if (item.category !== currentL1) return false;
    if (currentL2.length > 0 && !currentL2.includes(item.subCategory)) return false;
    if (filters.favoritesOnly && !favoriteIds.has(item.id)) return false;

    if (customPolygon && customPolygon.length >= 3) {
      if (!isPointInPolygon(getListingMapPoint(item), customPolygon)) return false;
    } else if (customPoint) {
      const coord = getListingMapPoint(item);
      const dx = coord.x - customPoint.x;
      const dy = coord.y - customPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > customRadius) return false;
    } else if (districtSearch.length > 0) {
      const listingCoords = getListingCoords(item);
      const listingDistrict = findDistrictByCoordsSync(listingCoords.lat, listingCoords.lng);
      if (!listingDistrict || !districtSearch.includes(listingDistrict)) return false;
    }

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(query);
      const inDesc = item.description.toLowerCase().includes(query);
      const inDistrict = item.district.toLowerCase().includes(query);
      if (!inTitle && !inDesc && !inDistrict) return false;
    }

    const comparablePrice = getComparablePrice(item, selectedDayCount);
    if (comparablePrice < filters.priceMin || comparablePrice > effectivePriceMax) return false;

    if (item.distanceToSeaMinutes !== undefined) {
      if (item.distanceToSeaMinutes < (filters.distanceToSeaMin || 0) || item.distanceToSeaMinutes > filters.distanceToSeaMax) {
        return false;
      }
    }

    if (filters.isNewOnly && !isListingFresh(item)) return false;

    if (filters.cleanlinessTags.length > 0) {
      const matchAllClean = filters.cleanlinessTags.every(tag => {
        if (tag === 'Approved') return item.isApproved;
        const revLabels = item.reviews ? item.reviews.flatMap(r => r.cleanlinessLabels || []) : [];
        return revLabels.includes(tag);
      });
      if (!matchAllClean) return false;
    }

    if (filters.isApprovedOnly && !item.isApproved) return false;
    if (filters.hasDropPriceOnly && !item.hasDropPrice) return false;
    if (filters.interiorStyle.length > 0 && !filters.interiorStyle.includes(item.interiorStyle)) return false;
    if (filters.housingType.length > 0 && item.housingType && !filters.housingType.includes(item.housingType)) return false;
    if (filters.territoryType.length > 0 && item.territoryType && !filters.territoryType.includes(item.territoryType)) return false;
    if (filters.densityType.length > 0 && item.densityType && !filters.densityType.includes(item.densityType)) return false;
    if (filters.wallMaterial.length > 0 && item.wallMaterial && !filters.wallMaterial.includes(item.wallMaterial)) return false;
    if (filters.bedType.length > 0 && item.bedType && !filters.bedType.includes(item.bedType)) return false;
    if (filters.kitchenType.length > 0 && item.kitchenType && !filters.kitchenType.includes(item.kitchenType)) return false;

    if (filters.poolType.length > 0) {
      if (!item.poolType || item.poolType === 'none') return false;

      if (filters.poolType.includes('infinity') && item.poolType !== 'infinity') return false;

      if (filters.poolType.includes('shared')) {
        const isShared = item.poolType === 'shared' || (item.poolType === 'infinity' && item.territoryType === 'shared');
        if (!isShared) return false;
      }

      if (filters.poolType.includes('private')) {
        const isPrivate = item.poolType === 'private' || (item.poolType === 'infinity' && item.territoryType === 'private');
        if (!isPrivate) return false;
      }
    }

    if (filters.internetSpeedMin > 0 && (item.internetSpeed === undefined || item.internetSpeed < filters.internetSpeedMin)) return false;
    if (filters.bathroomType.length > 0 && item.bathroomType && !filters.bathroomType.includes(item.bathroomType)) return false;

    if (filters.bathroomOptions.length > 0) {
      const hasAllBathOpts = filters.bathroomOptions.every(opt => item.bathroomOptions && item.bathroomOptions.includes(opt));
      if (!hasAllBathOpts) return false;
    }

    if (item.roomsTotal !== undefined) {
      if (item.roomsTotal < filters.roomsMin || item.roomsTotal > filters.roomsMax) return false;
    }

    if (filters.cleaningFrequency.length > 0 && item.cleaningFrequency && !filters.cleaningFrequency.includes(item.cleaningFrequency)) return false;

    if (filters.amenities.length > 0) {
      const hasAll = filters.amenities.every(amen => item.amenities && item.amenities.includes(amen));
      if (!hasAll) return false;
    }

    if (filters.viewType.length > 0 && item.viewType && !filters.viewType.includes(item.viewType)) return false;

    return true;
  }), [
    currentL1,
    currentL2,
    customPoint,
    customPolygon,
    customRadius,
    districtSearch,
    effectivePriceMax,
    favoriteIds,
    filters,
    listings,
    searchTerm,
    selectedDayCount
  ]);

  const sortedListings = useMemo(() => [...filteredListings].sort((a, b) => {
    if (a.isPromoTurbo && !b.isPromoTurbo) return -1;
    if (!a.isPromoTurbo && b.isPromoTurbo) return 1;
    if (sortBy === 'price_asc') {
      const pa = getComparablePrice(a, selectedDayCount);
      const pb = getComparablePrice(b, selectedDayCount);
      return pa - pb;
    }
    if (sortBy === 'price_desc') {
      const pa = getComparablePrice(a, selectedDayCount);
      const pb = getComparablePrice(b, selectedDayCount);
      return pb - pa;
    }
    if (sortBy === 'distance_sea') {
      const distA = a.distanceToSeaMinutes ?? 15;
      const distB = b.distanceToSeaMinutes ?? 15;
      return distA - distB;
    }
    if (sortBy === 'distance_point') {
      const pt = customPoint ?? latLngToSvgPoint(getDefaultDistrictCoordsSync());
      const coordA = getListingMapPoint(a);
      const coordB = getListingMapPoint(b);
      const distSqrA = Math.pow(coordA.x - pt.x, 2) + Math.pow(coordA.y - pt.y, 2);
      const distSqrB = Math.pow(coordB.x - pt.x, 2) + Math.pow(coordB.y - pt.y, 2);
      return distSqrA - distSqrB;
    }
    if (sortBy === 'newest') return Number(isListingFresh(b)) - Number(isListingFresh(a));
    if (sortBy === 'approved') return a.isApproved ? -1 : 1;
    if (sortBy === 'drop_price') return a.hasDropPrice ? -1 : 1;

    const pushA = a.pushedAt ? new Date(a.pushedAt).getTime() : 0;
    const pushB = b.pushedAt ? new Date(b.pushedAt).getTime() : 0;
    if (pushA !== pushB) return pushB - pushA;

    return b.viewsCount - a.viewsCount;
  }), [customPoint, filteredListings, selectedDayCount, sortBy]);

  const suggestions = useMemo<ListingSearchSuggestions | null>(() => {
    if (searchTerm.length < 2) return null;
    const query = searchTerm.toLowerCase();

    const matchedHousing = listings.filter(item =>
      item.category === 'housing' &&
      (item.title.toLowerCase().includes(query) || item.district.toLowerCase().includes(query))
    );

    const matchedTransport = listings.filter(item =>
      item.category === 'transport' &&
      (item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query))
    );

    const matchedGuides = MOCK_GUIDES.filter(guide =>
      guide.title.toLowerCase().includes(query) || guide.description.toLowerCase().includes(query)
    );

    return {
      housing: matchedHousing.slice(0, 3),
      transport: matchedTransport.slice(0, 3),
      guides: matchedGuides.slice(0, 3)
    };
  }, [listings, searchTerm]);

  return {
    filteredListings,
    sortedListings,
    suggestions
  };
};
