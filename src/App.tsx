import React, { useState, useEffect } from 'react';
import { Listing, SearchState, FilterState, BookingRequest } from './types';
import { getStoredData, saveStoredData, MOCK_GUIDES, BALI_DISTRICTS } from './data';
import HousingFilters from './components/HousingFilters';
import MapBox from './components/MapBox';
import ListingCard from './components/ListingCard';
import ListingDetails from './components/ListingDetails';
import CreateWizard from './components/CreateWizard';
import MyAddsListing from './components/MyAddsListing';
import UsersModal from './components/UsersModal';
import AdminDashboard from './components/AdminDashboard';
import TwoMonthCalendar from './components/TwoMonthCalendar';
import { ThreeDIcon } from './components/ThreeDIcon';
import MapSelectModal from './components/MapSelectModal';
import { THEME } from './theme';
import { LISTINGS_COLLECTION, testConnection, syncWithFirebase, setDocument, deleteDocument, getDocument } from './firebase';
import { normalizeHousingListingForImport } from './components/admin-dashboard/importListingNormalizer';
import { uniqueDocumentIdFromTitle } from './utils/documentIds';
import { isListingFresh } from './utils/listingFreshness';

// @ts-ignore
import menuHousing from './assets/images/menu_housing_1780404154855.png';
// @ts-ignore
import menuTransport from './assets/images/menu_transport_1780404170729.png';
// @ts-ignore
import menuServices from './assets/images/menu_services_1780404187685.png';
// @ts-ignore
import menuAds from './assets/images/menu_ads_1780404203502.png';
// @ts-ignore
import menuAfisha from './assets/images/menu_afisha_1780404226444.png';
// @ts-ignore
import menuLife from './assets/images/menu_life_1780404239433.png';
// @ts-ignore
import baliRiceBg from './assets/images/bali_rice_bg_1780760937277.png';

import {
  Compass, Search, Globe, User, PlusCircle, HelpCircle, Heart, Star,
  Calendar, MapPin, Tag, ChevronDown, MoveDown, BookOpen, Sparkles, Filter, ListOrdered, Layers, Image, Menu, Map, X,
  MessageSquare, List, LogOut, ShieldAlert, Maximize, Minimize
} from 'lucide-react';

const DISTRICT_COORDS: Record<string, { x: number, y: number }> = {
  'Canggu': { x: 190, y: 240 },
  'Ubud': { x: 260, y: 160 },
  'Seminyak': { x: 180, y: 280 },
  'Uluwatu': { x: 120, y: 380 },
  'Sanur': { x: 290, y: 290 },
  'Nusa Dua': { x: 280, y: 390 },
  'Kuta': { x: 160, y: 320 },
  'Jimbaran': { x: 170, y: 350 },
  'Amed': { x: 420, y: 80 },
  'Lovina': { x: 210, y: 60 }
};

// Ray-casting algorithm to check if point is inside a polygon
const isPointInPolygon = (point: { x: number; y: number }, polygon: { x: number; y: number }[]) => {
  let inside = false;
  const x = point.x, y = point.y;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};


// Conversion rates relative to IDR (Balinese Rupiah)
const CURRENCIES = {
  IDR: { symbol: 'Rp', rate: 1 },
  USD: { symbol: '$', rate: 0.000062 },
  EUR: { symbol: '€', rate: 0.000057 },
  AUD: { symbol: 'A$', rate: 0.000094 },
  RUB: { symbol: '₽', rate: 0.0055 }
};

type CurrencyKey = keyof typeof CURRENCIES;

const LANGUAGES = [
  { code: 'RU', name: 'Русский' },
  { code: 'EN', name: 'English' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'FR', name: 'Français' },
  { code: 'D', name: 'Deutsch' }
];

export const SUBCATEGORIES_MAP: Record<string, Array<{ id: string; label: string; icon: string }>> = {
  housing: [
    { id: 'entire_place', label: 'Частная Вилла / Дом', icon: '🏡' },
    { id: 'private_suite', label: 'Апартаменты', icon: '🏢' },
    { id: 'private_room', label: 'Частная комната', icon: '🛌' }
  ],
  transport: [
    { id: 'scooters', label: 'Скутеры', icon: '🛵' },
    { id: 'motorcycles', label: 'Мотоциклы', icon: '🏍' },
    { id: 'cars', label: 'Автомобили', icon: '🚗' }
  ],
  investments: [
    { id: 'villas', label: 'Виллы & Апартаменты', icon: '🏢' },
    { id: 'land', label: 'Участки Земли', icon: '🏝' },
    { id: 'business', label: 'Готовый Бизнес', icon: '💼' }
  ],
  services: [
    { id: 'for_leisure', label: 'Для отдыха & Серфинг', icon: '🏄‍♂️' },
    { id: 'for_living', label: 'Для жизни & Консультации', icon: '💼' }
  ],
  ads: [
    { id: 'electronics', label: 'Электроника & Фото', icon: '🔌' },
    { id: 'trans_sale', label: 'Транспорт продажа', icon: '🏍' },
    { id: 'clothes', label: 'Одежда и личные вещи', icon: '👕' },
    { id: 'house_furn', label: 'Дом и интерьер', icon: '🏡' }
  ],
  afisha: [
    { id: 'festivals', label: 'Фестивали & Вечеринки', icon: '🎉' },
    { id: 'seminars', label: 'Бизнес-семинары', icon: '💼' },
    { id: 'exhibitions', label: 'Выставки & Детские', icon: '🎨' }
  ],
  life: [
    { id: 'meetings', label: 'Встречи & Спорт', icon: '💬' },
    { id: 'buddies', label: 'Попутчики & Трипы', icon: '🛵' }
  ],
  useful: []
};

export const L1_CATEGORIES = [
  { 
    id: 'housing', 
    label: 'Жилье', 
    image: menuHousing, 
    desc: 'Виллы, таунхаусы, гестхаусы напрямую от владельцев',
    l2: 'entire_place',
    icon: '🏡'
  },
  { 
    id: 'transport', 
    label: 'Транспорт', 
    image: menuTransport, 
    desc: 'Аренда байков, скутеров и автомобилей без переплат',
    l2: 'scooters',
    icon: '🛵'
  },
  { 
    id: 'investments', 
    label: 'Инвестиции', 
    image: 'https://images.unsplash.com/photo-1638184984605-af1f05249a56?w=280&fit=crop&q=80', 
    desc: 'Виллы, земля, готовые бизнесы на Бали с высокой окупаемостью',
    l2: 'villas',
    icon: '🏢'
  },
  { 
    id: 'services', 
    label: 'Услуги', 
    image: menuServices, 
    desc: 'Проводники, няни, повара, клининг и массаж напрямую',
    l2: 'for_leisure',
    icon: '🧑‍💼'
  },
  { 
    id: 'ads', 
    label: 'Объявления', 
    image: menuAds, 
    desc: 'Аренда вещей, бытовая техника, совместное проживание',
    l2: 'electronics',
    icon: '📢'
  },
  { 
    id: 'afisha', 
    label: 'Афиша', 
    image: menuAfisha, 
    desc: 'Ближайшие концерты, вечеринки и фестивали на Бали',
    l2: 'festivals',
    icon: '🎉'
  },
  { 
    id: 'life', 
    label: 'Жизнь', 
    image: menuLife, 
    desc: 'Чаты сообщества, советы по визам, контакты и взаимопомощь',
    l2: 'meetings',
    icon: '💬'
  },
  { 
    id: 'useful', 
    label: 'Полезное', 
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=280&fit=crop&q=80', 
    desc: 'Полезные гиды, информация о визах, имена балийцев, лайфхаки',
    l2: '',
    icon: '🧭'
  }
];

const sanitizeMenuOverrides = (overrides: any) => {
  if (!overrides) return overrides;
  // Deep copy
  const copy = JSON.parse(JSON.stringify(overrides));
  
  if (copy.l1) {
    Object.keys(copy.l1).forEach(key => {
      const item = copy.l1[key];
      if (item && typeof item.image === 'string' && item.image.startsWith('data:image/')) {
        // If Base64 string is oversized (> 100,000 characters =~ 75KB)
        if (item.image.length > 100000) {
          console.warn(`Pruning oversized Base64 image in L1 category '${key}' (${item.image.length} chars)`);
          item.image = ''; // Prune safely to prevent Firestore size limit error
        }
      }
    });
  }

  if (copy.l2) {
    Object.keys(copy.l2).forEach(key => {
      const item = copy.l2[key];
      if (item && typeof item.image === 'string' && item.image.startsWith('data:image/')) {
        // If Base64 string is oversized (> 100,000 characters =~ 75KB)
        if (item.image.length > 100000) {
          console.warn(`Pruning oversized Base64 image in L2 subcategory '${key}' (${item.image.length} chars)`);
          item.image = ''; // Prune safely to prevent Firestore size limit error
        }
      }
    });
  }

  return copy;
};

