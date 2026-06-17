import React, { useState, useEffect } from 'react';
import { Listing, BookingRequest } from '../types';
import {
  X, Star, MapPin, Compass, Flame, ShieldCheck, Mail, Calendar, 
  ChevronRight, Wifi, ShieldAlert, Waves, Home, Lock, RefreshCw, Sparkles, Send, LayoutGrid, Check, Info, BedDouble
} from 'lucide-react';
import { THEME } from '../theme';
import DetailMap from './DetailMap';
import TwoMonthCalendar from './TwoMonthCalendar';
import CompetitorLogo from './CompetitorLogo';
import { calculateGraphDailyPrice, calculateGraphTotalPrice } from '../utils/pricing';


const DISTRICT_TRANSLATIONS: Record<string, string> = {
  'Seminyak': 'Семиньяк',
  'Canggu': 'Чангу',
  'Ubud': 'Убуд',
  'Uluwatu': 'Улувату',
  'Sanur': 'Санур',
  'Nusa Dua': 'Нуса Дуа',
  'Kuta': 'Кута',
  'Jimbaran': 'Джимбаран',
  'Amed': 'Амед',
  'Lovina': 'Ловина'
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
  cold_AC: { label: 'Холодный кондей', icon: '🥶' },
  hair_dryer: { label: 'Фен', icon: '💨' },
  washing_machine: { label: 'Стиральная машина', icon: '👕' },
  smart_tv: { label: 'Smart TV', icon: '📺' },
  workspace: { label: 'Рабочая зона', icon: '💻' },
  yoga: { label: 'Зона йоги', icon: '🧘' },
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
  garden_view: { label: 'Вид на сад', icon: '🪴' },
  sauna_hammam: { label: 'Сауна / хаммам', icon: '🧖' },

  // Extra Preferences
  pets_allowed: { label: 'С питомцами', icon: '🐾' },
  quiet_location: { label: 'Тишина', icon: '🔕' },
  all_bills_included: { label: 'Bills включены', icon: '⚡' },
  airport_transfer: { label: 'Трансфер', icon: '✈️' },
  chef: { label: 'Личный шеф', icon: '👨‍🍳' }
};

interface ListingDetailsProps {
  listing: Listing;
  onClose: () => void;
  currencySymbol: string;
  currencyRate: number;
  onAddBooking: (booking: BookingRequest) => void;
}

