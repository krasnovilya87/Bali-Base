import React, { useState, useEffect, useRef } from 'react';
import { Listing, BookingRequest, FilterState, ListingNearbySpot } from '../types';
import {
  X, Star, MapPin, Compass, Flame, ShieldCheck, Mail, Calendar,
  ChevronRight, Wifi, ShieldAlert, Waves, Home, Lock, RefreshCw, Sparkles, Send, LayoutGrid, Check, Info, BedDouble,
  Utensils, Dumbbell, ShoppingBasket, Landmark, Heart, Share2, Settings,
  Gauge, CalendarDays, Package, Usb, KeyRound, Building2, Route, Camera, UsersRound, Smartphone, Umbrella
} from 'lucide-react';
import { THEME } from '../theme';
import DetailMap, { DetailMapPlace } from './DetailMap';
import TwoMonthCalendar from './TwoMonthCalendar';
import CompetitorLogo from './CompetitorLogo';
import { calculateGraphDailyPrice, calculateGraphTotalPrice, calculateSavingsDisplay } from '../utils/pricing';
import { findDistrictByMapPointSync, getHaversineDistance, getListingCoords, svgPointToLatLng } from '../utils/geo';
import { buildListingSubtitle, stripListingRoomTypeFromTitle } from '../utils/listingSubtitle';
import { buildHousingAmenities, buildHousingCharacteristics, buildMissingHousingAmenities } from '../utils/housingFieldMeta';
import { buildGoogleMapsReviewsUrl, buildGoogleMapsWriteReviewUrl } from '../utils/googleMapsReviewLinks';
import { isListingUnavailableForDates } from '../utils/bookingAvailability';
import { DEFAULT_LANGUAGE, LanguageCode } from '../i18n';
import { useTranslatedDescription } from '../hooks/useTranslatedDescription';
import { useI18n } from '../i18nContext';
import { useAuth } from '../auth/AuthContext';
import { useFavoriteListings } from '../hooks/useFavoriteListings';
import { auth } from '../firebase';
import TranslatedReviewText from './listing-details/TranslatedReviewText';
import {
  getNearbyLibraryItems,
  isPlaceLibraryFresh,
  loadPlaceLibrary,
  PlaceLibraryCategory,
  PlaceLibraryItem,
  upsertPlaceLibraryItems
} from '../utils/placeLibrary';
import {
  createSupportTicketFromListing,
  readSupportTickets,
  resolveCurrentSupportUserPhone,
  writeSupportTickets
} from '../utils/supportTickets';
import { shareListingLink } from '../utils/listingShare';
import { isListingVerified } from '../utils/listingVerification';
import {
  getListingVehicleModel,
  listingHasAbs,
  listingHasInsurance,
  listingHasKeyless,
  listingHasSurfRack,
  SCOOTER_MODEL_OPTIONS,
  SCOOTER_MODELS_BY_GROUP
} from '../utils/scooterFilters';
import { ROOM_TYPE_LABELS } from './create-wizard/constants';
import { getScooterModelLabel } from './create-wizard/configs/scooterWizardConfig';

type MapSpotCategory = PlaceLibraryCategory;

type DetailCharacteristic = {
  key: string;
  icon: string;
  label: string;
  value?: string;
  isUnavailable?: boolean;
  isBoolean?: boolean;
};

type HelmetSize = 'none' | 'S' | 'M' | 'L' | 'XL';
type TransportBookingNotice = {
  messageKey: string;
  showSearchAction?: boolean;
};

const NEARBY_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 183;
const LISTING_NOTES_STORAGE_PREFIX = 'bali_base_listing_notes';
const HELMET_SIZE_OPTIONS: HelmetSize[] = ['none', 'S', 'M', 'L', 'XL'];
const DELIVERY_TIME_OPTIONS = Array.from({ length: 15 * 4 }, (_, index) => {
  const minutes = 7 * 60 + index * 15;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

const getListingNotesUserKey = () => {
  if (typeof window === 'undefined') return 'guest';

  const directUserKey =
    window.localStorage.getItem('bali_base_current_user') ||
    window.localStorage.getItem('bali_base_active_user') ||
    window.localStorage.getItem('bali_base_user_id');

  if (directUserKey?.trim()) {
    return directUserKey.trim();
  }

  try {
    const storedUsers = window.localStorage.getItem('bali_base_admin_users');
    const parsedUsers = storedUsers ? JSON.parse(storedUsers) : null;
    const firstUserId = Array.isArray(parsedUsers) ? parsedUsers[0]?.id : undefined;
    if (typeof firstUserId === 'string' && firstUserId.trim()) {
      return firstUserId.trim();
    }
  } catch {
    return 'guest';
  }

  return 'guest';
};

const getListingNotesStorageKey = (listingId: string) =>
  `${LISTING_NOTES_STORAGE_PREFIX}:${getListingNotesUserKey()}:${listingId}`;

const SUPERMARKET_NAMES = [
  'pepito',
  'frestive',
  'festive',
  'delta dewata',
  'bintang',
  'coco supermarket',
  'papaya',
  'bali jaya',
  'tiara dewata',
  "hardy's",
  'hardys',
  'popular deli',
  'foodmart',
  'grand lucky'
];

const SPORT_SEARCH_QUERIES = [
  'Surfing',
  'Padel',
  'Gym',
  'Yoga',
  'Boxing',
  'Muay Thai',
  'Brazilian Jiu-Jitsu BJJ',
  'Tennis',
  'Running',
  'Cycling',
  'Swimming',
  'Diving',
  'Snorkeling',
  'Beach Volleyball',
  'Badminton',
  'Football',
  'Basketball',
  'Golf',
  'Skateboarding',
  'Pilates',
  'CrossFit'
];

const SPORT_STORE_KEYWORDS = [
  'shop',
  'store',
  'outlet',
  'equipment',
  'gear',
  'rental',
  'retail',
  'apparel',
  'clothing',
  'sportswear',
  'surf shop',
  'bike shop',
  'bicycle shop',
  'склад',
  'магазин'
];

const SPORT_STORE_TYPES = ['store', 'shopping_mall', 'shoe_store', 'clothing_store', 'bicycle_store'];

const normalizePlaceName = (value: string) =>
  value.toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();

const isAllowedSupermarketName = (value: string) => {
  const normalized = normalizePlaceName(value);
  return SUPERMARKET_NAMES.some(allowed => normalized.includes(normalizePlaceName(allowed)));
};

const isSportVenue = (place: google.maps.places.PlaceResult) => {
  const name = normalizePlaceName(place.name || '');
  const types = place.types || [];
  const hasStoreType = types.some(type => SPORT_STORE_TYPES.includes(type));
  const hasStoreName = SPORT_STORE_KEYWORDS.some(keyword => name.includes(normalizePlaceName(keyword)));
  return !hasStoreType && !hasStoreName;
};

const formatBookingDate = (date: string) => {
  if (!date) return '';
  return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short'
  });
};

const ALL_PILLS_MAPPING: Record<string, { label: string; icon: string }> = {
  // Amenities
  AC: { label: 'Кондиционер', icon: '❄️' },
  cold_AC: { label: 'Кондиционер', icon: '🥶' },
  hair_dryer: { label: 'Фен', icon: '💨' },
  washing_machine: { label: 'Стиральная машина', icon: '👕' },
  smart_tv: { label: 'Smart TV', icon: '📺' },
  workspace: { label: 'Рабочая зона', icon: '💻' },
  yoga: { label: 'Зона йоги', icon: '🧘' },
  room_fridge: { label: 'Холодильник в номере', icon: '🧊' },
  water_cooler: { label: 'Кулер', icon: '💧' },
  'Без плесени и запаха': { label: 'Без плесени', icon: '🧼' },
  'Идеальная сантехника': { label: 'Исправная сантехника', icon: '🚿' },
  parking: { label: 'Парковка авто', icon: '🚗' },
  helmet_included: { label: 'Шлем в комплекте', icon: '🪖' },
  phone_mount: { label: 'Держатель тел.', icon: '📱' },
  surf_rack: { label: 'Крепеж для серфа', icon: '🏄' },
  retro_look: { label: 'Ретро стиль', icon: '🛵' },

  // Bathroom
  hot_water: { label: 'Горячая вода', icon: '🔥' },
  tropical_shower: { label: 'Тропический душ', icon: '🌴' },
  double_sink: { label: 'Две раковины', icon: '🚰' },
  bathtub: { label: 'Ванна', icon: '🛁' },
  garden_view: { label: 'Видовое окно', icon: '🪴' },
  sauna_hammam: { label: 'Сауна / хаммам', icon: '🧖' },

  // Extra Preferences
  pets_allowed: { label: 'С питомцами', icon: '🐾' },
  quiet_location: { label: 'Тишина', icon: '🔕' },
  all_bills_included: { label: 'Bills включены', icon: '⚡' },
  transfer_included: { label: 'Трансфер включен', icon: '✈️' },
  airport_transfer: { label: 'Трансфер за доп. плату', icon: '🚕' },
  airport_transfer_included: { label: 'Трансфер включен', icon: '✈️' },
  airport_transfer_paid: { label: 'Трансфер за доп. плату', icon: '🚕' },
  breakfast_included: { label: 'Завтрак включен', icon: '☕' },
  breakfast_paid: { label: 'Завтрак за доп. плату', icon: '🥐' },
  chef: { label: 'Личный шеф', icon: '👨‍🍳' }
};

const SCOOTER_ENGINE_CC: Record<string, number> = {
  scoopy: 110,
  beat_110: 110,
  genio_110: 110,
  vario_125: 125,
  fazzio: 125,
  grand_filano_125: 125,
  freego_125: 125,
  mio_125: 125,
  vespa_sprint_150: 150,
  vespa_primavera_150: 150,
  nmax: 155,
  nmax_turbo: 155,
  aerox_155: 155,
  vario_160: 160,
  adv: 160,
  pcx: 160,
  xmax: 250
};

const SCOOTER_USB_MODELS = SCOOTER_MODEL_OPTIONS
  .map(model => model.value)
  .filter(model => model !== 'mio_125');
const SCOOTER_KEYLESS_MODELS = ['scoopy', 'fazzio', 'grand_filano_125', 'nmax', 'nmax_turbo', 'xmax', 'pcx', 'beat_110'];
const SCOOTER_ABS_MODELS = ['nmax', 'nmax_turbo', 'xmax', 'pcx', 'adv'];
const SCOOTER_PHOTO_MODELS = SCOOTER_MODELS_BY_GROUP.retro;
const SCOOTER_LONG_TRIP_MODELS = SCOOTER_MODELS_BY_GROUP.maxi;
const SCOOTER_COUPLE_MODELS = SCOOTER_MODELS_BY_GROUP.maxi.filter(model => model !== 'aerox_155');

const TRANSPORT_DETAIL_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  engineCc: Gauge,
  yearBuilt: CalendarDays,
  largeStorage: Package,
  usbPort: Usb,
  abs: ShieldCheck,
  keyless: KeyRound,
  cityFit: Building2,
  longTripsFit: Route,
  photoFit: Camera,
  coupleFit: UsersRound,
  surfRack: Waves,
  insurance: ShieldCheck,
  freeDeliveryToAddress: MapPin,
  freeDeliveryDistricts: MapPin,
  'amenity-helmet': Umbrella,
  'amenity-phone_holder': Smartphone
};

interface ListingDetailsProps {
  listing: Listing;
  onClose: () => void;
  currencySymbol: string;
  currencyRate: number;
  onAddBooking: (booking: BookingRequest) => void;
  bookings?: BookingRequest[];
  filters?: FilterState;
  deliveryPoint?: { x: number; y: number } | null;
  onRequestDeliveryPoint?: () => void;
  initialCheckInDate?: string;
  initialCheckOutDate?: string;
  onDatesChange?: (checkIn: string, checkOut: string) => void;
  onListingChange?: (listing: Listing) => void;
  onEditClick?: (listing: Listing) => void;
  onRequireAuth?: (reasonKey?: string, afterAuth?: () => void) => boolean;
  activeLanguage?: LanguageCode;
  isMapFullscreen?: boolean;
  transportBookingReturnToken?: number;
}