export default function App() {
  const [currentView, setCurrentView] = useState<'cover' | 'menu' | 'app'>('cover');
  
  // Storage layer
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [menuOverrides, setMenuOverrides] = useState<any>({ l1: {}, l2: {} });

  // Search, category & routing states
  const [currentL1, setCurrentL1] = useState<string>('housing');
  const [currentL2, setCurrentL2] = useState<string>('entire_place');
  const [districtSearch, setDistrictSearch] = useState<string>('');
  
  // Date Picker Checkin - Checkout simulation states 
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  // Live Auto-complete states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAutoComplete, setShowAutoComplete] = useState<boolean>(false);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    priceMin: 0,
    priceMax: 30000000,
    distanceToSeaMin: 0,
    distanceToSeaMax: 45,
    interiorStyle: [],
    isNewOnly: false,
    isApprovedOnly: false,
    hasDropPriceOnly: false,
    housingType: [],
    roomsMin: 1,
    roomsMax: 10,
    areaMin: 5,
    wallMaterial: [],
    territoryType: [],
    densityType: [],
    cleanlinessTags: [],
    bedType: [],
    kitchenType: [],
    poolType: [],
    internetSpeedMin: 0,
    bathroomType: [],
    bathroomOptions: [],
    amenities: [],
    cleaningFrequency: [],
    viewType: [],
    extraOptions: [],
    engineSize: [],
    transmission: [],
    vehicleBrand: []
  });

  // Modals / Windows triggers states
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [hoveredListing, setHoveredListing] = useState<Listing | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState<boolean>(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showMyAddsListing, setShowMyAddsListing] = useState<boolean>(false);
  const [showUsersDropdown, setShowUsersDropdown] = useState<boolean>(false);
  const [showUsersModal, setShowUsersModal] = useState<boolean>(false);
  const [usersModalTab, setUsersModalTab] = useState<'favorites' | 'whatsapp'>('favorites');
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(false);
  const [showListingMap, setShowListingMap] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // enabled by default for PC version (tablets & mobile hidden by default)
    }
    return true;
  });
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);
  const [isL2Visible, setIsL2Visible] = useState<boolean>(true);
  const [showFooter, setShowFooter] = useState<boolean>(false);

  // Coordinated Scrolling logic for Desktop/PC
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWheel = (e: WheelEvent) => {
      // Only apply on desktop (MD screen and up)
      if (window.innerWidth < 768) return;

      // Skip when map is fullscreen or modal/view is open that covers screen
      if (isMapFullscreen || showFiltersModal || selectedListing || showCreateWizard || showMyAddsListing || showUsersModal || showAdminDashboard) {
        return;
      }

      const panel = document.getElementById('listings-scroll-panel');
      if (!panel) return;

      const isScrollDown = e.deltaY > 0;
      const isScrollUp = e.deltaY < 0;

      // 1. FIRST SCROLL DOWN - Hides Level 2 menu
      if (isScrollDown && isL2Visible) {
        e.preventDefault();
        setIsL2Visible(false);
        return;
      }

      // 2. AT BOTTOM OF LISTING AND SCROLLING DOWN - Show footer & scroll window down
      const isAtBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 6;
      if (isScrollDown && isAtBottom && !showFooter) {
        e.preventDefault();
        setShowFooter(true);
        return;
      }

      // 3. FROM THE BOTTOM SCROLLING UP - Hide footer & scroll window back up
      if (isScrollUp && showFooter) {
        e.preventDefault();
        setShowFooter(false);
        return;
      }

      // 4. AT TOP OF LISTING AND SCROLLING UP - Show Level 2 menu
      const isAtTop = panel.scrollTop <= 2;
      if (isScrollUp && isAtTop && !isL2Visible) {
        e.preventDefault();
        setIsL2Visible(true);
        return;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isL2Visible, showFooter, isMapFullscreen, showFiltersModal, selectedListing, showCreateWizard, showMyAddsListing, showUsersModal, showAdminDashboard]);

  // Keep the listings pinned to their bottom edge while the footer expands.
  useEffect(() => {
    if (!showFooter || typeof ResizeObserver === 'undefined') return;

    const panel = document.getElementById('listings-scroll-panel');
    if (!panel) return;

    const keepAtBottom = () => {
      panel.scrollTop = panel.scrollHeight;
    };

    keepAtBottom();
    const observer = new ResizeObserver(keepAtBottom);
    observer.observe(panel);

    return () => observer.disconnect();
  }, [showFooter]);

  useEffect(() => {
    if (isMapFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // On mobile or tablet, when map full-screen is turned off/minimized, hide the map entirely
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setShowListingMap(false);
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMapFullscreen]);

  // Localization and Pricing currencies multipliers
  const [activeCurrency, setActiveCurrency] = useState<CurrencyKey>('IDR');
  const [activeLanguage, setActiveLanguage] = useState<string>('RU');
  const [showCurrencyDrop, setShowCurrencyDrop] = useState<boolean>(false);
  const [showLanguageDrop, setShowLanguageDrop] = useState<boolean>(false);

  // Sorters
  const [sortBy, setSortBy] = useState<string>('popular');
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState<boolean>(false);
  const [showMapSelectModal, setShowMapSelectModal] = useState<boolean>(false);
  const [customPoint, setCustomPoint] = useState<{ x: number, y: number } | null>(null);
  const [customRadius, setCustomRadius] = useState<number>(100);
  const [customPolygon, setCustomPolygon] = useState<{ x: number, y: number }[] | null>(null);
  const [isMapSelectionActive, setIsMapSelectionActive] = useState<boolean>(false);

  useEffect(() => {
    // Initialise Local Storage or parse defaults
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

    // Boot & sync persistent Firebase collections
    const initFirebase = async () => {
      await testConnection();
      let syncPassed = false;
      try {
        const synced = await syncWithFirebase(loaded.listings, loaded.bookings);
        setListings(synced.listings);
        setBookings(synced.bookings);
        saveStoredData(synced.listings, synced.bookings);
        console.log('Firebase synced successfully');
        syncPassed = true;
      } catch (err) {
        console.error('Firebase synchronisation failed, running in local mode', err);
      }

      if (syncPassed) {
        try {
          // Fetch menu overrides from Firestore
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

  useEffect(() => {
    if (currentView !== 'cover') return;

    let touchStartY = 0;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 15) {
        setCurrentView('menu');
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      // Scroll down translates to swipe UP (where start Y is larger than end Y)
      if (touchStartY - touchEndY > 40) {
        setCurrentView('menu');
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentView]);

  const saveUpdatedState = (newLis: Listing[], newBks: BookingRequest[]) => {
    setListings(newLis);
    setBookings(newBks);
    saveStoredData(newLis, newBks);
  };

  const formatReservationDates = (startStr: string, endStr: string) => {
    if (!startStr) return "";
    const monthsRu = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    const d1 = new Date(startStr);
    const day1 = d1.getDate();
    const m1 = monthsRu[d1.getMonth()];
    
    if (endStr) {
      const d2 = new Date(endStr);
      const day2 = d2.getDate();
      const m2 = monthsRu[d2.getMonth()];

      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const getDaysWord = (days: number) => {
        const mod10 = days % 10;
        const mod100 = days % 100;
        if (mod100 >= 11 && mod100 <= 19) {
          return "дней";
        }
        if (mod10 === 1) {
          return "день";
        }
        if (mod10 >= 2 && mod10 <= 4) {
          return "дня";
        }
        return "дней";
      };

      const daysSuffix = diffDays > 0 ? ` (${diffDays} ${getDaysWord(diffDays)})` : "";

      if (m1 === m2) {
        return `${day1}–${day2} ${m1}${daysSuffix}`;
      }
      return `${day1} ${m1} – ${day2} ${m2}${daysSuffix}`;
    }
    return `с ${day1} ${m1}`;
  };

  // Switch Category L1 -> automatically adjusts default Level-2 parameters
  const selectL1 = (catId: string) => {
    setCurrentL1(catId);
    if (catId === 'housing') setCurrentL2('entire_place');
    else if (catId === 'transport') setCurrentL2('scooters');
    else if (catId === 'investments') setCurrentL2('villas');
    else if (catId === 'services') setCurrentL2('for_leisure');
    else if (catId === 'ads') setCurrentL2('electronics');
    else if (catId === 'afisha') setCurrentL2('festivals');
    else if (catId === 'life') setCurrentL2('meetings');
    else setCurrentL2('');
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
        const finalListing = { ...listingForSave, id: targetId };
        if (targetId !== item.id) deleteDocument(LISTINGS_COLLECTION, item.id);
        setDocument(LISTINGS_COLLECTION, targetId, finalListing);
        return finalListing;
      }
      return item;
    });
    saveUpdatedState(updated, bookings);
  };

  const handleUpdateListing = (updatedListing: Listing) => {
    const listingForSave = updatedListing.category === 'housing'
      ? normalizeHousingListingForImport(updatedListing, 0)
      : updatedListing;
    const targetId = uniqueDocumentIdFromTitle(
      listingForSave.title,
      listings.filter(listing => listing.id !== updatedListing.id).map(listing => listing.id)
    );
    const finalListing = { ...listingForSave, id: targetId };
    const updated = listings.map(item => {
      if (item.id === updatedListing.id) {
        if (targetId !== updatedListing.id) deleteDocument(LISTINGS_COLLECTION, updatedListing.id);
        setDocument(LISTINGS_COLLECTION, targetId, finalListing);
        return finalListing;
      }
      return item;
    });
    saveUpdatedState(updated, bookings);
  };

  const handleDeleteListing = (id: string) => {
    const updated = listings.filter(item => item.id !== id);
    deleteDocument(LISTINGS_COLLECTION, id);
    saveUpdatedState(updated, bookings);
  };

  const handleUpdateBookingStatus = (id: string, status: 'accepted' | 'declined') => {
    const updated = bookings.map(b => {
      if (b.id === id) {
        const nextB = { ...b, status };
        setDocument('bookings', b.id, nextB);
        return nextB;
      }
      return b;
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

  const handleAddBooking = (newB: BookingRequest) => {
    const updated = [newB, ...bookings];
    setDocument('bookings', newB.id, newB);
    saveUpdatedState(listings, updated);
  };

  const handlePublishListing = (newLis: Listing) => {
    const listingId = uniqueDocumentIdFromTitle(
      newLis.title,
      listings.filter(listing => listing.id !== newLis.id).map(listing => listing.id)
    );
    const listingForSave = { ...newLis, id: listingId };
    const exists = listings.some(listing => listing.id === newLis.id);
    const updated = exists
      ? listings.map(listing => listing.id === newLis.id ? listingForSave : listing)
      : [listingForSave, ...listings];
    if (exists && listingForSave.id !== newLis.id) {
      deleteDocument(LISTINGS_COLLECTION, newLis.id);
    }
    setDocument(LISTINGS_COLLECTION, listingForSave.id, listingForSave);
    saveUpdatedState(updated, bookings);
  };

  // Filter listings based on current L1 / L2, districts, filters modal criteria & search query
  const filteredListings = listings.filter(item => {
    // Stage 1: Category boundaries
    if (item.status !== 'active') return false;
    if (item.category !== currentL1) return false;
    if (currentL2 && item.subCategory !== currentL2) return false;

    // Stage 2: Geographic districts & Map custom radius selection
    if (customPolygon && customPolygon.length >= 3) {
      const coord = DISTRICT_COORDS[item.district];
      if (coord) {
        if (!isPointInPolygon(coord, customPolygon)) return false;
      } else {
        return false;
      }
    } else if (customPoint) {
      const coord = DISTRICT_COORDS[item.district];
      if (coord) {
        const dx = coord.x - customPoint.x;
        const dy = coord.y - customPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > customRadius) return false;
      } else {
        return false;
      }
    } else if (districtSearch && item.district !== districtSearch) {
      return false;
    }

    // Stage 3: Search text matching
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(query);
      const inDesc = item.description.toLowerCase().includes(query);
      const inDistrict = item.district.toLowerCase().includes(query);
      if (!inTitle && !inDesc && !inDistrict) return false;
    }

    // Stage 4: Advanced filters parameters
    const activePrice = item.hasDropPrice && item.dropPricePerDay ? item.dropPricePerDay : item.pricePerDay;
    const activePriceMonthly = item.pricePerMonth || (activePrice * 30);
    if (activePriceMonthly < filters.priceMin || activePriceMonthly > filters.priceMax) return false;
    
    // Distance check using range
    if (item.distanceToSeaMinutes !== undefined) {
      if (item.distanceToSeaMinutes < (filters.distanceToSeaMin || 0) || item.distanceToSeaMinutes > filters.distanceToSeaMax) {
        return false;
      }
    }

    // New/Renovated within 2 years check
    if (filters.isNewOnly) {
      if (!isListingFresh(item)) return false;
    }

    // Cleanliness constraints check (reviews or approval)
    if (filters.cleanlinessTags.length > 0) {
      const matchAllClean = filters.cleanlinessTags.every(tag => {
        if (tag === 'Bali Base Approved') return item.isApproved;
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
    
    // Wall materials
    if (filters.wallMaterial.length > 0 && item.wallMaterial && !filters.wallMaterial.includes(item.wallMaterial)) return false;

    // Bed Type
    if (filters.bedType.length > 0 && item.bedType && !filters.bedType.includes(item.bedType)) return false;

    // Kitchen Type
    if (filters.kitchenType.length > 0 && item.kitchenType && !filters.kitchenType.includes(item.kitchenType)) return false;

    // Pool Type
    if (filters.poolType.length > 0) {
      if (!item.poolType || item.poolType === 'none') return false;
      
      if (filters.poolType.includes('infinity')) {
        if (item.poolType !== 'infinity') return false;
      }
      
      if (filters.poolType.includes('shared')) {
        const isShared = item.poolType === 'shared' || (item.poolType === 'infinity' && item.territoryType === 'shared');
        if (!isShared) return false;
      }
      
      if (filters.poolType.includes('private')) {
        const isPrivate = item.poolType === 'private' || (item.poolType === 'infinity' && item.territoryType === 'private');
        if (!isPrivate) return false;
      }
    }

    // Internet Minimum Speed
    if (filters.internetSpeedMin > 0 && (item.internetSpeed === undefined || item.internetSpeed < filters.internetSpeedMin)) return false;

    // Bathroom Type & Options
    if (filters.bathroomType.length > 0 && item.bathroomType && !filters.bathroomType.includes(item.bathroomType)) return false;
    if (filters.bathroomOptions.length > 0) {
      const hasAllBathOpts = filters.bathroomOptions.every(opt => item.bathroomOptions && item.bathroomOptions.includes(opt));
      if (!hasAllBathOpts) return false;
    }

    // Room quantity check
    if (item.roomsTotal !== undefined) {
      if (item.roomsTotal < filters.roomsMin || item.roomsTotal > filters.roomsMax) return false;
    }

    // Cleaning frequency
    if (filters.cleaningFrequency.length > 0 && item.cleaningFrequency && !filters.cleaningFrequency.includes(item.cleaningFrequency)) return false;

    // Amenities options check
    if (filters.amenities.length > 0) {
      const hasAll = filters.amenities.every(amen => item.amenities && item.amenities.includes(amen));
      if (!hasAll) return false;
    }

    // View Type check
    if (filters.viewType.length > 0 && item.viewType && !filters.viewType.includes(item.viewType)) return false;

    return true;
  });

  // Sort logic sorting items
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (a.isPromoTurbo && !b.isPromoTurbo) return -1;
    if (!a.isPromoTurbo && b.isPromoTurbo) return 1;
    if (sortBy === 'price_asc') {
      const pa = a.hasDropPrice && a.dropPricePerDay ? a.dropPricePerDay : a.pricePerDay;
      const pb = b.hasDropPrice && b.dropPricePerDay ? b.dropPricePerDay : b.pricePerDay;
      return pa - pb;
    }
    if (sortBy === 'price_desc') {
      const pa = a.hasDropPrice && a.dropPricePerDay ? a.dropPricePerDay : a.pricePerDay;
      const pb = b.hasDropPrice && b.dropPricePerDay ? b.dropPricePerDay : b.pricePerDay;
      return pb - pa;
    }
    if (sortBy === 'distance_sea') {
      const distA = a.distanceToSeaMinutes ?? 15;
      const distB = b.distanceToSeaMinutes ?? 15;
      return distA - distB;
    }
    if (sortBy === 'distance_point') {
      let pt = { x: 190, y: 240 };
      if (customPoint) {
        pt = customPoint;
      }
      const coordA = DISTRICT_COORDS[a.district] || { x: 190, y: 240 };
      const coordB = DISTRICT_COORDS[b.district] || { x: 190, y: 240 };
      const distSqrA = Math.pow(coordA.x - pt.x, 2) + Math.pow(coordA.y - pt.y, 2);
      const distSqrB = Math.pow(coordB.x - pt.x, 2) + Math.pow(coordB.y - pt.y, 2);
      return distSqrA - distSqrB;
    }
    if (sortBy === 'newest') return Number(isListingFresh(b)) - Number(isListingFresh(a));
    if (sortBy === 'approved') return a.isApproved ? -1 : 1;
    if (sortBy === 'drop_price') return a.hasDropPrice ? -1 : 1;

    // Sort by push priority if available, which acts as a ranking priority within category
    const pushA = a.pushedAt ? new Date(a.pushedAt).getTime() : 0;
    const pushB = b.pushedAt ? new Date(b.pushedAt).getTime() : 0;
    if (pushA !== pushB) {
      return pushB - pushA;
    }

    return b.viewsCount - a.viewsCount; // Popularity factor
  });

  // Live Auto-complete suggest search results
  const getAutocompleteSuggestions = () => {
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
  };

  const suggestions = getAutocompleteSuggestions();

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#1E293B] antialiased selection:bg-[#FF7A50]/20 flex flex-col font-sans">
      
      {/* 1. COVER SCREEN (SCREEN 1) */}
      {currentView === 'cover' && (
        <div className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center text-center px-4 select-none">
          {/* Ambient Video styled Background overlay */}
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img
            src={baliRiceBg}
            alt="Rice Terraces Background"
            className="absolute inset-0 w-full h-full object-cover scale-105 animate-scale-slow-pan"
            referrerPolicy="no-referrer"
          />

          {/* Glowing badges upper area */}
          <div className="z-20 mb-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 inline-flex items-center gap-2 animate-bounce-slow">
            <Compass className="w-4 h-4 text-[#FF7A50]" />
            <span className="text-white text-xs font-mono font-bold tracking-wider uppercase">
              Bali base — Direct Connection 2026
            </span>
          </div>

          <div className="z-20 space-y-4 max-w-4xl relative">
            <h1 className="font-display text-5xl sm:text-7xl font-extrabold text-white tracking-tight drop-shadow-md pb-2">
              BALI BASE
            </h1>
            <p className="font-sans text-lg sm:text-xl text-emerald-50/90 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Все необходимое на Бали напрямую от владельцев по честной цене без комиссий агрегаторов
            </p>
          </div>

          {/* User directive indicator */}
          <div className="z-20 mt-16 flex flex-col items-center gap-2 text-white/90">
            <div className="flex flex-col items-center gap-1">
              <MoveDown className="w-5 h-5 animate-bounce text-[#FF7A50]" />
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN MENU (SCREEN 2) */}
      {currentView === 'menu' && (
        <div className="h-[100dvh] sm:min-h-screen w-full flex flex-col animate-fade-in bg-[#F4F7F6] overflow-hidden sm:overflow-visible">
          {/* HEADER BAR ROW */}
          <header className="sticky top-0 bg-white border-b border-[#E5E7EB] z-40 select-none">
            <div className="max-w-7xl mx-auto px-1.5 sm:px-6 h-16 flex items-center justify-between gap-1 sm:gap-4 font-sans">
              
              {/* BRAND EMBLEM & COVER BUTTON */}
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <div
                  onClick={() => setCurrentView('cover')}
                  className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-80 transition group"
                  title="Вернуться на обложку"
                >
                  <Compass className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#FF7A50] group-hover:rotate-45 transition duration-300" />
                  <span className="font-display font-black text-[15px] sm:text-lg text-[#FF7A50] tracking-widest uppercase block font-sans">
                    Bali Base
                  </span>
                </div>

                {/* Back to cover next to logo - hidden on mobile */}
                <button
                  onClick={() => setCurrentView('cover')}
                  className="hidden md:flex px-3 py-1.5 bg-[#F4F7F6] border border-[#E5E7EB] hover:bg-gray-200 text-[#1E293B] rounded-xl transition active:scale-95 cursor-pointer items-center gap-1.5 text-xs font-bold font-sans"
                  title="На обложку"
                  id="navbar-cover-btn"
                >
                  <Compass className="w-4 h-4 text-[#FF7A50]" />
                  <span>На обложку</span>
                </button>
              </div>

              {/* LIVE AUTOCAMP SUGGEST SEARCH BAR */}
              <div className="flex-1 max-w-md relative hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setShowAutoComplete(true);
                    }}
                    onFocus={() => setShowAutoComplete(true)}
                    placeholder="Быстрый поиск (например, 'Wayan')"
                    className="w-full bg-[#F4F7F6] border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#FF7A50] font-sans"
                    id="live-search-input-menu"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-600 text-xs font-bold absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Auto complete live matching box */}
                {showAutoComplete && suggestions && (
                  <div
                    className="absolute top-11 inset-x-0 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden text-xs max-h-[350px] overflow-y-auto p-4 space-y-4 text-left z-50"
                    id="search-suggest-box-menu"
                  >
                    {/* Housing matching */}
                    {suggestions.housing.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-gray-400 block pb-1 border-b border-gray-100">
                          🏨 Жилье ({suggestions.housing.length})
                        </span>
                        {suggestions.housing.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedListing(item);
                              setShowAutoComplete(false);
                              selectL1(item.category);
                              if (item.subcategory) {
                                setCurrentL2(item.subcategory);
                              }
                              setCurrentView('app');
                            }}
                            className="p-1 px-2 rounded-lg hover:bg-[#2F7D69]/5 cursor-pointer flex justify-between text-[#1E293B]"
                          >
                            <span className="font-semibold">{item.title}</span>
                            <span className="text-[10px] text-gray-400">{item.district}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Transport items matching */}
                    {suggestions.transport.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-amber-600 block pb-1 border-b border-gray-100">
                          🛵  Транспорт ({suggestions.transport.length})
                        </span>
                        {suggestions.transport.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedListing(item);
                              setShowAutoComplete(false);
                              selectL1(item.category);
                              if (item.subcategory) {
                                setCurrentL2(item.subcategory);
                              }
                              setCurrentView('app');
                            }}
                            className="p-1 px-2 rounded-lg hover:bg-amber-50/50 cursor-pointer flex justify-between text-[#1E293B]"
                          >
                            <span className="font-semibold">{item.title}</span>
                            <span className="text-[10px] text-gray-400">{item.district}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Guides and useful articles matching */}
                    {suggestions.guides.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-blue-600 block pb-1 border-b border-gray-100">
                          📖 Полезная информация ({suggestions.guides.length})
                        </span>
                        {suggestions.guides.map(guide => (
                          <div
                            key={guide.id}
                            onClick={() => {
                              const inputField = document.getElementById('live-search-input-menu') as HTMLInputElement;
                              if (inputField) inputField.value = guide.title;
                              setSearchTerm(guide.title);
                              setShowAutoComplete(false);
                              selectL1('useful');
                              setCurrentView('app');
                            }}
                            className="p-1 px-2 rounded-lg hover:bg-blue-50/50 cursor-pointer flex flex-col gap-0.5"
                          >
                            <span className="font-semibold text-gray-800">{guide.title}</span>
                            <span className="text-[9px] text-gray-400 line-clamp-1">{guide.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {suggestions.housing.length === 0 && suggestions.transport.length === 0 && suggestions.guides.length === 0 && (
                      <div className="text-center py-4 text-gray-400">
                        Ничего не найдено. Начните вводить "Way..."
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CONTROLS AREA (CURRENCY / PLACE LISTING / PERSONAL CABINET) */}
              <div className="flex items-center gap-1 sm:gap-3 shrink-0 font-sans text-xs">
                
                {/* Currency Switcher Drop */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowCurrencyDrop(!showCurrencyDrop);
                      setShowLanguageDrop(false);
                    }}
                    className="px-2.5 py-1.5 sm:px-2.5 sm:py-1.5 bg-white border border-[#E5E7EB] rounded-xl hover:bg-gray-100 cursor-pointer flex items-center gap-0.5 sm:gap-1 text-[#1E293B] font-mono font-semibold text-[11.5px] sm:text-xs"
                    title="Выбрать валюту"
                  >
                    <span>{CURRENCIES[activeCurrency].symbol}</span>
                    <span className="font-sans text-[10px] sm:text-xs uppercase">{activeCurrency}</span>
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>

                  {showCurrencyDrop && (
                    <div className="absolute top-10 right-0 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 z-50 text-xs w-28 text-center font-mono">
                      {Object.keys(CURRENCIES).map(curr => (
                        <button
                          key={curr}
                          onClick={() => {
                            setActiveCurrency(curr as CurrencyKey);
                            setShowCurrencyDrop(false);
                          }}
                          className={`w-full py-2 hover:bg-[#FF7A50]/10 transition block font-bold text-[#1E293B] ${
                            activeCurrency === curr ? 'bg-[#FF7A50]/10 text-[#FF7A50]' : ''
                          }`}
                        >
                          {CURRENCIES[curr as CurrencyKey].symbol} {curr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Language Switcher Drop */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowLanguageDrop(!showLanguageDrop);
                      setShowCurrencyDrop(false);
                    }}
                    className="px-2.5 py-1.5 sm:px-2.5 sm:py-1.5 bg-white border border-[#E5E7EB] rounded-xl hover:bg-gray-100 cursor-pointer flex items-center gap-0.5 font-bold text-[#1E293B] text-[11.5px] sm:text-xs"
                    title="Выбрать язык"
                  >
                    <span>{activeLanguage}</span>
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60" />
                  </button>

                  {showLanguageDrop && (
                    <div className="absolute top-10 right-0 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 z-50 text-xs w-32">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setActiveLanguage(lang.code);
                            setShowLanguageDrop(false);
                          }}
                          className={`w-full text-left py-2 px-3.5 hover:bg-[#FF7A50]/10 block text-[#1E293B] font-semibold ${
                            activeLanguage === lang.code ? 'bg-[#FF7A50]/10 text-[#FF7A50]' : ''
                          }`}
                        >
                          {lang.name} ({lang.code})
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create Listing Wizard trigger button */}
                <button
                  onClick={() => setShowCreateWizard(true)}
                  className="px-2.5 py-2 sm:px-3 sm:py-2 bg-[#FF7A50] hover:bg-[#E05A30] text-white rounded-xl font-bold font-sans transition hover:shadow-md cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 text-[12px] sm:text-xs"
                  id="create-l-btn-menu"
                >
                  <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Разместить объявление</span>
                </button>

                {/* Users dropdown trigger button with nested submenus */}
                <div className="relative">
                  <button
                    onClick={() => setShowUsersDropdown(!showUsersDropdown)}
                    className="p-2 sm:px-3 sm:py-2 bg-[#F4F7F6] border border-[#E5E7EB] hover:bg-gray-200 text-[#1E293B] rounded-xl font-bold font-sans transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 text-[12.5px] sm:text-xs text-text-dark"
                    id="users-dropdown-btn-menu"
                    title="Users Menu"
                  >
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF7A50]" />
                    <span className="hidden sm:inline">Users</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {/* Dropdown Menu Overlay */}
                  {showUsersDropdown && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2.5 z-40 animate-fade-in text-xs font-sans text-left">
                      <button
                        onClick={() => {
                          setShowAdminDashboard(true);
                          setShowUsersDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 bg-rose-50/50 hover:bg-rose-100/60 text-rose-600 font-extrabold flex items-center gap-2 cursor-pointer transition border-b border-gray-100"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        <span>Админ-панель</span>
                      </button>

                      <button
                        onClick={() => {
                          setUsersModalTab('favorites');
                          setShowUsersModal(true);
                          setShowUsersDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition mt-1"
                      >
                        <Heart className="w-4 h-4 text-[#FF7A50] fill-[#FF7A50]/10" />
                        <span>Избранное</span>
                      </button>

                      <button
                        onClick={() => {
                          setUsersModalTab('whatsapp');
                          setShowUsersModal(true);
                          setShowUsersDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-500" />
                        <span>История кликов</span>
                      </button>

                      <button
                        onClick={() => {
                          const ownListings = listings.filter(item => item.ownerId === 'owner-personal' || item.ownerId === 'owner-1');
                          if (ownListings.length === 0) {
                            // If empty, trigger create wizard
                            setShowCreateWizard(true);
                          } else {
                            // If has list, open the "Мои объявления" dashboard
                            setShowMyAddsListing(true);
                          }
                          setShowUsersDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition"
                      >
                        <List className="w-4 h-4 text-[#2F7D69]" />
                        <span>
                          Мои объявления
                          {listings.filter(item => item.ownerId === 'owner-personal' || item.ownerId === 'owner-1').length === 0 ? ' (создать)' : ''}
                        </span>
                      </button>

                      <div className="border-t border-gray-100 my-1.5" />

                      <button
                        onClick={() => {
                          setShowUsersDropdown(false);
                          localStorage.removeItem('bali_base_favorites');
                          localStorage.removeItem('bali_base_whatsapp_history');
                          alert('Пользователь вышел из системы. Данные сессии очищены.');
                          window.location.reload();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-bold flex items-center gap-2 cursor-pointer transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Выйти</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </header>

          {/* Main Menu body */}
          <div className="flex-grow max-w-4xl w-full mx-auto px-4 pt-3.5 pb-4 xs:pb-6 sm:py-8 flex flex-col justify-center overflow-hidden h-[calc(100dvh-64px)] sm:h-auto select-none">
            <div className="grid grid-cols-2 grid-rows-4 sm:grid-rows-none sm:grid-cols-4 gap-3.5 sm:gap-4 md:gap-6 flex-1 sm:flex-initial min-h-0">
              {L1_CATEGORIES.map(cat => {
                const displayLabel = menuOverrides?.l1?.[cat.id]?.label || cat.label;
                const displayImage = menuOverrides?.l1?.[cat.id]?.image || cat.image;
                const displayL2 = menuOverrides?.l1?.[cat.id]?.l2 || cat.l2;
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      selectL1(cat.id);
                      if (displayL2) {
                        setCurrentL2(displayL2);
                      }
                      setCurrentView('app');
                    }}
                    className="h-full min-h-0 sm:h-auto sm:aspect-square bg-white border border-[#E5E7EB] hover:border-[#FF7A50] hover:shadow-lg rounded-xl xs:rounded-2xl sm:rounded-3xl p-1 sm:p-3 pb-3.5 sm:pb-4.5 transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 active:scale-95 shadow-2xs relative overflow-hidden"
                  >
                    {/* Decorative faint glow */}
                    <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-[#FF7A50]/5 rounded-full filter blur-xl group-hover:scale-125 transition duration-300 pointer-events-none" />

                    {/* 3D Clay Illustration Image perfectly filling the card space */}
                    <div className="absolute inset-x-2 sm:inset-x-3 top-2 sm:top-3 bottom-7 sm:bottom-10 flex items-center justify-center">
                      <img
                        src={displayImage}
                        alt={displayLabel}
                        className="w-full h-full object-contain filter drop-shadow hover:brightness-105 group-hover:scale-110 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Title label at the bottom */}
                    <div className="absolute bottom-2 sm:bottom-2.5 left-1 right-1 flex justify-center text-center">
                      <h3 className="font-display font-extrabold text-center text-xs xs:text-sm sm:text-base lg:text-lg text-[#1E293B] group-hover:text-[#FF7A50] transition-colors leading-none sm:leading-tight tracking-tight px-1 truncate">
                        {displayLabel}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. APP VIEW (SCREEN 3) */}
      {currentView === 'app' && (
        <div className="flex-1 flex flex-col animate-fade-in md:flex-none md:h-[100dvh] md:min-h-0 md:overflow-hidden">
          
          {/* HEADER BAR ROW */}
          <header className="sticky top-0 shrink-0 bg-white border-b border-[#E5E7EB] z-[250] select-none">
            <div className="max-w-7xl mx-auto px-1.5 sm:px-6 h-16 flex items-center justify-between gap-1 sm:gap-4">
              
              {/* BRAND EMBLEM & MENU BUTTON */}
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <div
                  onClick={() => setCurrentView('menu')}
                  className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-80 transition group"
                  title="Вернуться в главное меню"
                >
                  <Compass className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#FF7A50] group-hover:rotate-45 transition duration-300" />
                  <span className="font-display font-black text-[15px] sm:text-lg text-[#FF7A50] tracking-widest uppercase block font-sans">
                    Bali Base
                  </span>
                </div>

                {/* Back to main menu next to logo - hidden on mobile / only visible starting from tablet/desktop (md) */}
                <button
                  onClick={() => setCurrentView('menu')}
                  className="hidden md:flex px-3 py-1.5 bg-[#F4F7F6] border border-[#E5E7EB] hover:bg-gray-200 text-[#1E293B] rounded-xl transition active:scale-95 cursor-pointer items-center gap-1.5 text-xs font-bold font-sans"
                  title="Главное меню"
                  id="navbar-menu-btn"
                >
                  <Menu className="w-4 h-4 text-[#FF7A50]" />
                  <span>Главное Меню</span>
                </button>
              </div>

              {/* LIVE AUTOCAMP SUGGEST SEARCH BAR */}
              <div className="flex-1 max-w-md relative hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setShowAutoComplete(true);
                    }}
                    onFocus={() => setShowAutoComplete(true)}
                    placeholder="Быстрый поиск (например, 'Wayan')"
                    className="w-full bg-[#F4F7F6] border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#FF7A50] font-sans"
                    id="live-search-input"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-600 text-xs font-bold absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Auto complete live matching box */}
                {showAutoComplete && suggestions && (
                  <div
                    className="absolute top-11 inset-x-0 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden text-xs max-h-[350px] overflow-y-auto p-4 space-y-4"
                    id="search-suggest-box"
                  >
                    {/* Housing matching */}
                    {suggestions.housing.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-gray-400 block pb-1 border-b border-gray-100">
                          🏨 Жилье ({suggestions.housing.length})
                        </span>
                        {suggestions.housing.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedListing(item);
                              setShowAutoComplete(false);
                            }}
                            className="p-1 px-2 rounded-lg hover:bg-[#2F7D69]/5 cursor-pointer flex justify-between text-[#1E293B]"
                          >
                            <span className="font-semibold">{item.title}</span>
                            <span className="text-[10px] text-gray-400">{item.district}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Transport items matching */}
                    {suggestions.transport.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-amber-600 block pb-1 border-b border-gray-100">
                          🛵 Транспорт ({suggestions.transport.length})
                        </span>
                        {suggestions.transport.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedListing(item);
                              setShowAutoComplete(false);
                            }}
                            className="p-1 px-2 rounded-lg hover:bg-amber-50/50 cursor-pointer flex justify-between text-[#1E293B]"
                          >
                            <span className="font-semibold">{item.title}</span>
                            <span className="text-[10px] text-gray-400">{item.district}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Guides and useful articles matching */}
                    {suggestions.guides.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-blue-600 block pb-1 border-b border-gray-100">
                          📖 Полезная информация ({suggestions.guides.length})
                        </span>
                        {suggestions.guides.map(guide => (
                          <div
                            key={guide.id}
                            onClick={() => {
                              const inputField = document.getElementById('live-search-input') as HTMLInputElement;
                              if (inputField) inputField.value = guide.title;
                              setSearchTerm(guide.title);
                              setShowAutoComplete(false);
                            }}
                            className="p-1 px-2 rounded-lg hover:bg-blue-50/50 cursor-pointer flex flex-col gap-0.5"
                          >
                            <span className="font-semibold text-gray-800">{guide.title}</span>
                            <span className="text-[9px] text-gray-400 line-clamp-1">{guide.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {suggestions.housing.length === 0 && suggestions.transport.length === 0 && suggestions.guides.length === 0 && (
                      <div className="text-center py-4 text-gray-400">
                        Ничего не найдено. Начните вводить "Way..."
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CONTROLS AREA (CURRENCY / PLACE LISTING / PERSONAL CABINET) */}
              <div className="flex items-center gap-1 sm:gap-3 shrink-0 font-sans text-xs">
                
                {/* Currency Switcher Drop */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowCurrencyDrop(!showCurrencyDrop);
                      setShowLanguageDrop(false);
                    }}
                    className="px-2.5 py-1.5 sm:px-2.5 sm:py-1.5 bg-white border border-[#E5E7EB] rounded-xl hover:bg-gray-100 cursor-pointer flex items-center gap-0.5 sm:gap-1 text-[#1E293B] font-mono font-semibold text-[11.5px] sm:text-xs"
                    title="Выбрать валюту"
                  >
                    <span>{CURRENCIES[activeCurrency].symbol}</span>
                    <span className="font-sans text-[10px] sm:text-xs uppercase">{activeCurrency}</span>
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>

                  {showCurrencyDrop && (
                    <div className="absolute top-10 right-0 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 z-50 text-xs w-28 text-center font-mono">
                      {Object.keys(CURRENCIES).map(curr => (
                        <button
                          key={curr}
                          onClick={() => {
                            setActiveCurrency(curr as CurrencyKey);
                            setShowCurrencyDrop(false);
                          }}
                          className={`w-full py-2 hover:bg-[#FF7A50]/10 transition block font-bold text-[#1E293B] ${
                            activeCurrency === curr ? 'bg-[#FF7A50]/10 text-[#FF7A50]' : ''
                          }`}
                        >
                          {CURRENCIES[curr as CurrencyKey].symbol} {curr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Language Switcher Drop */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowLanguageDrop(!showLanguageDrop);
                      setShowCurrencyDrop(false);
                    }}
                    className="px-2.5 py-1.5 sm:px-2.5 sm:py-1.5 bg-white border border-[#E5E7EB] rounded-xl hover:bg-gray-100 cursor-pointer flex items-center gap-0.5 font-bold text-[#1E293B] text-[11.5px] sm:text-xs"
                    title="Выбрать язык"
                  >
                    <span>{activeLanguage}</span>
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60" />
                  </button>

                  {showLanguageDrop && (
                    <div className="absolute top-10 right-0 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1 z-50 text-xs w-32">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setActiveLanguage(lang.code);
                            setShowLanguageDrop(false);
                          }}
                          className={`w-full text-left py-2 px-3.5 hover:bg-[#FF7A50]/10 block text-[#1E293B] font-semibold ${
                            activeLanguage === lang.code ? 'bg-[#FF7A50]/10 text-[#FF7A50]' : ''
                          }`}
                        >
                          {lang.name} ({lang.code})
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create Listing Wizard trigger button */}
                <button
                  onClick={() => setShowCreateWizard(true)}
                  className="px-2.5 py-2 sm:px-3 sm:py-2 bg-[#FF7A50] hover:bg-[#E05A30] text-white rounded-xl font-bold font-sans transition hover:shadow-md cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 text-[12px] sm:text-xs"
                  id="create-l-btn"
                >
                  <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Разместить объявление</span>
                </button>

                {/* Users dropdown trigger button with nested submenus */}
                <div className="relative">
                  <button
                    onClick={() => setShowUsersDropdown(!showUsersDropdown)}
                    className="p-2 sm:px-3 sm:py-2 bg-[#F4F7F6] border border-[#E5E7EB] hover:bg-gray-200 text-[#1E293B] rounded-xl font-bold font-sans transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 text-[12.5px] sm:text-xs text-text-dark"
                    id="users-dropdown-btn"
                    title="Users Menu"
                  >
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF7A50]" />
                    <span className="hidden sm:inline">Users</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {/* Dropdown Menu Overlay */}
                  {showUsersDropdown && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2.5 z-40 animate-fade-in text-xs font-sans">
                      <button
                        onClick={() => {
                          setShowAdminDashboard(true);
                          setShowUsersDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 bg-rose-50/50 hover:bg-rose-100/60 text-rose-600 font-extrabold flex items-center gap-2 cursor-pointer transition border-b border-gray-100"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        <span>Админ-панель</span>
                      </button>

                      <button
                        onClick={() => {
                          setUsersModalTab('favorites');
                          setShowUsersModal(true);
                          setShowUsersDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition mt-1"
                      >
                        <Heart className="w-4 h-4 text-[#FF7A50] fill-[#FF7A50]/10" />
                        <span>Избранное</span>
                      </button>

                      <button
                        onClick={() => {
                          setUsersModalTab('whatsapp');
                          setShowUsersModal(true);
                          setShowUsersDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-500" />
                        <span>История кликов</span>
                      </button>

                      <button
                        onClick={() => {
                          const ownListings = listings.filter(item => item.ownerId === 'owner-personal' || item.ownerId === 'owner-1');
                          if (ownListings.length === 0) {
                            // If empty, trigger create wizard
                            setShowCreateWizard(true);
                          } else {
                            // If has list, open the "Мои объявления" dashboard
                            setShowMyAddsListing(true);
                          }
                          setShowUsersDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition"
                      >
                        <List className="w-4 h-4 text-[#2F7D69]" />
                        <span>
                          Мои объявления
                          {listings.filter(item => item.ownerId === 'owner-personal' || item.ownerId === 'owner-1').length === 0 ? ' (создать)' : ''}
                        </span>
                      </button>

                      <div className="border-t border-gray-100 my-1.5" />

                      <button
                        onClick={() => {
                          setShowUsersDropdown(false);
                          localStorage.removeItem('bali_base_favorites');
                          localStorage.removeItem('bali_base_whatsapp_history');
                          alert('Пользователь вышел из системы. Данные сессии очищены.');
                          window.location.reload();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-bold flex items-center gap-2 cursor-pointer transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Выйти</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </header>

          {/* LEVEL 1: CATEGORY SELECTIONS ROW */}
          <nav className="hidden bg-white border-b border-[#E5E7EB] py-3 z-30 select-none animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 overflow-x-auto flex gap-6 sm:gap-10 justify-start sm:justify-center items-center shrink-0 w-full scrollbar-none">
              {[
                { id: 'housing', label: 'Жилье', icon: '🏡' },
                { id: 'transport', label: 'Транспорт', icon: '🛵' },
                { id: 'investments', label: 'Инвестиции', icon: '📈' },
                { id: 'services', label: 'Услуги', icon: '🧑‍💼' },
                { id: 'ads', label: 'Объявления', icon: '📢' },
                { id: 'afisha', label: 'афиша', icon: '🎉' },
                { id: 'life', label: 'Жизнь', icon: '💬' },
                { id: 'useful', label: 'Полезное', icon: '🧭' }
              ].map(cat => {
                const isActive = currentL1 === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => selectL1(cat.id)}
                    className={`pb-2 pt-2 px-1 transition-all duration-200 active:scale-95 cursor-pointer shrink-0 border-b-2 select-none focus:outline-none ${
                      isActive
                        ? 'border-[#FF7A50] text-[#FF7A50] font-bold'
                        : 'border-transparent text-gray-400 hover:text-gray-700 font-normal'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-display uppercase tracking-wider font-semibold">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* LEVEL 2: SUBCATEGORY SELECTIONS ROW */}
          <nav className={`shrink-0 bg-white select-none transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] overflow-hidden z-[230] ${
            isL2Visible 
              ? 'max-h-[140px] opacity-100 py-2.5 sm:py-3.5 border-b border-[#E5E7EB]' 
              : 'max-h-0 opacity-0 py-0 border-b-0 pointer-events-none'
          }`}>
            <div className="max-w-7xl mx-auto px-1.5 sm:px-4 flex flex-row justify-around sm:justify-center items-center w-full gap-0.5 sm:gap-10">
              
              {(SUBCATEGORIES_MAP[currentL1] || []).map(sub => {
                const displayLabel = menuOverrides?.l2?.[sub.id]?.label || sub.label;
                const displayIcon = menuOverrides?.l2?.[sub.id]?.icon || sub.icon;
                const displayCustomImage = menuOverrides?.l2?.[sub.id]?.customImage;

                return (
                  <button
                    key={sub.id}
                    onClick={() => setCurrentL2(sub.id)}
                    className={`pb-1.5 pt-1 sm:pb-2 px-1 sm:px-3.5 flex-1 sm:flex-initial flex flex-col items-center justify-center text-center gap-1 sm:gap-2 transition-all duration-200 active:scale-95 cursor-pointer border-b-2 select-none focus:outline-none ${
                      currentL2 === sub.id
                        ? 'border-[#FF7A50] text-[#FF7A50] font-bold scale-102 font-sans'
                        : 'border-transparent text-[#1E293B] hover:text-[#FF7A50] font-normal font-sans'
                    }`}
                  >
                    {displayCustomImage ? (
                      <div className="w-7 h-7 sm:w-[38px] sm:h-[38px] flex items-center justify-center shrink-0 overflow-hidden rounded-lg bg-gray-50 mb-0.5 shadow-2xs">
                        <img 
                          src={displayCustomImage} 
                          alt={displayLabel} 
                          className="w-full h-full object-cover rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <ThreeDIcon 
                        emoji={displayIcon} 
                        size={38} 
                        className="!w-7 !h-7 sm:!w-[38px] sm:!h-[38px] transition-transform duration-200 hover:scale-[1.08] mb-0.5" 
                      />
                    )}
                    <span className="text-[12px] sm:text-xs md:text-sm font-sans tracking-tight leading-tight block w-full">
                      {displayLabel}
                    </span>
                  </button>
                );
              })}

            </div>
          </nav>

          {/* LEVEL 4: STICKY SUB-BAR DISTRICTS AND CALENDARS */}
          <section className="shrink-0 bg-[#F4F7F6] py-3 sticky top-[64px] z-[240] select-none border-b-[0.5px] border-[#94A3B8]/20 px-2 sm:px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-4">
              
              {/* SORTING: CIRCULAR TRIGGER BUTTON (left of "Где? | Когда?") */}
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSortDropdown(!showSortDropdown);
                    setShowDistrictDropdown(false);
                    setShowCalendar(false);
                  }}
                  className={`w-10 h-10 flex items-center justify-center rounded-full border-[0.5px] border-[#94A3B8]/30 transition active:scale-95 cursor-pointer shadow-xs shrink-0 ${
                    showSortDropdown 
                      ? 'bg-[#FF7A50] border-[#FF7A50] text-white shadow-md' 
                      : 'bg-white text-[#FF7A50] hover:text-[#E05A30] hover:bg-[#FF7A50]/10'
                  }`}
                  title="Сортировка"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>

                {showSortDropdown && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowSortDropdown(false)} />
                    <div className="absolute top-12 left-0 min-w-[210px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-2 z-50 text-xs text-left animate-scale-up font-sans">
                      <div className="px-3.5 py-1.5 font-extrabold text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100 mb-1">
                        Сортировка
                      </div>
                      {[
                        { value: 'price_asc', label: 'Цена ↓', desc: 'Сначала дешевле' },
                        { value: 'price_desc', label: 'Цена ↑', desc: 'Сначала дороже' },
                        { value: 'popular', label: 'Рейтинг ↑', desc: 'Сначала по отзывам и просмотрам' },
                        { value: 'distance_sea', label: 'Удаление от моря', desc: 'Ближе к побережью' },
                        { value: 'distance_point', label: 'Удаление от точки', desc: 'Ближе к вашей отметке' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSortBy(opt.value);
                            setShowSortDropdown(false);
                            if (opt.value === 'distance_point' && !customPoint) {
                              setShowListingMap(true);
                              setIsMapFullscreen(true);
                              setIsMapSelectionActive(true);
                            }
                          }}
                          className={`w-full text-left px-3.5 py-2 hover:bg-[#FF7A50]/10 transition flex flex-col gap-0.5 ${
                            sortBy === opt.value ? 'bg-[#FF7A50]/5 text-[#FF7A50] font-bold' : 'text-[#1E293B]'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span className={`text-[10px] font-normal ${sortBy === opt.value ? 'text-[#FF7A50]/85' : 'text-gray-405'}`}>
                            {opt.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* UNIFIED SEARCH BLOCK: Где? | Когда? (Centered in the middle block) */}
              <div className="flex flex-row items-center border-[0.5px] border-[#94A3B8]/30 bg-white p-1 rounded-full shadow-xs hover:shadow-sm transition relative shrink-0">
                
                {/* 1. ГДЕ? */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDistrictDropdown(!showDistrictDropdown);
                    setShowSortDropdown(false);
                    setShowCalendar(false);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 relative cursor-pointer min-w-[110px] sm:min-w-[140px] flex-1 sm:flex-none"
                  id="where-trigger-btn"
                >
                  <MapPin className="w-4 h-4 text-[#FF7A50] shrink-0" />
                  <div className="text-left font-sans flex-1">
                    {customPolygon ? (
                      <div>
                        <span className="text-[#1E293B] font-bold text-[13px] sm:text-xs leading-none block">
                          Область на карте
                        </span>
                        <span className="text-[#FF7A50] font-bold text-[10px] leading-none block mt-0.5 whitespace-nowrap">
                          Выбранная область
                        </span>
                      </div>
                    ) : customPoint ? (
                      <div>
                        <span className="text-[#1E293B] font-bold text-[13px] sm:text-xs leading-none block">
                          Точка на карте
                        </span>
                        <span className="text-[#FF7A50] font-bold text-[10px] leading-none block mt-0.5 whitespace-nowrap">
                          R ~ {Math.round(customRadius)} км
                        </span>
                      </div>
                    ) : districtSearch ? (
                      <span className="text-[#1E293B] font-bold text-[13px] sm:text-sm leading-none block">
                        {districtSearch}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-normal text-[13px] sm:text-xs uppercase tracking-wider leading-none block">
                        Где ?
                      </span>
                    )}
                  </div>

                  {showDistrictDropdown && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={(e) => { e.stopPropagation(); setShowDistrictDropdown(false); }} />
                      <div 
                        className="absolute top-12 left-0 min-w-[210px] max-h-[300px] overflow-y-auto bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-2 z-50 text-xs text-left animate-scale-up font-sans"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Map Picker Selection CTA */}
                        <div className="p-2 border-b border-gray-100 mb-1">
                          <button
                            onClick={() => {
                              setShowListingMap(true);
                              setIsMapFullscreen(true);
                              setIsMapSelectionActive(true);
                              setShowDistrictDropdown(false);
                            }}
                            className="w-full py-2 px-2 bg-[#FF7A50]/15 hover:bg-[#FF7A50]/25 text-[#FF7A50] rounded-xl flex items-center justify-center gap-1.5 font-bold cursor-pointer transition active:scale-95 text-[10px] sm:text-xs"
                          >
                            <Map className="w-3.5 h-3.5 shrink-0" />
                            <span>📍 Указать на карте</span>
                          </button>
                        </div>

                        <div className="px-3.5 py-1 text-gray-400 text-[9px] uppercase font-bold tracking-wider mb-1">
                          Выбор Района
                        </div>
                        
                        <button
                          onClick={() => {
                            setDistrictSearch('');
                            setCustomPoint(null);
                            setCustomPolygon(null);
                            setShowDistrictDropdown(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 hover:bg-gray-100 transition font-bold ${
                            !districtSearch && !customPoint && !customPolygon ? 'text-[#FF7A50] bg-[#FF7A50]/5' : 'text-[#1E293B]'
                          }`}
                        >
                          Все районы
                        </button>

                        {BALI_DISTRICTS.map((dist) => (
                          <button
                            key={dist}
                            onClick={() => {
                              setDistrictSearch(dist);
                              setCustomPoint(null);
                              setCustomPolygon(null);
                              setShowDistrictDropdown(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 hover:bg-[#FF7A50]/10 transition ${
                              districtSearch === dist && !customPoint && !customPolygon ? 'text-[#FF7A50] bg-[#FF7A50]/5 font-bold' : 'text-[#1E293B]'
                            }`}
                          >
                            {dist}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Separator 1 */}
                <div className="w-[1px] h-5 bg-[#E5E7EB]" />

                {/* 2. КОГДА? */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCalendar(!showCalendar);
                    setShowDistrictDropdown(false);
                    setShowSortDropdown(false);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 relative cursor-pointer min-w-[120px] sm:min-w-[160px] flex-1 sm:flex-none"
                >
                  <Calendar className="w-4 h-4 text-[#FF7A50] shrink-0" />
                  <div className="text-left font-sans flex-1">
                    {checkInDate ? (
                      <span className="text-[#1E293B] font-bold text-[13px] sm:text-sm leading-none block">
                        {formatReservationDates(checkInDate, checkOutDate)}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-normal text-[13px] sm:text-xs uppercase tracking-wider leading-none block">
                        Когда ?
                      </span>
                    )}
                  </div>

                  {/* Back-drop layer to close calendar when clicking outside */}
                  {showCalendar && (
                    <div 
                      className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent cursor-default" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCalendar(false);
                      }}
                    />
                  )}

                  {/* Render interactive 2-month custom calendar popup */}
                  {showCalendar && (
                    <TwoMonthCalendar
                      checkInDate={checkInDate}
                      checkOutDate={checkOutDate}
                      onChange={(inD, outD) => {
                        setCheckInDate(inD);
                        setCheckOutDate(outD);
                      }}
                      onClose={() => setShowCalendar(false)}
                    />
                  )}
                </div>
              </div>

              {/* FILTERS: CIRCULAR BUTTON with symbol only (right of "Где? | Когда?") */}
              {currentL1 === 'housing' && (
                <button
                  onClick={() => setShowFiltersModal(true)}
                  className="w-10 h-10 flex items-center justify-center bg-white border-[0.5px] border-[#94A3B8]/30 text-[#FF7A50] hover:text-[#E05A30] hover:bg-[#FF7A50]/10 rounded-full transition active:scale-95 cursor-pointer shadow-xs shrink-0"
                  id="advanced-filters-btn"
                  title="Параметры фильтрации"
                >
                  <Filter className="w-4.5 h-4.5" />
                </button>
              )}

            </div>
          </section>

          {/* MAIN RESULTS PAGE: COLLAPSIBLE LISTING MAP WITH ADAPTIVE LAYOUTS */}
          <main className="flex-grow md:flex-1 md:min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:pt-6 md:pb-0 relative select-none transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]">
            <div className="flex flex-col md:flex-row gap-6 items-stretch md:h-full md:min-h-0">
              
              {/* COLUMN 1: Listings scroll column (adapts dynamically) */}
              <div 
                className={`space-y-6 overflow-y-auto p-[18px] scroll-p-[18px] transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${
                  showListingMap && currentL1 !== 'useful'
                    ? 'w-full md:w-[calc(50%-12px)] md:h-[calc(100%-15px)] md:min-h-0'
                    : 'w-full md:h-[calc(100%-15px)] md:min-h-0'
                }`} 
                id="listings-scroll-panel"
              >
                <div className="flex items-center justify-between select-none">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-lg font-bold text-[#1E293B]">
                      {currentL1 === 'useful' ? 'Полезная информация & гиды:' : 'Найдено объектов:'} {' '}
                      <span className="font-mono text-[#2F7D69] bg-[#2F7D69]/10 border border-[#2F7D69]/20 px-2.5 py-0.5 rounded-lg text-sm font-extrabold shadow-sm">
                        {currentL1 === 'useful' ? MOCK_GUIDES.length : sortedListings.length}
                      </span>
                    </h2>
                    {currentL1 !== 'useful' && (
                      <button
                        onClick={() => {
                          const nextVal = !showListingMap;
                          setShowListingMap(nextVal);
                          if (!nextVal) {
                            setIsMapFullscreen(false);
                          } else if (window.innerWidth < 1024) {
                            setIsMapFullscreen(true);
                          }
                        }}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 border [border-width:0.5px] cursor-pointer shadow-xs select-none active:scale-95 ${
                          showListingMap
                            ? 'bg-[#FF7A50] border-[#FF7A50] text-[#F4F7F6]'
                            : 'bg-white border-[#94A3B8]/30 text-[#1E293B] hover:bg-[#F4F7F6] hover:text-[#FF7A50] hover:border-[#FF7A50]/40'
                        }`}
                      >
                        <Map className="w-3.5 h-3.5 shrink-0" />
                        {showListingMap ? 'Скрыть карту' : 'Показать на карте'}
                      </button>
                    )}
                  </div>
                </div>

                {currentL1 === 'useful' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {MOCK_GUIDES.map(guide => (
                      <div
                        key={guide.id}
                        className="bg-white p-5 rounded-3xl border [border-width:0.5px] border-[#94A3B8]/20 flex flex-col sm:flex-row gap-5 items-start transition duration-200"
                      >
                        <img
                          src={guide.image}
                          alt="Guide preview"
                          className="w-full sm:w-28 h-28 aspect-square rounded-2xl object-cover border border-gray-100 shrink-0 select-none pb-0!"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-2 flex-1">
                          <span className="text-[10px] font-sans font-extrabold text-[#2F7D69] bg-[#2F7D69]/10 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                            {guide.category}
                          </span>
                          <h4 className="font-sans font-bold text-sm sm:text-base text-gray-900 leading-snug">
                            {guide.title}
                          </h4>
                          <p className="text-xs text-[#5F6978] leading-relaxed font-sans">
                            {guide.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sortedListings.length > 0 ? (
                  <div className={`grid gap-6 transition-all duration-300 ${
                    showListingMap 
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2' 
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  }`}>
                    {sortedListings.map(item => (
                      <ListingCard
                        key={item.id}
                        listing={item}
                        onSelect={(lis) => setSelectedListing(lis)}
                        currencySymbol={CURRENCIES[activeCurrency].symbol}
                        currencyRate={CURRENCIES[activeCurrency].rate}
                        checkInDate={checkInDate}
                        checkOutDate={checkOutDate}
                        onOpenCalendar={() => setShowCalendar(true)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-dashed border-[#E5E7EB] p-12 text-center space-y-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                      <Compass className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-gray-700">Нет объявлений в районе {districtSearch}</h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        Попробуйте сбросить продвинутые фильтры, изменить район или выбрать другую категорию размещения.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setDistrictSearch('Canggu');
                        setSearchTerm('');
                      }}
                      className="px-4 py-2 border border-[#E5E7EB] text-xs font-bold text-gray-600 rounded-xl hover:bg-gray-50 transition active:scale-95"
                    >
                      Сбросить до Чангу (Canggu)
                    </button>
                  </div>
                )}

              </div>

              {/* COLUMN 2 (Interactive Floating Map Box / Drawer) */}
              {showListingMap && currentL1 !== 'useful' && (
                <div 
                  className={`overflow-hidden flex flex-col transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${
                    isMapFullscreen
                      ? 'fixed inset-0 w-full h-full z-[300]'
                      : 'relative w-full md:w-[calc(50%-12px)] h-[50vh] min-h-[400px] md:h-[calc(100%-15px)] md:min-h-0 md:flex-none z-[100]'
                  }`}
                  id="map-right-panel"
                >
                  {/* Absolute overlay close button for map drawer */}
                  <div className="absolute top-4 right-4 z-[220] flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setShowListingMap(false);
                        setIsMapFullscreen(false);
                        setIsMapSelectionActive(false);
                      }}
                      className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
                      title="Закрыть карту"
                    >
                      <X className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                      className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
                      title={isMapFullscreen ? 'Свернуть карту' : 'Во весь экран'}
                    >
                      {isMapFullscreen ? (
                        <Minimize className="w-5 h-5 transition-transform group-hover:scale-110" />
                      ) : (
                        <Maximize className="w-5 h-5 transition-transform group-hover:scale-110" />
                      )}
                    </button>
                  </div>
                  
                  <div className="w-full h-full min-h-0 flex-1 relative z-[100]">
                    <MapBox
                      listings={sortedListings}
                      selectedListing={hoveredListing || selectedListing}
                      onListingHover={(lis) => setHoveredListing(lis)}
                      onListingSelect={(lis) => setSelectedListing(lis)}
                      currencySymbol={CURRENCIES[activeCurrency].symbol}
                      currencyRate={CURRENCIES[activeCurrency].rate}
                      isFullscreen={isMapFullscreen}
                      isSelectionActive={isMapSelectionActive}
                      onSelectionStart={() => setIsMapSelectionActive(true)}
                      onSelectionClose={() => setIsMapSelectionActive(false)}
                      onSelectionReset={() => {
                        setCustomPoint(null);
                        setCustomPolygon(null);
                      }}
                      onSelectionApply={(point, radius) => {
                        if (Array.isArray(point)) {
                          setCustomPolygon(point);
                          if (point.length > 0) {
                            const xs = point.map(p => p.x);
                            const ys = point.map(p => p.y);
                            const cx = xs.reduce((a, b) => a + b, 0) / point.length;
                            const cy = ys.reduce((a, b) => a + b, 0) / point.length;
                            setCustomPoint({ x: Math.round(cx), y: Math.round(cy) });
                          } else {
                            setCustomPoint(null);
                          }
                          setCustomRadius(0);
                        } else {
                          setCustomPolygon(null);
                          setCustomPoint(point as { x: number; y: number });
                          setCustomRadius(radius);
                        }
                        setDistrictSearch(''); // Clear district filters in favor of map selection
                        setSortBy('distance_point'); // Sort automatically by distance for best UX
                        setIsMapFullscreen(false);
                      }}
                      initialPoint={customPoint}
                      initialRadius={customRadius}
                      initialPolygon={customPolygon}
                    />
                  </div>
                </div>
              )}

            </div>
          </main>

          {/* ACTIVE FOOTER BAR */}
          <footer className={`shrink-0 bg-white border-t border-[#E5E7EB] text-center mt-auto font-sans text-xs text-gray-400 select-none transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
            showFooter
              ? 'max-h-[300px] opacity-100 py-8' 
              : 'max-md:max-h-[300px] max-md:opacity-100 max-md:py-8 md:max-h-px md:opacity-100 md:py-0 md:pointer-events-none'
          }`}>
            <div className="max-w-7xl mx-auto px-4 space-y-3">
              <p className="font-display font-bold text-gray-600 tracking-widest text-[10px] uppercase">
                BALI BASE PLATFORM v2.0 • direct connections classifieds
              </p>
              <p className="max-w-md mx-auto leading-relaxed">
                Свободные сделки на Бали без переплаты. Платформа не осуществляет транзакции и не взимает комиссии. Связь и оплата напрямую между туристом и провайдером.
              </p>
              <div className="flex justify-center gap-4 text-gray-500 font-semibold pt-2">
                <span className="hover:text-[#FF7A50] cursor-pointer">Жилье целиком</span>
                <span>•</span>
                <span className="hover:text-[#FF7A50] cursor-pointer">Транспорт</span>
                <span>•</span>
                <span className="hover:text-[#FF7A50] cursor-pointer">Полезные статьи</span>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* MODALS LAYERS POPUPS RENDERING */}
          {showFiltersModal && (
            <HousingFilters
              listings={listings}
              subCategory={currentL2}
              filters={filters}
              onApplyFilters={(newF) => setFilters(newF)}
              onClose={() => setShowFiltersModal(false)}
              currencySymbol={CURRENCIES[activeCurrency].symbol}
              currencyRate={CURRENCIES[activeCurrency].rate}
            />
          )}

          {selectedListing && (
            <ListingDetails
              listing={selectedListing}
              onClose={() => setSelectedListing(null)}
              currencySymbol={CURRENCIES[activeCurrency].symbol}
              currencyRate={CURRENCIES[activeCurrency].rate}
              onAddBooking={handleAddBooking}
            />
          )}

          {showCreateWizard && (
            <CreateWizard
              onClose={() => {
                setShowCreateWizard(false);
                if (editingListing) {
                  setShowMyAddsListing(true);
                }
                setEditingListing(null);
              }}
              onPublish={handlePublishListing}
              initialListing={editingListing}
              currencySymbol={CURRENCIES[activeCurrency].symbol}
              currencyRate={CURRENCIES[activeCurrency].rate}
              propCategoriesList={L1_CATEGORIES}
              propSubcategoriesMap={SUBCATEGORIES_MAP}
              menuOverrides={menuOverrides}
            />
          )}

          {showMyAddsListing && (
            <MyAddsListing
              listings={listings}
              bookings={bookings}
              onToggleStatus={handleToggleListingStatus}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onUpdateBooking={handleUpdateBooking}
              onUpdateListing={handleUpdateListing}
              onDeleteListing={handleDeleteListing}
              onClose={() => setShowMyAddsListing(false)}
              currencySymbol={CURRENCIES[activeCurrency].symbol}
              currencyRate={CURRENCIES[activeCurrency].rate}
              onCreateClick={() => {
                setShowMyAddsListing(false);
                setEditingListing(null);
                setShowCreateWizard(true);
              }}
              onEditClick={(listing) => {
                setShowMyAddsListing(false);
                setEditingListing(listing);
                setShowCreateWizard(true);
              }}
            />
          )}

          {showAdminDashboard && (
            <AdminDashboard
              listings={listings}
              bookings={bookings}
              onToggleStatus={handleToggleListingStatus}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onUpdateListing={handleUpdateListing}
              onDeleteListing={handleDeleteListing}
              onClose={() => setShowAdminDashboard(false)}
              currencySymbol={CURRENCIES[activeCurrency].symbol}
              currencyRate={CURRENCIES[activeCurrency].rate}
              menuOverrides={menuOverrides}
              onUpdateMenuOverrides={handleUpdateMenuOverrides}
            />
          )}

          {showUsersModal && (
            <UsersModal
              listings={listings}
              onClose={() => setShowUsersModal(false)}
              onViewListing={(listing) => {
                setSelectedListing(listing);
              }}
              currencySymbol={CURRENCIES[activeCurrency].symbol}
              currencyRate={CURRENCIES[activeCurrency].rate}
              initialTab={usersModalTab}
            />
          )}

          {showMapSelectModal && (
            <MapSelectModal
              initialPoint={customPoint}
              initialRadius={customRadius}
              onClose={() => setShowMapSelectModal(false)}
              onApply={(point, radius) => {
                setCustomPoint(point);
                setCustomRadius(radius);
                setDistrictSearch(''); // Clear district filters in favor of map selection
                setSortBy('distance_point'); // Sort automatically by distance for best UX
                setShowMapSelectModal(false);
              }}
              onReset={() => {
                setCustomPoint(null);
                setDistrictSearch('');
                setSortBy('popular');
                setShowMapSelectModal(false);
              }}
            />
          )}

    </div>
  );
}
