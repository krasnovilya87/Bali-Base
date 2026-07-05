import React, { useState, useEffect, useRef } from 'react';
import { FilterState, Listing } from '../types';
import { X, Check, ArrowRight, ChevronLeft, ChevronRight, SlidersHorizontal, Sparkles, Flame, Percent, Snowflake, Monitor, Key, Shield, HelpCircle, Wifi, Compass, Waves } from 'lucide-react';
import Polzunok from './Polzunok';
import { isListingFresh } from '../utils/listingFreshness';
import { snapRangeValue } from '../utils/range';
import { useI18n } from '../i18nContext';

interface HousingFiltersProps {
  listings: Listing[];
  subCategory: string; // 'entire_place' | 'private_suite' | 'private_room' | string
  selectedSubCategories?: string[];
  onSubCategoryChange?: (subCategoryId: string) => void;
  filters: FilterState;
  onApplyFilters: (newFilters: FilterState) => void;
  onClose: () => void;
  currencySymbol: string;
  currencyRate: number;
}

export default function HousingFilters({
  listings,
  subCategory,
  selectedSubCategories = [subCategory],
  onSubCategoryChange,
  filters,
  onApplyFilters,
  onClose,
  currencySymbol,
  currencyRate
}: HousingFiltersProps) {
  const { tr } = useI18n();
  // Slider Boundaries for monthly rates (e.g. 1M IDR to 30M IDR)
  const minBound = 1000000;
  const maxBound = 30000000;

  // Align filters within bounds or fallback to default
  const [localFilters, setLocalFilters] = useState<FilterState>({
    ...filters,
    priceMin: filters.priceMin < minBound ? minBound : filters.priceMin,
    priceMax: filters.priceMax > maxBound || filters.priceMax === 30000000 ? maxBound : filters.priceMax,
    distanceToSeaMin: filters.distanceToSeaMin !== undefined ? filters.distanceToSeaMin : 0,
    areaMin: filters.areaMin !== undefined ? filters.areaMin : 5
  });

  const [activeDrag, setActiveDrag] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const priceDragStartValue = useRef<number>(minBound);
  const latestPriceDragValue = useRef<number>(minBound);
  const [showKitchenTooltip, setShowKitchenTooltip] = useState(false);
  const activeSubCategoryIndex = Math.max(0, selectedSubCategories.indexOf(subCategory));
  const hasSubCategorySwitcher = selectedSubCategories.length > 1 && !!onSubCategoryChange;
  const roomOnlyAmenityOptions = subCategory === 'private_room'
    ? [
      { value: 'room_fridge', label: 'Холодильник в номере', icon: '🧊', type: 'amenity' },
      { value: 'water_cooler', label: 'Кулер', icon: '💧', type: 'amenity' }
    ]
    : [];
  const translateOption = (option: { value: string; label: string }) => {
    const fieldKeys = [
      'housingType',
      'interiorStyle',
      'densityType',
      'territoryType',
      'bedTypes',
      'kitchenType',
      'poolType',
      'viewType',
      'bathroomOptions',
      'amenities',
      'cleanlinessTags',
      'cleaningFrequency',
      'extraOptions'
    ];
    for (const fieldKey of fieldKeys) {
      const key = `details.option.${fieldKey}.${option.value}`;
      const translated = tr(key);
      if (translated !== key) return translated;
    }
    return option.label;
  };

  const switchSubCategory = (direction: -1 | 1) => {
    if (!hasSubCategorySwitcher) return;
    const nextIndex = (activeSubCategoryIndex + direction + selectedSubCategories.length) % selectedSubCategories.length;
    onSubCategoryChange?.(selectedSubCategories[nextIndex]);
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      priceMin: minBound,
      priceMax: maxBound,
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
    };
    setLocalFilters(defaultFilters);
  };

  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const list = localFilters[key] as string[];
    if (list.includes(value)) {
      setLocalFilters({
        ...localFilters,
        [key]: list.filter(v => v !== value)
      });
    } else {
      setLocalFilters({
        ...localFilters,
        [key]: [...list, value]
      });
    }
  };

  // 1. Get relevant monthly price of each listing
  const getItemMonthlyPrice = (item: Listing) => {
    if (item.hasDropPrice && item.dropPricePerMonth) {
      return item.dropPricePerMonth;
    }
    if (item.pricePerMonth) {
      return item.pricePerMonth;
    }
    const dailyPrice = item.hasDropPrice && item.dropPricePerDay ? item.dropPricePerDay : item.pricePerDay;
    return dailyPrice * 30; // monthly fallback
  };

  // 2. Compute Histogram Distribution statistics
  const relevantListings = listings.filter(item => item.category === 'housing' && item.subCategory === subCategory);
  
  const numBins = 24;
  const binWidth = (maxBound - minBound) / numBins;
  
  const histogramBins = Array.from({ length: numBins }, (_, i) => {
    const startPrice = minBound + i * binWidth;
    const endPrice = startPrice + binWidth;
    const count = relevantListings.filter(item => {
      const price = getItemMonthlyPrice(item);
      return price >= startPrice && price < endPrice;
    }).length;

    return {
      startPrice,
      endPrice,
      count
    };
  });

  const maxBinCount = Math.max(...histogramBins.map(b => b.count), 1);

  // 3. Coordinate dragging
  useEffect(() => {
    if (!activeDrag) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const rawPrice = minBound + fraction * (maxBound - minBound);

      if (activeDrag === 'min') {
        const nextMin = Math.min(rawPrice, localFilters.priceMax - 1000000);
        const constrainedMin = Math.max(minBound, nextMin);
        latestPriceDragValue.current = constrainedMin;
        setLocalFilters(prev => ({
          ...prev,
          priceMin: constrainedMin
        }));
      } else if (activeDrag === 'max') {
        const nextMax = Math.max(rawPrice, localFilters.priceMin + 1000000);
        const constrainedMax = Math.min(maxBound, nextMax);
        latestPriceDragValue.current = constrainedMax;
        setLocalFilters(prev => ({
          ...prev,
          priceMax: constrainedMax
        }));
      }
    };

    const handlePointerUp = () => {
      const snappedValue = snapRangeValue(
        latestPriceDragValue.current,
        priceDragStartValue.current,
        minBound,
        maxBound,
        500000
      );

      setLocalFilters(prev => ({
        ...prev,
        ...(activeDrag === 'min'
          ? { priceMin: Math.min(snappedValue, prev.priceMax - 1000000) }
          : { priceMax: Math.max(snappedValue, prev.priceMin + 1000000) })
      }));
      setActiveDrag(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeDrag, localFilters.priceMin, localFilters.priceMax]);

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const rawPrice = minBound + fraction * (maxBound - minBound);
    
    const distMin = Math.abs(rawPrice - localFilters.priceMin);
    const distMax = Math.abs(rawPrice - localFilters.priceMax);
    
    if (distMin < distMax) {
      const nextMin = Math.max(minBound, Math.min(rawPrice, localFilters.priceMax - 1000000));
      priceDragStartValue.current = localFilters.priceMin;
      latestPriceDragValue.current = nextMin;
      setLocalFilters(prev => ({
        ...prev,
        priceMin: nextMin
      }));
      setActiveDrag('min');
    } else {
      const nextMax = Math.min(maxBound, Math.max(rawPrice, localFilters.priceMin + 1000000));
      priceDragStartValue.current = localFilters.priceMax;
      latestPriceDragValue.current = nextMax;
      setLocalFilters(prev => ({
        ...prev,
        priceMax: nextMax
      }));
      setActiveDrag('max');
    }
  };

  // Convert and format IDR to friendly display based on currency settings
  const formatPriceWithMillionLabel = (idrValue: number) => {
    const converted = Math.round(idrValue * currencyRate);
    if (currencyRate === 1) {
      const million = idrValue / 1000000;
      return `${million.toFixed(1).replace('.0', '')} ${tr('filters.millionRp')}`;
    } else {
      return `${converted.toLocaleString()} ${currencySymbol}`;
    }
  };

  // 4. Calculate real-time matching listings count
  const getMatchingListingsCount = () => {
    return listings.filter(item => {
      // Category L1 & subCategory mapping
      if (item.category !== 'housing') return false;
      if (subCategory && item.subCategory !== subCategory) return false;

      // Pricing check matched to localFilters in real-time
      const price = getItemMonthlyPrice(item);
      if (price < localFilters.priceMin || price > localFilters.priceMax) return false;

      // Distance check
      if (item.distanceToSeaMinutes !== undefined) {
        if (item.distanceToSeaMinutes < (localFilters.distanceToSeaMin || 0) || item.distanceToSeaMinutes > localFilters.distanceToSeaMax) {
          return false;
        }
      }

      // New/Renovated building within 2 years check
      if (localFilters.isNewOnly) {
        if (!isListingFresh(item)) return false;
      }

      // Cleanliness
      if (localFilters.cleanlinessTags.length > 0) {
        const matchesAllTags = localFilters.cleanlinessTags.every(tag => {
          if (tag === 'Approved') return item.isApproved;
          const revTags = item.reviews ? item.reviews.flatMap(r => r.cleanlinessLabels || []) : [];
          return revTags.includes(tag);
        });
        if (!matchesAllTags) return false;
      }

      // Super tags / fast check
      if (localFilters.isApprovedOnly && !item.isApproved) return false;
      if (localFilters.hasDropPriceOnly && !item.hasDropPrice) return false;

      // Type
      if (localFilters.housingType.length > 0 && item.housingType && !localFilters.housingType.includes(item.housingType)) return false;
      
      // Territory
      if (localFilters.territoryType.length > 0 && item.territoryType && !localFilters.territoryType.includes(item.territoryType)) return false;

      // Density
      if (localFilters.densityType.length > 0) {
        const itemDensity = item.densityType || (item.roomsTotal ? (item.roomsTotal <= 4 ? 'cozy' : item.roomsTotal <= 10 ? 'medium' : 'large') : 'cozy');
        if (!localFilters.densityType.includes(itemDensity)) return false;
      }

      // Interior style
      if (localFilters.interiorStyle.length > 0 && !localFilters.interiorStyle.includes(item.interiorStyle)) return false;

      // Wall materials
      if (localFilters.wallMaterial.length > 0 && item.wallMaterial && !localFilters.wallMaterial.includes(item.wallMaterial)) return false;

      // Bed Type
      if (localFilters.bedType.length > 0 && item.bedType && !localFilters.bedType.includes(item.bedType)) return false;

      // Kitchen Type
      if (localFilters.kitchenType.length > 0 && item.kitchenType && !localFilters.kitchenType.includes(item.kitchenType)) return false;

      // Pool Type
      if (localFilters.poolType.length > 0) {
        if (!item.poolType || item.poolType === 'none') return false;
        
        if (localFilters.poolType.includes('infinity')) {
          if (item.poolType !== 'infinity') return false;
        }
        
        if (localFilters.poolType.includes('shared')) {
          const isShared = item.poolType === 'shared' || (item.poolType === 'infinity' && item.territoryType === 'shared');
          if (!isShared) return false;
        }
        
        if (localFilters.poolType.includes('private')) {
          const isPrivate = item.poolType === 'private' || (item.poolType === 'infinity' && item.territoryType === 'private');
          if (!isPrivate) return false;
        }
      }

      // Internet Minimum Speed
      if (localFilters.internetSpeedMin > 0 && (item.internetSpeed === undefined || item.internetSpeed < localFilters.internetSpeedMin)) return false;

      // Bathroom Type & Options
      if (localFilters.bathroomType.length > 0 && item.bathroomType && !localFilters.bathroomType.includes(item.bathroomType)) return false;
      if (localFilters.bathroomOptions.length > 0) {
        const hasAllBathOpts = localFilters.bathroomOptions.every(opt => item.bathroomOptions && item.bathroomOptions.includes(opt));
        if (!hasAllBathOpts) return false;
      }

      // Room quantity or Area quantity check
      if (subCategory === 'private_suite' || subCategory === 'private_room') {
        const areaMinFilter = localFilters.areaMin !== undefined ? localFilters.areaMin : 5;
        const itemArea = item.area !== undefined ? item.area : (item.roomsTotal ? item.roomsTotal * 12 : 25);
        if (itemArea < areaMinFilter) return false;
      } else {
        if (item.roomsTotal !== undefined) {
          if (item.roomsTotal < localFilters.roomsMin || item.roomsTotal > localFilters.roomsMax) return false;
        }
      }

      // Cleaning frequency
      if (localFilters.cleaningFrequency.length > 0 && item.cleaningFrequency && !localFilters.cleaningFrequency.includes(item.cleaningFrequency)) return false;

      // Amenities
      if (localFilters.amenities.length > 0) {
        const hasAll = localFilters.amenities.every(amen => item.amenities && item.amenities.includes(amen));
        if (!hasAll) return false;
      }

      // Extra options
      if (localFilters.extraOptions.length > 0) {
        const extraOptionAliases: Record<string, string[]> = {
          airport_transfer_included: ['airport_transfer_included', 'transfer_included'],
          airport_transfer_paid: ['airport_transfer_paid', 'airport_transfer'],
          transfer_included: ['airport_transfer_included', 'transfer_included'],
          airport_transfer: ['airport_transfer_paid', 'airport_transfer']
        };
        const hasAll = localFilters.extraOptions.every(opt => {
          const acceptedValues = extraOptionAliases[opt] || [opt];
          return acceptedValues.some(value => item.extraOptions && item.extraOptions.includes(value));
        });
        if (!hasAll) return false;
      }

      // View Type
      if (localFilters.viewType.length > 0 && item.viewType && !localFilters.viewType.includes(item.viewType)) return false;

      return true;
    }).length;
  };

  const matchingCount = getMatchingListingsCount();

  // Handle percentages for style layouts
  const minPct = ((localFilters.priceMin - minBound) / (maxBound - minBound)) * 100;
  const maxPct = ((localFilters.priceMax - minBound) / (maxBound - minBound)) * 100;

  return (
    <div 
      className="fixed inset-0 bg-[#1E293B]/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-[500] animate-fade-in" 
      id="filter-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-xl bg-white max-h-[88vh] flex flex-col shadow-[0_24px_60px_-15px_rgba(28,37,33,0.3)] relative rounded-[32px] border border-[#E5E7EB] overflow-hidden transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER SECTION */}
        <div className={`px-6 ${hasSubCategorySwitcher ? 'pt-5 pb-8' : 'py-5'} border-b border-[#F4F7F6] flex items-center justify-between bg-white relative z-10`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2F7D69]/10 flex items-center justify-center text-[#FF7A50]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans text-lg font-bold text-[#1E293B] leading-tight">
                {subCategory === 'entire_place' ? tr('filters.subEntirePlace') : subCategory === 'private_suite' ? tr('filters.subPrivateSuite') : tr('filters.subPrivateRoom')}
              </h2>
              {hasSubCategorySwitcher && (
                <div className="absolute left-[88px] bottom-2 flex items-center gap-0.5 rounded-full bg-[#F4F7F6] p-0.5 w-fit">
                  <button
                    type="button"
                    onClick={() => switchSubCategory(-1)}
                    className="w-5 h-5 rounded-full bg-white text-[#1E293B] hover:text-[#FF7A50] shadow-2xs flex items-center justify-center transition active:scale-90 cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="min-w-[22px] text-center text-[9px] font-bold text-gray-400 font-mono">
                    {activeSubCategoryIndex + 1}/{selectedSubCategories.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => switchSubCategory(1)}
                    className="w-5 h-5 rounded-full bg-white text-[#1E293B] hover:text-[#FF7A50] shadow-2xs flex items-center justify-center transition active:scale-90 cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition active:scale-90 cursor-pointer"
            id="close-filter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 select-none bg-[#F4F7F6]">
          
          {/* QUICK PREMIUM TAGS */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-500 tracking-wider block">{tr('filters.quickStatus')}</span>
            <div className="grid grid-cols-2 gap-3">

              {/* Checked card 1: Approved */}
              <button
                type="button"
                onClick={() => setLocalFilters({ ...localFilters, isApprovedOnly: !localFilters.isApprovedOnly })}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer select-none relative overflow-hidden h-[105px] ${
                  localFilters.isApprovedOnly 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-sm scale-102' 
                    : 'bg-white border-[#E5E7EB] text-gray-700 hover:border-emerald-400 hover:bg-emerald-50/10'
                }`}
              >
                {localFilters.isApprovedOnly && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                )}
                <span className="text-2xl leading-none">✨</span>
                <span className={`text-xs font-semibold mt-1 transition-colors ${localFilters.isApprovedOnly ? 'text-emerald-900' : 'text-[#1E293B]'}`}>{tr('filters.approvedOnly')}</span>
              </button>



              {/* Checked card 3: New only */}
              <button
                type="button"
                onClick={() => setLocalFilters({ ...localFilters, isNewOnly: !localFilters.isNewOnly })}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer select-none relative overflow-hidden h-[105px] ${
                  localFilters.isNewOnly
                    ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-sm scale-102' 
                    : 'bg-white border-[#E5E7EB] text-gray-700 hover:border-blue-400 hover:bg-blue-50/10'
                }`}
              >
                {localFilters.isNewOnly && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                )}
                <span className="text-2xl leading-none">🧭</span>
                <span className={`text-xs font-semibold mt-1 transition-colors ${localFilters.isNewOnly ? 'text-blue-950' : 'text-[#1E293B]'}`}>{tr('filters.newHousing')}</span>
              </button>

            </div>
          </div>

          {/* DRAGGABLE HISTOGRAM SECTION (PRICE) */}
          <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] space-y-4">
            {/* PRICING DUAL-SLIDER HISTOGRAM */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-500 tracking-wider block">{tr('filters.priceRange')}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-full">
                    {formatPriceWithMillionLabel(localFilters.priceMin)} – {formatPriceWithMillionLabel(localFilters.priceMax)} {tr('filters.perMonthShort')}
                  </span>
                </div>
              </div>

              {/* HISTOGRAM VISUAL BARS */}
              <div className="relative pt-6">
                <div className="flex items-end justify-between h-20 w-full px-2 gap-[3px]">
                  {histogramBins.map((bin, idx) => {
                    const isSelected = bin.endPrice >= localFilters.priceMin && bin.startPrice <= localFilters.priceMax;
                    const heightPercent = maxBinCount > 0 ? (bin.count / maxBinCount) * 100 : 0;
                    
                    return (
                      <div 
                        key={idx} 
                        className="flex-1 flex flex-col justify-end h-full group"
                        title={tr('filters.offersInRange', { count: bin.count, start: formatPriceWithMillionLabel(bin.startPrice), end: formatPriceWithMillionLabel(bin.endPrice) })}
                      >
                        <div 
                          className={`w-full rounded-t-[3px] transition-all duration-300 ${
                            isSelected 
                              ? 'bg-[#FF7A50]' 
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          style={{ 
                            height: `${Math.max(4, heightPercent)}%` 
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* THE DUAL RANGE SLIDER TRACK OVERLAY */}
                <div 
                  ref={trackRef}
                  onPointerDown={handleTrackPointerDown}
                  className="polzunok-dual relative h-6 mt-2 cursor-pointer touch-none flex items-center"
                >
                  <div className="absolute inset-x-0 h-1.5 bg-gray-100 rounded-full" />
                  <div 
                    className="absolute h-1.5 bg-[#FF7A50] rounded-full transition-all duration-[60ms]" 
                    style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
                  />

                  {/* Left (Min) Handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      priceDragStartValue.current = localFilters.priceMin;
                      latestPriceDragValue.current = localFilters.priceMin;
                      setActiveDrag('min');
                    }}
                    className="absolute top-1/2 w-[18px] h-[18px] bg-[#FF7A50] rounded-full shadow-[0_2px_6px_rgba(255,122,80,0.4)] hover:scale-115 transition-transform z-20 -ml-[9px] cursor-pointer"
                    style={{ 
                      left: `${minPct}%`, 
                      transform: 'translateY(-50%)',
                      touchAction: 'none' 
                    }}
                  />

                  {/* Right (Max) Handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      priceDragStartValue.current = localFilters.priceMax;
                      latestPriceDragValue.current = localFilters.priceMax;
                      setActiveDrag('max');
                    }}
                    className="absolute top-1/2 w-[18px] h-[18px] bg-[#FF7A50] rounded-full shadow-[0_2px_6px_rgba(255,122,80,0.4)] hover:scale-115 transition-transform z-20 -ml-[9px] cursor-pointer"
                    style={{ 
                      left: `${maxPct}%`, 
                      transform: 'translateY(-50%)',
                      touchAction: 'none' 
                    }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10.5px] text-[#1E293B] font-semibold mt-2 px-1">
                  <span>1 {tr('filters.millionRp')}</span>
                  <span>15 {tr('filters.millionRp')}</span>
                  <span>30 {tr('filters.millionRp')}+</span>
                </div>
              </div>
            </div>
          </div>

          {/* SEA DISTANCE SLIDER (SEPARATE BLOCK) */}
          <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 tracking-wider block">🛵 {tr('filters.distanceSea')}</span>
              <span className="text-xs font-semibold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-full">
                {tr('filters.distanceToSeaValue', { count: localFilters.distanceToSeaMax })}
              </span>
            </div>

            <div className="pt-2 relative">
              <Polzunok
                min={0}
                max={45}
                step={5}
                value={localFilters.distanceToSeaMax}
                onChange={value => setLocalFilters({ ...localFilters, distanceToSeaMin: 0, distanceToSeaMax: value })}
              />
              <div className="flex justify-between text-[10.5px] text-[#1E293B] font-semibold mt-1.5 px-0.5">
                <span>{tr('filters.nearBeach')}</span>
                <span>{tr('filters.minLabel', { count: 20 })}</span>
                <span>{tr('filters.minutesPlusLabel', { count: 45 })}</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC METRIC-SPECIFIC ADVANCED SECTIONS */}
          {/* 1. Количество комнат или Площадь */}
          {(subCategory === 'private_suite' || subCategory === 'private_room') ? (
            <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 tracking-wider block">📐 {tr('filters.area')}</span>
                <span className="text-xs font-semibold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-full">
                  {tr('filters.fromArea', { count: localFilters.areaMin !== undefined ? localFilters.areaMin : 5 })}
                </span>
              </div>
              
              <div className="pt-2 relative">
                <Polzunok
                  min={5}
                  max={50}
                  step={5}
                  value={localFilters.areaMin !== undefined ? localFilters.areaMin : 5}
                  onChange={value => setLocalFilters({ ...localFilters, areaMin: value })}
                />
                <div className="flex justify-between text-[10.5px] text-[#1E293B] font-semibold mt-1.5 px-0.5">
                  <span>{tr('filters.areaValue', { count: 5 })}</span>
                  <span>{tr('filters.areaValue', { count: 25 })}</span>
                  <span>{tr('filters.areaValuePlus', { count: 50 })}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 tracking-wider block">🏢 {tr('filters.rooms')}</span>
                <span className="text-xs font-semibold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-full">
                  {tr('filters.fromRooms', { count: localFilters.roomsMin })}
                </span>
              </div>
              
              <div className="pt-2 relative">
                <Polzunok
                  min={1}
                  max={10}
                  step={1}
                  value={localFilters.roomsMin}
                  onChange={value => setLocalFilters({ ...localFilters, roomsMin: value, roomsMax: 10 })}
                />
                <div className="flex justify-between text-[10.5px] text-[#1E293B] font-semibold mt-1.5 px-0.5">
                  <span>{tr('filters.fromRooms', { count: 1 })}</span>
                  <span>{tr('filters.roomsValue', { count: 5 })}</span>
                  <span>{tr('filters.roomsValuePlus', { count: 10 })}</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Дизайн и интерьер */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-500 tracking-wider block">🎨 {tr('filters.section.interior')}</span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'basic', label: 'Базовый', icon: '🪑' },
                { value: 'bali_style', label: 'Бали Стайл', icon: '🎋' },
                { value: 'modern', label: 'Современный', icon: '🛋️' },
                { value: 'luxury', label: 'Роскошный', icon: '👑' }
              ].map(style => {
                const isActive = localFilters.interiorStyle.includes(style.value);
                return (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => toggleArrayFilter('interiorStyle', style.value)}
                    className={`p-2 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer select-none relative overflow-hidden h-[100px] ${
                      isActive
                        ? 'bg-[#FF7A50]/10 border-[#FF7A50] text-[#FF7A50] font-bold shadow-sm scale-102'
                        : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50] hover:bg-gray-50/40'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-[900] z-10 animate-scale-up">✓</span>
                    )}
                    <span className="text-3xl leading-none">{style.icon}</span>
                    <span className={`text-xs font-semibold leading-tight mt-1 transition-colors ${isActive ? 'text-[#FF7A50]' : 'text-[#1E293B]'}`}>{translateOption(style)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DYNAMIC FOR PRIVATE_ROOM: TYPE OF OBJECT */}
          {subCategory === 'private_room' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-500 tracking-wider block">🏘️ {tr('filters.section.objectType')}</span>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { value: 'Villa', label: 'Вилла', icon: '🏘️' },
                  { value: 'House', label: 'Дом', icon: '🏡' },
                  { value: 'Guesthouse', label: 'Guesthouse', icon: '🌴' },
                  { value: 'homestay', label: 'homestay', icon: '🏠' },
                  { value: 'Hotel', label: 'Hotel', icon: '🏨' },
                  { value: 'Bungalow', label: 'Bungalow', icon: '🛖' }
                ].map(t => {
                  const isActive = localFilters.housingType.includes(t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleArrayFilter('housingType', t.value)}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer relative h-[105px] ${
                        isActive
                          ? 'bg-[#FF7A50]/10 border-[#FF7A50] text-[#FF7A50] font-bold shadow-sm scale-102 font-sans'
                          : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50] hover:bg-white'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                      )}
                      <span className="text-3xl leading-none">{t.icon}</span>
                      <span className={`text-xs font-semibold leading-tight mt-1 transition-colors ${isActive ? 'text-[#FF7A50]' : 'text-[#1E293B]'}`}>{translateOption(t)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Тип объекта или Плотность комплекса */}
          {(subCategory === 'private_suite' || subCategory === 'private_room') ? (
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-500 tracking-wider block">🍀 {tr('filters.section.density')}</span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'cozy', label: 'Уютный', icon: '🍃' },
                  { value: 'medium', label: 'Средний', icon: '🍀' },
                  { value: 'large', label: 'Большой', icon: '🌿' }
                ].map(density => {
                  const isActive = localFilters.densityType.includes(density.value);
                  return (
                    <button
                      key={density.value}
                      type="button"
                      onClick={() => toggleArrayFilter('densityType', density.value)}
                      className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer select-none relative overflow-hidden h-[105px] ${
                        isActive
                          ? 'bg-[#FF7A50]/15 border-[#FF7A50] text-[#FF7A50] font-bold shadow-xs scale-102'
                          : 'bg-white border-[#E5E7EB] text-gray-600 hover:border-[#FF7A50] hover:bg-white'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                      )}
                      <span className="text-3xl leading-none">{density.icon}</span>
                      <span className={`text-xs font-semibold leading-tight mt-1 transition-colors ${isActive ? 'text-[#FF7A50]' : 'text-[#1E293B]'}`}>{translateOption(density)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-500 tracking-wider block">🏘️ {tr('filters.section.objectType')}</span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'Villa', label: 'Вилла', icon: '🏘️' },
                  { value: 'House', label: 'Дом', icon: '🏡' },
                  { value: 'Bungalow', label: 'Бунгало', icon: '🛖' }
                ].map(t => {
                  const isActive = localFilters.housingType.includes(t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleArrayFilter('housingType', t.value)}
                      className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer relative h-[105px] ${
                        isActive
                          ? 'bg-[#FF7A50]/10 border-[#FF7A50] text-[#FF7A50] font-bold shadow-sm scale-102'
                          : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50] hover:bg-white'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                      )}
                      <span className="text-4xl leading-none">{t.icon}</span>
                      <span className={`text-xs font-semibold leading-tight mt-1 transition-colors ${isActive ? 'text-[#FF7A50]' : 'text-[#1E293B]'}`}>{translateOption(t)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Территория */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-500 tracking-wider block">🏡 {tr('filters.section.territory')}</span>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { value: 'private', label: 'Приватная', icon: '🔒' },
                { value: 'shared', label: 'Общая', icon: '👥' },
                { value: 'resort', label: 'Резорт', icon: '✨' }
              ].map(t => {
                const isActive = localFilters.territoryType.includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleArrayFilter('territoryType', t.value)}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer h-[105px] relative ${
                      isActive
                        ? 'bg-[#FF7A50]/10 border-[#FF7A50] text-[#FF7A50] font-bold shadow-sm'
                        : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                    )}
                    <span className="text-3xl leading-none">{t.icon}</span>
                    <span className={`text-xs font-semibold leading-tight mt-1 transition-colors ${isActive ? 'text-[#FF7A50]' : 'text-[#1E293B]'}`}>{translateOption(t)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8. Кровать */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-500 tracking-wider block">🛌 {tr('filters.section.beds')}</span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'queen_size', label: 'Queen size', icon: '🛏️' },
                { value: 'king_size', label: 'King size', icon: '👑' },
                ...(subCategory === 'private_room' ? [] : [
                  { value: 'single_1', label: '1 односпальная', icon: '🧸' },
                  { value: 'single_2', label: '2 односпальные', icon: '🛌' }
                ])
              ].map(bed => {
                const isActive = localFilters.bedType.includes(bed.value);
                return (
                  <button
                    key={bed.value}
                    type="button"
                    onClick={() => toggleArrayFilter('bedType', bed.value)}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer h-[105px] relative ${
                      isActive
                        ? 'bg-[#FF7A50]/15 border-[#FF7A50] text-[#FF7A50] font-bold shadow-sm scale-102'
                        : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                    )}
                    <span className="text-3xl leading-none my-0.5">{bed.icon}</span>
                    <span className={`text-xs font-semibold leading-tight mt-1 transition-colors ${isActive ? 'text-[#FF7A50]' : 'text-[#1E293B]'}`}>{translateOption(bed)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 9. Кухня */}
          <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 tracking-wider block">🍳 {tr('filters.section.kitchen')}</span>
              <span className="text-xs font-semibold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-full">
                {localFilters.kitchenType.includes('equipped') ? tr('details.option.kitchenType.equipped') :
                 localFilters.kitchenType.includes('basic') ? tr('details.option.kitchenType.basic') : tr('filters.kitchen.any')}
              </span>
            </div>

            <div className="pt-2 relative">
              <Polzunok
                min={0}
                max={2}
                step={1}
                value={
                  localFilters.kitchenType.includes('equipped') ? 2 :
                  localFilters.kitchenType.includes('basic') ? 1 : 0
                }
                onChange={v => {
                  if (v === 2) {
                    setLocalFilters({ ...localFilters, kitchenType: ['equipped'] });
                  } else if (v === 1) {
                    setLocalFilters({ ...localFilters, kitchenType: ['basic'] });
                  } else {
                    setLocalFilters({ ...localFilters, kitchenType: [] });
                  }
                }}
              />
              <div className="flex justify-between text-[10.5px] text-[#1E293B] font-semibold mt-1.5 px-0.5">
                <span>{tr('filters.kitchen.any')}</span>
                <span>{tr('filters.kitchen.basic')}</span>
                <span className="relative inline-flex items-center gap-1">
                  <span>{tr('filters.kitchen.equipped')}</span>
                  <button
                    type="button"
                    onMouseEnter={() => setShowKitchenTooltip(true)}
                    onMouseLeave={() => setShowKitchenTooltip(false)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowKitchenTooltip(!showKitchenTooltip);
                    }}
                    className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1E293B]/10 hover:bg-[#FF7A50]/20 text-[#1E293B] hover:text-[#FF7A50] text-[9.5px] font-extrabold cursor-pointer transition-colors"
                  >
                    i
                  </button>
                  {showKitchenTooltip && (
                    <span className="absolute bottom-full mb-2 right-0 w-[208px] p-2.5 bg-slate-900 text-white text-[10px] font-medium leading-normal rounded-xl shadow-xl z-50 text-left block">
                      {tr('filters.kitchen.equippedTooltip')}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 10. Бассейн */}
          <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 tracking-wider block">💦 {tr('filters.section.pool')}</span>
              <span className="text-xs font-semibold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-full">
                {localFilters.poolType.includes('private') && localFilters.poolType.includes('infinity') ? tr('details.option.poolType.infinity') :
                 localFilters.poolType.includes('shared') && localFilters.poolType.includes('infinity') ? tr('details.option.poolType.infinity') :
                 localFilters.poolType.includes('private') ? tr('details.option.poolType.private') :
                 localFilters.poolType.includes('shared') ? tr('details.option.poolType.shared') : tr('filters.pool.any')}
              </span>
            </div>

            <div className="pt-2 relative">
              <Polzunok
                min={0}
                max={2}
                step={1}
                value={
                  localFilters.poolType.includes('private') ? 2 :
                  localFilters.poolType.includes('shared') ? 1 : 0
                }
                onChange={v => {
                  const hasInfinity = localFilters.poolType.includes('infinity');
                  if (v === 2) {
                    setLocalFilters({ 
                      ...localFilters, 
                      poolType: hasInfinity ? ['private', 'infinity'] : ['private'] 
                    });
                  } else if (v === 1) {
                    setLocalFilters({ 
                      ...localFilters, 
                      poolType: hasInfinity ? ['shared', 'infinity'] : ['shared'] 
                    });
                  } else {
                    setLocalFilters({ 
                      ...localFilters, 
                      poolType: [] 
                    });
                  }
                }}
              />
              <div className="flex justify-between text-[10.5px] text-[#1E293B] font-semibold mt-1.5 px-0.5">
                <span>{tr('filters.pool.any')}</span>
                <span>{tr('details.option.poolType.shared')}</span>
                <span>{tr('details.option.poolType.private')}</span>
              </div>
            </div>

            {/* Infinity check option */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const hasInfinity = localFilters.poolType.includes('infinity');
                  let nextPoolTypes = [...localFilters.poolType];
                  if (hasInfinity) {
                    nextPoolTypes = nextPoolTypes.filter(x => x !== 'infinity');
                  } else {
                    if (!nextPoolTypes.includes('infinity')) {
                      nextPoolTypes.push('infinity');
                    }
                    if (!nextPoolTypes.includes('shared') && !nextPoolTypes.includes('private')) {
                      nextPoolTypes.push('shared');
                    }
                  }
                  setLocalFilters({ ...localFilters, poolType: nextPoolTypes });
                }}
                className={`p-3 rounded-2xl border w-full flex items-center justify-between transition cursor-pointer select-none ${
                  localFilters.poolType.includes('infinity')
                    ? 'bg-[#FF7A50]/15 border-[#FF7A50] text-[#FF7A50] font-bold'
                    : 'bg-gray-50/50 border-[#E5E7EB] text-gray-655 hover:bg-white hover:border-[#FF7A50]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🌅</span>
                  <span className="text-xs font-semibold text-[#1E293B]">{tr('filters.pool.infinity')}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  localFilters.poolType.includes('infinity')
                    ? 'border-[#FF7A50] bg-[#FF7A50] text-white'
                    : 'border-[#E5E7EB] bg-white'
                }`}>
                  {localFilters.poolType.includes('infinity') && <span className="text-[10px] font-bold">✓</span>}
                </div>
              </button>
            </div>
          </div>

          {/* 11. Вид */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-500 tracking-wider block">🌅 {tr('filters.section.view')}</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { value: 'rice_fields', label: 'Рис. поля', icon: '🌾' },
                { value: 'garden', label: 'Сад', icon: '🌴' },
                { value: 'pool', label: 'Бассейн', icon: '💦' },
                { value: 'ocean', label: 'Океан', icon: '🌊' },
                { value: 'jungle', label: 'Джунгли', icon: '🌿' }
              ].map(v => {
                const isActive = localFilters.viewType.includes(v.value);
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => toggleArrayFilter('viewType', v.value)}
                    className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer select-none h-[95px] relative ${
                      isActive
                        ? 'bg-[#FF7A50]/15 border-[#FF7A50] text-[#FF7A50] font-bold shadow-sm'
                        : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[7px] font-extrabold z-10 animate-scale-up">✓</span>
                    )}
                    <span className="text-2xl leading-none">{v.icon}</span>
                    <span className={`text-xs font-semibold leading-tight mt-1 transition-colors ${isActive ? 'text-[#FF7A50]' : 'text-[#1E293B]'}`}>{translateOption(v)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 12. Скорость интернета (WiFi) */}
          <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 tracking-wider block">⚡ {tr('filters.section.internet')}</span>
              <span className="text-xs font-semibold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-full">
                {localFilters.internetSpeedMin === 0 ? tr('filters.internet.any') : tr('details.mbps', { count: `${localFilters.internetSpeedMin}+` })}
              </span>
            </div>

            <div className="pt-2 relative">
              <Polzunok
                min={0}
                max={3}
                step={1}
                value={
                  localFilters.internetSpeedMin === 200 ? 3 :
                  localFilters.internetSpeedMin === 100 ? 2 :
                  localFilters.internetSpeedMin === 50 ? 1 : 0
                }
                onChange={idx => {
                  const speedMap = [0, 50, 100, 200];
                  setLocalFilters({ ...localFilters, internetSpeedMin: speedMap[idx] });
                }}
              />
              <div className="flex justify-between text-[10.5px] text-[#1E293B] font-semibold mt-1.5 px-0.5">
                <span>{tr('filters.internet.any')}</span>
                <span>{tr('details.mbps', { count: 50 })}</span>
                <span>{tr('details.mbps', { count: 100 })}</span>
                <span>{tr('details.mbps', { count: '200+' })}</span>
              </div>
            </div>
          </div>

          {/* 13. Ванная комната */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-500 tracking-wider block">🚿 {tr('filters.section.bathroom')}</span>
            
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { value: 'hot_water', label: 'Горячая вода', icon: '🔥' },
                { value: 'tropical_shower', label: 'Тропический душ', icon: '🌴' },
                { value: 'double_sink', label: 'Две раковины', icon: '🚰' },
                { value: 'bathtub', label: 'Ванна', icon: '🛁' },
                { value: 'garden_view', label: 'Вид на сад', icon: '🪴' },
                { value: 'sauna_hammam', label: 'сауна / хаммам', icon: '🧖' }
              ].map(opt => {
                const isActive = localFilters.bathroomOptions.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleArrayFilter('bathroomOptions', opt.value)}
                    className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer select-none relative min-h-[105px] ${
                      isActive
                        ? 'bg-[#FF7A50]/10 border-[#FF7A50] text-[#FF7A50] font-bold shadow-xs scale-102'
                        : 'bg-white border-[#E5E7EB] text-gray-500 hover:border-[#FF7A50]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                    )}
                    <span className="text-3xl shrink-0">{opt.icon}</span>
                    <span className={`text-xs font-semibold leading-tight mt-1 transition-colors ${isActive ? 'text-[#FF7A50]' : 'text-[#1E293B]'}`}>{translateOption(opt)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Удобства и Комфорт */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-500 tracking-wider block">🛋️ {tr('filters.section.amenities')}</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { value: 'cold_AC', label: 'Холодный кондиционер', icon: '🥶', type: 'amenity' },
                { value: 'hair_dryer', label: 'Фен', icon: '💨', type: 'amenity' },
                { value: 'washing_machine', label: 'Стиральная машина', icon: '👕', type: 'amenity' },
                { value: 'smart_tv', label: 'Smart TV', icon: '📺', type: 'amenity' },
                { value: 'workspace', label: 'Рабочее пространство', icon: '💻', type: 'amenity' },
                { value: 'yoga', label: 'Зона йоги', icon: '🧘', type: 'amenity' },
                ...roomOnlyAmenityOptions,
                { value: 'Без плесени и запаха', label: 'Без плесени и запаха', icon: '🧼', type: 'cleanliness' },
                { value: 'Идеальная сантехника', label: 'Исправная сантехника', icon: '🚿', type: 'cleanliness' },
                { value: 'parking', label: 'Парковка для машин', icon: '🚗', type: 'amenity' }
              ].map(item => {
                const isActive = item.type === 'cleanliness'
                  ? localFilters.cleanlinessTags.includes(item.value)
                  : localFilters.amenities.includes(item.value);
                
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      if (item.type === 'cleanliness') {
                        toggleArrayFilter('cleanlinessTags', item.value);
                      } else {
                        toggleArrayFilter('amenities', item.value);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer select-none relative min-h-[90px] ${
                      isActive
                        ? 'bg-[#FF7A50]/15 border-[#FF7A50] text-[#FF7A50] font-bold shadow-sm scale-102'
                        : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                    )}
                    <span className="text-2xl leading-none">{item.icon}</span>
                    <span className={`text-xs font-semibold leading-tight mt-1 transition-colors ${isActive ? 'text-[#FF7A50]' : 'text-[#1E293B]'}`}>{translateOption(item)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 15. Уборка */}
          <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 tracking-wider block">🧹 {tr('filters.section.cleaning')}</span>
              <span className="text-xs font-semibold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-full">
                {localFilters.cleaningFrequency.includes('daily') ? tr('details.option.cleaningFrequency.daily') :
                 localFilters.cleaningFrequency.includes('3_times_week') ? tr('details.option.cleaningFrequency.3_times_week') :
                 localFilters.cleaningFrequency.includes('once_week') ? tr('details.option.cleaningFrequency.once_week') : tr('filters.cleaning.none')}
              </span>
            </div>

            <div className="pt-2 relative">
              <Polzunok
                min={0}
                max={3}
                step={1}
                value={
                  localFilters.cleaningFrequency.includes('daily') ? 3 :
                  localFilters.cleaningFrequency.includes('3_times_week') ? 2 :
                  localFilters.cleaningFrequency.includes('once_week') ? 1 : 0
                }
                onChange={idx => {
                  const freqMap = ['none', 'once_week', '3_times_week', 'daily'];
                  setLocalFilters({ ...localFilters, cleaningFrequency: [freqMap[idx]] });
                }}
              />
              <div className="flex justify-between text-[10.5px] text-[#1E293B] font-semibold mt-1.5 px-0.5">
                <span>{tr('filters.cleaning.none')}</span>
                <span>{tr('filters.cleaning.onceShort')}</span>
                <span>{tr('filters.cleaning.threeShort')}</span>
                <span>{tr('details.option.cleaningFrequency.daily')}</span>
              </div>
            </div>
          </div>

          {/* Особые преференции */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-500 tracking-wider block font-sans">🐾 {tr('filters.section.extraOptions')}</span>
            <div className="flex flex-row overflow-x-auto gap-2.5 pb-2 scrollbar-thin">
              {[
                { value: 'pets_allowed', label: 'С питомцами', icon: '🐾' },
                { value: 'quiet_location', label: 'Тишина', icon: '🔕' },
                { value: 'all_bills_included', label: 'Bills включены', icon: '⚡' },
                { value: 'transfer_included', label: 'Трансфер включен', icon: '✈️' },
                { value: 'airport_transfer', label: 'Трансфер за доп плату', icon: '🚕' },
                { value: 'breakfast_included', label: 'Завтрак включен', icon: '☕' },
                { value: 'breakfast_paid', label: 'Завтрак за доп плату', icon: '🥐' },
                { value: 'chef', label: 'Личный шеф', icon: '👨‍🍳' }
              ].map(opt => {
                const isActive = localFilters.extraOptions.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleArrayFilter('extraOptions', opt.value)}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer select-none relative overflow-hidden shrink-0 w-[110px] h-[105px] ${
                      isActive
                        ? 'bg-[#FF7A50]/15 border-[#FF7A50] text-[#FF7A50] font-bold scale-102 shadow-sm'
                        : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                    )}
                    <span className="text-3xl leading-none">{opt.icon}</span>
                    <span className={`text-xs font-semibold leading-tight mt-1 transition-colors ${isActive ? 'text-[#FF7A50]' : 'text-[#1E293B]'}`}>{translateOption(opt)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM STICKY ACTION FOOTER */}
        <div className="p-5 bg-white border-t border-[#F4F7F6] flex items-center gap-3 relative z-10 shadow-[0_-10px_35px_-10px_rgba(0,0,0,0.04)]">
          <button
            onClick={handleReset}
            className="px-5 py-3.5 rounded-2xl border border-[#E5E7EB] text-[#1E293B] text-xs font-bold hover:bg-gray-50 hover:text-rose-600 active:scale-95 transition cursor-pointer shrink-0"
            id="reset-filter"
          >
            {tr('common.reset')}
          </button>
          
          <button
            onClick={handleApply}
            className="flex-1 py-3.5 bg-[#FF7A50] hover:bg-[#E05A30] text-white rounded-2xl text-xs font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            id="apply-filter"
          >
            <span>{tr('filters.showAll', { count: matchingCount })}</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
