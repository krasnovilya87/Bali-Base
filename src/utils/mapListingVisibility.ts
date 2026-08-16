import { Listing } from '../types';
import { isListingFresh } from './listingFreshness';
import { isListingVerified } from './listingVerification';

export type MapListingVisibilityCandidate = {
  item: Listing;
  coords: { lat: number; lng: number };
  price: number;
};

export type MapBoundsSnapshot = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapViewportSnapshot = {
  width: number;
  height: number;
  zoom: number;
  bounds: MapBoundsSnapshot;
};

export type MapListingVisibilityOptions = {
  viewport: MapViewportSnapshot | null;
  sessionPenalties?: Record<string, number>;
  searchQuery?: string;
  pinnedIds?: Set<string>;
  cellWidthPx?: number;
  cellHeightPx?: number;
  minCollisionDistancePx?: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const normalizeByMax = (value: number, max: number) => {
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(max) || max <= 0) return 0;
  return clamp01(value / max);
};

const getCompletenessScore = (listing: Listing) => {
  const fields = [
    listing.title,
    listing.description,
    listing.district,
    listing.address,
    listing.pricePerDay,
    listing.images?.length,
    listing.locationCoords,
    listing.whatsappNumber
  ];
  const filled = fields.filter(Boolean).length;
  return filled / fields.length;
};

const getQualityScore = (listing: Listing) => {
  const ratingScore = clamp01(((listing.rating || 0) - 3) / 2);
  const reviewsScore = clamp01(Math.log1p(listing.reviewsCount || 0) / Math.log1p(60));
  const photosScore = clamp01((listing.images?.length || 0) / 8);
  const approvedScore = isListingVerified(listing) ? 1 : 0.55;
  const completenessScore = getCompletenessScore(listing);

  return (
    ratingScore * 0.28 +
    reviewsScore * 0.2 +
    photosScore * 0.18 +
    approvedScore * 0.18 +
    completenessScore * 0.16
  );
};

const getRelevanceScore = (listing: Listing, searchQuery?: string) => {
  const query = searchQuery?.trim().toLowerCase();
  if (!query) return 1;

  const title = listing.title.toLowerCase();
  const description = listing.description.toLowerCase();
  const district = listing.district.toLowerCase();
  const category = `${listing.category} ${listing.subCategory}`.toLowerCase();

  if (title.includes(query)) return 1;
  if (district.includes(query)) return 0.85;
  if (category.includes(query)) return 0.75;
  if (description.includes(query)) return 0.65;

  const tokens = query.split(/\s+/).filter(Boolean);
  if (!tokens.length) return 1;

  const searchableText = `${title} ${description} ${district} ${category}`;
  const matchedTokens = tokens.filter(token => searchableText.includes(token)).length;
  return clamp01((matchedTokens / tokens.length) * 0.65);
};

const getFreshnessScore = (listing: Listing) => {
  if (listing.pushedAt) {
    const ageDays = (Date.now() - new Date(listing.pushedAt).getTime()) / 86400000;
    if (Number.isFinite(ageDays)) return clamp01(1 - ageDays / 30);
  }

  if (listing.createdAt) {
    const ageDays = (Date.now() - new Date(listing.createdAt).getTime()) / 86400000;
    if (Number.isFinite(ageDays)) return clamp01(1 - ageDays / 45);
  }

  return isListingFresh(listing) ? 0.85 : 0.35;
};

const getPromotionScore = (listing: Listing) => {
  const promoScore =
    (listing.isPromoTurbo ? 0.4 : 0) +
    (listing.isPromoPremium ? 0.35 : 0) +
    (listing.isPromoTop ? 0.2 : 0) +
    (listing.reachMultiplier && listing.reachMultiplier > 1 ? 0.05 : 0);

  return clamp01(promoScore);
};