export default function ListingDetails({
  listing,
  onClose,
  currencySymbol,
  currencyRate,
  onAddBooking,
  bookings = [],
  filters,
  deliveryPoint = null,
  onRequestDeliveryPoint,
  initialCheckInDate = '',
  initialCheckOutDate = '',
  onDatesChange,
  onListingChange,
  onEditClick,
  onRequireAuth,
  activeLanguage = DEFAULT_LANGUAGE,
  isMapFullscreen = false,
  transportBookingReturnToken = 0
}: ListingDetailsProps) {
  const { tr } = useI18n();
  const { user } = useAuth();
  const { favoriteIds, toggleFavorite: toggleFavoriteListing } = useFavoriteListings();
  const [activePhoto, setActivePhoto] = useState<number>(0);
  const [isVerticalGalleryOpen, setIsVerticalGalleryOpen] = useState<boolean>(false);
  const [hasHeroDragged, setHasHeroDragged] = useState<boolean>(false);
  const heroTrackRef = useRef<HTMLDivElement>(null);
  const heroTouchStartXRef = useRef<number | null>(null);
  const hasHeroDraggedRef = useRef<boolean>(false);
  const heroSettleTimerRef = useRef<number | null>(null);
  const lastShareActionRef = useRef<number>(0);
  const [checkInDate, setCheckInDate] = useState<string>(initialCheckInDate);
  const [checkOutDate, setCheckOutDate] = useState<string>(initialCheckOutDate);
  const [showDateCalendar, setShowDateCalendar] = useState<boolean>(false);
  const [diffDays, setDiffDays] = useState<number>(5);
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false);
  const [unavailableMessage, setUnavailableMessage] = useState<string>('');
  const [isTransportBookingConfirmOpen, setIsTransportBookingConfirmOpen] = useState<boolean>(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryTime, setDeliveryTime] = useState<string>('10:00');
  const [helmetOneSize, setHelmetOneSize] = useState<HelmetSize>('XL');
  const [helmetTwoSize, setHelmetTwoSize] = useState<HelmetSize>('none');
  const [needsSurfRack, setNeedsSurfRack] = useState<boolean>(false);
  const [needsInsurance, setNeedsInsurance] = useState<boolean>(false);
  const [deliveryPointRequestedFromBooking, setDeliveryPointRequestedFromBooking] = useState<boolean>(false);
  const [transportBookingNotice, setTransportBookingNotice] = useState<TransportBookingNotice | null>(null);
  const [countdownText, setCountdownText] = useState<string>('');
  const [isCharacteristicsExpanded, setIsCharacteristicsExpanded] = useState<boolean>(false);
  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState<boolean>(false);
  const [nearbySpots, setNearbySpots] = useState<ListingNearbySpot[]>(listing.nearbySpots || []);
  const [nearbyLoading, setNearbyLoading] = useState<boolean>(false);
  const [activeMapCategory, setActiveMapCategory] = useState<MapSpotCategory | null>(null);
  const [mapPlaces, setMapPlaces] = useState<DetailMapPlace[]>([]);
  const [mapPlacesLoading, setMapPlacesLoading] = useState<boolean>(false);
  const [selectedNearbyIndex, setSelectedNearbyIndex] = useState<number | null>(null);
  const [routeError, setRouteError] = useState<string>('');
  const [listingNote, setListingNote] = useState<string>('');
  const [isNotesExpanded, setIsNotesExpanded] = useState<boolean>(false);
  const [isProblemModalOpen, setIsProblemModalOpen] = useState<boolean>(false);
  const [problemMessage, setProblemMessage] = useState<string>('');
  const [problemSent, setProblemSent] = useState<boolean>(false);
  const { translatedDescription, isTranslating } = useTranslatedDescription(listing.description, activeLanguage);

  const visibleHeroPhotoIndexes = listing.images
    .map((_, idx) => idx)
    .filter(idx => Math.abs(idx - activePhoto) <= 1);

  const activeHeroVisiblePosition = Math.max(0, visibleHeroPhotoIndexes.indexOf(activePhoto));

  const getHeroClampedDragOffset = (offset: number) => {
    if (activePhoto === 0 && offset > 0) {
      return offset * 0.35;
    }
    if (activePhoto === listing.images.length - 1 && offset < 0) {
      return offset * 0.35;
    }
    return offset;
  };

  const setHeroTrackTransform = (offset: number, animate: boolean, position = activeHeroVisiblePosition) => {
    const track = heroTrackRef.current;
    if (!track) return;
    track.style.transition = animate ? 'transform 240ms cubic-bezier(0.2, 0, 0.2, 1)' : 'none';
    track.style.transform = `translate3d(calc(-${position * 100}% + ${offset}px), 0, 0)`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    heroTouchStartXRef.current = e.targetTouches[0].clientX;
    hasHeroDraggedRef.current = false;
    setHasHeroDragged(false);
    if (heroSettleTimerRef.current !== null) {
      window.clearTimeout(heroSettleTimerRef.current);
    }
    setHeroTrackTransform(0, false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (heroTouchStartXRef.current === null) return;
    e.preventDefault();
    e.stopPropagation();
    const diff = e.targetTouches[0].clientX - heroTouchStartXRef.current;
    setHeroTrackTransform(getHeroClampedDragOffset(diff), false);
    if (Math.abs(diff) > 8) {
      hasHeroDraggedRef.current = true;
      if (!hasHeroDragged) {
        setHasHeroDragged(true);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (heroTouchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const distance = heroTouchStartXRef.current - touchEndX;
    const swipeThreshold = 48;
    let targetPhoto = activePhoto;

    if (Math.abs(distance) > swipeThreshold) {
      e.stopPropagation();
      if (distance > 0) {
        targetPhoto = Math.min(listing.images.length - 1, activePhoto + 1);
      } else {
        targetPhoto = Math.max(0, activePhoto - 1);
      }
    }

    const targetPosition = Math.max(0, visibleHeroPhotoIndexes.indexOf(targetPhoto));
    setHeroTrackTransform(0, true, targetPosition);
    heroTouchStartXRef.current = null;
    heroSettleTimerRef.current = window.setTimeout(() => {
      setActivePhoto(targetPhoto);
      setHeroTrackTransform(0, false);
      if (hasHeroDraggedRef.current) {
        hasHeroDraggedRef.current = false;
        setHasHeroDragged(false);
      }
    }, 240);
  };

  const handleHeroWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) return;
    const scrollContainer = document.getElementById('details-scroll-container');
    if (!scrollContainer) return;
    e.preventDefault();
    scrollContainer.scrollTop += e.deltaY;
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhoto(prev => (prev === 0 ? listing.images.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhoto(prev => (prev === listing.images.length - 1 ? 0 : prev + 1));
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user && onRequireAuth && !onRequireAuth('auth.reason.favorites', () => toggleFavoriteListing(listing.id))) return;
    toggleFavoriteListing(listing.id);
  };

  const triggerShareListing = async () => {
    const now = Date.now();
    if (now - lastShareActionRef.current < 600) return;
    lastShareActionRef.current = now;
    await shareListingLink(listing, {
      copiedMessage: tr('listing.linkCopied'),
      copyFailedMessage: tr('listing.linkCopyFailed')
    });
  };

  const handleShareListing = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await triggerShareListing();
  };

  useEffect(() => {
    // Scroll to top inside container
    const elem = document.getElementById('details-scroll-container');
    if (elem) elem.scrollTop = 0;
    setIsCharacteristicsExpanded(false);
    setIsAmenitiesExpanded(false);
  }, [listing.id]);

  const isFavorite = favoriteIds.has(listing.id);

  useEffect(() => {
    setHeroTrackTransform(0, false);
  }, [activePhoto, listing.images.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedNote = window.localStorage.getItem(getListingNotesStorageKey(listing.id)) || '';
    setListingNote(savedNote);
    setIsNotesExpanded(Boolean(savedNote.trim()));
  }, [listing.id]);

  const handleListingNoteChange = (value: string) => {
    setListingNote(value);
    setIsNotesExpanded(true);

    if (typeof window === 'undefined') return;

    const storageKey = getListingNotesStorageKey(listing.id);
    if (value.trim()) {
      window.localStorage.setItem(storageKey, value);
    } else {
      window.localStorage.removeItem(storageKey);
    }
  };

  useEffect(() => {
    return () => {
      if (heroSettleTimerRef.current !== null) {
        window.clearTimeout(heroSettleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCheckInDate(initialCheckInDate);
    setCheckOutDate(initialCheckOutDate);
  }, [initialCheckInDate, initialCheckOutDate]);

  useEffect(() => {
    if (transportBookingReturnToken <= 0) return;

    setDeliveryPointRequestedFromBooking(true);
    setTransportBookingNotice(null);
    setIsTransportBookingConfirmOpen(true);
  }, [transportBookingReturnToken]);

  useEffect(() => {
    const deliveryDistrict = deliveryPoint ? findDistrictByMapPointSync(deliveryPoint) : '';
    const deliveryPointLabel = deliveryPoint
      ? deliveryDistrict
        ? tr('details.transportBooking.deliveryPointWithDistrict', { district: deliveryDistrict })
        : tr('details.transportBooking.deliveryPointSelected')
      : '';

    setDeliveryAddress(filters?.freeDeliveryToAddressOnly || deliveryPointRequestedFromBooking ? deliveryPointLabel : '');
    setNeedsSurfRack(Boolean(filters?.surfRackOnly));
    setNeedsInsurance(Boolean(filters?.insuranceOnly));
  }, [activeLanguage, deliveryPoint, deliveryPointRequestedFromBooking, filters?.freeDeliveryToAddressOnly, filters?.surfRackOnly, filters?.insuranceOnly]);

  useEffect(() => {
    // Calculate total days
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const timeDiff = end.getTime() - start.getTime();
    if (timeDiff > 0) {
      setDiffDays(Math.ceil(timeDiff / (1000 * 3600 * 24)));
    } else {
      setDiffDays(1);
    }
  }, [checkInDate, checkOutDate]);

  useEffect(() => {
    if (!listing.hasDropPrice || !listing.dropPriceEndsAt) return;

    const checkExpiration = () => {
      const difference = new Date(listing.dropPriceEndsAt!).getTime() - Date.now();
      if (difference <= 0) {
        setCountdownText(tr('listing.expired'));
      } else {
        const daysVal = difference / (1000 * 60 * 60 * 24);
        const daysText = Math.ceil(daysVal);
        setCountdownText(`${daysText} ${tr('listing.daysShort')}`);
      }
    };

    checkExpiration();
    const timer = setInterval(checkExpiration, 1000);

    return () => clearInterval(timer);
  }, [listing.hasDropPrice, listing.dropPriceEndsAt, tr]);

  useEffect(() => {
    setNearbySpots(listing.nearbySpots || []);
    setNearbyLoading(false);
  }, [listing.id, listing.nearbySpots]);

  useEffect(() => {
    setSelectedNearbyIndex(null);
    setRouteError('');
  }, [listing.id]);

  useEffect(() => {
    if (!activeMapCategory) {
      const selectedSpot = selectedNearbyIndex !== null ? nearbySpots[selectedNearbyIndex] : null;
      const selectedMapPlace = selectedSpot?.position
        ? [{
          id: selectedSpot.placeId || `${listing.id}-nearby-${selectedNearbyIndex}`,
          placeId: selectedSpot.placeId,
          name: selectedSpot.desc,
          title: selectedSpot.title,
          position: selectedSpot.position,
          rating: selectedSpot.rating,
          time: selectedSpot.time,
          emoji: selectedSpot.emoji
        }]
        : [];
      setMapPlaces(selectedMapPlace);
      setMapPlacesLoading(false);
      return;
    }

    const origin = getListingCoords(listing);
    const library = loadPlaceLibrary();
    const categoryItems = library[activeMapCategory]?.items || [];
    const mappedPlaces = getNearbyLibraryItems(categoryItems, origin)
      .slice(0, 12)
      .map(item => ({
        id: item.placeId || item.id,
        placeId: item.placeId,
        name: item.name,
        position: item.position,
        rating: item.rating
      }));

    setMapPlaces(mappedPlaces);
    setMapPlacesLoading(false);
  }, [activeMapCategory, listing.id, listing.locationCoords, listing.district, nearbySpots, selectedNearbyIndex]);

  const handleNearbySpotClick = (spot: ListingNearbySpot, index: number) => {
    if (selectedNearbyIndex === index) {
      setSelectedNearbyIndex(null);
      setRouteError('');
      return;
    }

    setSelectedNearbyIndex(index);
    setActiveMapCategory(null);
    setRouteError('');

    if (!spot.route?.overviewPath?.length) {
      setRouteError(tr('details.recalculateRoute'));
    }
  };

  const convertPrice = (idrAmount: number) => {
    return Math.round(idrAmount * currencyRate).toLocaleString();
  };

  const formatBookingTotal = (idrAmount: number) =>
    Math.round(idrAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const dropPriceDeadlineMs = listing.dropPriceEndsAt ? new Date(listing.dropPriceEndsAt).getTime() : null;
  const isDropPricePastDeadline = dropPriceDeadlineMs !== null && Number.isFinite(dropPriceDeadlineMs) && dropPriceDeadlineMs <= Date.now();
  const isExpired = countdownText === tr('listing.expired') || isDropPricePastDeadline;
  const isDropPriceActive = listing.hasDropPrice && !isExpired;

  const baseDailyPrice = isDropPriceActive && listing.dropPricePerDay
    ? listing.dropPricePerDay
    : listing.pricePerDay;

  const baseMonthlyPrice = isDropPriceActive && listing.dropPricePerMonth
    ? listing.dropPricePerMonth
    : listing.pricePerMonth;

  const activeDailyPrice = calculateGraphDailyPrice({
    days: diffDays,
    pricePerDay: baseDailyPrice,
    pricePerMonth: baseMonthlyPrice
  });

  const addOneCalendarMonth = (date: Date) => {
    const targetYear = date.getMonth() === 11 ? date.getFullYear() + 1 : date.getFullYear();
    const targetMonth = (date.getMonth() + 1) % 12;
    const targetMonthDays = new Date(targetYear, targetMonth + 1, 0).getDate();
    return new Date(targetYear, targetMonth, Math.min(date.getDate(), targetMonthDays));
  };
  const toDateStr = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const isCalendarMonthStay = Boolean(
    checkInDate &&
    checkOutDate &&
    toDateStr(addOneCalendarMonth(new Date(`${checkInDate}T00:00:00`))) === checkOutDate
  );
  const totalBudget = isCalendarMonthStay && baseMonthlyPrice
    ? baseMonthlyPrice
    : calculateGraphTotalPrice({
      days: diffDays,
      pricePerDay: baseDailyPrice,
      pricePerMonth: baseMonthlyPrice
    });

  const stayDays = diffDays;
  const activeBasePrice = stayDays ? totalBudget : activeDailyPrice;
  const activeCompetitorPrice = stayDays && listing.bookingComPrice ? listing.bookingComPrice * stayDays : listing.bookingComPrice || 0;
  const ownerDisplayName = listing.ownerName.trim() || tr('details.listingAuthor');
  const ownerInitial = ownerDisplayName.charAt(0).toUpperCase();
  const {
    hasSavings,
    savingsAmount,
    savingsPercent,
    showSavingsPercent
  } = calculateSavingsDisplay({
    stayDays,
    competitorPrice: activeCompetitorPrice,
    directPrice: activeBasePrice
  });

  const pluralizeDays = (count: number) => {
    if (activeLanguage !== 'RU') {
      return count === 1 ? tr('listing.day') : tr('listing.days');
    }
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 19) {
      return '\u0434\u043d\u0435\u0439';
    }
    if (mod10 === 1) {
      return '\u0434\u0435\u043d\u044c';
    }
    if (mod10 >= 2 && mod10 <= 4) {
      return '\u0434\u043d\u044f';
    }
    return '\u0434\u043d\u0435\u0439';
  };

  const getCardSubtitle = (): string => {
    if (listing.category !== 'housing') {
      return listing.description;
    }

    const pluralize = (count: number, one: string, few: string, many: string) => {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod100 >= 11 && mod100 <= 19) {
        return `${count} ${many}`;
      }
      if (mod10 === 1) {
        return `${count} ${one}`;
      }
      if (mod10 >= 2 && mod10 <= 4) {
        return `${count} ${few}`;
      }
      return `${count} ${many}`;
    };

    const subCat = listing.subCategory;
    const hType = (listing.housingType || '').toLowerCase();

    const distStr = listing.distanceToSeaMinutes !== undefined
      ? `${listing.distanceToSeaMinutes} мин до моря`
      : 'рядом с морем';

    if (subCat === 'private_suite' || hType.includes('apartment') || hType.includes('апарт')) {
      // Для апартов: тип объекта (апартаменты), площадь, удаление от моря
      const areaVal = listing.area || 45;
      return `Апартаменты • ${areaVal} м² • ${distStr}`;
    } else if (subCat === 'private_room' || hType.includes('room') || hType.includes('комнат')) {
      // Для комнаты: тип объекта (Guesthouse), количество комнат, удаление от моря
      const roomsVal = listing.roomsTotal || 1;
      const roomsStr = pluralize(roomsVal, 'комната', 'комнаты', 'комнат');
      return `Guesthouse • ${roomsStr} • ${distStr}`;
    } else {
      // Для Дома/Виллы: тип обьекта, количество комнат, расстояние до моря
      let typeStr = 'Вилла';
      if (hType.includes('house') || hType.includes('дом')) {
        typeStr = 'Дом';
      } else if (hType.includes('bungalow') || hType.includes('бунгало')) {
        typeStr = 'Бунгало';
      } else if (listing.housingType) {
        const mapping: Record<string, string> = {
          'Villa': 'Вилла',
          'House': 'Дом',
          'Bungalow': 'Бунгало',
          'Apartment': 'Апартаменты',
          'Guesthouse': 'Гестхаус',
          'Hotel': 'Отель'
        };
        typeStr = mapping[listing.housingType] || listing.housingType;
      }

      const roomsVal = listing.roomsTotal || 1;
      const roomsStr = pluralize(roomsVal, 'комната', 'комнаты', 'комнат');
      return `${typeStr} • ${roomsStr} • ${distStr}`;
    }
  };

  const getHelmetSizeLabel = (size: HelmetSize) =>
    size === 'none' ? 'None' : size;

  const getDeliveryAddressForBookingSummary = () => {
    if (!deliveryAddress.trim()) return 'Not specified';
    if (!deliveryPoint) return deliveryAddress.trim();

    const coords = svgPointToLatLng(deliveryPoint);
    const query = `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const getTransportBookingSummary = () => {
    if (listing.category !== 'transport') return '';

    const lines = [
      `Delivery time: ${deliveryTime}`,
      `Helmet 1: ${getHelmetSizeLabel(helmetOneSize)}`,
      `Helmet 2: ${getHelmetSizeLabel(helmetTwoSize)}`,
      `Surf Rack: ${needsSurfRack ? 'Yes' : 'No'}`,
      `Insurance: ${needsInsurance ? 'Yes' : 'No'}`,
      `Delivery address: ${getDeliveryAddressForBookingSummary()}`
    ];

    return `Booking details:\n${lines.join('\n')}`;
  };

  const handleTransportBookingOptionToggle = (
    option: 'surfRack' | 'insurance',
    value: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!value) {
      setter(false);
      return;
    }

    const isAvailable = option === 'surfRack'
      ? listingHasSurfRack(listing)
      : listingHasInsurance(listing);

    if (isAvailable) {
      setter(true);
      return;
    }

    setTransportBookingNotice({
      messageKey: 'details.transportBooking.optionUnavailableSearchAgain',
      showSearchAction: true
    });
  };

  const openTransportBookingConfirm = () => {
    if (isListingUnavailableForDates(listing, bookings, checkInDate, checkOutDate)) {
      setUnavailableMessage(tr('details.unavailableForDates', { title: listing.title }));
      return;
    }
    setIsTransportBookingConfirmOpen(true);
  };

  // WhatsApp template dispatch
  const placeWhatsAppBooking = () => {
    const activeUser = auth.currentUser || user;
    if (!checkInDate || !checkOutDate) {
      setShowDateCalendar(true);
      return;
    }
    if (isListingUnavailableForDates(listing, bookings, checkInDate, checkOutDate)) {
      setUnavailableMessage(tr('details.unavailableForDates', { title: listing.title }));
      return;
    }

    // Generate prefilled Text inside template
    const roomTypeLabel = listing.roomType ? ROOM_TYPE_LABELS[listing.roomType] || listing.roomType : '';
    const bookingTitle = roomTypeLabel
      ? `${stripListingRoomTypeFromTitle(listing.title)} - ${roomTypeLabel}`
      : listing.title;
    const transportBookingSummary = getTransportBookingSummary();
    const bookingMessage = [
      'Bali Base.',
      'Hello!',
      `I would like to book [${bookingTitle}].`,
      `Dates: [${checkInDate}] - [${checkOutDate}].`,
      `Duration: [${diffDays} nights].`,
      `Total price: [${formatBookingTotal(totalBudget)} IDR]`
    ].join('\n');
    const whatsappMessage = [bookingMessage, transportBookingSummary].filter(Boolean).join('\n\n');
    const cleanNumber = listing.whatsappNumber.replace(/[^0-9]/g, '');
    const waSearchParams = new URLSearchParams({
      phone: cleanNumber,
      text: whatsappMessage
    });
    const waUrl = `https://api.whatsapp.com/send?${waSearchParams.toString()}`;

    // Save WhatsApp click details into local history for Users -> History tab
    try {
      const existingHistory = localStorage.getItem('bali_base_whatsapp_history');
      let historyList: any[] = [];
      if (existingHistory) {
        historyList = JSON.parse(existingHistory);
      }
      const alreadyClickedIndex = historyList.findIndex((h: any) => h.id === listing.id);
      if (alreadyClickedIndex !== -1) {
        // Update visited timestamp and keep at top
        const found = historyList.splice(alreadyClickedIndex, 1)[0];
        found.clickedAt = new Date().toISOString();
        historyList.unshift(found);
      } else {
        historyList.unshift({
          id: listing.id,
          category: listing.category,
          title: listing.title,
          district: listing.district,
          pricePerDay: activeDailyPrice,
          image: listing.images[0] || '',
          whatsappNumber: listing.whatsappNumber,
          clickedAt: new Date().toISOString()
        });
      }
      localStorage.setItem('bali_base_whatsapp_history', JSON.stringify(historyList));
    } catch (e) {
      console.error('Error saving WhatsApp click history:', e);
    }

    // Add immediate booking request registration simulation
    const newReq: BookingRequest = {
      id: `bk-${Date.now()}`,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images[0],
      listingCategory: listing.category as any,
      guestName: activeUser?.displayName || activeUser?.email || 'Bali Base user',
      guestPhone: activeUser?.phoneNumber || '+62899123412',
      startDate: checkInDate,
      endDate: checkOutDate,
      totalDays: diffDays,
      totalPrice: totalBudget,
      status: 'pending',
      paymentStatus: 'unpaid',
      comment: transportBookingSummary || undefined,
      createdAt: new Date().toISOString()
    };
    onAddBooking(newReq);

    setOrderPlaced(true);
    window.location.href = waUrl;
    setOrderPlaced(false);
  };

  const handleWhatsAppClick = () => {
    const nextAction = listing.category === 'transport' ? openTransportBookingConfirm : placeWhatsAppBooking;
    if (!user && onRequireAuth && !onRequireAuth('auth.reason.booking', nextAction)) return;
    nextAction();
  };

  const confirmTransportBooking = () => {
    const datesMissing = !checkInDate || !checkOutDate;
    const addressMissing = !deliveryAddress.trim();

    if (datesMissing || addressMissing) {
      const messageKey = datesMissing && addressMissing
        ? 'details.transportBooking.validationDatesAndAddress'
        : datesMissing
          ? 'details.transportBooking.validationDates'
          : 'details.transportBooking.validationAddress';

      setTransportBookingNotice({ messageKey });
      return;
    }

    setIsTransportBookingConfirmOpen(false);
    placeWhatsAppBooking();
  };

  const requestTransportBookingDeliveryPoint = () => {
    setDeliveryPointRequestedFromBooking(true);
    onRequestDeliveryPoint?.();
  };

  const openProblemReport = () => {
    const showProblemReport = () => {
      setProblemSent(false);
      setIsProblemModalOpen(true);
    };
    if (!user && onRequireAuth && !onRequireAuth('auth.reason.reportProblem', showProblemReport)) return;
    showProblemReport();
  };

  const submitProblemReport = () => {
    if (!problemMessage.trim()) return;
    if (!user && onRequireAuth && !onRequireAuth('auth.reason.reportProblem', () => setIsProblemModalOpen(true))) return;
    const activeUser = auth.currentUser || user;

    const nextTicket = createSupportTicketFromListing({
      listingId: listing.id,
      listingTitle: problemListingTitle,
      userId: activeUser?.uid || 'registered-user',
      userName: activeUser?.displayName || activeUser?.email || tr('details.problem.defaultUser'),
      userPhone: resolveCurrentSupportUserPhone(activeUser),
      userAvatar: activeUser?.photoURL || '',
      subject: tr('details.problem.subject', { title: listing.title }),
      message: problemMessage.trim()
    });

    writeSupportTickets([nextTicket, ...readSupportTickets()]);
    setProblemMessage('');
    setProblemSent(true);
    window.setTimeout(() => {
      setIsProblemModalOpen(false);
      setProblemSent(false);
    }, 1400);
  };

  // Format metadata values for Housing Category
  let objectType = tr('details.option.housingType.Privet Villa (must pool)');
  if (listing.category === 'housing') {
    const hType = (listing.housingType || '').toLowerCase();
    const subCat = listing.subCategory;
    if (listing.housingType === 'Villa / House (privet room)') {
      objectType = tr('details.option.housingType.Villa / House (privet room)');
    } else if (listing.housingType === 'Apartment (privet room)' || subCat === 'private_suite' || hType.includes('apartment') || hType.includes('апарт')) {
      objectType = tr('details.option.housingType.Apartment Complex (privet unit)');
    } else if (subCat === 'private_room' || hType.includes('room') || hType.includes('комнат') || hType.includes('guesthouse') || hType.includes('гестхаус')) {
      objectType = tr('details.option.housingType.Guesthouse (privet room, shared property)');
    } else if (hType.includes('house') || hType.includes('дом')) {
      objectType = tr('details.option.housingType.House (no pool)');
    } else if (hType.includes('bungalow') || hType.includes('бунгало')) {
      objectType = tr('details.option.housingType.Bungalow (standalone unit)');
    } else if (listing.housingType) {
      const mapping: Record<string, string> = {
        'Villa': tr('details.option.housingType.Privet Villa (must pool)'),
        'House': tr('details.option.housingType.House (no pool)'),
        'Bungalow': tr('details.option.housingType.Bungalow (standalone unit)'),
        'Apartment': tr('details.option.housingType.Apartment Complex (privet unit)'),
        'Guesthouse': tr('details.option.housingType.Guesthouse (privet room, shared property)'),
        'Hotel': tr('details.option.housingType.Hotel (privet room)'),
        'Villa / House (privet room)': tr('details.option.housingType.Villa / House (privet room)'),
        'Apartment (privet room)': tr('details.option.housingType.Apartment (privet room)')
      };
      objectType = tr(`details.option.housingType.${listing.housingType}`);
      if (objectType === `details.option.housingType.${listing.housingType}`) {
        objectType = mapping[listing.housingType] || listing.housingType;
      }
    }
  }

  const roomsPart = listing.roomsTotal || listing.bedroomsCount || 1;
  const roomsText = `${roomsPart} BR`;
  const areaText = listing.area ? tr('details.areaSqm', { count: listing.area }) : '';
  const roomsAndArea = areaText ? `${roomsText}, ${areaText}` : roomsText;

  const features: string[] = [];
  if (listing.poolType && listing.poolType !== 'none') {
    const poolLabel = listing.poolType === 'infinity'
      ? tr('details.option.poolType.infinity')
      : listing.poolType === 'private'
        ? tr('details.option.poolType.private')
        : tr('details.option.poolType.shared');
    features.push(poolLabel);
  }
  if (listing.internetSpeed && listing.internetSpeed >= 100) {
    features.push(`WiFi ${tr('details.mbps', { count: listing.internetSpeed })}`);
  }
  if (listing.viewType) {
    const viewLabel = tr(`details.option.viewType.${listing.viewType}`);
    if (viewLabel !== `details.option.viewType.${listing.viewType}`) {
      features.push(viewLabel);
    }
  }
  if (listing.wallMaterial === 'wood') {
    features.push(tr('details.feature.naturalWood'));
  }
  if (features.length === 0) {
    features.push(tr('details.feature.highComfort'));
  }
  const mainFeatures = features.slice(0, 2).join(', ');

  const coordsDistrict = listing.locationCoords
    ? findDistrictByCoordsSync(listing.locationCoords.lat, listing.locationCoords.lng)
    : null;
  const displayDistrict = coordsDistrict || listing.district;

  let distanceText = '';
  const min = listing.distanceToSeaMinutes !== undefined ? listing.distanceToSeaMinutes : 5;
  if (displayDistrict.toLowerCase() === 'ubud') {
    distanceText = tr('details.distanceToCenter', { count: min });
  } else {
    distanceText = tr('details.distanceToSea', { count: min });
  }

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.title} ${listing.address || ''} ${displayDistrict} Bali`)}`;
  const googleMapsReviewsUrl = buildGoogleMapsReviewsUrl(listing);
  const googleMapsWriteReviewUrl = buildGoogleMapsWriteReviewUrl(listing);

  const DISTRICT_TEXT = displayDistrict;
  const displayTitle = stripListingRoomTypeFromTitle(listing.title);

  const metadataParts: React.ReactNode[] = [
    <a
      key="district"
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#FF7A50] hover:text-brand-orange underline font-semibold transition"
    >
      {DISTRICT_TEXT}
    </a>,
    <span key="type">{objectType}</span>,
    <span key="rooms">{roomsAndArea}</span>,
    ...(mainFeatures ? [<span key="features">{mainFeatures}</span>] : []),
    <span key="distance">{distanceText}</span>
  ];

  const NEARBY_Pills = [
    {
      emoji: '☕️',
      title: tr('details.nearby.coffeeTitle'),
      desc: tr('details.nearby.coffeeDesc')
    },
    {
      emoji: '🛒',
      title: tr('details.nearby.groceriesTitle'),
      desc: tr('details.nearby.groceriesDesc'),
      note: tr('details.nearby.apiNote')
    },
    {
      emoji: '🏋️‍♂️',
      title: tr('details.nearby.sportTitle'),
      desc: tr('details.nearby.sportDesc')
    },
    {
      emoji: '🏖',
      title: tr('details.nearby.beachTitle'),
      desc: tr('details.nearby.beachDesc')
    }
  ];
  const standardNearbyPills = [
    { emoji: '🍽️', title: tr('details.nearby.restaurantTitle'), desc: tr('details.notCalculated') },
    { emoji: '🛒', title: tr('details.nearby.groceriesTitle'), desc: tr('details.notCalculated') },
    { emoji: '🏋️', title: tr('details.nearby.gymTitle'), desc: tr('details.notCalculated') },
    { emoji: '🏖️', title: tr('details.nearby.beachTitle'), desc: tr('details.notCalculated') }
  ];
  const ubudNearbyPills = [
    { emoji: '🍽️', title: tr('details.nearby.restaurantTitle'), desc: tr('details.notCalculated') },
    { emoji: '🛒', title: tr('details.nearby.groceriesTitle'), desc: tr('details.notCalculated') },
    { emoji: '🧘', title: tr('details.nearby.yogaTitle'), desc: tr('details.notCalculated') },
    { emoji: '🌿', title: tr('details.nearby.ubudCenterTitle'), desc: 'Monkey Forest' }
  ];
  const kintamaniNearbyPills = [
    { emoji: '🍽️', title: tr('details.nearby.restaurantTitle'), desc: tr('details.notCalculated') },
    { emoji: '🛒', title: tr('details.nearby.groceriesTitle'), desc: tr('details.notCalculated') },
    { emoji: '♨️', title: tr('details.nearby.hotSpringsTitle'), desc: tr('details.notCalculated') },
    { emoji: '🌋', title: tr('details.nearby.mountBaturTitle'), desc: tr('details.notCalculated') }
  ];
  const getFallbackNearbyPills = () => {
    const normalizedDistrict = normalizeNearbyText(displayDistrict || '');
    if (normalizedDistrict.includes('ubud')) return ubudNearbyPills;
    if (normalizedDistrict.includes('kintamani') || normalizedDistrict.includes('kintomani')) return kintamaniNearbyPills;
    return standardNearbyPills;
  };
  const normalizeNearbyText = (value: string) => value.toLowerCase().replaceAll('ё', 'е').trim();
  const getNearbyTitleKey = (title: string, emoji: string) => {
    const normalized = normalizeNearbyText(title);
    if (normalized.includes('restaurant') || normalized.includes('ресторан') || emoji.includes('🍽')) {
      return 'details.nearby.restaurantTitle';
    }
    if (normalized.includes('supermarket') || normalized.includes('супермаркет') || normalized.includes('groceries') || emoji.includes('🛒')) {
      return 'details.nearby.groceriesTitle';
    }
    if (normalized.includes('gym') || normalized.includes('зал') || normalized.includes('fitness') || emoji.includes('🏋')) {
      return 'details.nearby.gymTitle';
    }
    if (normalized.includes('yoga') || normalized.includes('йога') || emoji.includes('🧘')) {
      return 'details.nearby.yogaTitle';
    }
    if (normalized.includes('beach') || normalized.includes('пляж') || emoji.includes('🏖')) {
      return 'details.nearby.beachTitle';
    }
    if (normalized.includes('monkey forest') || emoji.includes('🌿')) {
      return 'details.nearby.ubudCenterTitle';
    }
    if (normalized.includes('hot spring') || normalized.includes('горяч') || emoji.includes('♨')) {
      return 'details.nearby.hotSpringsTitle';
    }
    if (normalized.includes('mount batur') || normalized.includes('batur') || normalized.includes('батур') || emoji.includes('🌋')) {
      return 'details.nearby.mountBaturTitle';
    }
    return null;
  };
  const translateNearbyTime = (time?: string) => {
    if (!time) return time;
    return time.replace(/\s+на\s+байке$/i, ` ${tr('details.nearby.byBike')}`);
  };
  const translateNearbySpot = (spot: ListingNearbySpot): ListingNearbySpot => {
    const titleKey = getNearbyTitleKey(spot.title, spot.emoji);
    return {
      ...spot,
      title: titleKey ? tr(titleKey) : spot.title,
      time: translateNearbyTime(spot.time)
    };
  };
  const renderNearbyDescription = (desc: string) => {
    const separatorMatch = desc.match(/\s[—-]\s/);
    if (!separatorMatch || separatorMatch.index === undefined) return desc;

    const separatorStart = separatorMatch.index;
    const separatorEnd = separatorStart + separatorMatch[0].length;
    const categoryText = desc.slice(0, separatorStart);
    const afterSeparator = desc.slice(separatorEnd);
    const noteStart = afterSeparator.indexOf('(');
    const distanceText = noteStart >= 0 ? afterSeparator.slice(0, noteStart).trimEnd() : afterSeparator;
    const noteText = noteStart >= 0 ? afterSeparator.slice(noteStart) : '';

    return (
      <>
        <span className="listing-pill-main-text nearby-pill-strong">{categoryText}</span>
        <span> — </span>
        <span className="listing-pill-main-text nearby-pill-strong">{distanceText}</span>
        {noteText && <span> {noteText}</span>}
      </>
    );
  };
  const displayNearbySpots = nearbySpots.length > 0 ? nearbySpots.map(translateNearbySpot) : getFallbackNearbyPills();
  const activeNearbyRoute = selectedNearbyIndex !== null
    ? nearbySpots[selectedNearbyIndex]?.route || null
    : null;
  const detailMapSelectedPlaceIndex = selectedNearbyIndex !== null && !activeMapCategory ? 0 : null;
  const mapSpotFilters: Array<{ id: MapSpotCategory; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'restaurants', label: tr('details.nearby.filter.restaurants'), Icon: Utensils },
    { id: 'sport', label: tr('details.nearby.filter.sport'), Icon: Dumbbell },
    { id: 'supermarkets', label: tr('details.nearby.filter.supermarkets'), Icon: ShoppingBasket },
    { id: 'attractions', label: tr('details.nearby.filter.attractions'), Icon: Landmark },
    { id: 'beaches', label: tr('details.nearby.filter.beaches'), Icon: Waves }
  ];
  const detailLabelMaps = {
    housingType: {
      'Privet Villa (must pool)': 'Вилла',
      'House (no pool)': 'Дом',
      'Bungalow (standalone unit)': 'Бунгало',
      'Apartment Complex (privet unit)': 'Апартаменты',
      'Guesthouse (privet room, shared property)': 'Guesthouse',
      'Home stay (Host on-site)': 'Homestay',
      'Hotel (privet room)': 'Hotel',
      'Villa / House (privet room)': 'Вилла, Дом',
      'Apartment (privet room)': 'Апартаменты'
    } as Record<string, string>,
    roomType: {
      standard: 'Standard',
      deluxe: 'Deluxe',
      super_deluxe: 'Super Deluxe',
      family: 'Family'
    } as Record<string, string>,
    territoryType: {
      private: 'Приватная',
      shared: 'Общая',
      resort: 'Резорт'
    } as Record<string, string>,
    densityType: {
      cozy: 'Уютный, до 4 комнат',
      medium: 'Средний, 5-10 комнат',
      large: 'Большой, 10+ комнат'
    } as Record<string, string>,
    bedType: {
      queen_size: 'Queen size',
      king_size: 'King size',
      single_1: '1 односпальная',
      single_2: '2 односпальные'
    } as Record<string, string>,
    kitchenType: {
      none: 'Без кухни',
      basic: 'Базовая кухня',
      equipped: 'Оснащенная кухня',
      private_basic: 'Базовая, своя кухня',
      private_equipped: 'Оснащенная, своя кухня'
    } as Record<string, string>,
    poolType: {
      none: 'Без бассейна',
      shared: 'Общий бассейн',
      private: 'Частный бассейн',
      infinity: listing.territoryType === 'shared' || listing.territoryType === 'resort'
        ? 'Общий инфинити-бассейн'
        : 'Частный инфинити-бассейн'
    } as Record<string, string>,
    interiorStyle: {
      basic: 'Базовый',
      bali_style: 'Бали Стайл',
      modern: 'Современный',
      luxury: 'Роскошный'
    } as Record<string, string>,
    viewType: {
      rice_fields: 'Рисовые поля',
      garden: 'Сад',
      pool: 'Бассейн',
      ocean: 'Океан',
      jungle: 'Джунгли'
    } as Record<string, string>,
    bathroomOptions: {
      hot_water: 'Горячая вода',
      tropical_shower: 'Тропический душ',
      double_sink: 'Две раковины',
      bathtub: 'Ванна',
      garden_view: 'Видовое окно',
      sauna_hammam: 'Сауна / хаммам'
    } as Record<string, string>,
    amenities: {
      cold_AC: 'Кондиционер',
      hair_dryer: 'Фен',
      washing_machine: 'Стиральная машина',
      smart_tv: 'Smart TV',
      workspace: 'Рабочее пространство',
      yoga: 'Зона йоги',
      room_fridge: 'Холодильник в номере',
      water_cooler: 'Кулер',
      parking: 'Парковка для машин',
      'Без плесени и запаха': 'Без плесени и запаха',
      'Идеальная сантехника': 'Исправная сантехника'
    } as Record<string, string>,
    extraOptions: {
      airport_transfer_included: 'Трансфер включен',
      airport_transfer_paid: 'Трансфер за доп. плату',
      pets_allowed: 'С питомцами',
      quiet_location: 'Тишина',
      all_bills_included: 'Bills включены',
      transfer_included: 'Трансфер включен',
      airport_transfer: 'Трансфер за доп. плату',
      breakfast_included: 'Завтрак включен',
      breakfast_paid: 'Завтрак за доп. плату',
      nanny: 'Няня',
      chef: 'Личный шеф'
    } as Record<string, string>,
    cleaningFrequency: {
      none: 'Не указана',
      '2_times_week': '2 раза в неделю',
      '3_times_week': '3 раза в неделю',
      once_week: 'Раз в неделю',
      daily: 'Ежедневно'
    } as Record<string, string>
  };
  const detailCharacteristics: DetailCharacteristic[] = [];
  const transportFitCharacteristics: DetailCharacteristic[] = [];
  const addDetailCharacteristic = (condition: boolean, item: { key: string; icon: string; label: string; value?: string | number | null; isUnavailable?: boolean; isBoolean?: boolean }) => {
    if (!condition || item.value === undefined || item.value === null || item.value === '') return;
    detailCharacteristics.push({ ...item, value: String(item.value), isUnavailable: item.isUnavailable });
  };
  const formatMappedList = (values: string[] | undefined, map: Record<string, string>) =>
    (values || []).map(value => map[value] || value.replace(/_/g, ' ')).filter(Boolean).join(', ');
  const isPrivateRoomListing = listing.subCategory === 'private_room';
  const isPrivateSuiteListing = listing.subCategory === 'private_suite';
  const isHousingListing = listing.category === 'housing';
  const isTransportListing = listing.category === 'transport';
  const isHotelListing = listing.housingType === 'Hotel (privet room)' || (listing.housingType || '').toLowerCase().includes('hotel');
  const problemRoomTypeLabel = isPrivateRoomListing && listing.roomType
    ? detailLabelMaps.roomType[listing.roomType] || ROOM_TYPE_LABELS[listing.roomType] || listing.roomType
    : '';
  const problemListingTitle = problemRoomTypeLabel
    ? `${listing.title} · ${problemRoomTypeLabel}`
    : listing.title;

  if (isHousingListing) {
    addDetailCharacteristic(true, {
      key: 'housingType',
      icon: '🏘️',
      label: 'Тип объекта',
      value: listing.housingType ? detailLabelMaps.housingType[listing.housingType] || listing.housingType : undefined
    });
    addDetailCharacteristic(isPrivateRoomListing, {
      key: 'roomType',
      icon: '🛎️',
      label: 'Тип комнаты',
      value: listing.roomType ? detailLabelMaps.roomType[listing.roomType] || listing.roomType : undefined
    });
    addDetailCharacteristic(!isPrivateRoomListing && !isPrivateSuiteListing, {
      key: 'roomsTotal',
      icon: '🏢',
      label: 'Количество комнат',
      value: listing.roomsTotal ? (listing.roomsTotal >= 9 ? '9+ комнат' : `${listing.roomsTotal} ком.`) : undefined
    });
    addDetailCharacteristic(isPrivateSuiteListing, {
      key: 'area',
      icon: '📐',
      label: 'Площадь',
      value: listing.area ? `${listing.area} м²` : undefined
    });
    addDetailCharacteristic(!isPrivateRoomListing, {
      key: 'interiorStyle',
      icon: '🎨',
      label: 'Интерьер & дизайн',
      value: listing.interiorStyle ? detailLabelMaps.interiorStyle[listing.interiorStyle] || listing.interiorStyle : undefined
    });
    addDetailCharacteristic(!isPrivateRoomListing, {
      key: 'territoryType',
      icon: '🏡',
      label: 'Тип территории',
      value: listing.territoryType ? detailLabelMaps.territoryType[listing.territoryType] || listing.territoryType : undefined
    });
    addDetailCharacteristic(isPrivateSuiteListing || isPrivateRoomListing, {
      key: 'densityType',
      icon: '🍀',
      label: 'Плотность комплекса',
      value: listing.densityType ? detailLabelMaps.densityType[listing.densityType] || listing.densityType : undefined
    });
    addDetailCharacteristic(Boolean(listing.bedTypes?.length || listing.bedType), {
      key: 'bedTypes',
      icon: '🛌',
      label: 'Конфигурация кроватей',
      value: formatMappedList(listing.bedTypes?.length ? listing.bedTypes : listing.bedType ? [listing.bedType] : [], detailLabelMaps.bedType)
    });
    addDetailCharacteristic(Boolean(listing.kitchenType), {
      key: 'kitchenType',
      icon: '🍳',
      label: 'Оснащение кухни',
      value: listing.kitchenType ? detailLabelMaps.kitchenType[listing.kitchenType] || listing.kitchenType : undefined
    });
    addDetailCharacteristic(Boolean(listing.poolType), {
      key: 'poolType',
      icon: '💦',
      label: 'Бассейн',
      value: listing.poolType ? detailLabelMaps.poolType[listing.poolType] || listing.poolType : undefined
    });
    addDetailCharacteristic(listing.internetSpeed !== undefined, {
      key: 'internetSpeed',
      icon: '📶',
      label: 'Wi-Fi',
      value: listing.internetSpeed ? `${listing.internetSpeed} Мб/с` : 'Без WiFi'
    });
    addDetailCharacteristic(Boolean(listing.viewType), {
      key: 'viewType',
      icon: '🌅',
      label: 'Вид',
      value: listing.viewType ? detailLabelMaps.viewType[listing.viewType] || listing.viewType : undefined
    });
    addDetailCharacteristic(Boolean(listing.bathroomOptions?.length), {
      key: 'bathroomOptions',
      icon: '🚿',
      label: 'Ванная комната',
      value: formatMappedList(listing.bathroomOptions, detailLabelMaps.bathroomOptions)
    });
    addDetailCharacteristic(Boolean(listing.amenities?.length), {
      key: 'amenities',
      icon: '🛋️',
      label: 'Удобства и комфорт',
      value: formatMappedList(listing.amenities, detailLabelMaps.amenities)
    });
    addDetailCharacteristic(Boolean(listing.cleaningFrequency && listing.cleaningFrequency !== 'none'), {
      key: 'cleaningFrequency',
      icon: '🧹',
      label: 'Уборка',
      value: listing.cleaningFrequency ? detailLabelMaps.cleaningFrequency[listing.cleaningFrequency] || listing.cleaningFrequency : undefined
    });
    addDetailCharacteristic(Boolean(listing.yearBuilt), {
      key: 'yearBuilt',
      icon: '🔄',
      label: 'Построен / реновация',
      value: listing.yearBuilt === 'other'
        ? '-'
        : `${listing.yearBuilt} г${listing.yearRenovated ? ` (рен. ${listing.yearRenovated})` : ''}`
    });
  }

  if (isHousingListing && isHotelListing) {
    detailCharacteristics.splice(0, detailCharacteristics.length);
    addDetailCharacteristic(true, {
      key: 'housingType',
      icon: '🏨',
      label: 'Тип объекта',
      value: 'Hotel'
    });
    addDetailCharacteristic(listing.distanceToSeaMinutes !== undefined, {
      key: 'distanceToSeaMinutes',
      icon: '🧭',
      label: 'Удаление от моря',
      value: `${listing.distanceToSeaMinutes} мин`
    });
    addDetailCharacteristic(Boolean(listing.area), {
      key: 'area',
      icon: '📐',
      label: 'Площадь',
      value: listing.area ? `${listing.area} м²` : undefined
    });
    addDetailCharacteristic(Boolean(listing.roomsTotal), {
      key: 'roomsTotal',
      icon: '🏢',
      label: 'Кол. комнат',
      value: listing.roomsTotal ? (listing.roomsTotal >= 9 ? '9+ комнат' : `${listing.roomsTotal} ком.`) : undefined
    });
    addDetailCharacteristic(Boolean(listing.interiorStyle), {
      key: 'interiorStyle',
      icon: '🎨',
      label: 'Интерьер',
      value: listing.interiorStyle ? detailLabelMaps.interiorStyle[listing.interiorStyle] || listing.interiorStyle : undefined
    });
    addDetailCharacteristic(Boolean(listing.densityType), {
      key: 'densityType',
      icon: '🍀',
      label: 'Плотность комплекса',
      value: listing.densityType ? detailLabelMaps.densityType[listing.densityType] || listing.densityType : undefined
    });
    addDetailCharacteristic(Boolean(listing.territoryType), {
      key: 'territoryType',
      icon: '🏡',
      label: 'Тип территории',
      value: listing.territoryType ? detailLabelMaps.territoryType[listing.territoryType] || listing.territoryType : undefined
    });
    addDetailCharacteristic(Boolean(listing.poolType), {
      key: 'poolType',
      icon: '💦',
      label: 'Бассейн',
      value: listing.poolType ? detailLabelMaps.poolType[listing.poolType] || listing.poolType : undefined
    });
    addDetailCharacteristic(Boolean(listing.viewType), {
      key: 'viewType',
      icon: '🌅',
      label: 'Вид',
      value: listing.viewType ? detailLabelMaps.viewType[listing.viewType] || listing.viewType : undefined
    });
    addDetailCharacteristic(Boolean(listing.cleaningFrequency && listing.cleaningFrequency !== 'none'), {
      key: 'cleaningFrequency',
      icon: '🧹',
      label: 'Уборка',
      value: listing.cleaningFrequency ? detailLabelMaps.cleaningFrequency[listing.cleaningFrequency] || listing.cleaningFrequency : undefined
    });
  }

  if (false && isHousingListing) {
    detailCharacteristics.splice(0, detailCharacteristics.length);
    addDetailCharacteristic(true, {
      key: 'housingType',
      icon: '🏘️',
      label: 'Тип объекта',
      value: listing.housingType ? detailLabelMaps.housingType[listing.housingType] || listing.housingType : undefined
    });
    addDetailCharacteristic(listing.distanceToSeaMinutes !== undefined, {
      key: 'distanceToSeaMinutes',
      icon: '🧭',
      label: 'Удаление от моря',
      value: `${listing.distanceToSeaMinutes} мин`
    });
    addDetailCharacteristic(Boolean(listing.area), {
      key: 'area',
      icon: '📐',
      label: 'Площадь',
      value: listing.area ? `${listing.area} м²` : undefined
    });
    addDetailCharacteristic(Boolean(listing.roomsTotal), {
      key: 'roomsTotal',
      icon: '🏢',
      label: 'Кол. комнат',
      value: listing.roomsTotal ? (listing.roomsTotal >= 9 ? '9+ комнат' : `${listing.roomsTotal} ком.`) : undefined
    });
    addDetailCharacteristic(Boolean(listing.interiorStyle), {
      key: 'interiorStyle',
      icon: '🎨',
      label: 'Интерьер',
      value: listing.interiorStyle ? detailLabelMaps.interiorStyle[listing.interiorStyle] || listing.interiorStyle : undefined
    });
    addDetailCharacteristic(Boolean(listing.densityType), {
      key: 'densityType',
      icon: '🍀',
      label: 'Плотность комплекса',
      value: listing.densityType ? detailLabelMaps.densityType[listing.densityType] || listing.densityType : undefined
    });
    addDetailCharacteristic(Boolean(listing.territoryType), {
      key: 'territoryType',
      icon: '🏡',
      label: 'Тип территории',
      value: listing.territoryType ? detailLabelMaps.territoryType[listing.territoryType] || listing.territoryType : undefined
    });
    addDetailCharacteristic(Boolean(listing.poolType), {
      key: 'poolType',
      icon: '💦',
      label: 'Бассейн',
      value: listing.poolType ? detailLabelMaps.poolType[listing.poolType] || listing.poolType : undefined
    });
    addDetailCharacteristic(Boolean(listing.viewType), {
      key: 'viewType',
      icon: '🌅',
      label: 'Вид',
      value: listing.viewType ? detailLabelMaps.viewType[listing.viewType] || listing.viewType : undefined
    });
    addDetailCharacteristic(Boolean(listing.cleaningFrequency && listing.cleaningFrequency !== 'none'), {
      key: 'cleaningFrequency',
      icon: '🧹',
      label: 'Уборка',
      value: listing.cleaningFrequency ? detailLabelMaps.cleaningFrequency[listing.cleaningFrequency] || listing.cleaningFrequency : undefined
    });
  }

  if (isTransportListing) {
    const vehicleModel = getListingVehicleModel(listing) || listing.vehicleModel || '';
    const vehicleModelLabel = vehicleModel ? getScooterModelLabel(vehicleModel) : '';
    const vehicleColorLabel = listing.vehicleColor
      ? tr(`filters.transport.color.${listing.vehicleColor}`)
      : '';
    const vehicleConditionLabel = listing.vehicleCondition
      ? tr(`filters.transport.condition.${listing.vehicleCondition}`)
      : '';
    const sellerTypeLabel = listing.sellerType
      ? tr(`filters.transport.sellerType.${listing.sellerType}`)
      : '';

    addDetailCharacteristic(Boolean(listing.vehicleBrand), {
      key: 'vehicleBrand',
      icon: '🏷️',
      label: tr('details.field.vehicleBrand'),
      value: listing.vehicleBrand
    });
    addDetailCharacteristic(Boolean(listing.vehicleModel), {
      key: 'vehicleModel',
      icon: '🛵',
      label: tr('details.field.vehicleModel'),
      value: vehicleModelLabel || vehicleModel
    });
    addDetailCharacteristic(Boolean(vehicleModel && SCOOTER_ENGINE_CC[vehicleModel]), {
      key: 'engineCc',
      icon: '⚙️',
      label: tr('details.transport.engineCc'),
      value: tr('details.transport.ccValue', { count: SCOOTER_ENGINE_CC[vehicleModel] })
    });
    addDetailCharacteristic(Boolean(listing.yearBuilt), {
      key: 'yearBuilt',
      icon: '🔄',
      label: tr('filters.transport.year'),
      value: listing.yearBuilt === 'other' ? tr('details.yearOther') : listing.yearBuilt
    });
    addDetailCharacteristic(Boolean(listing.vehicleColor), {
      key: 'vehicleColor',
      icon: '🎨',
      label: tr('filters.transport.color'),
      value: vehicleColorLabel && vehicleColorLabel !== `filters.transport.color.${listing.vehicleColor}`
        ? vehicleColorLabel
        : listing.vehicleColor
    });
    addDetailCharacteristic(Boolean(listing.vehicleCondition), {
      key: 'vehicleCondition',
      icon: '🧰',
      label: tr('filters.transport.condition'),
      value: vehicleConditionLabel && vehicleConditionLabel !== `filters.transport.condition.${listing.vehicleCondition}`
        ? vehicleConditionLabel
        : listing.vehicleCondition
    });
    addDetailCharacteristic(Boolean(listing.sellerType), {
      key: 'sellerType',
      icon: '🤝',
      label: tr('filters.transport.sellerType'),
      value: sellerTypeLabel && sellerTypeLabel !== `filters.transport.sellerType.${listing.sellerType}`
        ? sellerTypeLabel
        : listing.sellerType
    });
    const hasLargeStorage = SCOOTER_MODELS_BY_GROUP.maxi.includes(vehicleModel);
    const hasUsbPort = SCOOTER_USB_MODELS.includes(vehicleModel);
    const hasAbs = listingHasAbs(listing) || SCOOTER_ABS_MODELS.includes(vehicleModel);
    const hasKeyless = listingHasKeyless(listing) || SCOOTER_KEYLESS_MODELS.includes(vehicleModel);
    const isCityFriendly = vehicleModel !== 'xmax';
    const isLongTripFriendly = SCOOTER_LONG_TRIP_MODELS.includes(vehicleModel);
    const isPhotoFriendly = SCOOTER_PHOTO_MODELS.includes(vehicleModel);
    const isCoupleFriendly = SCOOTER_COUPLE_MODELS.includes(vehicleModel);
    const addTransportBooleanCharacteristic = (key: string, icon: string, labelKey: string, isAvailable: boolean) => {
      detailCharacteristics.push({
        key,
        icon,
        label: tr(labelKey),
        isUnavailable: !isAvailable,
        isBoolean: true
      });
    };
    const addTransportFitCharacteristic = (key: string, icon: string, labelKey: string, isAvailable: boolean) => {
      transportFitCharacteristics.push({
        key,
        icon,
        label: tr(labelKey),
        isUnavailable: !isAvailable,
        isBoolean: true
      });
    };

    addTransportBooleanCharacteristic('largeStorage', '🧳', 'details.transport.largeStorage', hasLargeStorage);
    addTransportBooleanCharacteristic('usbPort', '🔌', 'details.transport.usbPort', hasUsbPort);
    addTransportBooleanCharacteristic('abs', '🛡️', 'filters.transport.features.abs', hasAbs);
    addTransportBooleanCharacteristic('keyless', '🔑', 'filters.transport.features.keyless', hasKeyless);
    addTransportFitCharacteristic('cityFit', '🏙️', 'details.transport.fit.city', isCityFriendly);
    addTransportFitCharacteristic('longTripsFit', '🛣️', 'details.transport.fit.longTrips', isLongTripFriendly);
    addTransportFitCharacteristic('photoFit', '📸', 'details.transport.fit.photo', isPhotoFriendly);
    addTransportFitCharacteristic('coupleFit', '👥', 'details.transport.fit.couple', isCoupleFriendly);
  }

  const detailAmenityGroups: Array<{ key: string; name: string; config: { label: string; icon: string } }> = [];
  const addDetailAmenityGroup = (condition: boolean, key: string, icon: string, label?: string) => {
    if (!condition || !label) return;
    detailAmenityGroups.push({
      key,
      name: key,
      config: { icon, label }
    });
  };

  if (isHousingListing) {
    addDetailAmenityGroup(
      listing.internetSpeed !== undefined,
      'internet',
      '📶',
      listing.internetSpeed ? `${listing.internetSpeed} Мб/с` : 'Без WiFi'
    );
    addDetailAmenityGroup(
      Boolean(listing.bedTypes?.length || listing.bedType),
      'bedTypes',
      '🛌',
      formatMappedList(listing.bedTypes?.length ? listing.bedTypes : listing.bedType ? [listing.bedType] : [], detailLabelMaps.bedType)
    );
    addDetailAmenityGroup(
      Boolean(listing.kitchenType),
      'kitchenType',
      '🍳',
      listing.kitchenType ? detailLabelMaps.kitchenType[listing.kitchenType] || listing.kitchenType : undefined
    );
    addDetailAmenityGroup(
      Boolean(listing.bathroomOptions?.length),
      'bathroomOptions',
      '🚿',
      formatMappedList(listing.bathroomOptions, detailLabelMaps.bathroomOptions)
    );
    addDetailAmenityGroup(
      Boolean(listing.amenities?.length),
      'amenities',
      '🛋️',
      formatMappedList(listing.amenities, detailLabelMaps.amenities)
    );
    addDetailAmenityGroup(
      Boolean(listing.extraOptions?.length),
      'extraOptions',
      '✨',
      formatMappedList(listing.extraOptions, detailLabelMaps.extraOptions)
    );
  }

  const detailAdditionalGroups: DetailCharacteristic[] = [];
  const addDetailAdditionalGroup = (condition: boolean, key: string, icon: string, label: string, isUnavailable = false) => {
    if (!condition || !label) return;
    detailAdditionalGroups.push({ key, icon, label, isUnavailable });
  };

  if (isTransportListing) {
    addDetailAdditionalGroup(Boolean(listing.surfRack || listing.amenities?.includes('surf_rack')), 'surfRack', '🌊', tr('filters.transport.features.surfRack'));
    addDetailAdditionalGroup(true, 'insurance', '✅', tr('filters.transport.features.insurance'), !Boolean(listing.insurance));
    addDetailAdditionalGroup(Boolean(listing.freeDeliveryToAddress), 'freeDeliveryToAddress', '📍', tr('details.field.freeDeliveryToAddress'));
    addDetailAdditionalGroup(Boolean(listing.freeDeliveryToDistricts || listing.freeDeliveryDistricts?.length), 'freeDeliveryDistricts', '🗺️', listing.freeDeliveryDistricts?.length
      ? `${tr('wizard.transport.freeDeliveryDistricts')}: ${listing.freeDeliveryDistricts.join(', ')}`
      : tr('wizard.transport.freeDeliveryDistricts')
    );
    (listing.amenities || [])
      .filter(name => name !== 'surf_rack')
      .forEach(name => {
        const mappedAmenity = ALL_PILLS_MAPPING[name];
        addDetailAdditionalGroup(
          true,
          `amenity-${name}`,
          mappedAmenity?.icon || '✨',
          mappedAmenity?.label || name.replace(/_/g, ' ')
        );
      });
    (listing.extraOptions || []).forEach(name => {
      const mappedExtra = ALL_PILLS_MAPPING[name];
      addDetailAdditionalGroup(
        true,
        `extra-${name}`,
        mappedExtra?.icon || '✨',
        mappedExtra?.label || name.replace(/_/g, ' ')
      );
    });
  }

  const housingDetailCharacteristics = isHousingListing
    ? buildHousingCharacteristics(listing, tr).filter(item => item.key !== 'distanceToSeaMinutes')
    : detailCharacteristics;
  const housingDetailAmenities = isHousingListing ? buildHousingAmenities(listing, tr) : null;
  const missingHousingAmenities = isHousingListing ? buildMissingHousingAmenities(listing, tr) : [];
  const getTransportTileTone = (key: string, isUnavailable?: boolean) => {
    if (isUnavailable) {
      return {
        shell: 'text-[#C4C9D1]',
        icon: 'border-[#E2E5E9] bg-[#F3F4F6] text-[#CCD1D8] shadow-[0_7px_14px_rgba(15,23,42,0.03)]',
        main: 'text-[#C7CBD1]',
        sub: 'text-[#D4D7DC]'
      };
    }

    if (key === 'engineCc' || key === 'keyless') {
      return {
        shell: 'text-[#111827]',
        icon: 'border-[#F2D98C] bg-[#F5EEDB] text-[#E7A500] shadow-[0_10px_18px_rgba(231,165,0,0.15)]',
        main: 'text-[#111827]',
        sub: 'text-[#A2A8B1]'
      };
    }

    if (key === 'usbPort' || key === 'cityFit') {
      return {
        shell: 'text-[#111827]',
        icon: 'border-[#99DBE7] bg-[#DDF3F7] text-[#00A9C9] shadow-[0_10px_18px_rgba(0,169,201,0.13)]',
        main: 'text-[#111827]',
        sub: 'text-[#A2A8B1]'
      };
    }

    if (key === 'abs' || key === 'insurance' || key === 'longTripsFit') {
      return {
        shell: 'text-[#111827]',
        icon: 'border-[#B9D8CA] bg-[#EDF7F1] text-[#2F7D69] shadow-[0_10px_18px_rgba(47,125,105,0.12)]',
        main: 'text-[#111827]',
        sub: 'text-[#A2A8B1]'
      };
    }

    if (key === 'freeDeliveryToAddress' || key === 'freeDeliveryDistricts' || key === 'coupleFit') {
      return {
        shell: 'text-[#111827]',
        icon: 'border-[#FFB996] bg-[#F4E1D5] text-[#F5651D] shadow-[0_10px_18px_rgba(245,101,29,0.13)]',
        main: 'text-[#111827]',
        sub: 'text-[#A2A8B1]'
      };
    }

    return {
      shell: 'text-[#111827]',
      icon: 'border-[#E2E5EA] bg-[#F8FAFC] text-[#687386] shadow-[0_8px_16px_rgba(15,23,42,0.05)]',
      main: 'text-[#111827]',
      sub: 'text-[#A2A8B1]'
    };
  };
  const renderTransportTile = (item: DetailCharacteristic, className = '') => {
    const tone = getTransportTileTone(item.key, item.isUnavailable);
    const Icon = TRANSPORT_DETAIL_ICON_MAP[item.key];
    const mainText = item.value || item.label;
    const subText = item.value ? item.label : '';

    return (
      <div
        key={item.key}
        className={`flex min-w-0 select-none flex-col items-center justify-start gap-1.5 text-center ${tone.shell} ${THEME.fonts.heading} ${className}`}
      >
        <span className={`flex h-[50px] w-[50px] items-center justify-center rounded-[16px] border transition sm:h-[56px] sm:w-[56px] sm:rounded-[18px] ${tone.icon}`}>
          {Icon ? (
            <Icon className="h-6 w-6 stroke-[1.4] sm:h-7 sm:w-7" />
          ) : (
            <span className="text-[22px] leading-none sm:text-[24px]">{item.icon}</span>
          )}
        </span>
        <span className={`max-w-[78px] text-[11px] font-medium leading-[1.05] tracking-normal sm:max-w-[88px] sm:text-[12px] ${subText ? 'truncate' : 'line-clamp-2'} ${tone.main}`}>
          {mainText}
        </span>
        {subText && (
          <span className={`max-w-[78px] line-clamp-2 text-[10px] font-normal leading-[1.05] tracking-normal sm:max-w-[88px] ${tone.sub}`}>
            {subText}
          </span>
        )}
      </div>
    );
  };
  const getTransportDetailsSubtitle = () => {
    const vehicleModel = getListingVehicleModel(listing) || listing.vehicleModel || '';
    const parts: string[] = [];

    if (vehicleModel && SCOOTER_ENGINE_CC[vehicleModel]) {
      parts.push(tr('details.transport.ccValue', { count: SCOOTER_ENGINE_CC[vehicleModel] }));
    }

    if (listing.yearBuilt && listing.yearBuilt !== 'other') {
      parts.push(String(listing.yearBuilt));
    }

    if (listingHasAbs(listing) || SCOOTER_ABS_MODELS.includes(vehicleModel)) {
      parts.push(tr('filters.transport.features.abs'));
    }

    if (listingHasKeyless(listing) || SCOOTER_KEYLESS_MODELS.includes(vehicleModel)) {
      parts.push(tr('filters.transport.features.keyless'));
    }

    if (vehicleModel && vehicleModel !== 'xmax') {
      parts.push(tr('details.transport.fit.city'));
    }

    if (SCOOTER_LONG_TRIP_MODELS.includes(vehicleModel)) {
      parts.push(tr('details.transport.fit.longTrips'));
    }

    if (SCOOTER_PHOTO_MODELS.includes(vehicleModel)) {
      parts.push(tr('details.transport.fit.photo'));
    }

    if (SCOOTER_COUPLE_MODELS.includes(vehicleModel)) {
      parts.push(tr('details.transport.fit.coupleComfort'));
    }

    return parts.join(' • ');
  };
  const transportBookingLabelClass = 'mb-2 block text-[10px] font-black uppercase text-gray-400';
  const transportBookingCardClass = 'rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]';
  const compactBookingDate = (date: string) => formatBookingDate(date).replace(/\./g, '');
  const hasDeliveryAddress = Boolean(deliveryAddress);

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center lg:p-5 p-0 animate-fade-in ${isMapFullscreen ? 'pointer-events-none opacity-0 z-[1]' : 'z-[400]'}`} id="details-modal">
      <div className="bg-white w-full h-full lg:max-w-5xl lg:max-h-[92vh] rounded-none lg:rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-slide-up lg:animate-scale-up border-0 lg:border border-[#E5E7EB]">

        {/* Header actions */}
        <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+14px)] z-40 flex items-center gap-2 lg:top-4">
          {onEditClick && (
            <button
              type="button"
              onClick={() => onEditClick(listing)}
              className="p-2 rounded-full bg-black/60 text-white hover:bg-black/95 transition border border-white/20 hover:scale-105 active:scale-95"
              title={tr('myListings.edit')}
              aria-label={tr('myListings.edit')}
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 text-white hover:bg-black/95 transition border border-white/20 hover:scale-105 active:scale-95"
            title={tr('common.close')}
            aria-label={tr('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll Body */}
        <div className="flex-1 overflow-y-auto bg-white" id="details-scroll-container">

          {/* Main Hero Gallery Grid - now only displaying one full width photo */}
          <div className="w-full p-0 bg-white border-b border-[#E5E7EB]">
            {/* Primary view */}
            <div
              className="relative w-full aspect-[4/3] sm:aspect-video rounded-none overflow-hidden bg-gray-50 border-0 cursor-zoom-in group/hero select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleHeroWheel}
              style={{
                touchAction: 'none',
                overscrollBehavior: 'contain',
              }}
              onClick={(e) => {
                if (hasHeroDragged) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                setIsVerticalGalleryOpen(true);
              }}
              title={tr('details.openGallery')}
            >
              {/* Left Zone - click to prev / dims on hover */}
              <div
                onClick={handlePrevPhoto}
                className="absolute left-0 top-0 bottom-0 w-[55px] sm:w-[75px] bg-black/0 hover:bg-black/35 transition-all duration-300 z-20 flex items-center justify-center cursor-pointer select-none group/navbtn"
                title={tr('details.prevPhoto')}
              >
                <span className="text-white text-3xl font-light opacity-0 group-hover/navbtn:opacity-100 transition-opacity duration-300 transform -translate-x-1 group-hover/navbtn:translate-x-0">
                  ‹
                </span>
              </div>

              {/* Right Zone - click to next / dims on hover */}
              <div
                onClick={handleNextPhoto}
                className="absolute right-0 top-0 bottom-0 w-[55px] sm:w-[75px] bg-black/0 hover:bg-black/35 transition-all duration-300 z-20 flex items-center justify-center cursor-pointer select-none group/navbtn"
                title={tr('details.nextPhoto')}
              >
                <span className="text-white text-3xl font-light opacity-0 group-hover/navbtn:opacity-100 transition-opacity duration-300 transform translate-x-1 group-hover/navbtn:translate-x-0">
                  ›
                </span>
              </div>

              <div
                ref={heroTrackRef}
                className="flex w-full h-full"
                style={{
                  transform: `translate3d(-${activeHeroVisiblePosition * 100}%, 0, 0)`,
                  transition: 'none',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                }}
              >
                {visibleHeroPhotoIndexes.map((idx) => (
                  <img
                    key={idx}
                    src={listing.images[idx]}
                    alt={listing.title}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    loading={idx === activePhoto ? 'eager' : 'lazy'}
                    onDragStart={(event) => event.preventDefault()}
                    className="w-full h-full object-cover shrink-0 select-none pointer-events-none"
                  />
                ))}
              </div>

              {/* Current photo layout bubble */}
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg border border-white/10 z-10 select-none">
                {activePhoto + 1} / {listing.images.length}
              </div>

              <div className="absolute left-4 top-[calc(env(safe-area-inset-top)+14px)] flex gap-1.5 flex-col z-10 pointer-events-none lg:top-4">
                {isDropPriceActive && countdownText && (
                  <div className="bg-amber-600 border border-amber-500/30 text-white text-[11px] font-mono font-bold px-3 py-1 rounded-xl shadow-md flex items-center gap-1">
                    <Flame className="w-4 h-4 fill-white animate-pulse" />
                    <span>{tr('details.dropPriceEndsIn', { time: countdownText })}</span>
                  </div>
                )}
                {isListingVerified(listing) && (
                  <div className="bg-[#FFCD29] text-gray-950 text-[11px] font-semibold px-3 py-1 rounded-xl shadow-md flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-[#2F7D69]" />
                    <span>{tr('details.approved')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-7 grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Col Info Details */}
            <div className="lg:col-span-2 space-y-7">

              {/* Matched Header block to completely correspond with ListingCard */}
              <div className={`space-y-4 ${THEME.fonts.main}`}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-2 sm:mb-3.5 lg:mb-1.5">
                  <div className="min-w-0">
                    <h3 className={`${THEME.fonts.heading} font-bold text-[21px] sm:text-base lg:text-xl text-text-dark line-clamp-2 leading-tight`}>
                      {displayTitle}
                    </h3>
                    <p className="line-clamp-2 leading-relaxed mt-1 text-gray-500 font-light text-[14px] sm:text-xs lg:text-[14.5px]">
                      {isTransportListing ? getTransportDetailsSubtitle() : buildListingSubtitle(listing, 4, tr)}
                    </p>
                  </div>
                  <div className="flex w-[74px] shrink-0 flex-col items-stretch gap-2 sm:w-[68px] lg:w-[78px]">
                    <div className={`h-9 rounded-full flex items-center justify-center gap-1.5 text-[14.5px] sm:text-xs lg:text-[15.5px] font-bold text-text-dark ${THEME.fonts.mono}`}>
                      <Star className="w-[15px] h-[15px] sm:w-3.5 sm:h-3.5 lg:w-[17px] lg:h-[17px] fill-current text-amber-500 shrink-0" />
                      <span>{listing.rating.toFixed(2).replace('.', ',')}</span>
                      <span className="text-gray-400 font-light">({listing.reviewsCount})</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleShareListing}
                        className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 transition hover:scale-105 hover:text-[#2F7D69] active:scale-95"
                        title={tr('listing.shareLink')}
                        aria-label={tr('listing.shareLink')}
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={toggleFavorite}
                        className={`h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center transition hover:scale-105 active:scale-95 ${isFavorite ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`}
                        title={tr('listing.toggleFavorite')}
                        aria-label={tr('listing.toggleFavorite')}
                        aria-pressed={isFavorite}
                      >
                        <Heart className="w-5 h-5" style={{ fill: isFavorite ? '#F43F5E' : 'none' }} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pricing stack completely corresponding to ListingCard */}
                <div className="pt-2 sm:pt-2.5 lg:pt-0 pb-1">
                  {stayDays && (
                    <div className={`mb-1.5 text-[14px] sm:text-xs lg:text-[13px] font-bold text-text-dark ${THEME.fonts.heading}`}>
                      {tr('details.totalFor', { count: stayDays, unit: pluralizeDays(stayDays) })}
                    </div>
                  )}

                  <div className="flex flex-col gap-1 sm:gap-1.5">
                    {/* Line 1: Competitor Price, grey/strikethrough and dynamic competitor logo */}
                    {listing.bookingComPrice && (
                      listing.competitorUrl ? (
                        <a
                          href={listing.competitorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 sm:gap-3 self-start cursor-pointer hover:opacity-75 transition"
                        >
                          <span className={`text-[14px] sm:text-xs lg:text-[13px] font-light text-gray-400 line-through leading-none ${THEME.fonts.mono}`}>
                            {convertPrice(activeCompetitorPrice)} {currencySymbol}
                          </span>
                          <CompetitorLogo platform={listing.competitorPlatform} />
                        </a>
                      ) : (
                        <div className="flex items-center gap-4 sm:gap-3">
                          <span className={`text-[14px] sm:text-xs lg:text-[13px] font-light text-gray-400 line-through leading-none ${THEME.fonts.mono}`}>
                            {convertPrice(activeCompetitorPrice)} {currencySymbol}
                          </span>
                          <CompetitorLogo platform={listing.competitorPlatform} />
                        </div>
                      )
                    )}

                    {/* Line 2: Direct Price and Direct price label */}
                    <div className="flex items-center gap-4 sm:gap-3">
                      <span className={`text-[21px] sm:text-base lg:text-xl font-bold text-text-dark ${THEME.fonts.mono}`}>
                        {convertPrice(activeBasePrice)} {currencySymbol}
                      </span>
                      {isDropPriceActive ? (
                        <span className={`bg-[#FF3B30] text-white font-extrabold text-[12px] sm:text-[9px] lg:text-[9.5px] px-1.5 py-0.5 rounded tracking-wider leading-none shadow-xs ${THEME.fonts.heading}`}>
                          {tr('listing.dropPrice')} • {countdownText}
                        </span>
                      ) : (
                        <span className={`text-[14px] sm:text-xs lg:text-[11px] text-[#2F7D69] font-bold tracking-wider leading-none ${THEME.fonts.heading}`}>
                          {tr('listing.directPrice')}
                        </span>
                      )}
                    </div>

                    {/* Line 3: Savings in small red font */}
                    {hasSavings && (
                      <div className="flex items-center self-start">
                        <div className="bg-[#FF3B30]/10 rounded-full px-2.5 py-1 sm:py-0.5 flex items-center gap-2 shadow-xs backdrop-blur-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] shrink-0" />
                          <span className={`text-[14px] sm:text-xs lg:text-[13px] text-[#FF3B30] font-bold tracking-wide leading-none ${THEME.fonts.mono}`}>
                            {showSavingsPercent ? `${savingsPercent}%` : `${convertPrice(savingsAmount)} ${currencySymbol}`}
                          </span>
                          <span className={`text-[12.5px] sm:text-[10px] lg:text-[10.5px] text-[#FF3B30] font-bold tracking-wider leading-none ${THEME.fonts.heading}`}>
                            {tr('listing.saved')}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mt-1 flex min-w-0 items-center gap-2 self-start max-w-full">
                      {listing.ownerAvatar ? (
                        <img
                          src={listing.ownerAvatar}
                          alt={ownerDisplayName}
                          className="h-7 w-7 shrink-0 rounded-full border border-[#E5E7EB] object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2F7D69] text-[10px] font-black text-white">
                          {ownerInitial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[8.5px] font-bold uppercase tracking-wider text-gray-400 leading-none">
                          {tr('details.listingAuthor')}
                        </p>
                        <p className="truncate text-[11px] sm:text-xs font-bold text-[#1E293B] leading-tight mt-0.5">
                          {ownerDisplayName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsNotesExpanded(prev => listingNote.trim() ? true : !prev)}
                  className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-extrabold text-[#1E293B] hover:text-[#FF7A50] transition-colors cursor-pointer select-none"
                  aria-expanded={isNotesExpanded || Boolean(listingNote.trim())}
                >
                  <span>{tr('details.myNotes')}</span>
                  {!listingNote.trim() && (
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isNotesExpanded ? 'rotate-90' : ''}`} />
                  )}
                </button>

                {(isNotesExpanded || Boolean(listingNote.trim())) && (
                  <textarea
                    value={listingNote}
                    onChange={event => handleListingNoteChange(event.target.value)}
                    placeholder={tr('details.myNotesPlaceholder')}
                    className="w-full min-h-[96px] rounded-2xl border border-[#E5E7EB] bg-white px-3.5 py-3 text-xs sm:text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:border-[#FF7A50]/50 focus:ring-2 focus:ring-[#FF7A50]/10 resize-y leading-relaxed"
                  />
                )}
              </div>

              {/* Grey section container starting from Description */}
              <div className="bg-[#F4F7F6] p-4 sm:p-6 rounded-[24px] border border-[#E5E7EB] space-y-7">

                {/* Description body */}
                <div className="space-y-3">
                  <h3 className="font-display text-base font-extrabold text-[#1E293B]">{tr('details.descriptionTitle')}</h3>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {translatedDescription}
                  </p>
                  {isTranslating && (
                    <span className="text-[10px] font-bold text-gray-400">{tr('common.loading')}</span>
                  )}
                </div>

                {/* Icons / Characteristics specs grid - Square plates */}
                <div className="space-y-3">
                  <h3 className={`text-base font-extrabold text-[#1E293B] ${THEME.fonts.heading}`}>
                    {isTransportListing ? tr('details.characteristicsTransportTitle') : tr('details.characteristicsTitle')}
                  </h3>

                  {(() => {
                    const buttonVisibilityClass = isTransportListing
                      ? 'hidden'
                      : housingDetailCharacteristics.length <= 4
                        ? 'hidden'
                        : housingDetailCharacteristics.length <= 8
                          ? 'sm:hidden'
                          : '';

                    return (
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className={`grid w-full ${isTransportListing ? 'grid-cols-3 gap-x-3 gap-y-3.5 sm:grid-cols-6 sm:gap-x-4' : 'grid-cols-2 sm:grid-cols-4 gap-2.5'}`}>
                          {housingDetailCharacteristics.map((item, index) => {
                            const visibilityClass = !isCharacteristicsExpanded
                              ? isTransportListing
                                ? 'flex'
                                : index < 4
                                ? 'flex'
                                : index < 8
                                  ? 'hidden sm:flex'
                                  : 'hidden'
                              : 'flex';
                            const housingCardClass = item.isUnavailable
                              ? 'bg-[#F8FAFC] text-[#94A3B8] border border-[#CBD5E1]'
                              : 'bg-white text-[#1E293B]';

                            if (isTransportListing) {
                              return renderTransportTile(item, visibilityClass);
                            }

                            return (
                              <div
                                key={item.key}
                                className={`${visibilityClass} pl listing-detail-pill min-h-[82px] rounded-2xl p-2.5 gap-1 text-center flex-col items-center justify-center select-none relative transition ${housingCardClass} ${THEME.fonts.heading}`}
                              >
                                <span className={`text-xl sm:text-2xl leading-none shrink-0 ${item.isUnavailable ? 'grayscale opacity-45' : ''}`}>{item.icon}</span>
                                <span className={`text-[10px] font-bold leading-tight ${item.isUnavailable ? 'text-[#94A3B8]' : 'text-gray-400'}`}>{item.label}</span>
                                {item.value && (
                                  <span className={`listing-pill-main-text text-center line-clamp-2 ${item.isUnavailable ? 'text-[#94A3B8]' : ''}`}>{item.value}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {!isTransportListing && housingDetailCharacteristics.length > 4 && (
                          <div className={`relative flex items-center py-2 ${isCharacteristicsExpanded ? '' : buttonVisibilityClass}`}>
                            <div className="flex-grow border-t border-[#E5E7EB] h-0"></div>
                            <button
                              onClick={() => setIsCharacteristicsExpanded(!isCharacteristicsExpanded)}
                              className="flex-shrink mx-4 px-5 py-2 rounded-full bg-white border border-[#E5E7EB] text-xs font-extrabold text-[#FF7A50] hover:bg-gray-50 active:scale-95 transition cursor-pointer shadow-xs select-none"
                            >
                              {isCharacteristicsExpanded ? tr('details.hideCharacteristics') : tr('details.more')}
                            </button>
                            <div className="flex-grow border-t border-[#E5E7EB] h-0"></div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {isTransportListing && transportFitCharacteristics.length > 0 && (
                    <div className="pt-1.5">
                      <h4 className={`mb-2 text-base font-extrabold text-[#1E293B] ${THEME.fonts.heading}`}>
                        {tr('details.transport.excellentFor')}
                      </h4>
                      <div className="grid grid-cols-3 gap-x-3 gap-y-3.5 sm:grid-cols-6 sm:gap-x-4 w-full">
                        {transportFitCharacteristics.map(item => renderTransportTile(item))}
                      </div>
                    </div>
                  )}
                  <div className="hidden">
                    {false && (
                      <>

                        {listing.roomsTotal && (
                          <div className="p-3 bg-white border border-[#E5E7EB] rounded-2xl flex items-center gap-2.5">
                            <Home className="w-4 h-4 text-brand-orange shrink-0" />
                            <div className="text-[10px] sm:text-xs">
                              <span className="text-gray-400 block leading-tight">{tr('details.quick.totalRooms')}</span>
                              <span className="font-bold text-text-dark">{tr('details.roomsShort', { count: listing.roomsTotal })}</span>
                            </div>
                          </div>
                        )}

                        {listing.internetSpeed !== undefined && (
                          <div className="p-3 bg-white border border-[#E5E7EB] rounded-2xl flex items-center gap-2.5">
                            <Wifi className="w-4 h-4 text-brand-orange shrink-0" />
                            <div className="text-[10px] sm:text-xs">
                              <span className="text-gray-400 block leading-tight">{tr('details.quick.fastWifi')}</span>
                              <span className="font-bold text-text-dark">{tr('details.mbps', { count: listing.internetSpeed })}</span>
                            </div>
                          </div>
                        )}

                        {listing.poolType && (
                          <div className="p-3 bg-white border border-[#E5E7EB] rounded-2xl flex items-center gap-2.5">
                            <Waves className="w-4 h-4 text-brand-orange shrink-0" />
                            <div className="text-[10px] sm:text-xs">
                              <span className="text-gray-400 block leading-tight">{tr('details.quick.villaPool')}</span>
                              <span className="font-bold text-text-dark">{listing.poolType === 'infinity' ? tr('details.option.poolType.infinity') : listing.poolType === 'private' ? tr('details.option.poolType.private') : tr('details.option.poolType.shared')}</span>
                            </div>
                          </div>
                        )}

                        {listing.yearBuilt !== 'other' && (
                          <div className="p-3 bg-white border border-[#E5E7EB] rounded-2xl flex items-center gap-2.5">
                            <RefreshCw className="w-4 h-4 text-brand-orange shrink-0" />
                            <div className="text-[10px] sm:text-xs">
                              <span className="text-gray-400 block leading-tight">{tr('details.quick.builtRenovation')}</span>
                              <span className="font-bold text-[#1E293B]">{listing.yearBuilt} {listing.yearRenovated ? `(${tr('details.yearRenovatedShort', { year: listing.yearRenovated })})` : ''}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                  </div>
                </div>

                {/* Amenities checkboxes - visual styled exactly like filters */}
                {!isTransportListing && (
                <div className="space-y-3">
                  <h3 className={`text-base font-extrabold text-[#1E293B] ${THEME.fonts.heading}`}>{tr('details.amenitiesTitle')}</h3>

                  {(() => {
                    const combinedAmenities = housingDetailAmenities || [
                      ...(listing.amenities || []).map(name => ({
                        key: `amenity-${name}`,
                        name,
                        config: ALL_PILLS_MAPPING[name] || { label: name.replace('_', ' '), icon: '✨' }
                      })),
                      ...(listing.bathroomOptions || []).map(opt => ({
                        key: `bathroom-${opt}`,
                        name: opt,
                        config: ALL_PILLS_MAPPING[opt] || { label: opt.replace('_', ' '), icon: '🛁' }
                      })),
                      ...(listing.extraOptions || []).map(ext => ({
                        key: `extra-${ext}`,
                        name: ext,
                        config: ALL_PILLS_MAPPING[ext] || { label: ext.replace('_', ' '), icon: '🐾' }
                      }))
                    ];

                    const buttonVisibilityClass =
                      combinedAmenities.length <= 4
                        ? 'hidden'
                        : combinedAmenities.length <= 8
                          ? 'sm:hidden'
                          : '';

                    return (
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                          {combinedAmenities.map((item, index) => {
                            const visibilityClass = !isAmenitiesExpanded
                              ? index < 4
                                ? 'flex'
                                : index < 8
                                  ? 'hidden sm:flex'
                                  : 'hidden'
                              : 'flex';

                            return (
                              <div
                                key={item.key}
                                className={`${visibilityClass} pl listing-detail-pill p-2.5 rounded-2xl text-center flex-col items-center justify-center gap-1 select-none relative min-h-[82px] bg-white text-[#1E293B] ${THEME.fonts.heading}`}
                              >
                                <span className="text-xl sm:text-2xl leading-none select-none">{item.config.icon}</span>
                                <span className="listing-pill-main-text listing-amenity-pill-text capitalize text-center line-clamp-2 whitespace-pre-line">{item.config.label}</span>
                              </div>
                            );
                          })}
                        </div>

                        {isAmenitiesExpanded && missingHousingAmenities.length > 0 && (
                          <div className="space-y-1.5 pt-1.5">
                            <div className={`text-[10px] font-extrabold uppercase tracking-wide text-[#94A3B8] ${THEME.fonts.heading}`}>
                              {tr('details.missingAmenitiesTitle')}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {missingHousingAmenities.map(item => (
                                <span
                                  key={item.key}
                                  className={`rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-2 py-0.5 text-[9px] font-bold leading-tight text-[#94A3B8] line-through decoration-[#64748B]/70 decoration-1 ${THEME.fonts.heading}`}
                                >
                                  {item.config.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {combinedAmenities.length > 4 && (
                          <div className={`relative flex items-center py-2 ${isAmenitiesExpanded ? '' : buttonVisibilityClass}`}>
                            <div className="flex-grow border-t border-[#E5E7EB] h-0"></div>
                            <button
                              onClick={() => setIsAmenitiesExpanded(!isAmenitiesExpanded)}
                              className="flex-shrink mx-4 px-5 py-2 rounded-full bg-white border border-[#E5E7EB] text-xs font-extrabold text-[#FF7A50] hover:bg-gray-50 active:scale-95 transition cursor-pointer shadow-xs select-none"
                            >
                              {isAmenitiesExpanded ? tr('details.hideAmenities') : tr('details.moreAmenities')}
                            </button>
                            <div className="flex-grow border-t border-[#E5E7EB] h-0"></div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                )}

                {isTransportListing && detailAdditionalGroups.length > 0 && (
                  <div className="space-y-3">
                    <h3 className={`text-base font-extrabold text-[#1E293B] ${THEME.fonts.heading}`}>{tr('details.additionalTitle')}</h3>
                    <div className="grid grid-cols-3 gap-x-3 gap-y-3.5 sm:grid-cols-6 sm:gap-x-4 w-full">
                      {detailAdditionalGroups.map(item => (
                        renderTransportTile(item)
                      ))}
                    </div>
                  </div>
                )}

                {/* Exact Surrounding spots list */}
                {!isTransportListing && (
                <div className="space-y-3">
                  <h3 className={`text-base font-extrabold text-[#1E293B] ${THEME.fonts.heading}`}>
                    {tr('details.nearbyTitle')}
                  </h3>
                  {nearbyLoading && (
                    <div className="text-[10px] font-bold text-[#2F7D69] bg-[#2F7D69]/10 rounded-full px-3 py-1 w-fit">
                      Google Maps...
                    </div>
                  )}
                  {routeError && (
                    <div className="text-[10px] font-bold text-[#FF3B30] bg-[#FF3B30]/10 rounded-full px-3 py-1 w-fit">
                      {routeError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {displayNearbySpots.map((spot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleNearbySpotClick(spot, idx)}
                        className={`pl-nearby nearby-pill min-h-[82px] p-2.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition ${selectedNearbyIndex === idx
                          ? 'selected'
                          : ''
                          } cursor-pointer`}
                      >
                        <span className="text-lg sm:text-xl select-none leading-none">{spot.emoji}</span>
                        <span className="listing-pill-main-text">{spot.title}</span>
                        <span className="text-[9.5px] sm:text-[10px] text-gray-400 line-clamp-2 leading-tight">{renderNearbyDescription(spot.desc)}</span>
                        {spot.time && (
                          <span className="text-[9.5px] sm:text-[10px] text-[#1E293B] font-semibold leading-tight">{spot.time}</span>
                        )}
                        {spot.note && (
                          <span className={`text-[8px] font-extrabold text-[#2F7D69] bg-[#2F7D69]/10 border border-[#2F7D69]/20 px-1.5 py-0.5 rounded tracking-wider leading-none ${THEME.fonts.heading}`}>
                            {spot.note}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                )}

              </div>

              {/* Interactive Location Map as separate, distinct block */}
              <div className="space-y-4 pt-1" id="detail-map-block">
                <h3 className="font-display text-[#1E293B] text-base font-extrabold">
                  {tr('details.locationTitle')}
                </h3>
                <DetailMap
                  listing={listing}
                  currencySymbol={currencySymbol}
                  currencyRate={currencyRate}
                  mapPlaces={mapPlaces}
                  activeRoute={activeNearbyRoute}
                  selectedPlaceIndex={detailMapSelectedPlaceIndex}
                />
                {false && (
                  <div className="flex flex-wrap gap-2">
                    {mapSpotFilters.map(({ id, label, Icon }) => {
                      const isActive = activeMapCategory === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActiveMapCategory(isActive ? null : id)}
                          className={`h-9 px-3 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition active:scale-95 ${isActive
                            ? 'bg-[#2F7D69] text-white shadow-sm'
                            : 'bg-[#F4F7F6] text-[#1E293B] hover:bg-white border border-transparent'
                            }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                    {mapPlacesLoading && (
                      <div className="h-9 px-3 rounded-full bg-[#2F7D69]/10 text-[#2F7D69] text-[10px] font-extrabold flex items-center">
                        Google Maps...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Review section elements with cleanest reviews as separate, distinct group */}
              <div className="space-y-4 pt-1">
                <h3 className="font-display text-[#1E293B] text-base font-extrabold">
                  {tr('details.reviewsTitle')}
                </h3>

                <div className="flex items-center justify-between">
                  <a
                    href={googleMapsReviewsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-gray-400 transition hover:text-gray-600"
                  >
                    {tr('details.review.all')}
                  </a>
                  <a
                    href={googleMapsWriteReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-gray-400 transition hover:text-gray-600"
                  >
                    {tr('details.review.leaveReview')}
                  </a>
                </div>

                <div className="space-y-3">
                  {listing.reviews.map(review => (
                    <div key={review.id} className="bg-[#F4F7F6] p-5 rounded-[24px] border border-[#E5E7EB] space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <img src={review.avatar} alt="Author" className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB]" referrerPolicy="no-referrer" />
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-gray-800 block">{review.authorName}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{review.date}</span>
                          </div>
                        </div>

                        <div className="flex bg-amber-50 px-2 py-0.5 rounded font-mono text-xs font-semibold text-amber-700 items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{review.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <TranslatedReviewText review={review} activeLanguage={activeLanguage} tr={tr} />

                      {review.cleanlinessLabels && review.cleanlinessLabels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {review.cleanlinessLabels.map(label => (
                            <span key={label} className="text-[9px] font-bold text-[#FF7A50] bg-[#2F7D69]/10 px-2 py-0.5 rounded-md border border-[#2F7D69]/20">
                              ✓ {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-1 lg:hidden">
                  <button
                    type="button"
                    onClick={openProblemReport}
                    title={tr('details.problem.tooltip')}
                    data-problem-report-native="true"
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-2xl text-xs font-normal text-gray-400 transition hover:text-gray-600"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{tr('details.reportProblem')}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Right Sticky Reservation & WhatsApp Box (Hidden on Mobile, Sticky on Desktop) */}
            <div className="hidden lg:flex min-h-full flex-col">
              <div className="sticky top-6 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xl space-y-4">
                {/* Total cost and nights details */}
                <div className="text-center space-y-2">
                  <span className="text-[13px] font-bold text-text-dark block">
                    {tr('details.totalFor', { count: diffDays, unit: pluralizeDays(diffDays) })}
                  </span>

                  {listing.bookingComPrice && (
                    listing.competitorUrl ? (
                      <a
                        href={listing.competitorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 mt-1 mb-1.5 cursor-pointer hover:opacity-75 transition"
                      >
                        <span className="text-[13px] text-gray-400 font-light line-through font-mono">
                          {convertPrice(activeCompetitorPrice)} {currencySymbol}
                        </span>
                        <CompetitorLogo platform={listing.competitorPlatform} size="md" />
                      </a>
                    ) : (
                      <div className="flex items-center justify-center gap-2 mt-1 mb-1.5">
                        <span className="text-[13px] text-gray-400 font-light line-through font-mono">
                          {convertPrice(activeCompetitorPrice)} {currencySymbol}
                        </span>
                        <CompetitorLogo platform={listing.competitorPlatform} size="md" />
                      </div>
                    )
                  )}

                  <span className="text-3xl font-mono font-black text-[#FF7A50] block">
                    {convertPrice(totalBudget)} {currencySymbol}
                  </span>

                  <div className="text-xs font-semibold text-text-dark/85 block">
                    <span className="font-mono">{convertPrice(activeDailyPrice)} {currencySymbol}</span>
                    <span className="text-gray-400 font-light">{` ${tr('details.perDay')}`}</span>
                  </div>

                  {hasSavings && (
                    <div className="flex items-center justify-center">
                      <div className="bg-[#FF3B30]/10 rounded-full px-2.5 py-1 flex items-center gap-2 shadow-xs backdrop-blur-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] shrink-0" />
                        <span className={`text-[13px] text-[#FF3B30] font-bold tracking-wide leading-none ${THEME.fonts.mono}`}>
                          {showSavingsPercent ? `${savingsPercent}%` : `${convertPrice(savingsAmount)} ${currencySymbol}`}
                        </span>
                        <span className={`text-[10.5px] text-[#FF3B30] font-bold tracking-wider leading-none ${THEME.fonts.heading}`}>
                          {tr('listing.saved')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dates input selectors */}
                <div className="space-y-3 pt-3.5 border-t border-[#E5E7EB]/60 relative">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">{tr('details.checkIn')}</label>
                      <button
                        type="button"
                        onClick={() => setShowDateCalendar(true)}
                        className="w-full bg-[#F4F7F6] border border-[#E5E7EB] rounded-xl px-3 py-2 text-left text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF7A50] cursor-pointer hover:border-[#FF7A50]/60 transition"
                      >
                        {formatBookingDate(checkInDate) || tr('details.date')}
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">{tr('details.checkOut')}</label>
                      <button
                        type="button"
                        onClick={() => setShowDateCalendar(true)}
                        className="w-full bg-[#F4F7F6] border border-[#E5E7EB] rounded-xl px-3 py-2 text-left text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF7A50] cursor-pointer hover:border-[#FF7A50]/60 transition"
                      >
                        {formatBookingDate(checkOutDate) || tr('details.date')}
                      </button>
                    </div>
                  </div>

                  {showDateCalendar && (
                    <TwoMonthCalendar
                      checkInDate={checkInDate}
                      checkOutDate={checkOutDate}
                      modalPlacement
                      onChange={(inD, outD) => {
                        setCheckInDate(inD);
                        setCheckOutDate(outD);
                        setUnavailableMessage('');
                        onDatesChange?.(inD, outD);
                      }}
                      onClose={() => setShowDateCalendar(false)}
                    />
                  )}
                </div>

                {/* Call WhatsApp button */}
                <div className="pt-2">
                  {unavailableMessage && (
                    <div className="mb-3 rounded-2xl border border-[#FF7A50]/25 bg-[#FF7A50]/10 px-3 py-3 text-center">
                      <p className="text-xs font-bold leading-relaxed text-[#1E293B]">
                        {unavailableMessage}
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="mt-2 text-xs font-extrabold text-[#2F7D69] underline decoration-[#2F7D69]/30 underline-offset-4 transition hover:text-[#FF7A50]"
                      >
                        {tr('details.viewOtherListings')}
                      </button>
                    </div>
                  )}
                  <button
                    disabled={orderPlaced}
                    onClick={handleWhatsAppClick}
                    className={`w-full py-3.5 rounded-2xl font-sans font-bold text-xs shadow-md transition duration-200 flex items-center justify-center gap-2 active:scale-97 cursor-pointer ${orderPlaced
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#2F7D69]/100 text-white hover:bg-emerald-600 hover:shadow-lg'
                      }`}
                    id="wa-booking-btn"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.764.462 3.42 1.258 4.876L2 22l5.304-1.216A9.94 9.94 0 0 0 12.004 22c5.52 0 10-4.48 10-10.004C22.004 6.48 17.524 2 12.004 2zm5.72 13.92c-.22.624-1.076 1.156-1.748 1.296-.512.108-1.18.2-3.444-.736-2.892-1.196-4.736-4.14-4.88-4.332-.14-.192-1.136-1.512-1.136-2.884 0-1.372.716-2.044.972-2.316.22-.228.58-.336.872-.336.096 0 .18 0 .252.004.212.008.316.02.456.328.176.388.604 1.472.656 1.58.052.108.088.232.016.376-.072.148-.108.24-.216.368-.108.128-.22.252-.316.364-.1.108-.204.228-.088.428.116.196.516.852 1.112 1.384.768.684 1.412.896 1.612.996.2.1.316.084.432-.048.116-.132.504-.588.64-.788.136-.2.272-.164.456-.096.188.068 1.192.56 1.4.664.204.104.34.156.388.24.048.084.048.492-.172 1.116z" />
                    </svg>
                    <span>
                      {orderPlaced ? tr('details.redirecting') : tr('details.book')}
                    </span>
                  </button>
                </div>

                <p className="text-[10px] text-gray-400 font-medium text-center">
                  *{tr('details.directDealNote')}
                </p>
              </div>

              <div className="mt-auto flex justify-end pt-4">
                <button
                  type="button"
                  onClick={openProblemReport}
                  title={tr('details.problem.tooltip')}
                  data-problem-report-native="true"
                  className="inline-flex min-w-[180px] items-center justify-center gap-2 px-3 py-2 rounded-2xl text-xs font-normal text-gray-400 transition hover:text-gray-600"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{tr('details.reportProblem')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Sticky bottom mobile checkout panel */}
        <div className="lg:hidden bg-white border-t border-[#E5E7EB] px-[30px] pt-[11px] pb-[26px] z-40">
          {unavailableMessage && (
            <div className="mb-3 rounded-2xl border border-[#FF7A50]/25 bg-[#FF7A50]/10 px-3 py-3 text-center">
              <p className="text-xs font-bold leading-relaxed text-[#1E293B]">
                {unavailableMessage}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 text-xs font-extrabold text-[#2F7D69] underline decoration-[#2F7D69]/30 underline-offset-4 transition active:scale-95"
              >
                {tr('details.viewOtherListings')}
              </button>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[9px] text-gray-400 font-bold block leading-none mb-1">{tr('details.totalFor', { count: diffDays, unit: diffDays === 1 ? tr('details.night') : tr('details.nights') })}</span>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-mono font-black text-[#FF7A50] leading-none">
                  {convertPrice(totalBudget)} {currencySymbol}
                </span>
                {listing.bookingComPrice && (
                  <span className="text-[10px] text-gray-400 line-through leading-normal mt-1">
                    {convertPrice(listing.bookingComPrice * diffDays)} {currencySymbol}
                  </span>
                )}
              </div>
            </div>

            <button
              disabled={orderPlaced}
              onClick={handleWhatsAppClick}
              className={`flex-1 py-3.5 rounded-xl font-sans font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition ${orderPlaced
                ? 'bg-emerald-600 text-white'
                : 'bg-[#2F7D69]/100 text-white hover:bg-emerald-600'
                }`}
              id="wa-mobile-btn"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.764.462 3.42 1.258 4.876L2 22l5.304-1.216A9.94 9.94 0 0 0 12.004 22c5.52 0 10-4.48 10-10.004C22.004 6.48 17.524 2 12.004 2zm5.72 13.92c-.22.624-1.076 1.156-1.748 1.296-.512.108-1.18.2-3.444-.736-2.892-1.196-4.736-4.14-4.88-4.332-.14-.192-1.136-1.512-1.136-2.884 0-1.372.716-2.044.972-2.316.22-.228.58-.336.872-.336.096 0 .18 0 .252.004.212.008.316.02.456.328.176.388.604 1.472.656 1.58.052.108.088.232.016.376-.072.148-.108.24-.216.368-.108.128-.22.252-.316.364-.1.108-.204.228-.088.428.116.196.516.852 1.112 1.384.768.684 1.412.896 1.612.996.2.1.316.084.432-.048.116-.132.504-.588.64-.788.136-.2.272-.164.456-.096.188.068 1.192.56 1.4.664.204.104.34.156.388.24.048.084.048.492-.172 1.116z" />
              </svg>
              <span>{orderPlaced ? tr('details.loading') : tr('details.book')}</span>
            </button>
          </div>
        </div>

        {showDateCalendar && (
          <div className={isTransportBookingConfirmOpen ? '' : 'lg:hidden'}>
            <TwoMonthCalendar
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              modalPlacement
              bookingModalPlacement={isTransportBookingConfirmOpen}
              onChange={(inD, outD) => {
                setCheckInDate(inD);
                setCheckOutDate(outD);
                setUnavailableMessage('');
                onDatesChange?.(inD, outD);
              }}
              onClose={() => setShowDateCalendar(false)}
            />
          </div>
        )}

        {isTransportBookingConfirmOpen && (
          <div className="fixed inset-0 z-[490] flex items-center justify-center bg-black/65 p-3 sm:p-5 backdrop-blur-xs">
            <div className="pu flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-2xl max-h-[92vh]">
              <div className="pu-header pu-window-header">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-5 w-5 text-[#FF7A50]" />
                  <h3>{tr('details.transportBooking.title')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTransportBookingConfirmOpen(false)}
                  className="pu-close"
                  title={tr('common.close')}
                  aria-label={tr('common.close')}
                >
                  <X />
                </button>
              </div>

              <div className="pu-body space-y-4 overflow-y-auto bg-[#F4F7F6]/55 p-4 sm:p-5">
                <div className="flex gap-3">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="h-24 w-32 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1 py-1">
                    <p className={`line-clamp-2 text-sm font-extrabold leading-tight text-[#1E293B] ${THEME.fonts.heading}`}>
                      {listing.title}
                    </p>
                    <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#F4F7F6] px-2.5 py-1 text-[10px] font-black uppercase text-[#2F7D69]">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{diffDays} {pluralizeDays(diffDays)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDateCalendar(true)}
                  className="w-full text-left transition active:scale-[0.99]"
                >
                  <span className={transportBookingLabelClass}>
                    {tr('details.transportBooking.period')}
                  </span>
                  <div className={`${transportBookingCardClass} flex min-h-[48px] overflow-hidden transition hover:border-[#FF7A50]/60`}>
                    <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-2.5">
                      <Calendar className="h-4 w-4 shrink-0 text-[#FF7A50]" />
                      <span className="block truncate text-sm font-extrabold leading-tight text-[#1E293B]">
                        {compactBookingDate(checkInDate)} - {compactBookingDate(checkOutDate)}
                      </span>
                    </div>
                    <div className="flex w-[96px] shrink-0 flex-col items-center justify-center bg-[#1E293B] px-3 text-center text-white sm:w-[108px]">
                      <span className="text-base font-black leading-none">{diffDays}</span>
                      <span className="mt-0.5 max-w-full truncate text-[10px] font-extrabold uppercase leading-none text-white/70">
                        {pluralizeDays(diffDays)}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="grid grid-cols-[minmax(0,1fr)_118px] gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                  <div className="min-w-0">
                    <span className={transportBookingLabelClass}>
                      {tr('details.transportBooking.deliveryAddress')}
                    </span>
                    <button
                      type="button"
                      onClick={requestTransportBookingDeliveryPoint}
                      className={`pl pl-interactive ${transportBookingCardClass} flex min-h-[48px] w-full items-center px-3.5 py-2.5 text-left transition active:scale-[0.99] hover:border-[#FF7A50]/60`}
                    >
                      <span className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-black uppercase leading-none ${
                        hasDeliveryAddress
                          ? 'bg-[#2F7D69]/10 text-[#2F7D69]'
                          : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                      }`}>
                        {hasDeliveryAddress ? tr('details.transportBooking.addressStatusProvided') : tr('details.transportBooking.addressStatusMissing')}
                      </span>
                    </button>
                  </div>

                  <div className="min-w-0">
                    <span className={transportBookingLabelClass}>
                      {tr('details.transportBooking.deliveryTime')}
                    </span>
                    <div className={`relative ${transportBookingCardClass} min-h-[48px]`}>
                      <select
                        value={deliveryTime}
                        onChange={(event) => setDeliveryTime(event.target.value)}
                        className="h-[48px] w-full appearance-none rounded-2xl bg-transparent px-3.5 pr-8 text-sm font-extrabold text-[#1E293B] outline-none transition focus:bg-white"
                      >
                        {DELIVERY_TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[#FF7A50]" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'helmetOne', value: helmetOneSize, setter: setHelmetOneSize, label: tr('details.transportBooking.helmetOne') },
                    { key: 'helmetTwo', value: helmetTwoSize, setter: setHelmetTwoSize, label: tr('details.transportBooking.helmetTwo') }
                  ].map(item => (
                    <div key={item.key} className="min-w-0">
                      <span className={transportBookingLabelClass}>
                        {item.label}
                      </span>
                      <div className={`${transportBookingCardClass} grid min-h-[48px] grid-cols-5 gap-1 p-1`}>
                        {HELMET_SIZE_OPTIONS.map(size => {
                          const isSelected = item.value === size;
                          return (
                            <button
                              key={`${item.key}-${size}`}
                              type="button"
                              onClick={() => item.setter(size)}
                              aria-pressed={isSelected}
                              className={`min-h-9 rounded-xl px-1 text-xs font-extrabold transition active:scale-95 ${
                                isSelected
                                  ? 'bg-[#FF7A50] text-white shadow-sm'
                                  : 'text-gray-400 hover:text-[#1E293B]'
                              }`}
                            >
                              {getHelmetSizeLabel(size)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <span className={transportBookingLabelClass}>{tr('details.additionalTitle')}</span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'surfRack', label: tr('filters.transport.features.surfRack'), value: needsSurfRack, setter: setNeedsSurfRack, Icon: Waves },
                      { key: 'insurance', label: tr('filters.transport.features.insurance'), value: needsInsurance, setter: setNeedsInsurance, Icon: ShieldCheck }
                    ].map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleTransportBookingOptionToggle(item.key as 'surfRack' | 'insurance', !item.value, item.setter)}
                        aria-pressed={item.value}
                        className={`pl pl-interactive ${transportBookingCardClass} flex min-h-[48px] min-w-0 cursor-pointer select-none items-center justify-between gap-2 px-3 py-2.5 text-left transition ${
                          item.value
                            ? 'selected border-[#FF7A50] bg-[#FF7A50]/12 shadow-[0_10px_22px_rgba(255,122,80,0.12)]'
                            : 'hover:border-[#FF7A50]/60'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <item.Icon className={`h-4 w-4 shrink-0 ${item.value ? 'text-[#FF7A50]' : 'text-[#64748B]'}`} />
                          <span className="truncate text-xs font-extrabold text-[#1E293B] leading-tight">
                            {item.label}
                          </span>
                        </span>
                        <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
                          item.value ? 'bg-[#FF7A50]' : 'bg-[#CBD5E1]'
                        }`}>
                          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                            item.value ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] bg-white p-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTransportBookingConfirmOpen(false)}
                    className="flex-1 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-xs font-extrabold text-[#1E293B] transition hover:border-[#CBD5E1]"
                  >
                    {tr('common.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={orderPlaced}
                    onClick={confirmTransportBooking}
                    className="flex-1 rounded-2xl bg-[#2F7D69] px-4 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-600 disabled:bg-emerald-600"
                  >
                    {orderPlaced ? tr('details.loading') : tr('details.transportBooking.confirm')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {transportBookingNotice && (
          <div className="fixed inset-0 z-[610] flex items-center justify-center bg-[#0F172A]/55 p-4 backdrop-blur-sm">
            <div className="pu w-full max-w-sm overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-2xl">
              <div className="pu-header pu-window-header">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-5 w-5 text-[#FF7A50]" />
                  <h3>{tr('details.transportBooking.title')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTransportBookingNotice(null)}
                  className="pu-close"
                  title={tr('common.close')}
                  aria-label={tr('common.close')}
                >
                  <X />
                </button>
              </div>
              <div className="pu-body p-5">
                <div className="rounded-2xl border border-[#FF7A50]/15 bg-[#FF7A50]/8 px-4 py-4 text-sm font-bold leading-relaxed text-[#1E293B]">
                  {tr(transportBookingNotice.messageKey)}
                </div>
              </div>
              <div className="pu-footer justify-end">
                {transportBookingNotice.showSearchAction ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setTransportBookingNotice(null)}
                      className="pu-button-secondary"
                    >
                      {tr('common.no')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransportBookingNotice(null)}
                      className="pu-button-primary"
                    >
                      {tr('common.yes')}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTransportBookingNotice(null)}
                    className="pu-button-primary"
                  >
                    {tr('common.ok')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {isProblemModalOpen && (
          <div className="fixed inset-0 z-[520] flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs">
            <div className="pu flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-2xl">
              <div className="pu-header pu-window-header">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-5 w-5 text-[#FF7A50]" />
                  <h3>{tr('details.problem.title')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProblemModalOpen(false)}
                  className="pu-close"
                  title={tr('common.close')}
                  aria-label={tr('common.close')}
                >
                  <X />
                </button>
              </div>

              <div className="pu-body p-5">
                {problemSent ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-8 text-center text-sm font-bold text-emerald-700">
                    {tr('details.problem.sent')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1 text-xs font-semibold text-[#5F6978]">
                      <p className="truncate">
                        {tr('details.problem.subtitle', { title: problemListingTitle })}
                      </p>
                    </div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[#5F6978]">
                      {tr('details.problem.label')}
                    </label>
                    <textarea
                      value={problemMessage}
                      onChange={(event) => setProblemMessage(event.target.value)}
                      rows={5}
                      className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-[#1E293B] outline-none transition focus:border-[#FF7A50] focus:ring-4 focus:ring-[#FF7A50]/10"
                    />
                  </div>
                )}
              </div>

              {!problemSent && (
                <div className="pu-footer justify-end">
                  <button
                    type="button"
                    onClick={() => setIsProblemModalOpen(false)}
                    className="pu-button-secondary"
                  >
                    {tr('details.problem.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={submitProblemReport}
                    disabled={!problemMessage.trim()}
                    className="pu-button-primary"
                  >
                    {tr('details.problem.submit')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full-screen Vertical Scroll Gallery Modal */}
        {isVerticalGalleryOpen && (
          <div
            className="fixed inset-0 bg-black/95 z-50 overflow-y-auto flex flex-col items-center p-4 sm:p-8 animate-fade-in"
            id="vertical-gallery-modal"
          >
            {/* Sticky Header inside scroll container */}
            <div className="w-full max-w-4xl flex items-center justify-between text-white border-b border-white/10 pb-4 mb-6 shrink-0 z-10 sticky top-0 bg-black/95 py-2">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-[#FF7A50]">{displayTitle}</h4>
                <p className="text-xs text-gray-400">{listing.images.length} {tr('details.photos')}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVerticalGalleryOpen(false);
                }}
                className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-[#FF7A50] text-white hover:text-white transition duration-200 cursor-pointer flex items-center gap-1 text-xs font-semibold"
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">{tr('details.closeGallery')}</span>
              </button>
            </div>

            {/* Stack of all images */}
            <div className="w-full max-w-4xl space-y-6 flex flex-col items-center">
              {listing.images.map((img, idx) => (
                <div key={idx} className="w-full bg-black/45 rounded-2xl overflow-hidden border border-white/15 flex flex-col items-center justify-center shadow-lg">
                  <img
                    src={img}
                    alt={`${listing.title} - ${tr('details.photoOf', { current: idx + 1, total: listing.images.length })}`}
                    className="w-full h-auto object-contain max-h-[85vh]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="py-3 text-center text-xs text-gray-400 border-t border-white/5 w-full bg-black/35 font-mono">
                    {tr('details.photoOf', { current: idx + 1, total: listing.images.length })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Action button to return */}
            <div className="mt-8 pb-12">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVerticalGalleryOpen(false);
                }}
                className="px-6 py-3 bg-[#FF7A50] hover:bg-brand-orange text-white text-xs font-bold rounded-xl transition duration-250 cursor-pointer shadow-md transform hover:scale-102 active:scale-98"
              >
                {tr('details.backToDetails')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
