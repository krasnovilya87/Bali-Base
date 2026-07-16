import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { Listing } from '../types';
import { isListingFresh } from '../utils/listingFreshness';
import {
  PHOTO_SLOT_CONFIG,
  REQUIRED_PHOTO_SLOTS,
  ROOM_TYPE_LABELS,
  stripRoomTypeFromTitle
} from './create-wizard/constants';
import WizardStepContent from './create-wizard/WizardStepContent';
import { useCategorySteps } from './create-wizard/steps/useCategorySteps';
import { useLocationStep } from './create-wizard/steps/useLocationStep';
import { usePhotoStep } from './create-wizard/steps/usePhotoStep';
import { useTitleStep } from './create-wizard/steps/useTitleStep';
import { calculateNearbySpotsOnce } from '../utils/nearbyPlaces';
import { applyGoogleReviewsCacheToListing, requestListingCreateGoogleReviewsRefresh } from '../utils/googlePlacesReviewsClient';
import { useI18n } from '../i18nContext';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface CreateWizardProps {
  onClose: () => void;
  onPublish: (newListing: Listing) => Promise<void>;
  initialListing?: Listing | null;
  currencySymbol: string;
  currencyRate: number;
  propCategoriesList?: Array<{ id: string; label: string; icon: string; desc: string; image?: any; l2?: string }>;
  propSubcategoriesMap?: Record<string, Array<{ id: string; label: string; icon: string }>>;
  menuOverrides?: any;
}

const stepLabelKeys = [
  'wizard.step.category',
  'wizard.step.subcategory',
  'wizard.step.description',
  'wizard.step.address',
  'wizard.step.photos',
  'wizard.step.parameters',
  'wizard.step.price',
  'wizard.step.ical',
  'wizard.step.contacts',
  'wizard.step.publish'
];

