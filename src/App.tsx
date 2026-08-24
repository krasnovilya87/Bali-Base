import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BookingRequest, Listing, SearchState, FilterState } from './types';
import { MOCK_GUIDES } from './data';
import MapBox from './components/MapBox';
import ListingCard from './components/ListingCard';
import SupportContactModal from './components/SupportContactModal';
import TwoMonthCalendar from './components/TwoMonthCalendar';
import { ThreeDIcon } from './components/ThreeDIcon';
import { THEME } from './theme';
import { DEFAULT_LANGUAGE, LanguageCode, loadTranslations, t } from './i18n';
import { I18nProvider } from './i18nContext';
// @ts-ignore
import baliRiceBg from './assets/images/hero4.jpg';
import { CURRENCIES, CurrencyKey } from './app/currency';
import { getDeviceLanguage } from './app/language';
import { L1_CATEGORIES, preloadMenuImages, SUBCATEGORIES_MAP } from './app/menu';
import AppOverlays from './app/components/AppOverlays';
import BrandWordmark from './app/components/BrandWordmark';
import SearchSuggestions from './app/components/SearchSuggestions';
import UsersDropdown from './app/components/UsersDropdown';
import AuthModal from './components/AuthModal';
import { useListingsData } from './app/hooks/useListingsData';
import { useListingSearch } from './app/hooks/useListingSearch';
import { useFavoriteListings } from './hooks/useFavoriteListings';
import { useAuth } from './auth/AuthContext';
import { getDistrictNamesFromGeoJSONSync } from './utils/geo';
import { LISTING_SHARE_PARAM } from './utils/listingShare';

import {
  Compass, Search, Globe, PlusCircle, HelpCircle, Star,
  Calendar, MapPin, Tag, ChevronDown, BookOpen, Sparkles, Filter, ListOrdered, Layers, Image, Menu, Map, X,
  Maximize, Minimize, Heart, MessageSquare, List, UserRound, LayoutGrid
} from 'lucide-react';

const DISTRICT_MENU_GROUPS = [
  ['Canggu', 'Ubud', 'Seminyak', 'Kuta', 'Sanur', 'Uluwatu', 'Nusa Dua', 'Jimbaran', 'Amed', 'Kintamani', 'Lovina'],
  ['Gili Trawangan', 'Gili Meno', 'Gili Air'],
  ['Nusa Penida']
];

const MENU_SELECTION_STORAGE_KEY = 'bali_base_menu_selection';
const FILTERS_STORAGE_KEY = 'bali_base_filters';
const AUTH_RETURN_VIEW_STORAGE_KEY = 'bali_base_auth_return_view';

type AppView = 'cover' | 'menu' | 'app';

const getL2IdsForL1 = (catId: string) => (SUBCATEGORIES_MAP[catId] || []).map(sub => sub.id);

const getDefaultFilters = (): FilterState => ({
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
  vehicleBrand: [],
  favoritesOnly: false
});

const readStoredMenuSelection = () => {
  const defaultL1 = 'housing';
  const defaultSelection = {
    currentL1: defaultL1,
    currentL2: getL2IdsForL1(defaultL1)
  };

  if (typeof window === 'undefined') return defaultSelection;

  try {
    const raw = window.localStorage.getItem(MENU_SELECTION_STORAGE_KEY);
    if (!raw) return defaultSelection;

    const parsed = JSON.parse(raw) as { currentL1?: unknown; currentL2?: unknown };
    const currentL1 = typeof parsed.currentL1 === 'string' && parsed.currentL1 in SUBCATEGORIES_MAP
      ? parsed.currentL1
      : defaultSelection.currentL1;
    const validL2Ids = new Set(getL2IdsForL1(currentL1));
    const currentL2 = Array.isArray(parsed.currentL2)
      ? parsed.currentL2.filter((id): id is string => typeof id === 'string' && validL2Ids.has(id))
      : [];

    return {
      currentL1,
      currentL2: currentL2.length > 0 ? currentL2 : getL2IdsForL1(currentL1)
    };
  } catch {
    return defaultSelection;
  }
};

const readStoredFilters = (): FilterState => {
  const defaultFilters = getDefaultFilters();
  if (typeof window === 'undefined') return defaultFilters;

  try {
    const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return defaultFilters;

    return {
      ...defaultFilters,
      ...(JSON.parse(raw) as Partial<FilterState>)
    };
  } catch {
    return defaultFilters;
  }
};

const readAuthReturnView = (): AppView | null => {
  if (typeof window === 'undefined') return null;

  try {
    const storedView = window.sessionStorage.getItem(AUTH_RETURN_VIEW_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_RETURN_VIEW_STORAGE_KEY);
    return storedView === 'cover' || storedView === 'menu' || storedView === 'app'
      ? storedView
      : null;
  } catch {
    return null;
  }
};

const storeAuthReturnView = (view: AppView) => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(AUTH_RETURN_VIEW_STORAGE_KEY, view);
  } catch {
    // Ignore storage failures; auth still works, only return-screen restore is skipped.
  }
};