export default function ListingDetails({
  listing,
  onClose,
  currencySymbol,
  currencyRate,
  onAddBooking
}: ListingDetailsProps) {
  const [activePhoto, setActivePhoto] = useState<number>(0);
  const [isVerticalGalleryOpen, setIsVerticalGalleryOpen] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [checkInDate, setCheckInDate] = useState<string>('2026-06-10');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-06-15');
  const [showDateCalendar, setShowDateCalendar] = useState<boolean>(false);
  const [diffDays, setDiffDays] = useState<number>(5);
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false);
  const [countdownText, setCountdownText] = useState<string>('');
  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      setActivePhoto(prev => (prev === listing.images.length - 1 ? 0 : prev + 1));
    } else if (isRightSwipe) {
      setActivePhoto(prev => (prev === 0 ? listing.images.length - 1 : prev - 1));
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhoto(prev => (prev === 0 ? listing.images.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhoto(prev => (prev === listing.images.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    // Scroll to top inside container
    const elem = document.getElementById('details-scroll-container');
    if (elem) elem.scrollTop = 0;
  }, [listing.id]);

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

    const timer = setInterval(() => {
      const difference = new Date(listing.dropPriceEndsAt!).getTime() - Date.now();
      if (difference <= 0) {
        setCountdownText('Истекло');
        clearInterval(timer);
      } else {
        const daysVal = difference / (1000 * 60 * 60 * 24);
        const daysText = Math.ceil(daysVal);
        setCountdownText(`${daysText} дн.`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [listing.hasDropPrice, listing.dropPriceEndsAt]);

  const convertPrice = (idrAmount: number) => {
    return Math.round(idrAmount * currencyRate).toLocaleString();
  };

  const baseDailyPrice = listing.hasDropPrice && listing.dropPricePerDay
    ? listing.dropPricePerDay
    : listing.pricePerDay;

  const baseMonthlyPrice = listing.hasDropPrice && listing.dropPricePerMonth
    ? listing.dropPricePerMonth
    : listing.pricePerMonth;

  const activeDailyPrice = calculateGraphDailyPrice({
    days: diffDays,
    pricePerDay: baseDailyPrice,
    pricePerMonth: baseMonthlyPrice
  });

  const totalBudget = calculateGraphTotalPrice({
    days: diffDays,
    pricePerDay: baseDailyPrice,
    pricePerMonth: baseMonthlyPrice
  });

  const isExpired = countdownText === '\u0418\u0441\u0442\u0435\u043a\u043b\u043e';
  const stayDays = diffDays;
  const activeBasePrice = stayDays ? totalBudget : activeDailyPrice;
  const activeCompetitorPrice = stayDays && listing.bookingComPrice ? listing.bookingComPrice * stayDays : listing.bookingComPrice || 0;
  const activeSavings = stayDays ? activeCompetitorPrice - activeBasePrice : (listing.bookingComPrice ? listing.bookingComPrice - activeDailyPrice : 0);
  const hasSavings = Boolean(listing.bookingComPrice && activeCompetitorPrice > totalBudget);
  const totalSavings = activeCompetitorPrice - totalBudget;

  const pluralizeDays = (count: number) => {
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

  // WhatsApp template dispatch
  const handleWhatsAppClick = () => {
    // Generate prefilled Text inside template
    const templateMessage = `Bali Base. Добрый день! Хочу забронировать [${listing.title}] с [${checkInDate}] по [${checkOutDate}], всего [${diffDays} дней], общая цена [${totalBudget.toLocaleString()} IDR]`;
    const encodedMessage = encodeURIComponent(templateMessage);
    const cleanNumber = listing.whatsappNumber.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    
    // Simulate updating analytics counters
    const stored = localStorage.getItem('bali_base_listings');
    if (stored) {
      try {
        const lis = JSON.parse(stored) as Listing[];
        const updated = lis.map(item => {
          if (item.id === listing.id) {
            return {
              ...item,
              clicksCount: item.clicksCount + 1
            };
          }
          return item;
        });
        localStorage.setItem('bali_base_listings', JSON.stringify(updated));
      } catch {}
    }

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
      guestName: 'Arnie Guest',
      guestPhone: '+62899123412',
      startDate: checkInDate,
      endDate: checkOutDate,
      totalDays: diffDays,
      totalPrice: totalBudget,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString()
    };
    onAddBooking(newReq);
    
    setOrderPlaced(true);
    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 1500);
  };

  // Format metadata values for Housing Category
  let objectType = 'Вилла';
  if (listing.category === 'housing') {
    const hType = (listing.housingType || '').toLowerCase();
    const subCat = listing.subCategory;
    if (subCat === 'private_suite' || hType.includes('apartment') || hType.includes('апарт')) {
      objectType = 'Апартаменты';
    } else if (subCat === 'private_room' || hType.includes('room') || hType.includes('комнат') || hType.includes('guesthouse') || hType.includes('гестхаус')) {
      objectType = 'Гестхаус';
    } else if (hType.includes('house') || hType.includes('дом')) {
      objectType = 'Дом';
    } else if (hType.includes('bungalow') || hType.includes('бунгало')) {
      objectType = 'Бунгало';
    } else if (listing.housingType) {
      const mapping: Record<string, string> = {
        'Villa': 'Вилла',
        'House': 'Дом',
        'Bungalow': 'Бунгало',
        'Apartment': 'Апартаменты',
        'Guesthouse': 'Гестхаус',
        'Hotel': 'Отель'
      };
      objectType = mapping[listing.housingType] || listing.housingType;
    }
  }

  const roomsPart = listing.roomsTotal || listing.bedroomsCount || 1;
  const roomsText = `${roomsPart} BR`;
  const areaText = listing.area ? `${listing.area} м²` : '';
  const roomsAndArea = areaText ? `${roomsText}, ${areaText}` : roomsText;

  const features: string[] = [];
  if (listing.poolType && listing.poolType !== 'none') {
    const poolLabel = listing.poolType === 'infinity' ? 'бассейн инфинити' : listing.poolType === 'private' ? 'приватный бассейн' : 'общий бассейн';
    features.push(poolLabel);
  }
  if (listing.internetSpeed && listing.internetSpeed >= 100) {
    features.push(`WiFi ${listing.internetSpeed} Мб/с`);
  }
  if (listing.viewType) {
    const VIEW_LABELS: Record<string, string> = {
      rice_fields: 'вид на рисовые поля',
      garden: 'вид на сад',
      pool: 'вид на бассейн',
      ocean: 'вид на океан',
      jungle: 'вид на джунгли'
    };
    if (VIEW_LABELS[listing.viewType]) {
      features.push(VIEW_LABELS[listing.viewType]);
    }
  }
  if (listing.wallMaterial === 'wood') {
    features.push('натур. дерево');
  }
  if (features.length === 0) {
    features.push('высокий комфорт');
  }
  const mainFeatures = features.slice(0, 2).join(', ');

  let distanceText = '';
  const min = listing.distanceToSeaMinutes !== undefined ? listing.distanceToSeaMinutes : 5;
  if (listing.district.toLowerCase() === 'ubud') {
    distanceText = `${min} мин до центра`;
  } else {
    distanceText = `${min} мин до моря`;
  }

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.title} ${listing.address || ''} ${listing.district} Bali`)}`;

  const DISTRICT_TEXT = DISTRICT_TRANSLATIONS[listing.district] || listing.district;

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
      title: 'Кофе и завтрак',
      desc: 'Кафе — 3 минуты пешком (идеально для утра) или завтрак на территории (эта позиция указывается самим владельцем обьявления)'
    },
    {
      emoji: '🛒',
      title: 'Продукты',
      desc: 'Супермаркет Pepito — 5 минут на байке',
      note: 'Будет настраиваться через API GOOGLE'
    },
    {
      emoji: '🏋️‍♂️',
      title: 'Спорт',
      desc: 'Зал Body Factory — 7 минут на байке'
    },
    {
      emoji: '🏖',
      title: 'Пляж',
      desc: 'Batu Bolong Beach — 10 минут на байке'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[400] lg:p-5 p-0 animate-fade-in" id="details-modal">
      <div className="bg-white w-full h-full lg:max-w-5xl lg:max-h-[92vh] rounded-none lg:rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-slide-up lg:animate-scale-up border-0 lg:border border-[#E5E7EB]">
        
        {/* Header Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-40 p-2 rounded-full bg-black/60 text-white hover:bg-black/95 transition border border-white/20 hover:scale-105 active:scale-95"
          title="Close listing page"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scroll Body */}
        <div className="flex-1 overflow-y-auto bg-white" id="details-scroll-container">
          
          {/* Main Hero Gallery Grid - now only displaying one full width photo */}
          <div className="w-full p-0 bg-white border-b border-[#E5E7EB]">
            {/* Primary view */}
            <div 
              className="w-full aspect-video relative rounded-none overflow-hidden bg-gray-50 border-0 cursor-zoom-in group/hero select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => setIsVerticalGalleryOpen(true)}
              title="Открыть галерею во весь экран"
            >
              {/* Left Zone - click to prev / dims on hover */}
              <div 
                onClick={handlePrevPhoto}
                className="absolute left-0 top-0 bottom-0 w-[55px] sm:w-[75px] bg-black/0 hover:bg-black/35 transition-all duration-300 z-20 flex items-center justify-center cursor-pointer select-none group/navbtn"
                title="Предыдущее фото"
              >
                <span className="text-white text-3xl font-light opacity-0 group-hover/navbtn:opacity-100 transition-opacity duration-300 transform -translate-x-1 group-hover/navbtn:translate-x-0">
                  ‹
                </span>
              </div>

              {/* Right Zone - click to next / dims on hover */}
              <div 
                onClick={handleNextPhoto}
                className="absolute right-0 top-0 bottom-0 w-[55px] sm:w-[75px] bg-black/0 hover:bg-black/35 transition-all duration-300 z-20 flex items-center justify-center cursor-pointer select-none group/navbtn"
                title="Следующее фото"
              >
                <span className="text-white text-3xl font-light opacity-0 group-hover/navbtn:opacity-100 transition-opacity duration-300 transform translate-x-1 group-hover/navbtn:translate-x-0">
                  ›
                </span>
              </div>

              <img
                src={listing.images[activePhoto]}
                alt={listing.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition duration-300 group-hover/hero:scale-101"
              />

              {/* Current photo layout bubble */}
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg border border-white/10 z-10 select-none">
                {activePhoto + 1} / {listing.images.length}
              </div>

              <div className="absolute top-4 left-4 flex gap-1.5 flex-col z-10 pointer-events-none">
                {listing.hasDropPrice && (
                  <div className="bg-amber-600 border border-amber-500/30 text-white text-[11px] font-mono font-bold px-3 py-1 rounded-xl shadow-md flex items-center gap-1">
                    <Flame className="w-4 h-4 fill-white animate-pulse" />
                    <span>Drop Price ends in: {countdownText}</span>
                  </div>
                )}
                {listing.isApproved && (
                  <div className="bg-[#FF7A50] text-white text-[11px] font-semibold px-3 py-1 rounded-xl shadow-md flex items-center gap-1 border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4 text-[#2F7D69]" />
                    <span>Bali Base Approved</span>
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
                <div>
          {/* Title and Rating Line */}
          <div className="flex justify-between items-start gap-2 mb-2 lg:mb-1.5">
            <h3 className={`${THEME.fonts.heading} font-bold text-[21px] sm:text-base lg:text-xl text-text-dark line-clamp-1`}>
              {listing.title}
            </h3>
            <div className={`flex items-center gap-1.5 text-[14.5px] sm:text-xs lg:text-[15.5px] font-bold text-text-dark shrink-0 ${THEME.fonts.mono}`}>
              <Star className="w-[15px] h-[15px] sm:w-3.5 sm:h-3.5 lg:w-[17px] lg:h-[17px] fill-current text-amber-500" />
              <span>{listing.rating.toFixed(2).replace('.', ',')}</span>
              <span className="text-gray-400 font-light">({listing.reviewsCount})</span>
            </div>
          </div>

          <p className="line-clamp-2 leading-relaxed mb-2 sm:mb-3.5 text-gray-500 font-light text-[14px] sm:text-xs lg:text-[14.5px]">
            {getCardSubtitle()}
          </p>
        </div>

        {/* Pricing stack completely corresponding to ListingCard */}
        <div className="pt-2 sm:pt-2.5 pb-1">
          {stayDays && (
            <div className={`mb-1.5 text-[14px] sm:text-xs lg:text-[13px] font-bold text-text-dark ${THEME.fonts.heading}`}>
              Итого за {stayDays} {pluralizeDays(stayDays)}:
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
              {listing.hasDropPrice && !isExpired ? (
                <span className={`bg-[#FF3B30] text-white font-extrabold text-[12px] sm:text-[9px] lg:text-[9.5px] px-1.5 py-0.5 rounded tracking-wider leading-none shadow-xs ${THEME.fonts.heading}`}>
                  Drop price • {countdownText}
                </span>
              ) : (
                <span className={`text-[14px] sm:text-xs lg:text-[11px] text-[#2F7D69] font-bold tracking-wider leading-none ${THEME.fonts.heading}`}>
                  Direct price
                </span>
              )}
            </div>

            {/* Line 3: Savings in small red font */}
            {hasSavings && (
              <div className="flex items-center self-start">
                <div className="bg-[#FF3B30]/10 rounded-full px-2.5 py-1 sm:py-0.5 flex items-center gap-2 shadow-xs backdrop-blur-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] shrink-0" />
                  <span className={`text-[14px] sm:text-xs lg:text-[13px] text-[#FF3B30] font-bold tracking-wide leading-none ${THEME.fonts.mono}`}>
                    {convertPrice(activeSavings)} {currencySymbol}
                  </span>
                  <span className={`text-[12.5px] sm:text-[10px] lg:text-[10.5px] text-[#FF3B30] font-bold tracking-wider leading-none ${THEME.fonts.heading}`}>
                    Saved
                  </span>
                </div>
              </div>
            )}
                  </div>
                </div>
              </div>

              {/* Grey section container starting from Description */}
              <div className="bg-[#F4F7F6] p-4 sm:p-6 rounded-[24px] border border-[#E5E7EB] space-y-7">
                
                {/* Description body */}
                <div className="space-y-3">
                  <h3 className="font-display text-base font-extrabold text-[#1E293B]">Описание объекта</h3>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </p>
                </div>

                {/* Icons / Characteristics specs grid - Square plates */}
                <div className="space-y-3">
                  <h3 className={`text-base font-extrabold text-[#1E293B] ${THEME.fonts.heading}`}>Характеристики & Условия</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    
                    {listing.roomsTotal && (
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-2xl flex items-center gap-2.5">
                        <Home className="w-4 h-4 text-brand-orange shrink-0" />
                        <div className="text-[10px] sm:text-xs">
                          <span className="text-gray-400 block leading-tight">Всего комнат:</span>
                          <span className="font-bold text-text-dark">{listing.roomsTotal} спален</span>
                        </div>
                      </div>
                    )}

                    {listing.internetSpeed !== undefined && (
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-2xl flex items-center gap-2.5">
                        <Wifi className="w-4 h-4 text-brand-orange shrink-0" />
                        <div className="text-[10px] sm:text-xs">
                          <span className="text-gray-400 block leading-tight">Высокоскостной Wifi:</span>
                          <span className="font-bold text-text-dark">{listing.internetSpeed} Мб/с</span>
                        </div>
                      </div>
                    )}

                    {listing.poolType && (
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-2xl flex items-center gap-2.5">
                        <Waves className="w-4 h-4 text-brand-orange shrink-0" />
                        <div className="text-[10px] sm:text-xs">
                          <span className="text-gray-400 block leading-tight">Бассейн на вилле:</span>
                          <span className="font-bold text-text-dark">{listing.poolType === 'infinity' ? 'Инфинити' : listing.poolType === 'private' ? 'Частный' : 'Общий'}</span>
                        </div>
                      </div>
                    )}

                    {listing.distanceToSeaMinutes !== undefined && (
                      <div className="p-3 bg-white border border-[#E5E7EB] rounded-2xl flex items-center gap-2.5">
                        <Compass className="w-4 h-4 text-brand-orange shrink-0" />
                        <div className="text-[10px] sm:text-xs">
                          <span className="text-gray-400 block leading-tight">Дистанция до моря:</span>
                          <span className="font-bold text-[#1E293B]">{listing.distanceToSeaMinutes} мин на байке</span>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-white border border-[#E5E7EB] rounded-2xl flex items-center gap-2.5">
                      <RefreshCw className="w-4 h-4 text-brand-orange shrink-0" />
                      <div className="text-[10px] sm:text-xs">
                        <span className="text-gray-400 block leading-tight">Построен/Реновация:</span>
                        <span className="font-bold text-[#1E293B]">{listing.yearBuilt}г {listing.yearRenovated ? `(рен. ${listing.yearRenovated})` : ''}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Amenities checkboxes - visual styled exactly like filters */}
                <div className="space-y-3">
                  <h3 className={`text-base font-extrabold text-[#1E293B] ${THEME.fonts.heading}`}>Удобства</h3>
                  
                  {(() => {
                    const combinedAmenities = [
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
                        : combinedAmenities.length <= 6
                        ? 'xs:hidden'
                        : combinedAmenities.length <= 8
                        ? 'sm:hidden'
                        : '';

                    return (
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2.5 w-full">
                          {combinedAmenities.map((item, index) => {
                            const visibilityClass = !isAmenitiesExpanded
                              ? index < 4
                                ? 'flex'
                                : index < 6
                                ? 'hidden xs:flex'
                                : index < 8
                                ? 'hidden sm:flex'
                                : 'hidden'
                              : 'flex';

                            return (
                              <div 
                                key={item.key} 
                                className={`${visibilityClass} p-3 rounded-2xl border border-[#E5E7EB] bg-white text-center flex-col items-center justify-center gap-1.5 min-h-[95px] select-none ${THEME.fonts.heading}`}
                              >
                                <span className="text-2xl sm:text-3xl leading-none select-none">{item.config.icon}</span>
                                <span className="text-[10px] sm:text-xs font-semibold leading-tight text-[#1E293B] capitalize text-center">{item.config.label}</span>
                              </div>
                            );
                          })}
                        </div>

                        {combinedAmenities.length > 4 && (
                          <div className={`relative flex items-center py-2 ${isAmenitiesExpanded ? '' : buttonVisibilityClass}`}>
                            <div className="flex-grow border-t border-[#E5E7EB] h-0"></div>
                            <button 
                              onClick={() => setIsAmenitiesExpanded(!isAmenitiesExpanded)}
                              className="flex-shrink mx-4 px-5 py-2 rounded-full bg-white border border-[#E5E7EB] text-xs font-extrabold text-[#FF7A50] hover:bg-gray-50 active:scale-95 transition cursor-pointer shadow-xs select-none"
                            >
                              {isAmenitiesExpanded ? 'Скрыть удобства' : 'Еще'}
                            </button>
                            <div className="flex-grow border-t border-[#E5E7EB] h-0"></div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Exact Surrounding spots list */}
                <div className="space-y-3">
                  <h3 className={`text-base font-extrabold text-[#1E293B] ${THEME.fonts.heading}`}>
                    Что рядом
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {NEARBY_Pills.map((spot, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 bg-white border border-[#E5E7EB] rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 aspect-square"
                      >
                        <span className="text-xl sm:text-2xl select-none">{spot.emoji}</span>
                        <span className={`font-extrabold text-[#1E293B] text-[10.5px] sm:text-[11.5px] tracking-wide leading-tight ${THEME.fonts.heading}`}>{spot.title}</span>
                        <span className="text-[9.5px] sm:text-[10px] text-gray-400 line-clamp-2 leading-tight">{spot.desc}</span>
                        {spot.note && (
                          <span className={`text-[8px] font-extrabold text-[#2F7D69] bg-[#2F7D69]/10 border border-[#2F7D69]/20 px-1.5 py-0.5 rounded tracking-wider leading-none ${THEME.fonts.heading}`}>
                            {spot.note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Interactive Location Map as separate, distinct block */}
              <div className="space-y-4 pt-1">
                <h3 className="font-display text-[#1E293B] text-base font-extrabold">
                  Местоположение на карте
                </h3>
                <DetailMap 
                  listing={listing} 
                  currencySymbol={currencySymbol} 
                  currencyRate={currencyRate} 
                />
              </div>

              {/* Review section elements with cleanest reviews as separate, distinct group */}
              <div className="space-y-4 pt-1">
                <h3 className="font-display text-[#1E293B] text-base font-extrabold">
                  Отзывы гостей
                </h3>

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

                      <p className="text-[#1E293B] text-xs sm:text-sm leading-relaxed italic">
                        "{review.text}"
                      </p>

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
              </div>

            </div>

            {/* Right Sticky Reservation & WhatsApp Box (Hidden on Mobile, Sticky on Desktop) */}
            <div className="hidden lg:block">
              <div className="sticky top-6 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xl space-y-4">
                {/* Total cost and nights details */}
                <div className="text-center space-y-2">
                  <span className="text-[13px] font-bold text-text-dark block">
                    Итого за {diffDays} {pluralizeDays(diffDays)}:
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
                    <span className="text-gray-400 font-light">{' / \u0434\u0435\u043d\u044c'}</span>
                  </div>

                  {hasSavings && totalSavings > 0 && (
                    <div className="flex items-center justify-center">
                      <div className="bg-[#FF3B30]/10 rounded-full px-2.5 py-1 flex items-center gap-2 shadow-xs backdrop-blur-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] shrink-0" />
                        <span className={`text-[13px] text-[#FF3B30] font-bold tracking-wide leading-none ${THEME.fonts.mono}`}>
                          {convertPrice(totalSavings)} {currencySymbol}
                        </span>
                        <span className={`text-[10.5px] text-[#FF3B30] font-bold tracking-wider leading-none ${THEME.fonts.heading}`}>
                          Saved
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dates input selectors */}
                <div className="space-y-3 pt-3.5 border-t border-[#E5E7EB]/60 relative">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">Check-in</label>
                      <button
                        type="button"
                        onClick={() => setShowDateCalendar(true)}
                        className="w-full bg-[#F4F7F6] border border-[#E5E7EB] rounded-xl px-3 py-2 text-left text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF7A50] cursor-pointer hover:border-[#FF7A50]/60 transition"
                      >
                        {formatBookingDate(checkInDate) || 'Дата'}
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">Check-out</label>
                      <button
                        type="button"
                        onClick={() => setShowDateCalendar(true)}
                        className="w-full bg-[#F4F7F6] border border-[#E5E7EB] rounded-xl px-3 py-2 text-left text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF7A50] cursor-pointer hover:border-[#FF7A50]/60 transition"
                      >
                        {formatBookingDate(checkOutDate) || 'Дата'}
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
                      }}
                      onClose={() => setShowDateCalendar(false)}
                    />
                  )}
                </div>

                {/* Call WhatsApp button */}
                <div className="pt-2">
                  <button
                    disabled={orderPlaced}
                    onClick={handleWhatsAppClick}
                    className={`w-full py-3.5 rounded-2xl font-sans font-bold text-xs shadow-md transition duration-200 flex items-center justify-center gap-2 active:scale-97 cursor-pointer ${
                      orderPlaced
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#2F7D69]/100 text-white hover:bg-emerald-600 hover:shadow-lg'
                    }`}
                    id="wa-booking-btn"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.764.462 3.42 1.258 4.876L2 22l5.304-1.216A9.94 9.94 0 0 0 12.004 22c5.52 0 10-4.48 10-10.004C22.004 6.48 17.524 2 12.004 2zm5.72 13.92c-.22.624-1.076 1.156-1.748 1.296-.512.108-1.18.2-3.444-.736-2.892-1.196-4.736-4.14-4.88-4.332-.14-.192-1.136-1.512-1.136-2.884 0-1.372.716-2.044.972-2.316.22-.228.58-.336.872-.336.096 0 .18 0 .252.004.212.008.316.02.456.328.176.388.604 1.472.656 1.58.052.108.088.232.016.376-.072.148-.108.24-.216.368-.108.128-.22.252-.316.364-.1.108-.204.228-.088.428.116.196.516.852 1.112 1.384.768.684 1.412.896 1.612.996.2.1.316.084.432-.048.116-.132.504-.588.64-.788.136-.2.272-.164.456-.096.188.068 1.192.56 1.4.664.204.104.34.156.388.24.048.084.048.492-.172 1.116z" />
                    </svg>
                    <span>
                      {orderPlaced ? 'Перенаправление...' : 'Забронировать'}
                    </span>
                  </button>
                </div>

                <p className="text-[10px] text-gray-400 font-medium text-center">
                  *Без комиссий. Сделка напрямую с владельцем через чат.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Sticky bottom mobile checkout panel */}
        <div className="lg:hidden p-4 bg-white border-t border-[#E5E7EB] flex items-center justify-between gap-4 z-40">
          <div>
            <span className="text-[9px] text-gray-400 font-bold block leading-none mb-1">Итого за {diffDays} {diffDays === 1 ? 'ночь' : (diffDays >= 2 && diffDays <= 4) ? 'ночи' : 'ночей'}</span>
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
            className={`flex-1 py-3.5 rounded-xl font-sans font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition ${
              orderPlaced
                ? 'bg-emerald-600 text-white'
                : 'bg-[#2F7D69]/100 text-white hover:bg-emerald-600'
            }`}
            id="wa-mobile-btn"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.764.462 3.42 1.258 4.876L2 22l5.304-1.216A9.94 9.94 0 0 0 12.004 22c5.52 0 10-4.48 10-10.004C22.004 6.48 17.524 2 12.004 2zm5.72 13.92c-.22.624-1.076 1.156-1.748 1.296-.512.108-1.18.2-3.444-.736-2.892-1.196-4.736-4.14-4.88-4.332-.14-.192-1.136-1.512-1.136-2.884 0-1.372.716-2.044.972-2.316.22-.228.58-.336.872-.336.096 0 .18 0 .252.004.212.008.316.02.456.328.176.388.604 1.472.656 1.58.052.108.088.232.016.376-.072.148-.108.24-.216.368-.108.128-.22.252-.316.364-.1.108-.204.228-.088.428.116.196.516.852 1.112 1.384.768.684 1.412.896 1.612.996.2.1.316.084.432-.048.116-.132.504-.588.64-.788.136-.2.272-.164.456-.096.188.068 1.192.56 1.4.664.204.104.34.156.388.24.048.084.048.492-.172 1.116z" />
            </svg>
            <span>{orderPlaced ? 'Загрузка...' : 'Забронировать'}</span>
          </button>
        </div>

        {/* Full-screen Vertical Scroll Gallery Modal */}
        {isVerticalGalleryOpen && (
          <div 
            className="fixed inset-0 bg-black/95 z-50 overflow-y-auto flex flex-col items-center p-4 sm:p-8 animate-fade-in"
            id="vertical-gallery-modal"
          >
            {/* Sticky Header inside scroll container */}
            <div className="w-full max-w-4xl flex items-center justify-between text-white border-b border-white/10 pb-4 mb-6 shrink-0 z-10 sticky top-0 bg-black/95 py-2">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-[#FF7A50]">{listing.title}</h4>
                <p className="text-xs text-gray-400">{listing.images.length} фото</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVerticalGalleryOpen(false);
                }}
                className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-[#FF7A50] text-white hover:text-white transition duration-200 cursor-pointer flex items-center gap-1 text-xs font-semibold"
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">Закрыть галерею</span>
              </button>
            </div>

            {/* Stack of all images */}
            <div className="w-full max-w-4xl space-y-6 flex flex-col items-center">
              {listing.images.map((img, idx) => (
                <div key={idx} className="w-full bg-black/45 rounded-2xl overflow-hidden border border-white/15 flex flex-col items-center justify-center shadow-lg">
                  <img 
                    src={img} 
                    alt={`${listing.title} - Фото ${idx + 1}`} 
                    className="w-full h-auto object-contain max-h-[85vh]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="py-3 text-center text-xs text-gray-400 border-t border-white/5 w-full bg-black/35 font-mono">
                    Фото {idx + 1} из {listing.images.length}
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
                Вернуться к деталям объекта
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