export default function CreateWizard({
  onClose,
  onPublish,
  currencySymbol,
  currencyRate,
  propCategoriesList,
  propSubcategoriesMap,
  menuOverrides,
  initialListing
}: CreateWizardProps) {
  const { tr } = useI18n();
  const stepLabels = stepLabelKeys.map(key => tr(key));
  const [step, setStep] = useState<number>(1);
  const wizardBodyRef = useRef<HTMLDivElement | null>(null);
  const wizardOverlayRef = useRef<HTMLDivElement | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [confirmedLocationCoords, setConfirmedLocationCoords] = useState<Listing['locationCoords']>(
    initialListing?.locationCoords
  );

  const {
    category,
    subCategory,
    setSubCategory,
    categoriesList,
    subcategories,
    handleSelectCategory
  } = useCategorySteps({
    initialListing,
    propCategoriesList,
    propSubcategoriesMap,
    menuOverrides
  });

  const {
    title,
    setTitle,
    description,
    setDescription,
    roomType,
    setRoomType,
    getSeoLengthVerdict
  } = useTitleStep({ initialListing });

  const {
    district,
    setDistrict,
    address,
    setAddress,
    pickedCoords,
    setPickedCoords,
    isMapExpanded,
    setIsMapExpanded,
    iframeZoom,
    setIframeZoom,
    mapSuggestions,
    isSearchingMap,
    showSuggestionsDropdown,
    setShowSuggestionsDropdown,
    selectedGooglePlaceId,
    handleAddressChange,
    handleInputKeyDown,
    triggerDirectSearch,
    handleSelectSuggestion
  } = useLocationStep({ initialListing, step, title, apiKey: API_KEY, hasValidKey });

  const {
    photoUrls,
    photoSlotAssignments,
    draggedPhotoSlotId,
    setDraggedPhotoSlotId,
    getAssignedPhotoUrls,
    getRemainingPhotoCount,
    assignPhotoToSlot,
    getPhotoSlot,
    isUploading,
    uploadError,
    dragActive,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileChoose,
    handleRemovePhoto
  } = usePhotoStep({ initialListing });

  const [housingType, setHousingType] = useState<string>(initialListing?.housingType || 'Privet Villa (must pool)');
  const [territoryType, setTerritoryType] = useState<'private' | 'shared' | 'resort'>(initialListing?.territoryType || 'private');
  const [interiorStyle, setInteriorStyle] = useState<'basic' | 'bali_style' | 'modern' | 'luxury'>(initialListing?.interiorStyle || 'basic');
  const [poolType, setPoolType] = useState<'none' | 'shared' | 'private' | 'infinity'>(initialListing?.poolType || 'none');
  const [kitchenType, setKitchenType] = useState<NonNullable<Listing['kitchenType']>>(initialListing?.kitchenType || 'none');
  const [bathroomType] = useState<'standard' | 'modern' | 'designer'>(initialListing?.bathroomType || 'standard');
  const [bathroomOptions, setBathroomOptions] = useState<string[]>(initialListing?.bathroomOptions || []);
  const [amenities, setAmenities] = useState<string[]>(initialListing?.amenities || []);
  const [extraOptions, setExtraOptions] = useState<string[]>(initialListing?.extraOptions || []);
  const [roomsTotal, setRoomsTotal] = useState<number>(initialListing?.roomsTotal || 1);
  const [area, setArea] = useState<number>(initialListing?.area || 5);
  const [selectedBedTypes, setSelectedBedTypes] = useState<string[]>(initialListing?.bedTypes || (initialListing?.bedType ? [initialListing.bedType] : []));
  const [selectedViews, setSelectedViews] = useState<string[]>(initialListing?.viewType ? [initialListing.viewType] : []);
  const [internetSpeed, setInternetSpeed] = useState<number>(initialListing?.internetSpeed || 0);
  const [cleaningFrequency, setCleaningFrequency] = useState<'none' | '3_times_week' | 'once_week' | 'daily'>(initialListing?.cleaningFrequency || 'none');
  const [cleanlinessTags, setCleanlinessTags] = useState<string[]>([]);
  const [densityType, setDensityType] = useState<'cozy' | 'medium' | 'large'>(initialListing?.densityType || 'cozy');
  const [showKitchenTooltip, setShowKitchenTooltip] = useState<boolean>(false);

  const currentYear = new Date().getFullYear();
  const recentYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const [yearBuilt, setYearBuilt] = useState<string>(String(initialListing?.yearBuilt || currentYear));

  const [pricePerDay, setPricePerDay] = useState<number>(initialListing?.pricePerDay || 450000);
  const [pricePerMonth, setPricePerMonth] = useState<number>(initialListing?.pricePerMonth || 11000000);
  const [competitorPrice, setCompetitorPrice] = useState<number>(initialListing?.bookingComPrice || 0);
  const [competitorUrl, setCompetitorUrl] = useState<string>(initialListing?.competitorUrl || '');
  const [competitorPlatform, setCompetitorPlatform] = useState<string>(initialListing?.competitorPlatform || 'Only Facebook');
  const [airbnbWeeklyDiscount, setAirbnbWeeklyDiscount] = useState<number>(0);
  const [airbnbMonthlyDiscount, setAirbnbMonthlyDiscount] = useState<number>(0);
  const [selectedDiscountPercent, setSelectedDiscountPercent] = useState<number>(() => {
    if (!initialListing?.hasDropPrice || !initialListing.dropPricePerDay || !initialListing.pricePerDay) return 0;
    return Math.max(0, Math.round((1 - initialListing.dropPricePerDay / initialListing.pricePerDay) * 100));
  });
  const [interactiveDays, setInteractiveDays] = useState<number>(30);

  const [icalInput, setIcalInput] = useState<string>('');
  const [icalStatus, setIcalStatus] = useState<string>('');
  const [simulatedBlockedCount, setSimulatedBlockedCount] = useState<number>(initialListing?.blockedDates?.length || 0);
  const [whatsappNumber, setWhatsappNumber] = useState<string>(initialListing?.whatsappNumber || '');
  const [whatsappInput, setWhatsappInput] = useState<string>(initialListing?.whatsappNumber || '');
  const [ownerName, setOwnerName] = useState<string>(initialListing?.ownerName || '');

  useEffect(() => {
    const maxBeds = subCategory === 'private_room' ? 1 : Math.max(1, roomsTotal);
    if (selectedBedTypes.length > maxBeds) {
      setSelectedBedTypes(current => current.slice(0, maxBeds));
    }
  }, [roomsTotal, selectedBedTypes.length, subCategory]);

  useEffect(() => {
    if (category !== 'housing' || initialListing) return;
    if (subCategory === 'private_suite') {
      setHousingType('Apartment Complex (privet unit)');
    } else if (subCategory === 'private_room') {
      setHousingType('Guesthouse (privet room, shared property)');
    } else {
      setHousingType('Privet Villa (must pool)');
    }
  }, [category, initialListing, subCategory]);

  useEffect(() => {
    wizardBodyRef.current?.scrollTo({ top: 0, left: 0 });
    wizardOverlayRef.current?.scrollTo({ top: 0, left: 0 });
  }, [step]);

  const toggleBathroomOption = (value: string) => {
    setBathroomOptions(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };

  const toggleCleanlinessTag = (value: string) => {
    setCleanlinessTags(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };

  const toggleAmenity = (value: string) => {
    setAmenities(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };

  const toggleExtraOption = (value: string) => {
    setExtraOptions(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };

  const toggleViewType = (value: string) => {
    setSelectedViews(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };

  const handlePhoneChange = (value: string, e164Number?: string) => {
    setWhatsappInput(value);
    setWhatsappNumber(e164Number || '');
  };

  const testIcalSync = () => {
    if (!icalInput.trim()) {
      setIcalStatus(tr('wizard.icalMissing'));
      setSimulatedBlockedCount(0);
      return;
    }
    setSimulatedBlockedCount(3);
    setIcalStatus(tr('wizard.icalAccepted'));
  };

  const canProceed = () => {
    if (step === 3 && !title.trim()) return false;
    if (step === 4 && (!address.trim() || !pickedCoords)) return false;
    if (step === 5 && REQUIRED_PHOTO_SLOTS.some(slot => getAssignedPhotoUrls(slot.id).length < 1)) return false;
    if (step === 6 && category === 'housing' && !yearBuilt) return false;
    return true;
  };

  const handleNextStep = async () => {
    if (!canProceed()) {
      if (step === 3) alert(tr('wizard.validationTitle'));
      if (step === 4) alert(tr('wizard.validationAddress'));
      if (step === 5) alert(tr('wizard.validationPhotos'));
      if (step === 6) alert(tr('wizard.validationYear'));
      return;
    }
    if (step === 4) {
      const finalCoords = pickedCoords;

      if (!finalCoords) {
        alert(tr('wizard.validationMapPoint'));
        return;
      }

      setPickedCoords(finalCoords);
      setConfirmedLocationCoords(finalCoords);
    }
    setStep(prev => Math.min(10, prev + 1));
  };

  const rawYear: Listing['yearBuilt'] = yearBuilt === 'other'
    ? 'other'
    : (yearBuilt ? Number(yearBuilt) : currentYear);
  const coordsMatch = (
    a?: { lat: number; lng: number } | null,
    b?: { lat: number; lng: number } | null
  ) => Boolean(
    a &&
    b &&
    Math.abs(a.lat - b.lat) < 0.00001 &&
    Math.abs(a.lng - b.lng) < 0.00001
  );

  const buildListing = (id: string): Listing => {
    const dropPricePerDay = selectedDiscountPercent > 0
      ? Math.round(pricePerDay * (1 - selectedDiscountPercent / 100))
      : undefined;
    const dropPricePerMonth = selectedDiscountPercent > 0
      ? Math.round(pricePerMonth * (1 - selectedDiscountPercent / 100))
      : undefined;
    const baseTitle = stripRoomTypeFromTitle(title || 'Новое бунгало на побережье');
    const listingTitle = category === 'housing' && subCategory === 'private_room'
      ? `${baseTitle} · ${ROOM_TYPE_LABELS[roomType]}`
      : baseTitle;
    const cleanListingTitle = stripRoomTypeFromTitle(listingTitle);
    const assignedPhotoUrls = PHOTO_SLOT_CONFIG
      .flatMap(slot => photoSlotAssignments[slot.id] || [])
      .filter(url => photoUrls.includes(url));
    const orderedPhotoUrls = [
      ...assignedPhotoUrls,
      ...photoUrls.filter(url => !assignedPhotoUrls.includes(url))
    ];
    const locationCoords = confirmedLocationCoords || pickedCoords || initialListing?.locationCoords;
    const canKeepNearbySpots = coordsMatch(initialListing?.locationCoords, locationCoords);

    return {
      id,
      ownerId: initialListing?.ownerId || 'owner-personal',
      category: category as Listing['category'],
      subCategory,
      title: cleanListingTitle,
      description: description || 'Стильный объект в центральном районе, ждет своих гостей.',
      district,
      address: address || district,
      locationCoords,
      googlePlaceId: selectedGooglePlaceId || initialListing?.googlePlaceId || initialListing?.placeId,
      images: orderedPhotoUrls,
      rating: initialListing?.rating || 4.9,
      reviewsCount: initialListing?.reviewsCount || 0,
      reviews: initialListing?.reviews || [],
      isApproved: initialListing?.isApproved ?? false,
      isNew: isListingFresh({ yearBuilt: rawYear, yearRenovated: initialListing?.yearRenovated }),
      status: initialListing?.status || 'moderation',
      pricePerDay,
      pricePerMonth,
      bookingComPrice: competitorPlatform !== 'Only Facebook' ? competitorPrice || undefined : undefined,
      competitorPlatform: competitorPlatform !== 'Only Facebook' ? competitorPlatform as Listing['competitorPlatform'] : undefined,
      competitorUrl: competitorUrl || undefined,
      hasDropPrice: selectedDiscountPercent > 0,
      dropPricePerDay,
      dropPricePerMonth,
      roomsTotal: subCategory === 'private_room' ? 1 : roomsTotal,
      bedroomsCount: subCategory === 'private_room' ? 1 : roomsTotal,
      wallMaterial: initialListing?.wallMaterial || 'concrete',
      territoryType: subCategory === 'private_room' ? undefined : territoryType,
      densityType,
      bedType: selectedBedTypes[0],
      bedTypes: selectedBedTypes,
      roomType: subCategory === 'private_room' ? roomType : undefined,
      kitchenType,
      poolType,
      internetSpeed,
      bathroomType,
      bathroomOptions,
      amenities: [...amenities, ...cleanlinessTags],
      cleaningFrequency,
      viewType: selectedViews[0] as Listing['viewType'],
      extraOptions,
      yearBuilt: rawYear,
      interiorStyle,
      housingType,
      area: subCategory === 'private_room' ? undefined : area,
      distanceToSeaMinutes: initialListing?.distanceToSeaMinutes || 8,
      whatsappNumber,
      ownerName,
      ownerAvatar: initialListing?.ownerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80',
      clicksCount: initialListing?.clicksCount || 0,
      viewsCount: initialListing?.viewsCount || 0,
      blockedDates: initialListing?.blockedDates || (simulatedBlockedCount > 0 ? ['2026-06-12', '2026-06-13', '2026-06-14'] : []),
      createdAt: initialListing?.createdAt || new Date().toISOString(),
      nearbySpots: canKeepNearbySpots ? initialListing?.nearbySpots : undefined,
      nearbySpotsUpdatedAt: canKeepNearbySpots ? initialListing?.nearbySpotsUpdatedAt : undefined,
      nearbySpotsStatus: canKeepNearbySpots ? initialListing?.nearbySpotsStatus : undefined,
      nearbySpotsError: canKeepNearbySpots ? initialListing?.nearbySpotsError : undefined
    };
  };

  const handlePublishListing = async () => {
    if (isPublishing) return;
    setIsPublishing(true);

    const baseListing = buildListing(initialListing?.id || `house-${Date.now()}`);
    const publishCoords = confirmedLocationCoords || pickedCoords || baseListing.locationCoords;
    let listingForPublish: Listing = {
      ...baseListing,
      locationCoords: publishCoords,
      nearbySpots: undefined,
      nearbySpotsUpdatedAt: undefined,
      nearbySpotsStatus: publishCoords ? 'pending' : 'empty',
      nearbySpotsError: publishCoords ? undefined : 'Coordinates are missing'
    };

    if (publishCoords) {
      try {
        const nearbySpots = await calculateNearbySpotsOnce(publishCoords, baseListing.district);
        listingForPublish = {
          ...baseListing,
          locationCoords: publishCoords,
          nearbySpots: nearbySpots.length ? nearbySpots : baseListing.nearbySpots,
          nearbySpotsUpdatedAt: nearbySpots.length ? new Date().toISOString() : baseListing.nearbySpotsUpdatedAt,
          nearbySpotsStatus: nearbySpots.length ? 'ready' : 'empty',
          nearbySpotsError: nearbySpots.length ? undefined : 'Google Places returned no nearby spots'
        };
      } catch (error) {
        console.warn('Nearby spots calculation failed:', error);
        listingForPublish = {
          ...baseListing,
          locationCoords: publishCoords,
          nearbySpotsStatus: 'error',
          nearbySpotsError: error instanceof Error ? error.message : String(error)
        };
      }
    }

    try {
      const reviewsResponse = await requestListingCreateGoogleReviewsRefresh({
        listingId: listingForPublish.id,
        placeId: listingForPublish.googlePlaceId || listingForPublish.placeId,
        googleReviewsUpdatedAt: initialListing?.googleReviewsUpdatedAt
      });
      await onPublish(applyGoogleReviewsCacheToListing(listingForPublish, reviewsResponse));
      onClose();
    } catch (error) {
      console.error('Failed to publish listing:', error);
      alert('Не удалось сохранить объявление в Firebase. Проверьте подключение и попробуйте еще раз.');
    } finally {
      setIsPublishing(false);
    }
  };

  const wizardStepContentProps = {
    step,
    categoryState: {
      categoriesList,
      category,
      handleSelectCategory,
      setStep,
      subcategories,
      subCategory,
      setSubCategory,
      title,
      setTitle,
      description,
      setDescription,
      getSeoLengthVerdict,
      roomType,
      setRoomType
    },
    locationState: {
      apiKey: API_KEY,
      hasValidKey,
      isMapExpanded,
      setIsMapExpanded,
      pickedCoords,
      setPickedCoords,
      address,
      setAddress,
      district,
      setDistrict,
      iframeZoom,
      setIframeZoom,
      handleAddressChange,
      handleInputKeyDown,
      triggerDirectSearch,
      mapSuggestions,
      showSuggestionsDropdown,
      setShowSuggestionsDropdown,
      isSearchingMap,
      handleSelectSuggestion
    },
    photoState: {
      dragActive,
      handleDrag,
      handleDrop,
      fileInputRef,
      handleFileChoose,
      isUploading,
      uploadError,
      photoUrls,
      getRemainingPhotoCount,
      setDraggedPhotoSlotId,
      draggedPhotoSlotId,
      getPhotoSlot,
      assignPhotoToSlot,
      handleRemovePhoto
    },
    featureState: {
      category,
      subCategory,
      yearBuilt,
      recentYears,
      setYearBuilt,
      area,
      setArea,
      roomsTotal,
      setRoomsTotal,
      interiorStyle,
      setInteriorStyle,
      housingType,
      setHousingType,
      densityType,
      setDensityType,
      territoryType,
      setTerritoryType,
      selectedBedTypes,
      setSelectedBedTypes,
      kitchenType,
      setKitchenType,
      showKitchenTooltip,
      setShowKitchenTooltip,
      poolType,
      setPoolType,
      selectedViews,
      toggleViewType,
      internetSpeed,
      setInternetSpeed,
      bathroomOptions,
      toggleBathroomOption,
      cleanlinessTags,
      amenities,
      toggleCleanlinessTag,
      toggleAmenity,
      cleaningFrequency,
      setCleaningFrequency,
      extraOptions,
      toggleExtraOption
    },
    pricingState: {
      pricePerDay,
      setPricePerDay,
      pricePerMonth,
      setPricePerMonth,
      competitorPlatform,
      setCompetitorPlatform,
      competitorPrice,
      setCompetitorPrice,
      competitorUrl,
      setCompetitorUrl,
      airbnbWeeklyDiscount,
      setAirbnbWeeklyDiscount,
      airbnbMonthlyDiscount,
      setAirbnbMonthlyDiscount,
      selectedDiscountPercent,
      setSelectedDiscountPercent,
      interactiveDays,
      setInteractiveDays
    },
    icalState: {
      icalInput,
      setIcalInput,
      testIcalSync,
      icalStatus,
      simulatedBlockedCount
    },
    contactState: {
      ownerName,
      setOwnerName,
      whatsappInput,
      handlePhoneChange
    },
    previewState: {
      buildListing,
      currencySymbol,
      currencyRate
    }
  };

  return (
    <div
      ref={wizardOverlayRef}
      className={`fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[500] ${isMapExpanded ? 'p-0 overflow-hidden' : 'p-2 sm:p-5 overflow-y-auto'}`}
      id="wizard-modal"
      onKeyDown={(event) => {
        if (
          event.key === 'Enter'
          && step < 10
          && !(event.target instanceof HTMLTextAreaElement)
          && !(event.target instanceof HTMLButtonElement)
        ) {
          event.preventDefault();
          handleNextStep();
        }
      }}
    >
      <div className={`pu w-full max-w-3xl rounded-[2rem] shadow-2xl flex flex-col relative border border-white/50 ${isMapExpanded ? 'h-screen max-w-none rounded-none' : 'max-h-[92vh]'}`}>
        <div className="pu-header px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-heading text-[#1E293B] text-base font-extrabold">
              {tr('wizard.title')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-gray-50 text-gray-500 flex items-center justify-center transition cursor-pointer"
            title={tr('common.close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="pu-header px-4 sm:px-5 py-4 shrink-0 border-b border-[#E5E7EB]">
          <div className="relative overflow-x-auto pt-1 pb-1">
            <div className="absolute left-8 right-8 top-4 h-px rounded-full bg-[#CBD5E1]" />
            <div
              className="absolute left-8 top-4 h-px rounded-full bg-[#FF7A50] transition-all duration-300"
              style={{ width: `calc((100% - 4rem) * ${stepLabels.length > 1 ? (step - 1) / (stepLabels.length - 1) : 0})` }}
            />
            <div className="relative grid min-w-[620px] grid-cols-10 gap-2 sm:min-w-0 sm:gap-3">
              {stepLabels.map((label, index) => {
                const itemStep = index + 1;
                const isReached = step >= itemStep;
                const isActive = step === itemStep;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStep(itemStep)}
                    className="group flex min-w-0 flex-col items-center gap-1.5 text-center focus:outline-none"
                    title={label}
                  >
                    <span className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-medium shadow-[0_0_0_3px_#EAEAEC] transition ${isActive ? 'border-[#FF7A50] bg-white text-[#FF7A50] ring-2 ring-[#FF7A50]/25' : isReached ? 'border-[#FF7A50] bg-[#FF7A50] text-white' : 'border-[#CBD5E1] bg-[#E5E7EB] text-[#64748B]'}`}>
                      {itemStep}
                    </span>
                    <span className={`w-full truncate text-[9px] font-normal leading-tight transition ${isReached ? 'text-[#FF7A50]' : 'text-[#94A3B8]'}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div ref={wizardBodyRef} className={`pu-body flex-grow min-h-[55vh] text-[#1E293B] ${step === 4 ? 'p-0 overflow-hidden h-[55vh]' : 'p-5 sm:p-7 overflow-y-auto space-y-6 max-h-[64vh]'}`}>
          <WizardStepContent {...wizardStepContentProps} />
        </div>

        <div className="pu-footer p-4 border-t border-[#E5E7EB] flex items-center justify-between shrink-0">
          <button
            disabled={step === 1}
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            className={`px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${step === 1 ? 'opacity-35 cursor-not-allowed select-none bg-gray-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700'}`}
            id="prev-wiz-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{tr('common.back')}</span>
          </button>

          {step < 10 ? (
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-[#FF7A50] hover:bg-[#E05A30] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
              id="next-wiz-btn"
            >
              <span>{tr('common.next')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled={isPublishing}
              onClick={handlePublishListing}
              className={`px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 active:scale-95 shadow-md ${isPublishing ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
              id="publish-wiz-btn"
            >
              <Check className="w-4 h-4" />
              <span>{isPublishing ? 'Google Maps...' : tr('wizard.publish')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