export const calculateMapScore = ({
  listing,
  maxViews,
  maxClicks,
  searchQuery,
  sessionPenalty = 0
}: {
  listing: Listing;
  maxViews: number;
  maxClicks: number;
  searchQuery?: string;
  sessionPenalty?: number;
}) => {
  const popularityScore =
    normalizeByMax(Math.log1p(listing.viewsCount || 0), Math.log1p(maxViews || 0)) * 0.58 +
    normalizeByMax(Math.log1p(listing.clicksCount || 0), Math.log1p(maxClicks || 0)) * 0.42;

  const baseScore =
    getQualityScore(listing) * 0.35 +
    popularityScore * 0.25 +
    getRelevanceScore(listing, searchQuery) * 0.2 +
    getFreshnessScore(listing) * 0.1 +
    getPromotionScore(listing) * 0.1;

  return clamp01(baseScore - sessionPenalty);
};

const latLngToWorldPoint = (coords: { lat: number; lng: number }, zoom: number) => {
  const siny = Math.max(-0.9999, Math.min(0.9999, Math.sin((coords.lat * Math.PI) / 180)));
  const scale = 256 * Math.pow(2, zoom);

  return {
    x: ((coords.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) * scale
  };
};

const getScreenPoint = (
  coords: { lat: number; lng: number },
  viewport: MapViewportSnapshot
) => {
  const northWest = latLngToWorldPoint({ lat: viewport.bounds.north, lng: viewport.bounds.west }, viewport.zoom);
  const point = latLngToWorldPoint(coords, viewport.zoom);
  return {
    x: point.x - northWest.x,
    y: point.y - northWest.y
  };
};

const isInsideViewport = (point: { x: number; y: number }, viewport: MapViewportSnapshot) => (
  point.x >= -120 &&
  point.y >= -120 &&
  point.x <= viewport.width + 120 &&
  point.y <= viewport.height + 120
);

export const selectVisibleMapListings = (
  candidates: MapListingVisibilityCandidate[],
  options: MapListingVisibilityOptions
) => {
  const {
    viewport,
    sessionPenalties = {},
    searchQuery,
    pinnedIds = new Set<string>(),
    cellWidthPx = 100,
    cellHeightPx = 70,
    minCollisionDistancePx = 72
  } = options;

  if (!viewport) return candidates;

  const maxViews = Math.max(...candidates.map(({ item }) => item.viewsCount || 0), 0);
  const maxClicks = Math.max(...candidates.map(({ item }) => item.clicksCount || 0), 0);
  const scoredCandidates = candidates
    .map(candidate => {
      const point = getScreenPoint(candidate.coords, viewport);
      return {
        ...candidate,
        point,
        mapScore: calculateMapScore({
          listing: candidate.item,
          maxViews,
          maxClicks,
          searchQuery,
          sessionPenalty: sessionPenalties[candidate.item.id] || 0
        })
      };
    })
    .filter(candidate => isInsideViewport(candidate.point, viewport));

  const cellWinners = new Map<string, (typeof scoredCandidates)[number]>();
  scoredCandidates.forEach(candidate => {
    const cellX = Math.floor(candidate.point.x / cellWidthPx);
    const cellY = Math.floor(candidate.point.y / cellHeightPx);
    const key = `${cellX}:${cellY}`;
    const current = cellWinners.get(key);

    if (!current || candidate.mapScore > current.mapScore) {
      cellWinners.set(key, candidate);
    }
  });

  const selected: typeof scoredCandidates = [];
  const pinned = scoredCandidates.filter(candidate => pinnedIds.has(candidate.item.id));
  const regular = Array.from(cellWinners.values())
    .filter(candidate => !pinnedIds.has(candidate.item.id))
    .sort((a, b) => b.mapScore - a.mapScore);

  [...pinned, ...regular].forEach(candidate => {
    if (pinnedIds.has(candidate.item.id)) {
      selected.push(candidate);
      return;
    }

    const hasCollision = selected.some(active => {
      const dx = active.point.x - candidate.point.x;
      const dy = active.point.y - candidate.point.y;
      return Math.sqrt(dx * dx + dy * dy) < minCollisionDistancePx;
    });

    if (!hasCollision) {
      selected.push(candidate);
    }
  });

  const selectedIds = new Set(selected.map(candidate => candidate.item.id));
  return candidates.filter(candidate => selectedIds.has(candidate.item.id));
};
