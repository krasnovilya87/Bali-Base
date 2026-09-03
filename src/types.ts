export interface Review {
  id: string;
  authorName: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  textLanguageCode?: string;
  originalText?: string;
  originalLanguageCode?: string;
  relativePublishTimeDescription?: string;
  cleanlinessLabels?: string[];
}

export interface Coordinates {
  lat: number;
  lng: number;
  name: string;
  type: 'supermarket' | 'restaurant' | 'gym' | 'sunset' | 'nightclub';
}

export interface ListingNearbySpot {
  emoji: string;
  title: string;
  desc: string;
  time?: string;
  note?: string;
  position?: LatLng;
  placeId?: string;
  rating?: number;
  route?: ListingNearbyRoute;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AiModerationCheck {
  id: string;
  passed: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface AiModerationResult {
  status: 'passed' | 'manual_review' | 'error';
  checkedAt: string;
  model?: string;
  summary?: string;
  checks: AiModerationCheck[];
}

export interface ListingNearbyRoute {
  overviewPath: LatLng[];
  distanceText?: string;
  durationText?: string;
  travelMode?: 'DRIVING';
  updatedAt: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  // Category L1
  category: 'housing' | 'transport' | 'investments' | 'services' | 'ads' | 'afisha' | 'life' | 'info' | 'useful';
  // Category L2
  subCategory: string; // e.g. 'entire_place' | 'private_suite' | 'private_room' for housing, 'scooters' | 'motorcycles' | 'cars' for transport
  title: string;
  description: string;
  district: string; // District name from area.geojson
  address: string;
  locationCoords?: LatLng;
  googlePlaceId?: string;
  placeId?: string;
  googleReviewsUpdatedAt?: string;
  images: string[];
  photoSlotAssignments?: Partial<Record<string, string[]>>;
  realPhotoUrls?: string[];
  rating: number;
  reviewsCount: number;
  reviews: Review[];
  
  // Badges & status
  isApproved: boolean; // Approved
  isVerified?: boolean;
  isNew: boolean;
  status: 'active' | 'paused' | 'draft' | 'moderation' | 'rejected';
  rejectionReason?: string;
  rejectionComment?: string;
  aiModeration?: AiModerationResult;
  expirationDate?: string;
  
  // Pricing configuration
  pricePerDay: number; // in IDR
  pricePerMonth?: number; // in IDR
  listingDepositAmount?: number; // in IDR
  bookingComPrice?: number; // in IDR, used for direct comparison
  competitorPlatform?: 'Booking' | 'Airbnb' | 'Agoda' | 'Trip.com' | 'Traveloka' | 'Only Facebook';
  competitorUrl?: string;
  
  // Drop price feature
  hasDropPrice: boolean;
  dropPricePerDay?: number;
  dropPricePerMonth?: number;
  dropPriceEndsAt?: string; // ISO string 
  
  // Specific parameters (for filtering and formulas)
  roomsTotal?: number;
  bedroomsCount?: number;
  wallMaterial?: 'wood' | 'concrete';
  territoryType?: 'private' | 'shared' | 'resort';
  densityType?: 'cozy' | 'medium' | 'large'; // cozy (<=4 rooms), medium (5-10), large (10+)
  bedType?: string;
  bedTypes?: string[];
  roomCount?: number;
  roomNumber?: string;
  roomNumbers?: string[];
  roomType?: 'standard' | 'deluxe' | 'super_deluxe' | 'family';
  unitType?: 'type_1' | 'type_2' | 'type_3' | 'type_4';
  kitchenType?: 'basic' | 'equipped' | 'private_basic' | 'private_equipped' | 'none';
  poolType?: 'none' | 'shared' | 'private' | 'infinity';
  internetSpeed?: number; // Mb/s, 0 for none
  bathroomType?: 'standard' | 'modern' | 'designer';
  bathroomOptions?: string[]; // tropical_shower, bathtub, stone_sink, garden_view
  amenities?: string[]; // AC, cold_AC, smart_tv, washing_machine, parking, workspace, spa
  cleaningFrequency?: 'none' | 'once_week' | '2_times_week' | '3_times_week' | 'daily';
  viewType?: 'rice_fields' | 'garden' | 'pool' | 'ocean' | 'jungle';
  extraOptions?: string[]; // pets_allowed, quiet_location, all_bills_included, airport_transfer_included, airport_transfer_paid, breakfast_included, breakfast_paid, nanny, chef

  // Transport attributes
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleModelQuantity?: number;
  vehicleColor?: string;
  vehicleCondition?: 'like_new' | 'minor_scratches' | 'faded_surf_rack';
  sellerType?: 'private' | 'company';
  sellerGoogleMapsUrl?: string;
  sellerGooglePlaceId?: string;
  keyless?: boolean;
  abs?: boolean;
  surfRack?: boolean;
  insurance?: boolean;
  freeDeliveryToAddress?: boolean;
  freeDeliveryToDistricts?: boolean;
  freeDeliveryDistricts?: string[];
  
  // Construction metrics
  yearBuilt: number | 'other';
  yearRenovated?: number;
  distanceToSeaMinutes?: number; // mins on bike
  interiorStyle: 'basic' | 'bali_style' | 'modern' | 'luxury';
  housingType?: string;
  area?: number; // size in m2
  
  // Owner contact
  whatsappNumber: string;
  ownerName: string;
  ownerAvatar?: string;
  clicksCount: number;
  viewsCount: number;
  isPromoTop?: boolean;
  isPromoPremium?: boolean;
  isPromoTurbo?: boolean;
  blockedDates?: string[];
  icalUrl?: string;
  icalLastSyncedAt?: string;
  pushedAt?: string;
  reachMultiplier?: number;
  createdAt?: string;
  nearbySpots?: ListingNearbySpot[];
  nearbySpotsUpdatedAt?: string;
  nearbySpotsStatus?: 'pending' | 'ready' | 'empty' | 'error';
  nearbySpotsError?: string;
}

export interface BookingRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  listingCategory: 'housing' | 'transport' | 'investments' | 'services' | 'ads' | 'afisha' | 'life' | 'useful';
  guestName: string;
  guestPhone: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrice: number;
  status: 'pending' | 'accepted' | 'declined';
  paymentStatus?: 'unpaid' | 'paid' | 'deposit';
  depositAmount?: number;
  roomIndex?: number;
  roomNumber?: string;
  comment?: string;
  declinedAt?: string;
  statusChangedAt?: string;
  createdAt: string;
}

export interface SearchState {
  district: string;
  startDate: string;
  endDate: string;
  searchQuery: string;
}

export interface FilterState {
  // Shared
  priceMin: number;
  priceMax: number;
  distanceToSeaMin: number;
  distanceToSeaMax: number;
  interiorStyle: string[];
  isNewOnly: boolean;
  isApprovedOnly: boolean;
  hasDropPriceOnly: boolean;
  favoritesOnly: boolean;
  
  // Housing specifics
  housingType: string[]; // wizard housingType values, with legacy aliases handled in filters
  roomsMin: number;
  roomsMax: number;
  areaMin?: number;
  wallMaterial: string[];
  territoryType: string[];
  densityType: string[];
  cleanlinessTags: string[];
  bedType: string[];
  kitchenType: string[];
  poolType: string[];
  internetSpeedMin: number;
  bathroomType: string[];
  bathroomOptions: string[];
  amenities: string[];
  cleaningFrequency: string[];
  viewType: string[];
  extraOptions: string[];
  
  // Transport specifics
  engineSize: string[];
  transmission: string[];
  vehicleBrand: string[];
  vehicleModel: string[];
  vehicleColor: string[];
  vehicleYear: string[];
  vehicleYearMin: number;
  vehicleCondition: string[];
  sellerType: string[];
  keylessOnly: boolean;
  absOnly: boolean;
  surfRackOnly: boolean;
  insuranceOnly: boolean;
  freeDeliveryToAddressOnly: boolean;
  freeDeliveryToDistrictOnly: boolean;
}
