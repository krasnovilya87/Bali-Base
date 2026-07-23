import React, { useState, useEffect, useRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Listing, SearchState, FilterState } from './types';
import { MOCK_GUIDES } from './data';
import MapBox from './components/MapBox';
import ListingCard from './components/ListingCard';
import TwoMonthCalendar from './components/TwoMonthCalendar';
import { ThreeDIcon } from './components/ThreeDIcon';
import { THEME } from './theme';
import { DEFAULT_LANGUAGE, LanguageCode, loadTranslations, t } from './i18n';
import { I18nProvider } from './i18nContext';
// @ts-ignore
import baliRiceBg from './assets/images/hero4.jpg';
import { BRAND_LOGO_SRC, COVER_SWIPE_LOTTIE_SRC, HEADER_LOGO_SRC } from './app/brand';
import { CURRENCIES, CurrencyKey } from './app/currency';
import { getDeviceLanguage } from './app/language';
import { L1_CATEGORIES, SUBCATEGORIES_MAP } from './app/menu';
import AppOverlays from './app/components/AppOverlays';
import CurrencyLanguageControls from './app/components/CurrencyLanguageControls';
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
  Maximize, Minimize, Heart
} from 'lucide-react';

const DISTRICT_MENU_GROUPS = [
  ['Canggu', 'Ubud', 'Seminyak', 'Kuta', 'Sanur', 'Uluwatu', 'Nusa Dua', 'Jimbaran', 'Amed', 'Kintamani', 'Lovina'],
  ['Gili Trawangan', 'Gili Meno', 'Gili Air'],
  ['Nusa Penida']
];

