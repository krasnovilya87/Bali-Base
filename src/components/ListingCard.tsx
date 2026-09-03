import React, { useState, useEffect, useRef } from 'react';
import { Listing } from '../types';
import { Heart, Star, BookmarkCheck, Flame, ShieldCheck, ShieldAlert, BadgeInfo } from 'lucide-react';
import { THEME } from '../theme';
import { isListingFresh } from '../utils/listingFreshness';
import { motion } from 'motion/react';
import CompetitorLogo from './CompetitorLogo';
import { calculateGraphDailyPrice, calculateGraphTotalPrice, calculateSavingsDisplay } from '../utils/pricing';
import { ROOM_TYPE_LABELS } from './create-wizard/constants';
import { buildListingSubtitle, stripListingRoomTypeFromTitle } from '../utils/listingSubtitle';
import { DEFAULT_LANGUAGE, LanguageCode } from '../i18n';
import { useTranslatedDescription } from '../hooks/useTranslatedDescription';
import { useFavoriteListings } from '../hooks/useFavoriteListings';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18nContext';
import { isListingVerified } from '../utils/listingVerification';
import {
  getListingVehicleModel,
  listingHasAbs,
  listingHasKeyless,
  SCOOTER_MODELS_BY_GROUP
} from '../utils/scooterFilters';

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

const SCOOTER_KEYLESS_MODELS = ['scoopy', 'fazzio', 'grand_filano_125', 'nmax', 'nmax_turbo', 'xmax', 'pcx', 'beat_110'];
const SCOOTER_ABS_MODELS = ['nmax', 'nmax_turbo', 'xmax', 'pcx', 'adv'];
const SCOOTER_PHOTO_MODELS = SCOOTER_MODELS_BY_GROUP.retro;
const SCOOTER_LONG_TRIP_MODELS = SCOOTER_MODELS_BY_GROUP.maxi;
const SCOOTER_COUPLE_MODELS = SCOOTER_MODELS_BY_GROUP.maxi.filter(model => model !== 'aerox_155');

interface ListingCardProps {
  key?: string;
  listing: Listing;
  onSelect: (listing: Listing) => void;
  currencySymbol: string;
  currencyRate: number;
  checkInDate?: string;
  checkOutDate?: string;
  onOpenCalendar?: () => void;
  activeLanguage?: LanguageCode;
  onRequireAuth?: (afterAuth?: () => void) => boolean;
  actions?: React.ReactNode;
}

