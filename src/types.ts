export interface Review {
  id: string;
  authorName: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  cleanlinessLabels?: string[];
}

export interface Coordinates {
  lat: number;
  lng: number;
  name: string;
  type: 'supermarket' | 'restaurant' | 'gym' | 'sunset' | 'nightclub';
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
  district: string; // Seminyak, Canggu, Ubud, Uluwatu, Sanur, Nusa Dua, Kuta, Jimbaran, Amed, Lovina
  address: string;
  images: string[];
  rating: number;
  reviewsCount: number;
  reviews: Review[];
  
  // Badges & status
  isApproved: boolean; // Bali Base Approved
  isNew: boolean;
  status: 'active' | 'paused' | 'draft' | 'moderation';
  expirationDate?: string;
  
  // Pricing configuration
  pricePerDay: number; // in IDR
  pricePerMonth?: number; // in IDR
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
  roomType?: 'standard' | 'deluxe' | 'super_deluxe' | 'family';
  kitchenType?: 'basic' | 'equipped' | 'none';
  poolType?: 'none' | 'shared' | 'private' | 'infinity';
  internetSpeed?: number; // Mb/s, 0 for none
  bathroomType?: 'standard' | 'modern' | 'designer';
  bathroomOptions?: string[]; // tropical_shower, bathtub, stone_sink, garden_view
  amenities?: string[]; // AC, cold_AC, smart_tv, washing_machine, parking, workspace, spa
  cleaningFrequency?: 'none' | '3_times_week' | 'once_week' | 'daily';
  viewType?: 'rice_fields' | 'garden' | 'pool' | 'ocean' | 'jungle';
  extraOptions?: string[]; // pets_allowed, quiet_location, all_bills_included, transfer_included, airport_transfer, breakfast_included, breakfast_paid, nanny, chef
  
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
  pushedAt?: string;
  reachMultiplier?: number;
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
  
  // Housing specifics
  housingType: string[]; // Villa, House, Bungalow, Apartment, Guesthouse, Hotel
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
}