export default function App() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'cover' | 'menu' | 'app'>('cover');
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
  const [currentL1, setCurrentL1] = useState<string>('housing');
  const [currentL2, setCurrentL2] = useState<string[]>(['entire_place']);
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
    vehicleBrand: [],
    favoritesOnly: false
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
  const [authModalReason, setAuthModalReason] = useState<string>('');
  const pendingAuthActionRef = useRef<(() => void) | null>(null);
  const [showListingMap, setShowListingMap] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // enabled by default for PC version (tablets & mobile hidden by default)
    }
    return true;
  });
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);
  const [isL2Visible, setIsL2Visible] = useState<boolean>(true);
  const [showFooter, setShowFooter] = useState<boolean>(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

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
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>(() => getDeviceLanguage());
  const [showCurrencyDrop, setShowCurrencyDrop] = useState<boolean>(false);
  const [showLanguageDrop, setShowLanguageDrop] = useState<boolean>(false);
  const [, setI18nVersion] = useState(0);
  const tr = (key: string, params?: Record<string, string | number>) => t(activeLanguage, key, params);
  const { favoriteIds } = useFavoriteListings();

  const requestAuth = (reasonKey = 'auth.defaultReason', afterAuth?: () => void) => {
    if (user) return true;
    pendingAuthActionRef.current = afterAuth || null;
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

      setShowCurrencyDrop(false);
      setShowLanguageDrop(false);
      setShowUsersDropdown(false);
      setShowAutoComplete(false);
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
    if (showUsersModal) {
      setShowUsersModal(false);
      return;
    }
    if (showCalendar) {
      setShowCalendar(false);
      return;
    }
    if (showSortDropdown || showDistrictDropdown || showCurrencyDrop || showLanguageDrop || showUsersDropdown || showAutoComplete) {
      setShowSortDropdown(false);
      setShowDistrictDropdown(false);
      setShowCurrencyDrop(false);
      setShowLanguageDrop(false);
      setShowUsersDropdown(false);
      setShowAutoComplete(false);
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
    showCurrencyDrop,
    showDistrictDropdown,
    showFiltersModal,
    showLanguageDrop,
    showMapSelectModal,
    showMyAddsListing,
    showSortDropdown,
    showUsersDropdown,
    showUsersModal
  ]);

  useEffect(() => {
    if (currentView !== 'cover') return;

    let touchStartY = 0;
    let isCoverSwipeCandidate = false;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 15) {
        setCurrentView('menu');
      }
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
        resetViewScroll();
        setCurrentView('menu');
      }
      isCoverSwipeCandidate = false;
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
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
      const getDaysWord = (days: number) => {
        if (activeLanguage !== 'RU') {
          return days === 1 ? tr('listing.day') : tr('listing.days');
        }
        const mod10 = days % 10;
        const mod100 = days % 100;
        if (mod100 >= 11 && mod100 <= 19) {
          return "\u0434\u043d\u0435\u0439";
        }
        if (mod10 === 1) {
          return "\u0434\u0435\u043d\u044c";
        }
        if (mod10 >= 2 && mod10 <= 4) {
          return "\u0434\u043d\u044f";
        }
        return "\u0434\u043d\u0435\u0439";
      };

      const daysSuffix = diffDays > 0 ? ` (${diffDays} ${getDaysWord(diffDays)})` : "";

      if (m1 === m2) {
        return `${d1.getDate()}-${d2.getDate()} ${m1}${daysSuffix}`;
      }
      return `${getDayMonth(d1)} - ${getDayMonth(d2)}${daysSuffix}`;
    }
    return `${tr('date.from')} ${getDayMonth(d1)}`;
  };

  // Switch Category L1 -> automatically adjusts default Level-2 parameters
  const selectL1 = (catId: string) => {
    setCurrentL1(catId);
    if (catId === 'housing') setCurrentL2(['entire_place']);
    else if (catId === 'transport') setCurrentL2(['scooters']);
    else if (catId === 'investments') setCurrentL2(['villas']);
    else if (catId === 'services') setCurrentL2(['for_leisure']);
    else if (catId === 'ads') setCurrentL2(['electronics']);
    else if (catId === 'afisha') setCurrentL2(['festivals']);
    else if (catId === 'life') setCurrentL2(['meetings']);
    else setCurrentL2([]);
  };

  const openAppView = () => {
    setIsL2Visible(true);
    setShowFooter(false);
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
          <div className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center text-center px-4 select-none">
            {/* Ambient Video styled Background overlay */}
            <div className="absolute inset-0 bg-black/55 z-10" />
            <img
              src={baliRiceBg}
              alt="Rice Terraces Background"
              className="absolute inset-0 w-full h-full object-cover object-[center_38%] scale-105 animate-scale-slow-pan"
              referrerPolicy="no-referrer"
            />

            {/* Glowing badges upper area */}
            <div className="z-20 mb-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 inline-flex items-center gap-2 animate-bounce-slow">
              <Compass className="w-4 h-4 text-[#FF7A50]" />
              <span className="text-white text-xs font-mono font-bold tracking-wider uppercase">
                {tr('cover.badge')}
              </span>
            </div>

            <div className="z-20 space-y-4 max-w-4xl relative">
              <img
                src={BRAND_LOGO_SRC}
                alt="Bali Base"
                className="mx-auto h-auto w-[280px] sm:w-[430px] max-w-[78vw] drop-shadow-md pb-2"
                referrerPolicy="no-referrer"
              />
              <p className="font-sans text-lg sm:text-xl text-emerald-50/90 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
                {tr('cover.subtitle')}
              </p>
            </div>

            {/* Scroll directive indicator */}
            <div className="z-20 mt-24 flex items-center justify-center text-white/90">
              <div className="flex cover-swipe-hand" aria-hidden="true">
                {COVER_SWIPE_LOTTIE_SRC && (
                  <DotLottieReact
                    src={COVER_SWIPE_LOTTIE_SRC}
                    loop
                    autoplay
                    className="cover-swipe-lottie"
                  />
                )}
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
                    title={tr('nav.backToCover.title')}
                  >
                    <Compass className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#FF7A50] group-hover:rotate-45 transition duration-300" />
                    <img
                      src={HEADER_LOGO_SRC}
                      alt="Bali Base"
                      className="h-[18px] sm:h-[22px] w-auto max-w-[96px] sm:max-w-[124px] object-contain"
                      referrerPolicy="no-referrer"
                    />
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
                <div className="header-popover-root flex-1 max-w-md relative hidden md:block">
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
                      className="w-full bg-[#F4F7F6] border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#FF7A50] font-sans"
                      id="live-search-input-menu"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-gray-400 hover:text-gray-600 text-xs font-bold absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        Г—
                      </button>
                    )}
                  </div>

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

                {/* CONTROLS AREA (CURRENCY / PLACE LISTING / PERSONAL CABINET) */}
                <div className="flex items-center gap-1 sm:gap-3 shrink-0 font-sans text-xs">

                  <CurrencyLanguageControls
                    activeCurrency={activeCurrency}
                    activeLanguage={activeLanguage}
                    showCurrencyDrop={showCurrencyDrop}
                    showLanguageDrop={showLanguageDrop}
                    tr={tr}
                    setActiveCurrency={setActiveCurrency}
                    setActiveLanguage={setActiveLanguage}
                    setShowCurrencyDrop={setShowCurrencyDrop}
                    setShowLanguageDrop={setShowLanguageDrop}
                  />

                  {/* Create Listing Wizard trigger button */}
                  <button
                    onClick={() => requireAuth('auth.reason.createListing', () => setShowCreateWizard(true))}
                    className="px-2.5 py-2 sm:px-3 sm:py-2 bg-[#FF7A50] hover:bg-[#E05A30] text-white rounded-xl font-bold font-sans transition hover:shadow-md cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 text-[12px] sm:text-xs"
                    id="create-l-btn-menu"
                  >
                    <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tr('nav.createListing')}</span>
                  </button>

                  <UsersDropdown
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
                    setShowUsersModal={setShowUsersModal}
                    setUsersModalTab={setUsersModalTab}
                  />

                </div>

              </div>
            </header>

            {/* Main Menu body */}
            <div className="flex-grow max-w-4xl w-full mx-auto px-4 pt-3.5 pb-4 xs:pb-6 sm:py-8 flex flex-col justify-center overflow-hidden h-[calc(100dvh-64px)] sm:h-auto select-none">
              <div className="grid grid-cols-2 grid-rows-4 sm:grid-rows-none sm:grid-cols-4 gap-3.5 sm:gap-4 md:gap-6 flex-1 sm:flex-initial min-h-0">
                {L1_CATEGORIES.map(cat => {
                  const displayLabel = tr(`category.${cat.id}.label`);
                  const displayImage = menuOverrides?.l1?.[cat.id]?.image || cat.image;
                  const displayL2 = menuOverrides?.l1?.[cat.id]?.l2 || cat.l2;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        selectL1(cat.id);
                        if (displayL2) {
                          selectSingleL2(displayL2);
                        }
                        openAppView();
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
                          loading="eager"
                          decoding="async"
                          width={560}
                          height={560}
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
                    title={tr('nav.backToCover.title')}
                  >
                    <Compass className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#FF7A50] group-hover:rotate-45 transition duration-300" />
                    <img
                      src={HEADER_LOGO_SRC}
                      alt="Bali Base"
                      className="h-[18px] sm:h-[22px] w-auto max-w-[96px] sm:max-w-[124px] object-contain"
                      referrerPolicy="no-referrer"
                    />
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
                <div className="header-popover-root flex-1 max-w-md relative hidden md:block">
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
                      className="w-full bg-[#F4F7F6] border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#FF7A50] font-sans"
                      id="live-search-input"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-gray-400 hover:text-gray-600 text-xs font-bold absolute right-3 top-1/2 -translate-y-1/2"
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

                {/* CONTROLS AREA (CURRENCY / PLACE LISTING / PERSONAL CABINET) */}
                <div className="flex items-center gap-1 sm:gap-3 shrink-0 font-sans text-xs">

                  <CurrencyLanguageControls
                    activeCurrency={activeCurrency}
                    activeLanguage={activeLanguage}
                    showCurrencyDrop={showCurrencyDrop}
                    showLanguageDrop={showLanguageDrop}
                    tr={tr}
                    setActiveCurrency={setActiveCurrency}
                    setActiveLanguage={setActiveLanguage}
                    setShowCurrencyDrop={setShowCurrencyDrop}
                    setShowLanguageDrop={setShowLanguageDrop}
                  />

                  <button
                    type="button"
                    onClick={() => requireAuth('auth.reason.favorites', () => {
                      setShowFavoritesOnly(prev => {
                        const next = !prev;
                        setFilters(currentFilters => ({ ...currentFilters, favoritesOnly: next }));
                        return next;
                      });
                    })}
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-white border border-[#E5E7EB] hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D5D]/30 rounded-xl cursor-pointer flex items-center justify-center active:scale-95 transition shrink-0"
                    title={tr('nav.favorites')}
                    aria-label={tr('nav.favorites')}
                    aria-pressed={showFavoritesOnly}
                  >
                    <Heart
                      className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#FF4D5D] transition-colors"
                      strokeWidth={showFavoritesOnly ? 2.2 : 1.6}
                      fill={showFavoritesOnly ? 'currentColor' : 'none'}
                    />
                  </button>

                  {/* Create Listing Wizard trigger button */}
                  <button
                    onClick={() => requireAuth('auth.reason.createListing', () => setShowCreateWizard(true))}
                    className="px-2.5 py-2 sm:px-3 sm:py-2 bg-[#FF7A50] hover:bg-[#E05A30] text-white rounded-xl font-bold font-sans transition hover:shadow-md cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 text-[12px] sm:text-xs"
                    id="create-l-btn"
                  >
                    <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tr('nav.createListing')}</span>
                  </button>

                  <UsersDropdown
                    id="users-dropdown-btn"
                    listings={listings}
                    showUsersDropdown={showUsersDropdown}
                    tr={tr}
                    label="Users"
                    chevronClassName="w-3 h-3 text-gray-400"
                    currentUser={user}
                    onRequireAuth={requestAuth}
                    setShowUsersDropdown={setShowUsersDropdown}
                    setShowAdminDashboard={setShowAdminDashboard}
                    setShowCreateWizard={setShowCreateWizard}
                    setShowMyAddsListing={setShowMyAddsListing}
                    setShowUsersModal={setShowUsersModal}
                    setUsersModalTab={setUsersModalTab}
                  />

                </div>
              </div>
            </header>

            {/* LEVEL 1: CATEGORY SELECTIONS ROW */}
            <nav className="hidden bg-white border-b border-[#E5E7EB] py-3 z-30 select-none animate-fade-in">
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
            <nav className={`shrink-0 bg-white select-none transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] overflow-hidden z-[230] ${isL2Visible
              ? 'max-h-[140px] opacity-100 py-2.5 sm:py-3.5 border-b border-[#E5E7EB]'
              : 'max-h-0 opacity-0 py-0 border-b-0 pointer-events-none'
              }`}>
              <div className="max-w-7xl mx-auto px-1.5 sm:px-4 flex flex-row justify-around sm:justify-center items-center w-full gap-0.5 sm:gap-10">

                {(SUBCATEGORIES_MAP[currentL1] || []).map(sub => {
                  const displayLabel = tr(`subcategory.${sub.id}`);
                  const displayIcon = menuOverrides?.l2?.[sub.id]?.icon || sub.icon;
                  const displayCustomImage = menuOverrides?.l2?.[sub.id]?.customImage;
                  const isSelected = currentL2.includes(sub.id);

                  return (
                    <button
                      key={sub.id}
                      onClick={() => toggleL2(sub.id)}
                      className={`pb-1.5 pt-1 sm:pb-2 px-1 sm:px-3.5 flex-1 sm:flex-initial flex flex-col items-center justify-center text-center gap-1 sm:gap-2 transition-all duration-200 active:scale-95 cursor-pointer border-b-2 select-none focus:outline-none ${isSelected
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
              <div className="max-w-7xl w-full mx-auto flex items-center justify-center gap-1.5 sm:gap-4">

                {/* SORTING: CIRCULAR TRIGGER BUTTON (left of "Р“РґРµ? | РљРѕРіРґР°?") */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSortDropdown(!showSortDropdown);
                      setShowDistrictDropdown(false);
                      setShowCalendar(false);
                    }}
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-[0.5px] border-[#94A3B8]/30 transition active:scale-95 cursor-pointer shadow-xs shrink-0 ${showSortDropdown
                      ? 'bg-[#FF7A50] border-[#FF7A50] text-white shadow-md'
                      : 'bg-white text-[#FF7A50] hover:text-[#E05A30] hover:bg-[#FF7A50]/10'
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
                <div className="flex flex-row items-center border-[0.5px] border-[#94A3B8]/30 bg-white p-1 rounded-full shadow-xs hover:shadow-sm transition relative min-w-0 flex-1 sm:flex-none">

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
                          <span className="text-[#1E293B] font-bold text-[13px] sm:text-xs leading-none block truncate">
                            {tr('location.areaOnMap')}
                          </span>
                          <span className="text-[#FF7A50] font-bold text-[10px] leading-none block mt-0.5 truncate">
                            {tr('location.selectedArea')}
                          </span>
                        </div>
                      ) : customPoint ? (
                        <div>
                          <span className="text-[#1E293B] font-bold text-[13px] sm:text-xs leading-none block truncate">
                            {tr('location.pointOnMap')}
                          </span>
                          <span className="text-[#FF7A50] font-bold text-[10px] leading-none block mt-0.5 truncate">
                            R ~ {Math.round(customRadius)} km
                          </span>
                        </div>
                      ) : districtSearch.length > 0 ? (
                        <span className="text-[#1E293B] font-bold text-[13px] sm:text-sm leading-none block truncate">
                          {selectedDistrictLabel}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal text-[13px] sm:text-xs uppercase tracking-wider leading-none block truncate">
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
                    className="w-10 h-10 flex items-center justify-center bg-white border-[0.5px] border-[#94A3B8]/30 text-[#FF7A50] hover:text-[#E05A30] hover:bg-[#FF7A50]/10 rounded-full transition active:scale-95 cursor-pointer shadow-xs shrink-0"
                    id="advanced-filters-btn"
                    title={tr('filters.title')}
                  >
                    <Filter className="w-4.5 h-4.5" />
                  </button>
                )}

              </div>
            </section>

            {/* MAIN RESULTS PAGE: COLLAPSIBLE LISTING MAP WITH ADAPTIVE LAYOUTS */}
            <main className="flex-grow md:flex-1 md:min-h-0 max-w-7xl w-full mx-auto px-1 sm:px-6 py-6 md:pt-6 md:pb-0 relative select-none transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]">
              <div className="flex flex-col md:flex-row gap-6 items-stretch md:h-full md:min-h-0">

                {/* COLUMN 1: Listings scroll column (adapts dynamically) */}
                <div
                  className={`space-y-4 sm:space-y-6 overflow-y-auto px-0.5 sm:px-[18px] pb-[18px] pt-0 scroll-p-[18px] transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${showListingMap && currentL1 !== 'useful'
                    ? 'w-full md:w-[calc(50%-12px)] md:h-[calc(100%-15px)] md:min-h-0'
                    : 'w-full md:h-[calc(100%-15px)] md:min-h-0'
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
                    className={`overflow-hidden flex flex-col transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${isMapFullscreen
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

            {/* ACTIVE FOOTER BAR */}
            <footer className={`shrink-0 bg-white border-t border-[#E5E7EB] text-center mt-auto font-sans text-xs text-gray-400 select-none transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${showFooter
              ? 'max-h-[300px] opacity-100 py-8'
              : 'max-md:max-h-[300px] max-md:opacity-100 max-md:py-8 md:max-h-px md:opacity-100 md:py-0 md:pointer-events-none'
              }`}>
              <div className="max-w-7xl mx-auto px-4 space-y-3">
                <p className="font-display font-bold text-gray-600 tracking-widest text-[10px] uppercase">
                  {tr('footer.title')}
                </p>
                <p className="max-w-md mx-auto leading-relaxed">
                  {tr('footer.body')}
                </p>
                <div className="flex justify-center gap-4 text-gray-500 font-semibold pt-2">
                  <span className="hover:text-[#FF7A50] cursor-pointer">{tr('footer.entirePlace')}</span>
                  <span>вЂў</span>
                  <span className="hover:text-[#FF7A50] cursor-pointer">{tr('footer.transport')}</span>
                  <span>вЂў</span>
                  <span className="hover:text-[#FF7A50] cursor-pointer">{tr('footer.usefulArticles')}</span>
                </div>
              </div>
            </footer>
          </div>
        )}

        <AppOverlays
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
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          listings={listings}
          menuOverrides={menuOverrides}
          primaryL2={primaryL2}
          selectedListing={selectedListing}
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
          setShowUsersModal={setShowUsersModal}
          setSortBy={setSortBy}
          showAdminDashboard={showAdminDashboard}
          showCreateWizard={showCreateWizard}
          showFiltersModal={showFiltersModal}
          showMapSelectModal={showMapSelectModal}
          showMyAddsListing={showMyAddsListing}
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

      </div>
    </I18nProvider>
  );
}