export default function ListingCard({
  listing,
  onSelect,
  currencySymbol,
  currencyRate,
  checkInDate,
  checkOutDate,
  onOpenCalendar,
  activeLanguage = DEFAULT_LANGUAGE,
  onRequireAuth,
  actions
}: ListingCardProps) {
  const { tr } = useI18n();
  const { user } = useAuth();
  const [currentPhoto, setCurrentPhoto] = useState<number>(0);
  const [countdownText, setCountdownText] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const [hasDragged, setHasDragged] = useState<boolean>(false);
  const carouselTrackRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const isHorizontalTouchDragRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);
  const settleTimerRef = useRef<number | null>(null);
  const { favoriteIds, toggleFavorite: toggleFavoriteListing } = useFavoriteListings();
  const isFavorite = favoriteIds.has(listing.id);

  const visiblePhotoIndexes = listing.images
    .map((_, idx) => idx)
    .filter(idx => Math.abs(idx - currentPhoto) <= 1);

  const currentVisiblePosition = Math.max(0, visiblePhotoIndexes.indexOf(currentPhoto));

  const getClampedDragOffset = (offset: number) => {
    if (currentPhoto === 0 && offset > 0) {
      return offset * 0.35;
    }
    if (currentPhoto === listing.images.length - 1 && offset < 0) {
      return offset * 0.35;
    }
    return offset;
  };

  const setCarouselTransform = (offset: number, animate: boolean, position = currentVisiblePosition) => {
    const track = carouselTrackRef.current;
    if (!track) return;
    track.style.transition = animate ? 'transform 240ms cubic-bezier(0.2, 0, 0.2, 1)' : 'none';
    track.style.transform = `translate3d(calc(-${position * 100}% + ${offset}px), 0, 0)`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartXRef.current = e.targetTouches[0].clientX;
    dragStartYRef.current = e.targetTouches[0].clientY;
    isHorizontalTouchDragRef.current = false;
    hasDraggedRef.current = false;
    setHasDragged(false);
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
    }
    setCarouselTransform(0, false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartXRef.current === null || dragStartYRef.current === null) return;
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diff = currentX - dragStartXRef.current;
    const verticalDiff = currentY - dragStartYRef.current;

    if (!isHorizontalTouchDragRef.current) {
      if (Math.abs(verticalDiff) > 8 && Math.abs(verticalDiff) > Math.abs(diff) * 1.2) {
        dragStartXRef.current = null;
        dragStartYRef.current = null;
        setCarouselTransform(0, true);
        return;
      }

      if (Math.abs(diff) < 12 || Math.abs(diff) < Math.abs(verticalDiff) * 1.35) {
        return;
      }

      isHorizontalTouchDragRef.current = true;
    }

    setCarouselTransform(getClampedDragOffset(diff), false);
    if (Math.abs(diff) > 10) {
      hasDraggedRef.current = true;
      if (!hasDragged) {
        setHasDragged(true);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = dragStartXRef.current - touchEndX;
    const swipeThreshold = 50;
    let targetPhoto = currentPhoto;

    if (Math.abs(diff) > swipeThreshold) {
      e.stopPropagation();
      if (diff > 0) {
        targetPhoto = Math.min(listing.images.length - 1, currentPhoto + 1);
      } else {
        targetPhoto = Math.max(0, currentPhoto - 1);
      }
    }

    const targetPosition = Math.max(0, visiblePhotoIndexes.indexOf(targetPhoto));
    setCarouselTransform(0, true, targetPosition);
    dragStartXRef.current = null;
    dragStartYRef.current = null;
    isHorizontalTouchDragRef.current = false;

    settleTimerRef.current = window.setTimeout(() => {
      setCurrentPhoto(targetPhoto);
      setCarouselTransform(0, false);
      if (hasDraggedRef.current) {
        setHasDragged(false);
        hasDraggedRef.current = false;
      }
    }, 240);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartXRef.current = e.clientX;
    hasDraggedRef.current = false;
    setHasDragged(false);
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
    }
    setCarouselTransform(0, false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartXRef.current === null) return;
    const currentX = e.clientX;
    const diff = currentX - dragStartXRef.current;
    setCarouselTransform(getClampedDragOffset(diff), false);
    if (Math.abs(diff) > 10) {
      hasDraggedRef.current = true;
      if (!hasDragged) {
        setHasDragged(true);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartXRef.current === null) return;
    const mouseEndX = e.clientX;
    const diff = dragStartXRef.current - mouseEndX;
    const swipeThreshold = 50;
    let targetPhoto = currentPhoto;

    if (Math.abs(diff) > swipeThreshold) {
      e.stopPropagation();
      if (diff > 0) {
        targetPhoto = Math.min(listing.images.length - 1, currentPhoto + 1);
      } else {
        targetPhoto = Math.max(0, currentPhoto - 1);
      }
    }

    const targetPosition = Math.max(0, visiblePhotoIndexes.indexOf(targetPhoto));
    setCarouselTransform(0, true, targetPosition);
    dragStartXRef.current = null;

    settleTimerRef.current = window.setTimeout(() => {
      setCurrentPhoto(targetPhoto);
      setCarouselTransform(0, false);
      if (hasDraggedRef.current) {
        setHasDragged(false);
        hasDraggedRef.current = false;
      }
    }, 240);
  };

  useEffect(() => {
    setCarouselTransform(0, false);
  }, [currentPhoto, listing.images.length]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!listing.hasDropPrice || !listing.dropPriceEndsAt) return;

    const checkExpiration = () => {
      const difference = new Date(listing.dropPriceEndsAt!).getTime() - Date.now();
      if (difference <= 0) {
        setCountdownText(tr('listing.expired'));
        setIsExpired(true);
      } else {
        const daysVal = difference / (1000 * 60 * 60 * 24);
        const daysText = Math.ceil(daysVal);
        setCountdownText(`${daysText} ${tr('listing.daysShort')}`);
        setIsExpired(false);
      }
    };

    checkExpiration();
    const timer = setInterval(checkExpiration, 1000);

    return () => clearInterval(timer);
  }, [listing.hasDropPrice, listing.dropPriceEndsAt, tr]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user && onRequireAuth && !onRequireAuth(() => toggleFavoriteListing(listing.id))) return;
    toggleFavoriteListing(listing.id);
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhoto(prev => Math.min(listing.images.length - 1, prev + 1));
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhoto(prev => Math.max(0, prev - 1));
  };

  const convertPrice = (idrAmount: number) => {
    const converted = Math.round(idrAmount * currencyRate);
    return converted.toLocaleString();
  };

  const splitTitleRoomLabel = (title: string) => {
    const roomTypeLabels = Object.values(ROOM_TYPE_LABELS);
    const escapedLabels = roomTypeLabels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (escapedLabels.length === 0) return { title, roomLabel: '' };
    const roomPairRegex = new RegExp(`(${escapedLabels.join('|')})`, 'gi');
    const match = title.match(roomPairRegex);
    const roomLabel = match?.[match.length - 1] || '';

    return {
      title: roomLabel ? title.replace(roomPairRegex, '').replace(/\s*·\s*$/, '').trim() : title,
      roomLabel
    };
  };
  const titleParts = splitTitleRoomLabel(listing.title);
  const displayTitle = stripListingRoomTypeFromTitle(titleParts.title);
  const { translatedDescription } = useTranslatedDescription(
    listing.description,
    activeLanguage,
    listing.category !== 'housing'
  );

  // Helper type emoji labeling
  const getSubcategoryEmoji = () => {
    switch (listing.subCategory) {
      case 'entire_place': return '🏡 Villa целиком';
      case 'private_suite': return '🏢 Апартаменты';
      case 'private_room': return '🌴 Комната';
      case 'scooters': return '🛵 Скутер';
      case 'motorcycles': return '🏍 Мотоцикл';
      case 'cars': return '🚗 Автомобиль';
      case 'household_services': return '🧰 Бытовые услуги';
      case 'beauty_care': return '✨ Красота и уход';
      case 'health': return '🩺 Здоровье';
      case 'education': return '📚 Обучение';
      case 'sport': return '🏄‍♂️ Спорт';
      case 'photo_video': return '📷 Фото и видео';
      case 'consultations': return '💡 Консультации';
      case 'service_business': return '💼 Бизнес';
      case 'service_transport': return '🛵 Транспорт';
      case 'other_services': return '⭐ Другие услуги';
      case 'electronics': return '🔌 Гаджеты';
      case 'festivals': return '📅 Афиша: Фестиваль';
      default: return '🏷 Объявление';
    }
  };

  // Automated privacy label based on total neighbors and categories
  const getPrivacyFormula = () => {
    if (listing.category === 'housing') {
      const sub = listing.subCategory === 'entire_place' ? 'Вилла целиком' : 'Комната на вилле';
      const rooms = listing.roomsTotal ? ` • Всего ${listing.roomsTotal} спален` : '';
      return `${sub}${rooms}`;
    }
    return `${listing.district}, Бали`;
  };

  const getTransportCardSubtitle = () => {
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

    return parts.length > 0 ? parts.join(' • ') : translatedDescription;
  };

  const getCardSubtitle = (): string => {
    if (listing.category === 'transport') {
      return getTransportCardSubtitle();
    }

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
      const roomLabel = titleParts.roomLabel ? ` \u2022 ${titleParts.roomLabel}` : '';
      return `Guesthouse${roomLabel} \u2022 ${roomsStr} \u2022 ${distStr}`;
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

  const baseDailyPrice = listing.hasDropPrice && listing.dropPricePerDay && !isExpired
    ? listing.dropPricePerDay
    : listing.pricePerDay;

  const baseMonthlyPrice = listing.hasDropPrice && listing.dropPricePerMonth && !isExpired
    ? listing.dropPricePerMonth
    : listing.pricePerMonth;

  // Calculate reservation stay duration in days
  const getStayDays = () => {
    if (listing.category === 'housing' && checkInDate && checkOutDate) {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const timeDiff = end.getTime() - start.getTime();
      if (timeDiff > 0) {
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
      }
    }
    return null;
  };

  const stayDays = getStayDays();
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
  const pricingDays = stayDays || 1;
  const activeDailyPrice = calculateGraphDailyPrice({
    days: pricingDays,
    pricePerDay: baseDailyPrice,
    pricePerMonth: baseMonthlyPrice
  });
  const activeBasePrice = isCalendarMonthStay && baseMonthlyPrice
    ? baseMonthlyPrice
    : stayDays
      ? calculateGraphTotalPrice({
        days: stayDays,
        pricePerDay: baseDailyPrice,
        pricePerMonth: baseMonthlyPrice
      })
      : activeDailyPrice;

  const pluralizeNights = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 19) {
      return 'ночей';
    }
    if (mod10 === 1) {
      return 'ночь';
    }
    if (mod10 >= 2 && mod10 <= 4) {
      return 'ночи';
    }
    return 'ночей';
  };

  const pluralizeDays = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 19) {
      return 'дней';
    }
    if (mod10 === 1) {
      return 'день';
    }
    if (mod10 >= 2 && mod10 <= 4) {
      return 'дня';
    }
    return 'дней';
  };

  const activeCompetitorPrice = stayDays && listing.bookingComPrice ? listing.bookingComPrice * stayDays : listing.bookingComPrice;
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

  return (
    <div
      onClick={(e) => {
        if (hasDragged) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onSelect(listing);
      }}
      className={`group pl-card relative z-0 hover:z-20 rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer select-none ${listing.isPromoTop
        ? 'bg-amber-50/[0.8] border-amber-400 shadow-md shadow-amber-200/40 ring-1 ring-amber-300/40'
        : 'bg-white'
        }`}
      id={`card-${listing.id}`}
    >
      {/* Photo Carousel Container with Touch & Drag support */}
      <div
        className="relative aspect-[4/3] sm:aspect-video w-full overflow-hidden bg-gray-50 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={carouselTrackRef}
          className="flex w-full h-full"
          style={{
            transform: `translate3d(-${currentVisiblePosition * 100}%, 0, 0)`,
            transition: 'none',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          {visiblePhotoIndexes.map((idx) => (
            <img
              key={idx}
              src={listing.images[idx]}
              alt={listing.title}
              referrerPolicy="no-referrer"
              decoding="async"
              loading="lazy"
              onDragStart={(e) => e.preventDefault()}
              className="w-full h-full object-cover shrink-0 select-none pointer-events-none"
            />
          ))}
        </div>

        {/* Carousel side zones */}
        {listing.images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevPhoto}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute inset-y-0 left-0 z-10 w-[1cm] bg-black/20 opacity-0 transition-opacity duration-200 hover:bg-black/35 group-hover:opacity-100 active:bg-black/45"
              title={tr('listing.prevImage')}
              aria-label={tr('listing.prevImage')}
            />
            <button
              type="button"
              onClick={handleNextPhoto}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute inset-y-0 right-0 z-10 w-[1cm] bg-black/20 opacity-0 transition-opacity duration-200 hover:bg-black/35 group-hover:opacity-100 active:bg-black/45"
              title={tr('listing.nextImage')}
              aria-label={tr('listing.nextImage')}
            />
          </>
        )}

        {/* Badge Layers upper Left - scaled up for better mobile visibility */}
        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 sm:gap-1.5 items-start z-10">
          {listing.isPromoPremium && (
            <div className={`bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500 text-white ${THEME.fonts.heading} text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded shadow-md flex items-center gap-1 sm:gap-1.5 tracking-wider`}>
              <Flame className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-white text-white animate-bounce" />
              <span>👑 {tr('listing.vipPremium')}</span>
            </div>
          )}
          {isListingVerified(listing) && (
            <div className={`bg-[#FFCD29] text-gray-950 ${THEME.fonts.heading} text-[8px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded shadow-md flex items-center gap-1 sm:gap-1.5 tracking-wide`}>
              <ShieldCheck className="w-2.5 h-2.5 sm:w-[15px] sm:h-[15px] text-[#2F7D69] shrink-0" />
              <span>{tr('listing.approvedBadge')}</span>
            </div>
          )}
          {isListingFresh(listing) && (
            <div className={`bg-brand-orange text-white ${THEME.fonts.heading} text-[8px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded shadow-md`}>
              {tr('listing.newBadge')}
            </div>
          )}
        </div>

        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-30 flex items-center gap-1 pointer-events-auto">
          <button
            type="button"
            onClick={toggleFavorite}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="p-1 sm:p-1.5 rounded-full bg-white text-gray-400 hover:text-rose-500 hover:scale-105 active:scale-95 transition shadow-md min-w-[24px] min-h-[24px] sm:min-w-[28px] sm:min-h-[28px] flex items-center justify-center"
            title={tr('listing.toggleFavorite')}
            aria-label={tr('listing.toggleFavorite')}
            aria-pressed={isFavorite}
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4 lg:h-4 color-rose-500" style={{ fill: isFavorite ? '#F43F5E' : 'none', color: isFavorite ? '#F43F5E' : 'currentColor' }} />
          </button>
        </div>

        <div className={`absolute right-1.5 bottom-1.5 sm:right-2 sm:bottom-2 z-10 flex items-center gap-1 sm:gap-1.5 rounded-full bg-transparent px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs lg:text-sm font-bold text-white drop-shadow-md ${THEME.fonts.mono}`}>
          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-[15px] lg:h-[15px] fill-current text-amber-500" />
          <span>{listing.rating.toFixed(2).replace('.', ',')}</span>
          <span className="text-white/85 font-light">({listing.reviewsCount})</span>
        </div>
      </div>

      {/* Content details description */}
      <div className={`p-2.5 sm:p-5 lg:p-4 flex-1 flex flex-col justify-between ${THEME.fonts.main}`}>

        <div>
          {/* Title and Rating Line */}
          <div className="flex justify-between items-start gap-2 mb-1 sm:mb-1.5 lg:mb-1">
            <h3 className={`${THEME.fonts.heading} font-bold text-[13px] sm:text-base lg:text-lg text-text-dark line-clamp-2 group-hover:text-brand-orange-hover transition-colors leading-tight`}>
              {displayTitle}
            </h3>
          </div>

          <p className="line-clamp-2 leading-snug sm:leading-relaxed mb-1 sm:mb-2 text-gray-500 font-light text-[10px] sm:text-xs lg:text-[13px]">
            {getCardSubtitle()}
          </p>
        </div>

        {/* Pricing stack matching user specifications */}
        <div className="pt-0.5 sm:pt-1 pb-1">
          {stayDays && (
            <div className={`mb-1 text-[10px] sm:text-xs lg:text-xs font-bold text-text-dark ${THEME.fonts.heading}`}>
              {tr('listing.totalFor')} {stayDays} {pluralizeDays(stayDays)}:
            </div>
          )}

          <div className="flex flex-col gap-0.5 sm:gap-1.5">
            {/* Line 1: Competitor Price, grey/strikethrough and dynamic competitor logo */}
            {listing.bookingComPrice && (
              listing.competitorUrl ? (
                <a
                  href={listing.competitorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 sm:gap-3 self-start cursor-pointer hover:opacity-75 transition"
                >
                  <span className={`text-[10px] sm:text-xs lg:text-xs font-light text-gray-400 line-through leading-none ${THEME.fonts.mono}`}>
                    {convertPrice(activeCompetitorPrice)} {currencySymbol}
                  </span>
                  <CompetitorLogo platform={listing.competitorPlatform} />
                </a>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <span className={`text-[10px] sm:text-xs lg:text-xs font-light text-gray-400 line-through leading-none ${THEME.fonts.mono}`}>
                    {convertPrice(activeCompetitorPrice)} {currencySymbol}
                  </span>
                  <CompetitorLogo platform={listing.competitorPlatform} />
                </div>
              )
            )}

            {/* Line 2: Direct Price and Direct price label */}
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              <span className={`text-[14px] sm:text-base lg:text-lg font-bold text-text-dark leading-none ${THEME.fonts.mono}`}>
                {convertPrice(activeBasePrice)} {currencySymbol}
              </span>
              {listing.hasDropPrice && !isExpired ? (
                <span className={`bg-[#FF3B30] text-white font-extrabold text-[8px] sm:text-[9px] lg:text-[9px] px-1 sm:px-1.5 py-0.5 rounded tracking-wider leading-none shadow-xs ${THEME.fonts.heading}`}>
                  {tr('listing.dropPrice')} • {countdownText}
                </span>
              ) : (
                <span className={`text-[8px] sm:text-xs lg:text-[10px] text-[#2F7D69] font-bold tracking-wider leading-none ${THEME.fonts.heading}`}>
                  {tr('listing.directPrice')}
                </span>
              )}
            </div>

            {/* Line 3: Savings in small red font */}
            {hasSavings && (
              <div className="flex items-center self-start">
                <div className="bg-[#FF3B30]/10 rounded-full px-1.5 sm:px-2.5 py-0.5 flex items-center gap-1 sm:gap-2 shadow-xs backdrop-blur-xs">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#FF3B30] shrink-0" />
                  <span className={`text-[10px] sm:text-xs lg:text-xs text-[#FF3B30] font-bold tracking-wide leading-none ${THEME.fonts.mono}`}>
                    {showSavingsPercent ? `${savingsPercent}%` : `${convertPrice(savingsAmount)} ${currencySymbol}`}
                  </span>
                  <span className={`text-[8px] sm:text-[10px] lg:text-[9px] text-[#FF3B30] font-bold tracking-wider leading-none ${THEME.fonts.heading}`}>
                    {tr('listing.saved')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {actions && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {actions}
          </div>
        )}

      </div>
    </div>
  );
}