export default function App() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(() => readAuthReturnView() || 'cover');
  const {
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
  } = useListingsData();

  // Search, category & routing states
  const [storedMenuSelection] = useState(readStoredMenuSelection);
  const [currentL1, setCurrentL1] = useState<string>(storedMenuSelection.currentL1);
  const [currentL2, setCurrentL2] = useState<string[]>(storedMenuSelection.currentL2);
  const [districtSearch, setDistrictSearch] = useState<string[]>([]);
  const [districtOptions] = useState<string[]>(() => {
    const districtsFromGeoJSON = new Set(getDistrictNamesFromGeoJSONSync());
    return DISTRICT_MENU_GROUPS.flat().filter(district => districtsFromGeoJSON.has(district));
  });
  const districtGroups = DISTRICT_MENU_GROUPS
    .map(group => group.filter(district => districtOptions.includes(district)))
    .filter(group => group.length > 0);

  // Date Picker Checkin - Checkout simulation states 
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  // Live Auto-complete states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAutoComplete, setShowAutoComplete] = useState<boolean>(false);
  const [showMenuCurrencyDrop, setShowMenuCurrencyDrop] = useState<boolean>(false);

  // Filters state
  const [filters, setFilters] = useState<FilterState>(readStoredFilters);

  // Modals / Windows triggers states
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [hoveredListing, setHoveredListing] = useState<Listing | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState<boolean>(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showMyAddsListing, setShowMyAddsListing] = useState<boolean>(false);
  const [initialBookingsListingId, setInitialBookingsListingId] = useState<string | null>(null);
  const [showUsersDropdown, setShowUsersDropdown] = useState<boolean>(false);
  const [showUsersModal, setShowUsersModal] = useState<boolean>(false);
  const [usersModalTab, setUsersModalTab] = useState<'favorites' | 'whatsapp'>('favorites');
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(false);
  const [showContactUsModal, setShowContactUsModal] = useState<boolean>(false);
  const [authModalReason, setAuthModalReason] = useState<string>('');
  const pendingAuthActionRef = useRef<(() => void) | null>(null);
  const [showListingMap, setShowListingMap] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // enabled by default for PC version (tablets & mobile hidden by default)
    }
    return true;
  });
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);
  const [isTopHeaderHidden, setIsTopHeaderHidden] = useState<boolean>(false);
  const [isMobileNavHidden, setIsMobileNavHidden] = useState<boolean>(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const lastPageScrollYRef = useRef(0);
  const filtersBarRef = useRef<HTMLElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const mapPanelRef = useRef<HTMLDivElement | null>(null);
  const mapFrameRef = useRef({ top: 154, height: 420 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(MENU_SELECTION_STORAGE_KEY, JSON.stringify({
      currentL1,
      currentL2
    }));
  }, [currentL1, currentL2]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    preloadMenuImages(menuOverrides);
  }, [menuOverrides]);

  useEffect(() => {
    if (typeof window === 'undefined' || listings.length === 0 || selectedListing) return;

    const params = new URLSearchParams(window.location.search);
    const listingId = params.get(LISTING_SHARE_PARAM);
    if (!listingId) return;

    const sharedListing = listings.find(item => item.id === listingId);
    if (!sharedListing) return;

    setCurrentView('app');
    setCurrentL1(sharedListing.category);
    setCurrentL2([sharedListing.subCategory]);
    setSelectedListing(sharedListing);
  }, [listings, selectedListing]);

  const closeSelectedListing = () => {
    const closingListingId = selectedListing?.id;
    setSelectedListing(null);

    if (typeof window === 'undefined' || !closingListingId) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get(LISTING_SHARE_PARAM) !== closingListingId) return;

    url.searchParams.delete(LISTING_SHARE_PARAM);
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (currentView !== 'app') {
      setIsTopHeaderHidden(false);
      setIsMobileNavHidden(false);
      lastPageScrollYRef.current = window.scrollY;
      return;
    }

    const handlePageScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastPageScrollYRef.current;

      if (currentScrollY <= 2) {
        setIsTopHeaderHidden(false);
        setIsMobileNavHidden(false);
      } else if (delta > 6) {
        setIsTopHeaderHidden(false);
        setIsMobileNavHidden(true);
      } else if (delta < -6) {
        setIsMobileNavHidden(false);
      }

      lastPageScrollYRef.current = currentScrollY;
    };

    lastPageScrollYRef.current = window.scrollY;
    window.addEventListener('scroll', handlePageScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handlePageScroll);
    };
  }, [currentView]);

  useEffect(() => {
    if (typeof window === 'undefined' || currentView !== 'app') return;

    let frameId = 0;
    const updateMapFrame = () => {
      frameId = 0;
      const mapPanel = mapPanelRef.current;
      const filtersBar = filtersBarRef.current;

      if (!mapPanel || !filtersBar || window.innerWidth < 768 || isMapFullscreen || !showListingMap || currentL1 === 'useful') {
        return;
      }

      const filtersBottom = filtersBar.getBoundingClientRect().bottom;
      const top = Math.max(0, filtersBottom + 20);
      const footerTop = footerRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      const bottom = Math.min(window.innerHeight - 20, footerTop - 20);
      const height = Math.max(0, Math.round(bottom - top));

      const previousFrame = mapFrameRef.current;
      if (Math.abs(previousFrame.top - top) < 0.5 && Math.abs(previousFrame.height - height) < 0.5) {
        return;
      }

      mapFrameRef.current = { top, height };
      mapPanel.style.setProperty('--map-sticky-top', `${top}px`);
      mapPanel.style.setProperty('--map-sticky-height', `${height}px`);
    };

    const scheduleMapFrameUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateMapFrame);
    };

    scheduleMapFrameUpdate();
    window.addEventListener('scroll', scheduleMapFrameUpdate, { passive: true });
    window.addEventListener('resize', scheduleMapFrameUpdate);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleMapFrameUpdate);
      window.removeEventListener('resize', scheduleMapFrameUpdate);
    };
  }, [currentView, currentL1, isMapFullscreen, showListingMap, listings.length]);

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
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>(() => getDeviceLanguage());
  const [, setI18nVersion] = useState(0);
  const tr = (key: string, params?: Record<string, string | number>) => t(activeLanguage, key, params);
  const { favoriteIds } = useFavoriteListings();
  const ownerListingIds = useMemo(() => new Set(listings
    .filter(item =>
      item.ownerId === user?.uid ||
      item.ownerId === 'owner-1' ||
      item.ownerId === 'owner-personal' ||
      item.ownerId === 'owner-direct'
    )
    .map(item => item.id)
  ), [listings, user?.uid]);
  const newBookingRequests = useMemo(() => bookings.filter(booking =>
    booking.status === 'pending' && ownerListingIds.has(booking.listingId)
  ), [bookings, ownerListingIds]);
  const newBookingRequestListingIds = useMemo(() => (
    Array.from(new Set(newBookingRequests.map(booking => booking.listingId)))
  ), [newBookingRequests]);
  const acceptedBookingHistoryCount = useMemo(
    () => getAcceptedContactHistoryBookingCount(bookings),
    [bookings, showUsersModal, selectedListing]
  );

  const requestAuth = (reasonKey = 'auth.defaultReason', afterAuth?: () => void) => {
    if (user) return true;
    pendingAuthActionRef.current = afterAuth || null;
    storeAuthReturnView(currentView);
    setAuthModalReason(tr(reasonKey));
    return false;
  };

  const requireAuth = (reasonKey: string, action: () => void) => {
    if (!user) {
      requestAuth(reasonKey, action);
      return;
    }

    action();
  };

  const openBookingRequests = () => {
    const openRequests = () => {
      setShowUsersDropdown(false);
      setInitialBookingsListingId(newBookingRequestListingIds.length === 1 ? newBookingRequestListingIds[0] : null);
      setShowMyAddsListing(true);
    };

    if (!requestAuth('auth.reason.myListings', openRequests)) return;
    openRequests();
  };

  const openBookingHistory = () => {
    const openHistory = () => {
      setShowUsersDropdown(false);
      setUsersModalTab('whatsapp');
      setShowUsersModal(true);
    };

    if (!requestAuth('auth.reason.messages', openHistory)) return;
    openHistory();
  };

  const openMobileMessages = () => {
    openBookingHistory();
  };

  const toggleFavoritesOnly = () => {
    requireAuth('auth.reason.favorites', () => {
      setShowFavoritesOnly(prev => {
        const next = !prev;
        setFilters(currentFilters => ({ ...currentFilters, favoritesOnly: next }));
        return next;
      });
      if (currentView !== 'app') {
        openAppView();
      }
    });
  };

  const openProfile = () => {
    requireAuth('auth.defaultReason', () => {
      setShowUsersDropdown(false);
      setShowProfileModal(true);
    });
  };

  useEffect(() => {
    if (!user || !pendingAuthActionRef.current) return;

    const pendingAction = pendingAuthActionRef.current;
    pendingAuthActionRef.current = null;
    setAuthModalReason('');
    window.setTimeout(pendingAction, 0);
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    loadTranslations(activeLanguage).then(() => {
      if (isMounted) setI18nVersion((version) => version + 1);
    });

    return () => {
      isMounted = false;
    };
  }, [activeLanguage]);

  // Sorters
  const [sortBy, setSortBy] = useState<string>('popular');
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState<boolean>(false);
  const [showMapSelectModal, setShowMapSelectModal] = useState<boolean>(false);
  const [customPoint, setCustomPoint] = useState<{ x: number, y: number } | null>(null);
  const [customRadius, setCustomRadius] = useState<number>(100);
  const [customPolygon, setCustomPolygon] = useState<{ x: number, y: number }[] | null>(null);
  const [isMapSelectionActive, setIsMapSelectionActive] = useState<boolean>(false);
  const [selectionFitRequest, setSelectionFitRequest] = useState<number>(0);
  const [backSwipeOffset, setBackSwipeOffset] = useState<number>(0);
  const [isBackSwipeSettling, setIsBackSwipeSettling] = useState<boolean>(false);

  const resetViewScroll = () => {
    if (typeof window === 'undefined') return;

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = 0;
    }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const listingsPanel = document.getElementById('listings-scroll-panel');
    if (listingsPanel) {
      listingsPanel.scrollTop = 0;
    }
  };

  useEffect(() => {
    resetViewScroll();
    const frame = window.requestAnimationFrame(resetViewScroll);
    const timer = window.setTimeout(resetViewScroll, 80);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [currentView]);

  useEffect(() => {
    if (currentView !== 'menu') return;

    setShowFavoritesOnly(false);
    setFilters(prev => (prev.favoritesOnly ? { ...prev, favoritesOnly: false } : prev));
  }, [currentView]);

  useEffect(() => {
    if (currentView !== 'menu' && currentView !== 'app') return;

    const handleHeaderOutsidePointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.header-popover-root')) return;

      setShowUsersDropdown(false);
      setShowAutoComplete(false);
      setShowMenuCurrencyDrop(false);
    };

    document.addEventListener('pointerdown', handleHeaderOutsidePointer);
    return () => {
      document.removeEventListener('pointerdown', handleHeaderOutsidePointer);
    };
  }, [currentView]);

  const handleGlobalBack = () => {
    if (showMapSelectModal) {
      setShowMapSelectModal(false);
      return;
    }
    if (isMapFullscreen) {
      setIsMapFullscreen(false);
      return;
    }
    if (showFiltersModal) {
      setShowFiltersModal(false);
      return;
    }
    if (selectedListing) {
      closeSelectedListing();
      return;
    }
    if (showCreateWizard) {
      setShowCreateWizard(false);
      setEditingListing(null);
      return;
    }
    if (showMyAddsListing) {
      setShowMyAddsListing(false);
      return;
    }
    if (showAdminDashboard) {
      setShowAdminDashboard(false);
      return;
    }
    if (showContactUsModal) {
      setShowContactUsModal(false);
      return;
    }
    if (showUsersModal) {
      setShowUsersModal(false);
      return;
    }
    if (showProfileModal) {
      setShowProfileModal(false);
      return;
    }
    if (showCalendar) {
      setShowCalendar(false);
      return;
    }
    if (showSortDropdown || showDistrictDropdown || showUsersDropdown || showAutoComplete || showMenuCurrencyDrop) {
      setShowSortDropdown(false);
      setShowDistrictDropdown(false);
      setShowUsersDropdown(false);
      setShowAutoComplete(false);
      setShowMenuCurrencyDrop(false);
      return;
    }
    if (currentView === 'app') {
      setCurrentView('menu');
      return;
    }
    if (currentView === 'menu') {
      setCurrentView('cover');
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let touchStartX = 0;
    let touchStartY = 0;
    let isBackSwipeCandidate = false;
    let isBackSwipeDragging = false;
    let settleTimer: number | null = null;

    const isInteractiveTextTarget = (target: EventTarget | null) => {
      const element = target instanceof Element ? target : null;
      return Boolean(element?.closest('input, textarea, select, [contenteditable="true"]'));
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (showFiltersModal || showCreateWizard) {
        isBackSwipeCandidate = false;
        isBackSwipeDragging = false;
        setBackSwipeOffset(0);
        setIsBackSwipeSettling(false);
        return;
      }

      if (event.touches.length !== 1 || isInteractiveTextTarget(event.target)) {
        isBackSwipeCandidate = false;
        return;
      }

      if (settleTimer !== null) {
        window.clearTimeout(settleTimer);
        settleTimer = null;
      }

      const touch = event.touches[0];
      const edgeWidth = Math.min(88, Math.max(48, window.innerWidth * 0.22));
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isBackSwipeCandidate = touchStartX <= edgeWidth;
      isBackSwipeDragging = false;
      setIsBackSwipeSettling(false);
      setBackSwipeOffset(0);
    };

    const resetBackSwipe = () => {
      setIsBackSwipeSettling(true);
      setBackSwipeOffset(0);
      settleTimer = window.setTimeout(() => {
        setIsBackSwipeSettling(false);
        settleTimer = null;
      }, 220);
    };

    const completeBackSwipe = () => {
      setIsBackSwipeSettling(true);
      setBackSwipeOffset(window.innerWidth);
      settleTimer = window.setTimeout(() => {
        handleGlobalBack();
        setBackSwipeOffset(0);
        setIsBackSwipeSettling(false);
        settleTimer = null;
      }, 180);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isBackSwipeCandidate || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      if (!isBackSwipeDragging) {
        if (deltaX < 8 && Math.abs(deltaY) > 12) {
          isBackSwipeCandidate = false;
          setBackSwipeOffset(0);
          return;
        }

        if (deltaX > 12 && deltaX > Math.abs(deltaY) * 1.35) {
          isBackSwipeDragging = true;
        } else {
          return;
        }
      }

      event.preventDefault();
      setIsBackSwipeSettling(false);
      setBackSwipeOffset(Math.max(0, Math.min(deltaX, window.innerWidth)));
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!isBackSwipeCandidate || event.changedTouches.length !== 1) {
        setBackSwipeOffset(0);
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const isRightSwipe = deltaX > Math.min(110, window.innerWidth * 0.28);
      const isMostlyHorizontal = Math.abs(deltaY) < 60 && deltaX > Math.abs(deltaY) * 1.6;

      isBackSwipeCandidate = false;
      isBackSwipeDragging = false;

      if (isRightSwipe && isMostlyHorizontal) {
        completeBackSwipe();
      } else if (deltaX > 0) {
        resetBackSwipe();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      if (settleTimer !== null) {
        window.clearTimeout(settleTimer);
      }
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    currentView,
    isMapFullscreen,
    selectedListing,
    showAdminDashboard,
    showAutoComplete,
    showCalendar,
    showCreateWizard,
    showDistrictDropdown,
    showFiltersModal,
    showMapSelectModal,
    showMyAddsListing,
    showProfileModal,
    showSortDropdown,
    showUsersDropdown,
    showUsersModal
  ]);

  useEffect(() => {
    if (currentView !== 'cover') return;

    let touchStartY = 0;
    let isCoverSwipeCandidate = false;

    const goToMenuFromCover = () => {
      resetViewScroll();
      setCurrentView('menu');
    };

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 6 || Math.abs(e.deltaX) > 6) {
        goToMenuFromCover();
      }
    };

    const handleKeyDown = () => {
      goToMenuFromCover();
    };

    const handleMouseDown = () => {
      goToMenuFromCover();
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      isCoverSwipeCandidate = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isCoverSwipeCandidate || e.touches.length !== 1) return;
      const touchY = e.touches[0].clientY;
      if (touchStartY - touchY > 8) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      // Scroll down translates to swipe UP (where start Y is larger than end Y)
      if (touchStartY - touchEndY > 40) {
        goToMenuFromCover();
      }
      isCoverSwipeCandidate = false;
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentView]);

  const formatReservationDates = (startStr: string, endStr: string) => {
    if (!startStr) return "";
    const localeByLanguage: Record<LanguageCode, string> = {
      EN: 'en-US',
      ID: 'id-ID',
      RU: 'ru-RU',
      FR: 'fr-FR',
      DE: 'de-DE'
    };
    const locale = localeByLanguage[activeLanguage];
    const getDayMonth = (date: Date) =>
      date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }).replace('.', '');
    const d1 = new Date(startStr);
    const m1 = d1.toLocaleDateString(locale, { month: 'short' }).replace('.', '');

    if (endStr) {
      const d2 = new Date(endStr);
      const m2 = d2.toLocaleDateString(locale, { month: 'short' }).replace('.', '');

      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const getNightsWord = (nights: number) => {
        if (activeLanguage !== 'RU') {
          return nights === 1 ? tr('listing.night') : tr('listing.nights');
        }
        const mod10 = nights % 10;
        const mod100 = nights % 100;
        if (mod100 >= 11 && mod100 <= 19) {
          return "\u043d\u043e\u0447\u0435\u0439";
        }
        if (mod10 === 1) {
          return "\u043d\u043e\u0447\u044c";
        }
        if (mod10 >= 2 && mod10 <= 4) {
          return "\u043d\u043e\u0447\u0438";
        }
        return "\u043d\u043e\u0447\u0435\u0439";
      };

      const nightsSuffix = diffDays > 0 ? ` (${diffDays} ${getNightsWord(diffDays)})` : "";

      if (m1 === m2) {
        return `${d1.getDate()}-${d2.getDate()} ${m1}${nightsSuffix}`;
      }
      return `${getDayMonth(d1)} - ${getDayMonth(d2)}${nightsSuffix}`;
    }
    return `${tr('date.from')} ${getDayMonth(d1)}`;
  };

  // Switch Category L1 -> automatically enables all matching Level-2 filters
  const selectL1 = (catId: string) => {
    setCurrentL1(prevL1 => {
      if (prevL1 !== catId) {
        setCurrentL2(getL2IdsForL1(catId));
      }
      return catId;
    });
  };

  const openAppView = () => {
    lastPageScrollYRef.current = 0;
    setCurrentView('app');
    resetViewScroll();
  };

  const selectSingleL2 = (subCategoryId: string) => {
    setCurrentL2(subCategoryId ? [subCategoryId] : []);
  };

  const toggleL2 = (subCategoryId: string) => {
    setCurrentL2(prev => {
      if (prev.includes(subCategoryId)) {
        return prev.length > 1 ? prev.filter(id => id !== subCategoryId) : prev;
      }
      return [...prev, subCategoryId];
    });
  };

  const setPrimaryL2 = (subCategoryId: string) => {
    setCurrentL2(prev => {
      if (!subCategoryId) return prev;
      if (!prev.includes(subCategoryId)) return [subCategoryId, ...prev];
      return [subCategoryId, ...prev.filter(id => id !== subCategoryId)];
    });
  };

  const primaryL2 = currentL2[0] || '';
  const selectedDistrictLabel = districtSearch.length > 2
    ? `${districtSearch.slice(0, 2).join(', ')} +${districtSearch.length - 2}`
    : districtSearch.join(', ');
  const activeFilters: FilterState = {
    ...filters,
    favoritesOnly: showFavoritesOnly
  };

  const applyFilters = (nextFilters: FilterState) => {
    setFilters(nextFilters);
    setShowFavoritesOnly(nextFilters.favoritesOnly);
  };

  const { sortedListings, suggestions } = useListingSearch({
    listings,
    bookings,
    currentL1,
    currentL2,
    districtSearch,
    customPoint,
    customRadius,
    customPolygon,
    searchTerm,
    filters: activeFilters,
    sortBy,
    favoriteIds,
    checkInDate,
    checkOutDate
  });
  const mobileNavButtonClass = 'flex h-[50px] w-[50px] min-w-0 items-center justify-center justify-self-center rounded-full border border-white/60 bg-white/32 text-[#1E293B] shadow-[0_1px_8px_rgba(15,23,42,0.08)] backdrop-blur-[2px] transition active:scale-95';
  const mobileNavActiveButtonClass = 'relative flex h-[50px] w-[50px] min-w-0 items-center justify-center justify-self-center rounded-full border border-white/60 bg-white/38 shadow-[0_1px_8px_rgba(15,23,42,0.08)] backdrop-blur-[2px] transition active:scale-95';

  return (
    <I18nProvider language={activeLanguage}>
      <div
        className="min-h-screen bg-[#F4F7F6] text-[#1E293B] antialiased selection:bg-[#FF7A50]/20 flex flex-col font-sans"
        style={{
          transform: backSwipeOffset > 0 ? `translate3d(${backSwipeOffset}px, 0, 0)` : undefined,
          transition: isBackSwipeSettling ? 'transform 180ms cubic-bezier(0.2, 0, 0, 1)' : 'none',
          willChange: backSwipeOffset > 0 || isBackSwipeSettling ? 'transform' : undefined
        }}
      >

        {/* 1. COVER SCREEN (SCREEN 1) */}
        {currentView === 'cover' && (
          <div className="relative min-h-[100lvh] w-full overflow-hidden px-4 text-center select-none">
            {/* Ambient Video styled Background overlay */}
            <div className="pointer-events-none fixed inset-x-0 top-[calc(-1*max(env(safe-area-inset-top),24px))] bottom-[-18svh] overflow-hidden">
              <img
                src={baliRiceBg}
                alt="Rice Terraces Background"
                className="cover-hero-image absolute inset-0 h-full w-full object-cover object-[center_38%] scale-105 animate-scale-slow-pan"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/55 z-10" />
            </div>

            <div className="relative z-20 mx-auto flex min-h-[100lvh] w-full max-w-5xl flex-col items-center justify-center pb-[calc(22svh+env(safe-area-inset-bottom))] pt-[calc(10svh+env(safe-area-inset-top))] sm:pb-[20svh] sm:pt-[8svh]">
              <div className="flex translate-y-[-2svh] flex-col items-center sm:translate-y-[-3svh]">
                {/* Glowing badges upper area */}
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 backdrop-blur-md sm:mb-5 sm:px-4 animate-bounce-slow">
                  <Compass className="w-4 h-4 text-[#FF7A50]" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white sm:text-xs">
                    {tr('cover.badge')}
                  </span>
                </div>

                <div className="mx-auto max-w-[92vw] pb-2">
                  <BrandWordmark label={tr('brand.name')} variant="cover" />
                </div>

                <p className="mx-auto mt-3 max-w-[min(38rem,86vw)] text-balance font-sans text-base font-medium leading-relaxed text-emerald-50/90 drop-shadow-sm sm:mt-4 sm:text-xl">
                  {tr('cover.subtitle')}
                </p>
              </div>
            </div>

            {/* Scroll directive indicator */}
            <div className="absolute inset-x-0 bottom-[calc(6svh+env(safe-area-inset-bottom))] z-20 flex items-center justify-center text-white/90 sm:bottom-[7svh]">
              <div className="cover-scroll-mouse" aria-hidden="true">
                <div className="cover-scroll-mouse-shell">
                  <div className="cover-scroll-wheel" />
                </div>
              </div>
              <div className="flex cover-swipe-hand" aria-hidden="true">
                <div className="cover-swipe-up">
                  <span className="cover-swipe-up-arrow" />
                  <span className="cover-swipe-up-track" />
                  <span className="cover-swipe-up-dot" />
                </div>
              </div>
            </div>
            <div className="relative h-[18svh]" aria-hidden="true" />
          </div>
        )}

        {/* 2. MAIN MENU (SCREEN 2) */}
        {currentView === 'menu' && (
          <div className="h-[100dvh] sm:min-h-screen w-full flex flex-col animate-fade-in bg-[#F4F7F6] overflow-hidden sm:overflow-visible">
            {/* HEADER BAR ROW */}
            <header className={`sticky top-0 bg-white border-b border-[#E5E7EB] z-40 select-none transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] md:translate-y-0 ${isTopHeaderHidden ? '-translate-y-full' : 'translate-y-0'}`}>
              <div className="max-w-7xl mx-auto px-1.5 sm:px-6 h-16 flex items-center justify-between gap-1 sm:gap-4 font-sans">

                {/* BRAND EMBLEM & COVER BUTTON */}
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                  <div
                    onClick={() => setCurrentView('cover')}
                    className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-80 transition group"
                    title={tr('nav.backToCover.title')}
                  >
                    <Compass className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#FF7A50] group-hover:rotate-45 transition duration-300" />
                    <BrandWordmark label={tr('brand.name')} />
                  </div>

                  {/* Back to cover next to logo - hidden on mobile */}
                  <button
                    onClick={() => setCurrentView('cover')}
                    className="hidden md:flex px-3 py-1.5 bg-[#F4F7F6] border border-[#E5E7EB] hover:bg-gray-200 text-[#1E293B] rounded-xl transition active:scale-95 cursor-pointer items-center gap-1.5 text-xs font-bold font-sans"
                    title={tr('nav.backToCover')}
                    id="navbar-cover-btn"
                  >
                    <Menu className="w-4 h-4 text-[#FF7A50]" />
                    <span>{tr('nav.backToCover')}</span>
                  </button>
                </div>

                {/* LIVE AUTOCAMP SUGGEST SEARCH BAR */}
                <div className="header-popover-root relative mx-1 flex min-w-0 flex-1 items-center gap-1.5 sm:mx-0 sm:gap-2 md:max-w-md">
                  <div className="relative min-w-0 flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setShowAutoComplete(true);
                        setShowMenuCurrencyDrop(false);
                      }}
                      onFocus={() => {
                        setShowAutoComplete(true);
                        setShowMenuCurrencyDrop(false);
                      }}
                      placeholder={tr('search.placeholder')}
                      className="box-border h-8 min-h-8 max-h-8 w-full appearance-none rounded-xl border border-[#E5E7EB] bg-[#F4F7F6] py-0 pl-8 pr-7 font-sans text-xs leading-none text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#FF7A50] sm:h-9 sm:min-h-9 sm:max-h-9 sm:text-sm md:h-auto md:min-h-0 md:max-h-none md:py-2 md:pl-9 md:pr-4"
                      id="live-search-input-menu"
                    />
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 md:left-3" />

                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 md:right-3"
                      >
                        Г—
                      </button>
                    )}

                    {showAutoComplete && suggestions && (
                      <SearchSuggestions
                        suggestions={suggestions}
                        tr={tr}
                        className="text-left z-50"
                        onListingSelect={item => {
                          setSelectedListing(item);
                          setShowAutoComplete(false);
                          selectL1(item.category);
                          const legacySubcategory = (item as Listing & { subcategory?: string }).subcategory;
                          if (legacySubcategory) {
                            selectSingleL2(legacySubcategory);
                          }
                          openAppView();
                        }}
                        onGuideSelect={guide => {
                          const inputField = document.getElementById('live-search-input-menu') as HTMLInputElement;
                          if (inputField) inputField.value = guide.title;
                          setSearchTerm(guide.title);
                          setShowAutoComplete(false);
                          selectL1('useful');
                          openAppView();
                        }}
                      />
                    )}
                  </div>

                  <div className="relative shrink-0 md:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenuCurrencyDrop(!showMenuCurrencyDrop);
                        setShowAutoComplete(false);
                      }}
                      className="box-border flex h-8 min-h-8 w-14 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-2 font-sans text-[11px] font-black uppercase leading-none text-[#1E293B] transition hover:bg-gray-100 active:scale-95 sm:h-9 sm:min-h-9 sm:w-16 sm:text-xs"
                      title={tr('nav.currency.title')}
                      aria-label={tr('nav.currency.title')}
                      aria-expanded={showMenuCurrencyDrop}
                    >
                      {activeCurrency}
                    </button>

                    {showMenuCurrencyDrop && (
                      <div className="pu absolute right-0 top-10 z-50 w-28 overflow-hidden rounded-2xl border border-white/50 py-1.5 text-center text-xs shadow-xl animate-fade-in sm:top-11">
                        {Object.keys(CURRENCIES).map(curr => (
                          <button
                            key={curr}
                            type="button"
                            onClick={() => {
                              setActiveCurrency(curr as CurrencyKey);
                              setShowMenuCurrencyDrop(false);
                            }}
                            className={`block w-full py-2 font-bold text-[#1E293B] transition hover:bg-white/70 ${
                              activeCurrency === curr ? 'bg-white/70 text-[#FF7A50]' : ''
                            }`}
                          >
                            {CURRENCIES[curr as CurrencyKey].symbol} {curr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* CONTROLS AREA (PLACE LISTING / PERSONAL CABINET) */}
                <div className="flex items-center gap-1 sm:gap-3 shrink-0 font-sans text-xs">

                  <button
                    type="button"
                    onClick={openBookingRequests}
                    className="relative hidden w-8 h-8 sm:w-9 sm:h-9 bg-white border border-[#E5E7EB] hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A50]/30 rounded-xl cursor-pointer md:flex items-center justify-center active:scale-95 transition shrink-0"
                    title={tr('nav.bookingRequests')}
                    aria-label={tr('nav.bookingRequests')}
                  >
                    <List
                      className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#FF7A50] transition-colors"
                      strokeWidth={1.8}
                    />
                    {newBookingRequests.length > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#FF4D5D] px-1 text-[10px] font-black leading-none text-white shadow-sm">
                        {newBookingRequests.length > 99 ? '99+' : newBookingRequests.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={openBookingHistory}
                    className="relative hidden w-8 h-8 sm:w-9 sm:h-9 bg-white border border-[#E5E7EB] hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A50]/30 rounded-xl cursor-pointer md:flex items-center justify-center active:scale-95 transition shrink-0"
                    title={tr('nav.clickHistory')}
                    aria-label={tr('nav.clickHistory')}
                  >
                    <MessageSquare
                      className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#FF7A50] transition-colors"
                      strokeWidth={1.8}
                    />
                    {acceptedBookingHistoryCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#FF4D5D] px-1 text-[10px] font-black leading-none text-white shadow-sm">
                        {acceptedBookingHistoryCount > 99 ? '99+' : acceptedBookingHistoryCount}
                      </span>
                    )}
                  </button>

                  {/* Create Listing Wizard trigger button */}
                  <button
                    onClick={() => requireAuth('auth.reason.createListing', () => setShowCreateWizard(true))}
                    className="hidden px-2.5 py-2 sm:px-3 sm:py-2 bg-[#FF7A50] hover:bg-[#E05A30] text-white rounded-xl font-bold font-sans transition hover:shadow-md cursor-pointer md:flex items-center gap-1 active:scale-95 shrink-0 text-[12px] sm:text-xs"
                    id="create-l-btn-menu"
                  >
                    <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tr('nav.createListing')}</span>
                  </button>

                  <div className="hidden md:block">
                    <UsersDropdown
                      bookings={bookings}
                      id="users-dropdown-btn-menu"
                      listings={listings}
                      showUsersDropdown={showUsersDropdown}
                      tr={tr}
                      currentUser={user}
                      onRequireAuth={requestAuth}
                      setShowUsersDropdown={setShowUsersDropdown}
                      setShowAdminDashboard={setShowAdminDashboard}
                      setShowCreateWizard={setShowCreateWizard}
                      setShowMyAddsListing={setShowMyAddsListing}
                      setShowProfileModal={setShowProfileModal}
                      setShowUsersModal={setShowUsersModal}
                      setUsersModalTab={setUsersModalTab}
                    />
                  </div>

                </div>

              </div>
            </header>

            {/* Main Menu body */}
            <div className="flex-grow max-w-4xl w-full mx-auto px-4 pt-3 pb-3 sm:py-8 flex flex-col justify-start sm:justify-center overflow-hidden h-[calc(100dvh_-_64px_-_6.2rem_-_env(safe-area-inset-bottom))] sm:h-auto select-none">
              <div className="grid w-full max-w-[min(100%,calc((100dvh_-_64px_-_6.2rem_-_env(safe-area-inset-bottom)_-_30px)/2_*_1.18_+_10px))] mx-auto grid-cols-2 grid-rows-4 sm:grid-rows-none sm:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 sm:max-w-none sm:flex-initial min-h-0">
                {L1_CATEGORIES.map(cat => {
                  const displayLabel = tr(`category.${cat.id}.label`);
                  const displayImage = menuOverrides?.l1?.[cat.id]?.image || cat.image;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        selectL1(cat.id);
                        openAppView();
                      }}
                      className="aspect-[1.18/1] min-h-0 bg-white border border-[#E5E7EB] hover:border-[#FF7A50] hover:shadow-lg rounded-xl xs:rounded-2xl sm:rounded-3xl p-1 sm:p-3 pb-4 sm:pb-4.5 transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 active:scale-95 shadow-2xs relative overflow-hidden"
                    >
                      {/* Decorative faint glow */}
                      <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-[#FF7A50]/5 rounded-full filter blur-xl group-hover:scale-125 transition duration-300 pointer-events-none" />

                      {/* 3D Clay Illustration Image perfectly filling the card space */}
                      <div className="absolute inset-x-2 sm:inset-x-3 top-2 sm:top-3 bottom-9 sm:bottom-10 flex items-center justify-center">
                        <img
                          src={displayImage}
                          alt={displayLabel}
                          className="main-menu-card-image w-full h-full object-contain filter drop-shadow hover:brightness-105 group-hover:scale-110 transition-all duration-300"
                          loading="eager"
                          decoding="async"
                          width={560}
                          height={560}
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Title label at the bottom */}
                      <div className="absolute bottom-2 sm:bottom-2.5 left-1 right-1 flex justify-center text-center">
                        <h3 className="font-display font-extrabold text-center text-[13px] xs:text-[15px] sm:text-base lg:text-lg text-[#1E293B] group-hover:text-[#FF7A50] transition-colors leading-[1.2] sm:leading-tight tracking-tight px-1 py-0.5 truncate">
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
          <div className="flex-1 flex flex-col animate-fade-in min-h-screen">

            {/* HEADER BAR ROW */}
            <header className="hidden shrink-0 bg-white border-b border-[#E5E7EB] select-none md:block">
              <div className="max-w-7xl mx-auto px-1.5 sm:px-6 h-16 flex items-center justify-between gap-1 sm:gap-4">

                {/* BRAND EMBLEM & MENU BUTTON */}
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                  <div
                    onClick={() => setCurrentView('menu')}
                    className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-80 transition group"
                    title={tr('nav.backToCover.title')}
                  >
                    <Compass className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#FF7A50] group-hover:rotate-45 transition duration-300" />
                    <BrandWordmark label={tr('brand.name')} />
                  </div>

                  {/* Back to main menu next to logo - hidden on mobile / only visible starting from tablet/desktop (md) */}
                  <button
                    onClick={() => setCurrentView('menu')}
                    className="hidden md:flex px-3 py-1.5 bg-[#F4F7F6] border border-[#E5E7EB] hover:bg-gray-200 text-[#1E293B] rounded-xl transition active:scale-95 cursor-pointer items-center gap-1.5 text-xs font-bold font-sans"
                    title={tr('nav.backToCover')}
                    id="navbar-menu-btn"
                  >
                    <Menu className="w-4 h-4 text-[#FF7A50]" />
                    <span>{tr('nav.backToCover')}</span>
                  </button>
                </div>

                {/* LIVE AUTOCAMP SUGGEST SEARCH BAR */}
                <div className="header-popover-root relative mx-1 block min-w-0 flex-1 sm:mx-0 md:max-w-md">
                  <div className="header-popover-root relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setShowAutoComplete(true);
                      }}
                      onFocus={() => setShowAutoComplete(true)}
                      placeholder={tr('search.placeholder')}
                      className="box-border h-8 min-h-8 max-h-8 w-full appearance-none rounded-xl border border-[#E5E7EB] bg-[#F4F7F6] py-0 pl-8 pr-7 font-sans text-xs leading-none text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#FF7A50] sm:h-9 sm:min-h-9 sm:max-h-9 sm:text-sm md:h-auto md:min-h-0 md:max-h-none md:py-2 md:pl-9 md:pr-4"
                      id="live-search-input"
                    />
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 md:left-3" />

                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 md:right-3"
                      >
                        Г—
                      </button>
                    )}
                  </div>

                  {showAutoComplete && suggestions && (
                    <SearchSuggestions
                      suggestions={suggestions}
                      tr={tr}
                      onListingSelect={item => {
                        setSelectedListing(item);
                        setShowAutoComplete(false);
                      }}
                      onGuideSelect={guide => {
                        const inputField = document.getElementById('live-search-input') as HTMLInputElement;
                        if (inputField) inputField.value = guide.title;
                        setSearchTerm(guide.title);
                        setShowAutoComplete(false);
                      }}
                    />
                  )}
                </div>

                {/* CONTROLS AREA (PLACE LISTING / PERSONAL CABINET) */}
                <div className="flex items-center gap-1 sm:gap-3 shrink-0 font-sans text-xs">

                  <button
                    type="button"
                    onClick={() => requireAuth('auth.reason.favorites', () => {
                      setShowFavoritesOnly(prev => {
                        const next = !prev;
                        setFilters(currentFilters => ({ ...currentFilters, favoritesOnly: next }));
                        return next;
                      });
                    })}
                    className="relative hidden w-8 h-8 sm:w-9 sm:h-9 bg-white border border-[#E5E7EB] hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D5D]/30 rounded-xl cursor-pointer md:flex items-center justify-center active:scale-95 transition shrink-0"
                    title={tr('nav.favorites')}
                    aria-label={tr('nav.favorites')}
                    aria-pressed={showFavoritesOnly}
                  >
                    <Heart
                      className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#FF4D5D] transition-colors"
                      strokeWidth={showFavoritesOnly ? 2.2 : 1.6}
                      fill={showFavoritesOnly ? 'currentColor' : 'none'}
                    />
                    {favoriteIds.size > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#FF4D5D] px-1 text-[10px] font-black leading-none text-white shadow-sm">
                        {favoriteIds.size > 99 ? '99+' : favoriteIds.size}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={openBookingRequests}
                    className="relative hidden w-8 h-8 sm:w-9 sm:h-9 bg-white border border-[#E5E7EB] hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A50]/30 rounded-xl cursor-pointer md:flex items-center justify-center active:scale-95 transition shrink-0"
                    title={tr('nav.bookingRequests')}
                    aria-label={tr('nav.bookingRequests')}
                  >
                    <List
                      className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#FF7A50] transition-colors"
                      strokeWidth={1.8}
                    />
                    {newBookingRequests.length > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#FF4D5D] px-1 text-[10px] font-black leading-none text-white shadow-sm">
                        {newBookingRequests.length > 99 ? '99+' : newBookingRequests.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={openBookingHistory}
                    className="relative hidden w-8 h-8 sm:w-9 sm:h-9 bg-white border border-[#E5E7EB] hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A50]/30 rounded-xl cursor-pointer md:flex items-center justify-center active:scale-95 transition shrink-0"
                    title={tr('nav.clickHistory')}
                    aria-label={tr('nav.clickHistory')}
                  >
                    <MessageSquare
                      className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#FF7A50] transition-colors"
                      strokeWidth={1.8}
                    />
                    {acceptedBookingHistoryCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#FF4D5D] px-1 text-[10px] font-black leading-none text-white shadow-sm">
                        {acceptedBookingHistoryCount > 99 ? '99+' : acceptedBookingHistoryCount}
                      </span>
                    )}
                  </button>

                  {/* Create Listing Wizard trigger button */}
                  <button
                    onClick={() => requireAuth('auth.reason.createListing', () => setShowCreateWizard(true))}
                    className="hidden px-2.5 py-2 sm:px-3 sm:py-2 bg-[#FF7A50] hover:bg-[#E05A30] text-white rounded-xl font-bold font-sans transition hover:shadow-md cursor-pointer md:flex items-center gap-1 active:scale-95 shrink-0 text-[12px] sm:text-xs"
                    id="create-l-btn"
                  >
                    <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tr('nav.createListing')}</span>
                  </button>

                  <div className="hidden md:block">
                    <UsersDropdown
                      bookings={bookings}
                      id="users-dropdown-btn"
                      listings={listings}
                      showUsersDropdown={showUsersDropdown}
                      tr={tr}
                      currentUser={user}
                      onRequireAuth={requestAuth}
                      setShowUsersDropdown={setShowUsersDropdown}
                      setShowAdminDashboard={setShowAdminDashboard}
                      setShowCreateWizard={setShowCreateWizard}
                      setShowMyAddsListing={setShowMyAddsListing}
                      setShowProfileModal={setShowProfileModal}
                      setShowUsersModal={setShowUsersModal}
                      setUsersModalTab={setUsersModalTab}
                    />
                  </div>

                </div>
              </div>
            </header>

            {/* LEVEL 1: CATEGORY SELECTIONS ROW */}
            <nav className="hidden bg-white py-3 z-30 select-none animate-fade-in">
              <div className="max-w-7xl mx-auto px-4 overflow-x-auto flex gap-6 sm:gap-10 justify-start sm:justify-center items-center shrink-0 w-full scrollbar-none">
                {[
                  { id: 'housing', label: tr('category.housing.label'), icon: 'рџЏЎ' },
                  { id: 'transport', label: tr('category.transport.label'), icon: 'рџ›µ' },
                  { id: 'investments', label: tr('category.investments.label'), icon: 'рџ“€' },
                  { id: 'services', label: tr('category.services.label'), icon: 'рџ§‘вЂЌрџ’ј' },
                  { id: 'ads', label: tr('category.ads.label'), icon: 'рџ“ў' },
                  { id: 'afisha', label: tr('category.afisha.label'), icon: 'рџЋ‰' },
                  { id: 'life', label: tr('category.life.label'), icon: 'рџ’¬' },
                  { id: 'useful', label: tr('category.useful.label'), icon: 'рџ§­' }
                ].map(cat => {
                  const isActive = currentL1 === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => selectL1(cat.id)}
                      className={`pb-2 pt-2 px-1 transition-all duration-200 active:scale-95 cursor-pointer shrink-0 border-b-2 select-none focus:outline-none ${isActive
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
            <nav className="relative z-[230] shrink-0 select-none overflow-x-auto bg-[#F4F7F6] py-1.5 sm:overflow-hidden md:py-2">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 flex flex-row justify-center items-center w-max min-w-full gap-3 sm:gap-4">

                {(SUBCATEGORIES_MAP[currentL1] || []).map(sub => {
                  const displayLabel = tr(`subcategory.${sub.id}`);
                  const displayIcon = menuOverrides?.l2?.[sub.id]?.icon || sub.icon;
                  const displayCustomImage = menuOverrides?.l2?.[sub.id]?.customImage;
                  const isSelected = currentL2.includes(sub.id);

                  return (
                    <button
                      key={sub.id}
                      onClick={() => toggleL2(sub.id)}
                      className={`relative min-h-[54px] w-auto min-w-[104px] px-3 py-2 flex-none md:flex-initial flex flex-col items-center justify-center text-center gap-1 rounded-none border border-transparent select-none cursor-pointer bg-transparent font-sans transition-[transform,box-shadow,border-color,color] duration-[180ms] ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E293B]/35 active:translate-y-0 ${isSelected
                        ? 'font-semibold text-[#1E293B]'
                        : 'font-light text-gray-400 hover:text-gray-500'
                        }`}
                    >
                      {displayCustomImage ? (
                        <div className={`w-[30px] h-[30px] flex items-center justify-center shrink-0 overflow-hidden rounded-lg bg-gray-50 shadow-[0_2px_4px_rgba(15,23,42,0.12)] transition duration-200 ${isSelected ? '' : 'grayscale opacity-55'}`}>
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
                          className={`transition duration-200 hover:scale-[1.04] ${isSelected ? '' : 'grayscale opacity-45'}`}
                        />
                      )}
                      <span className="min-w-0 w-full text-xs font-sans leading-tight block">
                        {displayLabel}
                      </span>
                      {isSelected && (
                        <span className="pointer-events-none absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-[#1E293B]" />
                      )}
                    </button>
                  );
                })}

              </div>
            </nav>

            {/* LEVEL 4: STICKY SUB-BAR DISTRICTS AND CALENDARS */}
            <section ref={filtersBarRef} className="sticky top-0 z-[240] shrink-0 select-none border-b-[0.5px] border-white/45 bg-[#F4F7F6]/20 px-2 py-2.5 backdrop-blur-[2px] sm:px-4 sm:py-3">
              <div className="max-w-7xl w-full mx-auto flex items-center justify-center gap-1.5 sm:gap-4">

                {/* SORTING: CIRCULAR TRIGGER BUTTON (left of "Р“РґРµ? | РљРѕРіРґР°?") */}
                <div className="relative ml-6 sm:ml-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSortDropdown(!showSortDropdown);
                      setShowDistrictDropdown(false);
                      setShowCalendar(false);
                    }}
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-[0.5px] border-white/60 transition active:scale-95 cursor-pointer shadow-[0_1px_8px_rgba(15,23,42,0.08)] backdrop-blur-[2px] shrink-0 ${showSortDropdown
                      ? 'bg-[#FF7A50] border-[#FF7A50] text-white shadow-md'
                      : 'bg-white/32 text-[#FF7A50] hover:text-[#E05A30] hover:bg-white/42'
                      }`}
                    title={tr('sort.title')}
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>

                  {showSortDropdown && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowSortDropdown(false)} />
                      <div className="pu absolute top-12 left-0 min-w-[210px] border border-white/50 rounded-2xl shadow-xl py-2 z-50 text-xs text-left animate-scale-up font-sans">
                        {[
                          { value: 'price_asc', label: tr('sort.priceAsc.label') },
                          { value: 'price_desc', label: tr('sort.priceDesc.label') },
                          { value: 'rating_desc', label: tr('sort.ratingAsc.label') },
                          { value: 'popular', label: tr('sort.popular.label') },
                          { value: 'distance_sea', label: tr('sort.distanceSea.label') },
                          { value: 'distance_point', label: tr('sort.distancePoint.label') },
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
                            className={`w-full text-left px-3.5 py-2 hover:bg-[#FF7A50]/10 transition font-bold ${sortBy === opt.value ? 'bg-[#FF7A50]/5 text-[#FF7A50]' : 'text-[#1E293B]'
                              }`}
                          >
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* UNIFIED SEARCH BLOCK: Р“РґРµ? | РљРѕРіРґР°? (Centered in the middle block) */}
                <div className="flex flex-row items-center border-[0.5px] border-white/60 bg-white/32 p-1 rounded-full shadow-[0_1px_8px_rgba(15,23,42,0.08)] backdrop-blur-[2px] hover:shadow-sm transition relative min-w-0 flex-1 sm:flex-none">

                  {/* 1. Р“Р”Р•? */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDistrictDropdown(!showDistrictDropdown);
                      setShowSortDropdown(false);
                      setShowCalendar(false);
                    }}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 relative cursor-pointer min-w-0 sm:min-w-[140px] flex-1 sm:flex-none"
                    id="where-trigger-btn"
                  >
                    <MapPin className="w-4 h-4 text-[#FF7A50] shrink-0" />
                    <div className="text-left font-sans flex-1 min-w-0">
                      {customPolygon ? (
                        <div>
                          <span className="text-[#1E293B] font-bold text-[13px] sm:text-xs leading-[1.2] block truncate">
                            {tr('location.areaOnMap')}
                          </span>
                          <span className="text-[#FF7A50] font-bold text-[10px] leading-[1.15] block mt-0.5 truncate">
                            {tr('location.selectedArea')}
                          </span>
                        </div>
                      ) : customPoint ? (
                        <div>
                          <span className="text-[#1E293B] font-bold text-[13px] sm:text-xs leading-[1.2] block truncate">
                            {tr('location.pointOnMap')}
                          </span>
                          <span className="text-[#FF7A50] font-bold text-[10px] leading-[1.15] block mt-0.5 truncate">
                            R ~ {Math.round(customRadius)} km
                          </span>
                        </div>
                      ) : districtSearch.length > 0 ? (
                        <span className="text-[#1E293B] font-bold text-[13px] sm:text-sm leading-[1.2] block truncate">
                          {selectedDistrictLabel}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal text-[13px] sm:text-xs uppercase tracking-wider leading-[1.2] block truncate">
                          {tr('location.where')}
                        </span>
                      )}
                    </div>

                    {showDistrictDropdown && (
                      <>
                        <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={(e) => { e.stopPropagation(); setShowDistrictDropdown(false); }} />
                        <div
                          className="pu absolute top-12 left-0 min-w-[210px] max-h-[300px] !overflow-y-auto border border-white/50 rounded-2xl shadow-xl py-2 z-50 text-xs text-left animate-scale-up font-sans"
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
                              <span>{tr('location.selectOnMap')}</span>
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setDistrictSearch([]);
                              setCustomPoint(null);
                              setCustomPolygon(null);
                              setShowDistrictDropdown(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 hover:bg-gray-100 transition font-bold ${districtSearch.length === 0 && !customPoint && !customPolygon ? 'text-[#FF7A50] bg-[#FF7A50]/5' : 'text-[#1E293B]'
                              }`}
                          >
                            {tr('location.allDistricts')}
                          </button>

                          {districtGroups.map((group, groupIndex) => (
                            <React.Fragment key={`district-group-${groupIndex}`}>
                              {groupIndex > 0 && <div className="my-1 border-t border-[#E5E7EB]" />}
                              {group.map((dist) => {
                                const isSelected = districtSearch.includes(dist) && !customPoint && !customPolygon;
                                return (
                                  <button
                                    key={dist}
                                    onClick={() => {
                                      setDistrictSearch(prev => prev.includes(dist)
                                        ? prev.filter(item => item !== dist)
                                        : [...prev, dist]
                                      );
                                      setCustomPoint(null);
                                      setCustomPolygon(null);
                                    }}
                                    className={`w-full text-left px-3.5 py-2 hover:bg-[#FF7A50]/10 transition flex items-center gap-2 ${isSelected ? 'text-[#FF7A50] bg-[#FF7A50]/5 font-bold' : 'text-[#1E293B]'
                                      }`}
                                  >
                                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] leading-none ${isSelected ? 'bg-[#FF7A50] border-[#FF7A50] text-white' : 'border-[#CBD5E1] text-transparent'
                                      }`}>
                                      ✓
                                    </span>
                                    <span>{dist}</span>
                                  </button>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Separator 1 */}
                  <div className="w-[1px] h-5 bg-[#E5E7EB]" />

                  {/* 2. РљРћР“Р”Рђ? */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCalendar(!showCalendar);
                      setShowDistrictDropdown(false);
                      setShowSortDropdown(false);
                    }}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 relative cursor-pointer min-w-0 sm:min-w-[160px] flex-1 sm:flex-none"
                  >
                    <Calendar className="w-4 h-4 text-[#FF7A50] shrink-0" />
                    <div className="text-left font-sans flex-1 min-w-0">
                      {checkInDate ? (
                        <span className="text-[#1E293B] font-bold text-[13px] sm:text-sm leading-none block truncate">
                          {formatReservationDates(checkInDate, checkOutDate)}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal text-[13px] sm:text-xs uppercase tracking-wider leading-none block truncate">
                          {tr('date.when')}
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

                {/* FILTERS: CIRCULAR BUTTON with symbol only (right of "Р“РґРµ? | РљРѕРіРґР°?") */}
                {currentL1 === 'housing' && (
                  <button
                    onClick={() => setShowFiltersModal(true)}
                    className="w-10 h-10 flex items-center justify-center bg-white/32 border-[0.5px] border-white/60 text-[#FF7A50] hover:text-[#E05A30] hover:bg-white/42 rounded-full transition active:scale-95 cursor-pointer shadow-[0_1px_8px_rgba(15,23,42,0.08)] backdrop-blur-[2px] shrink-0 mr-6 sm:mr-0"
                    id="advanced-filters-btn"
                    title={tr('filters.title')}
                  >
                    <Filter className="w-4.5 h-4.5" />
                  </button>
                )}

              </div>
            </section>

            {/* MAIN RESULTS PAGE: COLLAPSIBLE LISTING MAP WITH ADAPTIVE LAYOUTS */}
            <main className="flex-grow max-w-7xl w-full mx-auto px-1 sm:px-6 py-6 relative select-none transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]">
              <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* COLUMN 1: Listings scroll column (adapts dynamically) */}
                <div
                  className={`space-y-4 sm:space-y-6 px-0.5 sm:px-[18px] pb-[18px] pt-0 scroll-p-[18px] transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${showListingMap && currentL1 !== 'useful'
                    ? 'w-full md:w-[calc(50%-12px)]'
                    : 'w-full'
                    }`}
                  id="listings-scroll-panel"
                >
                  <div className="flex items-center justify-between select-none">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-lg font-bold text-[#1E293B]">
                        {currentL1 === 'useful' ? tr('results.guidesTitle') : tr('results.foundTitle')} {' '}
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
                          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 border [border-width:0.5px] cursor-pointer shadow-xs select-none active:scale-95 ${showListingMap
                            ? 'bg-[#FF7A50] border-[#FF7A50] text-[#F4F7F6]'
                            : 'bg-white border-[#94A3B8]/30 text-[#1E293B] hover:bg-[#F4F7F6] hover:text-[#FF7A50] hover:border-[#FF7A50]/40'
                            }`}
                        >
                          <Map className="w-3.5 h-3.5 shrink-0" />
                          {showListingMap ? tr('results.hideMap') : tr('results.showMap')}
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
                    <div className={`grid gap-1.5 sm:gap-6 transition-all duration-300 ${showListingMap
                      ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-2'
                      : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
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
                          activeLanguage={activeLanguage}
                          onRequireAuth={(afterAuth) => requestAuth('auth.reason.favorites', afterAuth)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-dashed border-[#E5E7EB] p-12 text-center space-y-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <Compass className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-gray-700">{tr('empty.title', { district: selectedDistrictLabel })}</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                          {tr('empty.body')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDistrictSearch([]);
                          setSearchTerm('');
                        }}
                        className="px-4 py-2 border border-[#E5E7EB] text-xs font-bold text-gray-600 rounded-xl hover:bg-gray-50 transition active:scale-95"
                      >
                        {tr('location.allDistricts')}
                      </button>
                    </div>
                  )}

                </div>

                {/* COLUMN 2 (Interactive Floating Map Box / Drawer) */}
                {showListingMap && currentL1 !== 'useful' && (
                  <div
                    ref={mapPanelRef}
                    className={`overflow-hidden flex flex-col ${isMapFullscreen
                      ? 'fixed inset-0 w-full h-full z-[300]'
                      : 'relative w-full md:w-[calc(50%-12px)] h-[50vh] min-h-[400px] md:sticky md:top-[var(--map-sticky-top,154px)] md:h-[var(--map-sticky-height,calc(100dvh-174px))] md:min-h-0 md:flex-none z-[100]'
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
                        title={tr('map.close')}
                      >
                        <X className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                        className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
                        title={isMapFullscreen ? tr('map.collapse') : tr('map.fullscreen')}
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
                        selectedListing={selectedListing}
                        hoveredListing={hoveredListing}
                        onListingHover={(lis) => setHoveredListing(lis)}
                        onListingSelect={(lis) => setSelectedListing(lis)}
                        currencySymbol={CURRENCIES[activeCurrency].symbol}
                        currencyRate={CURRENCIES[activeCurrency].rate}
                        isFullscreen={isMapFullscreen}
                        isSelectionActive={isMapSelectionActive}
                        selectedDistricts={districtSearch}
                        onSelectionStart={() => setIsMapSelectionActive(true)}
                        onSelectionClose={() => setIsMapSelectionActive(false)}
                        onSelectionReset={() => {
                          setCustomPoint(null);
                          setCustomPolygon(null);
                          setIsMapSelectionActive(false);
                          setSelectionFitRequest(0);
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
                          setDistrictSearch([]); // Clear district filters in favor of map selection
                          setSortBy('distance_point'); // Sort automatically by distance for best UX
                          setIsMapFullscreen(false);
                          setSelectionFitRequest(request => request + 1);
                        }}
                        initialPoint={customPoint}
                        initialRadius={customRadius}
                        initialPolygon={customPolygon}
                        selectionFitRequest={selectionFitRequest}
                      />
                    </div>
                  </div>
                )}

              </div>
            </main>

            <footer ref={footerRef} className="shrink-0 bg-white border-t border-[#E5E7EB] text-center mt-auto font-sans text-xs text-gray-400 select-none py-8">
              <div className="max-w-7xl mx-auto px-4 space-y-3">
                <p className="max-w-md mx-auto leading-relaxed whitespace-pre-line">
                  {tr('footer.body')}
                </p>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-gray-500 font-semibold sm:gap-x-10">
                  <a href="/faq.html" className="transition hover:text-[#FF7A50]">
                    {tr('footer.faq')}
                  </a>
                  <a href="/terms.html" className="transition hover:text-[#FF7A50]">
                    {tr('footer.terms')}
                  </a>
                  <a href="/privacy.html" className="transition hover:text-[#FF7A50]">
                    {tr('footer.privacy')}
                  </a>
                  <a href="/listing-content-policy.html" className="transition hover:text-[#FF7A50]">
                    {tr('footer.listingContentPolicy')}
                  </a>
                </div>
                <div className="text-gray-500">
                  <button
                    type="button"
                    onClick={() => setShowContactUsModal(true)}
                    className="border-0 bg-transparent p-0 font-normal text-inherit transition hover:text-[#FF7A50]"
                  >
                    {tr('footer.contactUs')}
                  </button>
                </div>
                <p>{tr('footer.copyright')}</p>
              </div>
            </footer>

          </div>
        )}

        {currentView !== 'cover' && !isMapFullscreen && (
          <nav
            className={`fixed inset-x-0 bottom-0 z-[260] md:hidden transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${isMobileNavHidden ? 'translate-y-[115%]' : 'translate-y-0'}`}
            aria-label={tr('nav.mobile.label')}
          >
            <div className="relative px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2">
              <div className="pointer-events-none absolute inset-0">
                <svg
                  className="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_-10px_24px_rgba(15,23,42,0.06)]"
                  viewBox="0 0 400 72"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <filter id="mobile-nav-topline-glow" x="-5%" y="-80%" width="110%" height="220%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feColorMatrix
                        in="blur"
                        type="matrix"
                        values="0 0 0 0 0.58 0 0 0 0 0.64 0 0 0 0 0.72 0 0 0 0.5 0"
                      />
                    </filter>
                  </defs>
                  <path
                    d="M0 1 H164 C182 1 182 38 200 38 C218 38 218 1 236 1 H400 V72 H0 Z"
                    fill="rgba(255,255,255,0.16)"
                  />
                  <path
                    d="M0 1 H164 C182 1 182 38 200 38 C218 38 218 1 236 1 H400"
                    fill="none"
                    stroke="rgba(148,163,184,0.22)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    filter="url(#mobile-nav-topline-glow)"
                    opacity="0.34"
                  />
                  <path
                    d="M0 1 H164 C182 1 182 38 200 38 C218 38 218 1 236 1 H400"
                    fill="none"
                    stroke="rgba(255,255,255,0.24)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
              <div className="relative mx-auto grid max-w-md grid-cols-5 items-end gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('menu');
                  }}
                  className={mobileNavButtonClass}
                  aria-label={tr('nav.backToCover')}
                  title={tr('nav.backToCover')}
                >
                  <Menu className="h-[22px] w-[22px] text-[#FF7A50]" strokeWidth={1.8} />
                </button>

                <button
                  type="button"
                  onClick={toggleFavoritesOnly}
                  className={`${mobileNavActiveButtonClass} ${showFavoritesOnly ? 'text-[#FF4D5D]' : 'text-[#1E293B]'}`}
                  aria-label={tr('nav.favorites')}
                  aria-pressed={showFavoritesOnly}
                  title={tr('nav.favorites')}
                >
                  <span className="relative flex h-[22px] w-[22px] items-center justify-center">
                    <Heart className="h-[22px] w-[22px] text-[#FF4D5D]" strokeWidth={showFavoritesOnly ? 2.1 : 1.65} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
                    {favoriteIds.size > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4D5D] px-1 text-[9px] font-black leading-none text-white">
                        {favoriteIds.size > 99 ? '99+' : favoriteIds.size}
                      </span>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => requireAuth('auth.reason.myListings', () => {
                    setInitialBookingsListingId(newBookingRequestListingIds.length === 1 ? newBookingRequestListingIds[0] : null);
                    setShowMyAddsListing(true);
                  })}
                  className="relative -mt-4 flex h-[58px] w-[58px] place-self-center items-center justify-center rounded-full border border-white/55 bg-[#FF7A50]/95 text-white shadow-[0_6px_14px_rgba(255,122,80,0.26)] backdrop-blur-[2px] transition active:scale-95"
                  aria-label={tr('nav.myListings')}
                  title={tr('nav.myListings')}
                  id="mobile-create-l-btn"
                >
                  {newBookingRequests.length > 0 ? (
                    <span className="text-[18px] font-black leading-none">
                      {newBookingRequests.length > 99 ? '99+' : newBookingRequests.length}
                    </span>
                  ) : (
                    <LayoutGrid className="h-7 w-7" strokeWidth={1.75} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={openMobileMessages}
                  className={mobileNavActiveButtonClass}
                  aria-label={tr('nav.messages')}
                  title={tr('nav.messages')}
                >
                  <span className="relative flex h-[22px] w-[22px] items-center justify-center">
                    <MessageSquare className="h-[22px] w-[22px] text-[#FF7A50]" strokeWidth={1.8} />
                    {newBookingRequests.length + acceptedBookingHistoryCount > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4D5D] px-1 text-[9px] font-black leading-none text-white">
                        {newBookingRequests.length + acceptedBookingHistoryCount > 99 ? '99+' : newBookingRequests.length + acceptedBookingHistoryCount}
                      </span>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openProfile}
                  className={`${mobileNavButtonClass} overflow-hidden p-0`}
                  aria-label={tr('nav.profile')}
                  title={tr('nav.profile')}
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserRound className="h-[22px] w-[22px] text-[#FF7A50]" strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>
          </nav>
        )}

        <AppOverlays
          activeCurrency={activeCurrency}
          activeLanguage={activeLanguage}
          bookings={bookings}
          currencyRate={CURRENCIES[activeCurrency].rate}
          currencySymbol={CURRENCIES[activeCurrency].symbol}
          currentL2={currentL2}
          customPoint={customPoint}
          customRadius={customRadius}
          editingListing={editingListing}
          filters={activeFilters}
          handleAddBooking={handleAddBooking}
          handleDeleteListing={handleDeleteListing}
          handlePublishListing={handlePublishListing}
          handleToggleListingStatus={handleToggleListingStatus}
          handleUpdateBooking={handleUpdateBooking}
          handleUpdateBookingStatus={handleUpdateBookingStatus}
          handleUpdateListing={handleUpdateListing}
          handleUpdateMenuOverrides={handleUpdateMenuOverrides}
          initialCheckInDate={checkInDate}
          initialCheckOutDate={checkOutDate}
          initialBookingsListingId={initialBookingsListingId}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          listings={listings}
          menuOverrides={menuOverrides}
          primaryL2={primaryL2}
          selectedListing={selectedListing}
          setActiveCurrency={setActiveCurrency}
          setActiveLanguage={setActiveLanguage}
          onRequireAuth={requestAuth}
          onSelectedListingClose={closeSelectedListing}
          setCheckInDate={setCheckInDate}
          setCheckOutDate={setCheckOutDate}
          setCustomPoint={setCustomPoint}
          setCustomRadius={setCustomRadius}
          setDistrictSearch={setDistrictSearch}
          setEditingListing={setEditingListing}
          setFilters={applyFilters}
          setPrimaryL2={setPrimaryL2}
          setSelectedListing={setSelectedListing}
          setShowAdminDashboard={setShowAdminDashboard}
          setShowCreateWizard={setShowCreateWizard}
          setShowFiltersModal={setShowFiltersModal}
          setShowMapSelectModal={setShowMapSelectModal}
          setShowMyAddsListing={setShowMyAddsListing}
          setShowProfileModal={setShowProfileModal}
          setShowUsersModal={setShowUsersModal}
          setSortBy={setSortBy}
          onInitialBookingsOpened={() => setInitialBookingsListingId(null)}
          showAdminDashboard={showAdminDashboard}
          showCreateWizard={showCreateWizard}
          showFiltersModal={showFiltersModal}
          showMapSelectModal={showMapSelectModal}
          showMyAddsListing={showMyAddsListing}
          showProfileModal={showProfileModal}
          showUsersModal={showUsersModal}
          usersModalTab={usersModalTab}
        />

        <AuthModal
          isOpen={Boolean(authModalReason)}
          onClose={() => {
            if (!user) {
              pendingAuthActionRef.current = null;
            }
            setAuthModalReason('');
          }}
          reason={authModalReason}
        />

        {showContactUsModal && (
          <SupportContactModal onClose={() => setShowContactUsModal(false)} />
        )}

      </div>
    </I18nProvider>
  );
}

function getAcceptedContactHistoryBookingCount(bookings: BookingRequest[]) {
  if (typeof window === 'undefined') return 0;
  try {
    const history = JSON.parse(localStorage.getItem('bali_base_whatsapp_history') || '[]') as Array<{ id?: string }>;
    const historyListingIds = new Set(history.map((item) => item.id).filter(Boolean));
    if (historyListingIds.size === 0) return 0;

    return Array.from(historyListingIds).filter((listingId) => {
      const latestBooking = bookings
        .filter((booking) => booking.listingId === listingId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      return latestBooking?.status === 'accepted';
    }).length;
  } catch {
    return 0;
  }
}
