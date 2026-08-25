import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ClipboardPlus, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { Listing } from '../types';
import { isListingFresh } from '../utils/listingFreshness';
import {
  PHOTO_SLOT_CONFIG,
  REQUIRED_PHOTO_SLOTS,
  ROOM_TYPE_LABELS,
  UNIT_TYPE_OPTIONS,
  stripRoomTypeFromTitle
} from './create-wizard/constants';
import WizardStepContent from './create-wizard/WizardStepContent';
import { useCategorySteps } from './create-wizard/steps/useCategorySteps';
import { useLocationStep } from './create-wizard/steps/useLocationStep';
import { usePhotoStep } from './create-wizard/steps/usePhotoStep';
import { useTitleStep } from './create-wizard/steps/useTitleStep';
import { calculateNearbySpotsOnce } from '../utils/nearbyPlaces';
import { useI18n } from '../i18nContext';
import { findDistrictByCoordsSync } from '../utils/geo';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase';
import { formatPhoneInput } from '../utils/phone';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const normalizeContactPhone = (value: string) => {
  const formatted = formatPhoneInput(value, 'ID');
  return {
    displayValue: formatted.displayValue,
    savedValue: formatted.whatsappNumber || formatted.e164Number || value
  };
};

interface CreateWizardProps {
  onClose: () => void;
  onPublish: (newListing: Listing) => Promise<void>;
  existingListings?: Listing[];
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

const MIN_DESCRIPTION_LENGTH = 20;
const MIN_LISTING_PHOTO_WIDTH = 640;
const MIN_LISTING_PHOTO_HEIGHT = 480;
const CALENDAR_ROOM_SUBCATEGORIES = ['private_room', 'private_suite', 'entire_place'];
const UNIT_TYPE_SUBCATEGORIES = ['private_suite', 'entire_place'];

type RoomType = keyof typeof ROOM_TYPE_LABELS;
type UnitType = typeof UNIT_TYPE_OPTIONS[number];

export default function CreateWizard({
  onClose,
  onPublish,
  currencySymbol,
  currencyRate,
  propCategoriesList,
  propSubcategoriesMap,
  menuOverrides,
  existingListings = [],
  initialListing
}: CreateWizardProps) {
  const { tr } = useI18n();
  const { user } = useAuth();
  const stepLabels = stepLabelKeys.map(key => tr(key));
  const [step, setStep] = useState<number>(1);
  const wizardBodyRef = useRef<HTMLDivElement | null>(null);
  const wizardOverlayRef = useRef<HTMLDivElement | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [validationPopup, setValidationPopup] = useState<{ title: string; message: string } | null>(null);
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
    unitType,
    setUnitType,
    roomCount,
    setRoomCount,
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
    resolveGooglePlaceIdForListing,
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
  const [cleaningFrequency, setCleaningFrequency] = useState<'none' | 'once_week' | '2_times_week' | '3_times_week' | 'daily'>(initialListing?.cleaningFrequency || 'none');
  const [cleanlinessTags, setCleanlinessTags] = useState<string[]>([]);
  const [densityType, setDensityType] = useState<'cozy' | 'medium' | 'large'>(initialListing?.densityType || 'cozy');
  const [showKitchenTooltip, setShowKitchenTooltip] = useState<boolean>(false);

  const currentYear = new Date().getFullYear();
  const recentYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const [yearBuilt, setYearBuilt] = useState<string>(String(initialListing?.yearBuilt || 'other'));

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
  const [initialPhoneValue] = useState(() => normalizeContactPhone(initialListing?.whatsappNumber || ''));
  const [whatsappNumber, setWhatsappNumber] = useState<string>(initialPhoneValue.savedValue);
  const [whatsappInput, setWhatsappInput] = useState<string>(initialPhoneValue.displayValue);
  const [ownerName, setOwnerName] = useState<string>(initialListing?.ownerName || '');

  useEffect(() => {
    if (initialListing || !user?.uid) return;

    let isMounted = true;
    const loadSavedContact = async () => {
      try {
        const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
        if (!isMounted || !profileSnapshot.exists()) return;

        const profile = profileSnapshot.data();
        const savedName = typeof profile.contactName === 'string' && profile.contactName.trim()
          ? profile.contactName
          : typeof profile.displayName === 'string'
            ? profile.displayName
            : '';
        const savedPhone = typeof profile.contactPhone === 'string' && profile.contactPhone.trim()
          ? profile.contactPhone
          : typeof profile.whatsappNumber === 'string'
            ? profile.whatsappNumber
            : '';

        if (savedName) {
          setOwnerName(current => current || savedName);
        }
        if (savedPhone) {
          const formattedPhone = normalizeContactPhone(savedPhone);
          setWhatsappInput(current => current || formattedPhone.displayValue);
          setWhatsappNumber(current => current || formattedPhone.savedValue);
        }
      } catch (error) {
        console.warn('Failed to load saved listing contact profile:', error);
      }
    };

    loadSavedContact();

    return () => {
      isMounted = false;
    };
  }, [initialListing, user?.uid]);

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

  const showValidationPopup = (message: string, targetStep?: number) => {
    if (targetStep) setStep(targetStep);
    setValidationPopup({
      title: tr('wizard.validationPopupTitle'),
      message
    });
  };

  const inspectListingImage = (url: string) => new Promise<{ width: number; height: number } | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = url;
  });

  const validatePhotoQuality = async () => {
    for (const photoUrl of photoUrls) {
      if (photoUrl.startsWith('data:')) {
        return tr('wizard.validationPhotoLocal');
      }

      const dimensions = await inspectListingImage(photoUrl);
      if (!dimensions) {
        return tr('wizard.validationPhotoBroken');
      }
      if (dimensions.width < MIN_LISTING_PHOTO_WIDTH || dimensions.height < MIN_LISTING_PHOTO_HEIGHT) {
        return tr('wizard.validationPhotoQuality', {
          width: MIN_LISTING_PHOTO_WIDTH,
          height: MIN_LISTING_PHOTO_HEIGHT
        });
      }
    }

    return '';
  };

  const validateMechanicalStep = async (targetStep: number) => {
    if (targetStep === 3) {
      if (!title.trim()) return tr('wizard.validationTitle');
      if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
        return tr('wizard.validationDescriptionMin', { count: MIN_DESCRIPTION_LENGTH });
      }
      if (category === 'housing' && subCategory === 'private_room' && (!Number.isFinite(roomCount) || !roomCount || roomCount < 1 || roomCount > 50)) {
        return tr('wizard.validationRoomCount');
      }
      if (category === 'housing' && UNIT_TYPE_SUBCATEGORIES.includes(subCategory) && roomCount !== undefined && (!Number.isFinite(roomCount) || roomCount < 1 || roomCount > 50)) {
        return tr('wizard.validationRoomCount');
      }
    }

    if (targetStep === 4) {
      if (!address.trim()) return tr('wizard.validationAddress');
    }

    if (targetStep === 5) {
      if (isUploading) return tr('wizard.validationPhotosUploading');
      if (REQUIRED_PHOTO_SLOTS.some(slot => getAssignedPhotoUrls(slot.id).length < 1)) {
        return tr('wizard.validationPhotos');
      }
      return await validatePhotoQuality();
    }

    if (targetStep === 6 && category === 'housing' && !yearBuilt) {
      return tr('wizard.validationYear');
    }

    if (targetStep === 7) {
      if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) return tr('wizard.validationPriceDay');
      if (pricePerMonth !== undefined && pricePerMonth < 0) return tr('wizard.validationPriceMonth');
    }

    if (targetStep === 9) {
      if (ownerName.trim().length < 2) return tr('wizard.validationOwnerName');
      if (!whatsappNumber || whatsappNumber.replace(/\D/g, '').length < 8) return tr('wizard.validationPhone');
    }

    return '';
  };

  const validateMechanicalListing = async () => {
    const stepsToValidate = [3, 4, 5, 6, 7, 9];
    for (const stepToValidate of stepsToValidate) {
      const message = await validateMechanicalStep(stepToValidate);
      if (message) {
        showValidationPopup(message, stepToValidate);
        return false;
      }
      if (stepToValidate === 3 && findDuplicateListingByTitleAndType()) {
        showValidationPopup(tr('wizard.validationDuplicateTitleType'), 3);
        return false;
      }
    }

    return true;
  };

  const normalizeGooglePlaceId = (listing: Listing) => (listing.googlePlaceId || listing.placeId || '').trim();
  const normalizeListingTitle = (value?: string) =>
    stripRoomTypeFromTitle(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const normalizeRoomType = (value?: string) => (value || '').trim().toLowerCase();
  const normalizeHousingType = (value?: string) => (value || '').trim().toLowerCase();
  const getListingObjectTypeKey = (listing: Pick<Listing, 'category' | 'subCategory' | 'housingType' | 'roomType' | 'unitType'>) => [
    listing.category,
    listing.subCategory,
    listing.category === 'housing' && listing.subCategory === 'private_room'
      ? normalizeRoomType(listing.roomType)
      : listing.category === 'housing' && UNIT_TYPE_SUBCATEGORIES.includes(listing.subCategory)
        ? normalizeRoomType(listing.unitType)
      : listing.category === 'housing'
        ? normalizeHousingType(listing.housingType)
        : ''
  ].join('|');
  const getListingCalendarRoomCount = (listing?: Listing) =>
    Math.max(1, Math.min(50, listing?.roomCount || listing?.roomNumbers?.length || 1));

  const findDuplicateListingByTitleAndType = () => {
    const currentTitle = normalizeListingTitle(title);
    if (!currentTitle) return undefined;

    const currentTypeKey = getListingObjectTypeKey({
      category: category as Listing['category'],
      subCategory,
      housingType,
      roomType,
      unitType
    });

    return existingListings.find(listing =>
      listing.id !== initialListing?.id &&
      normalizeListingTitle(listing.title) === currentTitle &&
      getListingObjectTypeKey(listing) === currentTypeKey
    );
  };

  const findExistingPrivateRoomListing = (googlePlaceId: string, targetRoomType: RoomType = roomType) => {
    const normalizedPlaceId = googlePlaceId.trim();
    if (!normalizedPlaceId) return undefined;

    const candidateListings = [
      ...(initialListing ? [initialListing] : []),
      ...existingListings.filter(listing => listing.id !== initialListing?.id)
    ];

    return candidateListings.find(listing =>
      listing.category === 'housing' &&
      listing.subCategory === 'private_room' &&
      normalizeGooglePlaceId(listing) === normalizedPlaceId &&
      normalizeRoomType(listing.roomType) === normalizeRoomType(targetRoomType)
    );
  };

  const findDuplicateListing = (googlePlaceId: string) => {
    const normalizedPlaceId = googlePlaceId.trim();
    if (!normalizedPlaceId) return undefined;

    const matchingListings = existingListings.filter(listing =>
      listing.id !== initialListing?.id &&
      normalizeGooglePlaceId(listing) === normalizedPlaceId
    );

    if (matchingListings.length === 0) return undefined;

    if (category !== 'housing') {
      return matchingListings.find(listing => listing.category === category && listing.subCategory === subCategory);
    }

    const currentHousingType = normalizeHousingType(housingType);
    const currentRoomType = normalizeRoomType(roomType);
    const currentUnitType = normalizeRoomType(unitType);
    if (subCategory === 'private_room' && currentRoomType && findExistingPrivateRoomListing(normalizedPlaceId)) {
      return undefined;
    }

    return matchingListings.find(listing =>
      listing.category === 'housing' &&
      listing.subCategory === subCategory &&
      normalizeHousingType(listing.housingType) === currentHousingType &&
      (
        subCategory !== 'private_room' ||
        !currentRoomType ||
        normalizeRoomType(listing.roomType) === currentRoomType
      ) &&
      (
        !UNIT_TYPE_SUBCATEGORIES.includes(subCategory) ||
        !currentUnitType ||
        normalizeRoomType(listing.unitType) === currentUnitType
      )
    );
  };

  const getGooglePlaceIdForValidation = async () => {
    const googlePlaceId = selectedGooglePlaceId;

    if (!googlePlaceId) {
      showValidationPopup(tr('wizard.validationGoogleObjectRequired'));
      return '';
    }

    if (findDuplicateListing(googlePlaceId)) {
      showValidationPopup(tr('wizard.validationDuplicateListing'));
      return '';
    }

    return googlePlaceId;
  };

  useEffect(() => {
    if (category !== 'housing' || subCategory !== 'private_room') return;

    const activeGooglePlaceId = selectedGooglePlaceId || initialListing?.googlePlaceId || initialListing?.placeId || '';
    const existingRoomListing = findExistingPrivateRoomListing(activeGooglePlaceId, roomType);
    const nextRoomCount = existingRoomListing ? getListingCalendarRoomCount(existingRoomListing) : 1;

    setRoomCount(current => current === nextRoomCount ? current : nextRoomCount);
  }, [category, existingListings, initialListing?.googlePlaceId, initialListing?.placeId, roomType, selectedGooglePlaceId, setRoomCount, subCategory]);

  const handleNextStep = async () => {
    const mechanicalMessage = await validateMechanicalStep(step);
    if (mechanicalMessage) {
      showValidationPopup(mechanicalMessage);
      return;
    }

    if (step === 3 && !title.trim()) {
      showValidationPopup(tr('wizard.validationTitle'));
      return;
    }
    if (step === 3 && description.trim().length < MIN_DESCRIPTION_LENGTH) {
      showValidationPopup(tr('wizard.validationDescriptionMin', { count: MIN_DESCRIPTION_LENGTH }));
      return;
    }
    if (step === 3 && findDuplicateListingByTitleAndType()) {
      showValidationPopup(tr('wizard.validationDuplicateTitleType'));
      return;
    }
    if (step === 4 && !address.trim()) {
      showValidationPopup(tr('wizard.validationAddress'));
      return;
    }
    if (step === 4 && !selectedGooglePlaceId) {
      showValidationPopup(tr('wizard.validationGoogleObjectRequired'));
      return;
    }
    if (step === 4 && !pickedCoords) {
      const foundCoords = await triggerDirectSearch(address);
      if (!foundCoords) {
        showValidationPopup(tr('wizard.validationGoogleObjectRequired'));
        return;
      }
      setPickedCoords(foundCoords);
      setConfirmedLocationCoords(foundCoords);
    } else if (step === 4 && pickedCoords) {
      setConfirmedLocationCoords(pickedCoords);
    }
    if (step === 4 && !(await getGooglePlaceIdForValidation())) {
      return;
    }

    if (step === 5 && REQUIRED_PHOTO_SLOTS.some(slot => getAssignedPhotoUrls(slot.id).length < 1)) {
      showValidationPopup(tr('wizard.validationPhotos'));
      return;
    }
    if (step === 6 && category === 'housing' && !yearBuilt) {
      showValidationPopup(tr('wizard.validationYear'));
      return;
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

  const buildListing = (id: string, googlePlaceIdOverride = ''): Listing => {
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
    const savedPhotoSlotAssignments = PHOTO_SLOT_CONFIG.reduce<Partial<Record<string, string[]>>>((acc, slot) => {
      const urls = (photoSlotAssignments[slot.id] || [])
        .filter(url => photoUrls.includes(url))
        .slice(0, slot.maxCount);
      if (urls.length) {
        acc[slot.id] = urls;
      }
      return acc;
    }, {});
    const locationCoords = confirmedLocationCoords || pickedCoords || initialListing?.locationCoords;
    const canKeepNearbySpots = coordsMatch(initialListing?.locationCoords, locationCoords);
    const resolvedDistrict = locationCoords
      ? findDistrictByCoordsSync(locationCoords.lat, locationCoords.lng) || district
      : district;
    const existingPrivateRoomListing = category === 'housing' && subCategory === 'private_room'
      ? findExistingPrivateRoomListing(googlePlaceIdOverride || selectedGooglePlaceId || initialListing?.googlePlaceId || initialListing?.placeId || '')
      : undefined;
    const sourceListing = initialListing || existingPrivateRoomListing;
    const normalizedRoomCount = category === 'housing' && subCategory === 'private_room'
      ? Math.max(1, Math.min(50, roomCount || 1))
      : category === 'housing' && UNIT_TYPE_SUBCATEGORIES.includes(subCategory) && roomCount !== undefined
        ? Math.max(1, Math.min(50, roomCount))
      : undefined;
    const normalizedRoomNumbers = normalizedRoomCount
      ? Array.from({ length: normalizedRoomCount }, (_, index) => sourceListing?.roomNumbers?.[index] || (index === 0 ? sourceListing?.roomNumber || '' : ''))
      : undefined;

    return {
      id,
      ownerId: initialListing?.ownerId || user?.uid || sourceListing?.ownerId || 'owner-personal',
      category: category as Listing['category'],
      subCategory,
      title: cleanListingTitle,
      description: description || 'Стильный объект в центральном районе, ждет своих гостей.',
      district: resolvedDistrict,
      address: address || resolvedDistrict,
      locationCoords,
      googlePlaceId: selectedGooglePlaceId || googlePlaceIdOverride || initialListing?.googlePlaceId || initialListing?.placeId,
      images: orderedPhotoUrls,
      photoSlotAssignments: savedPhotoSlotAssignments,
      rating: initialListing?.rating || 4.9,
      reviewsCount: initialListing?.reviewsCount || 0,
      reviews: initialListing?.reviews || [],
      isApproved: initialListing?.isApproved ?? false,
      isVerified: initialListing?.isVerified ?? false,
      isNew: isListingFresh({ yearBuilt: rawYear, yearRenovated: initialListing?.yearRenovated }),
      status: initialListing?.status === 'rejected' ? 'moderation' : initialListing?.status || 'moderation',
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
      roomCount: normalizedRoomCount,
      roomNumber: normalizedRoomNumbers?.[0]?.trim() || sourceListing?.roomNumber,
      roomNumbers: normalizedRoomNumbers,
      roomType: subCategory === 'private_room' ? roomType : undefined,
      unitType: UNIT_TYPE_SUBCATEGORIES.includes(subCategory) && unitType ? unitType : undefined,
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

    if (!(await validateMechanicalListing())) {
      setIsPublishing(false);
      return;
    }

    const resolvedGooglePlaceId = selectedGooglePlaceId;
    if (!resolvedGooglePlaceId) {
      showValidationPopup(tr('wizard.validationGoogleObjectRequired'));
      setIsPublishing(false);
      return;
    }
    if (findDuplicateListing(resolvedGooglePlaceId)) {
      showValidationPopup(tr('wizard.validationDuplicateListing'));
      setIsPublishing(false);
      return;
    }

    const existingPrivateRoomListing = category === 'housing' && subCategory === 'private_room'
      ? findExistingPrivateRoomListing(resolvedGooglePlaceId)
      : undefined;
    const baseListing = buildListing(initialListing?.id || existingPrivateRoomListing?.id || `house-${Date.now()}`, resolvedGooglePlaceId);
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
      await onPublish(listingForPublish);
      onClose();
    } catch (error) {
      console.error('Failed to publish listing:', error);
      showValidationPopup(tr('wizard.validationSaveFailed'));
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
      setRoomType,
      unitType,
      setUnitType,
      roomCount,
      setRoomCount
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
      roomCount,
      setRoomCount,
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
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#FF7A50]/10 text-[#E05A30]">
              <ClipboardPlus className="h-5 w-5" />
            </span>
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
          <div className="relative h-8 pt-0.5 pb-0.5 sm:h-auto sm:pt-1 sm:pb-1">
            <div className="absolute left-[5%] right-[5%] top-3 h-px rounded-full bg-[#CBD5E1] sm:top-4" />
            <div
              className="absolute left-[5%] top-3 h-px rounded-full bg-[#FF7A50] transition-all duration-300 sm:top-4"
              style={{ width: `calc(90% * ${stepLabels.length > 1 ? (step - 1) / (stepLabels.length - 1) : 0})` }}
            />
            <div className="relative grid w-full grid-cols-10 gap-0 sm:gap-3">
              {stepLabels.map((label, index) => {
                const itemStep = index + 1;
                const isReached = step >= itemStep;
                const isActive = step === itemStep;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStep(itemStep)}
                    className="group flex h-8 min-w-0 flex-col items-center gap-0.5 text-center focus:outline-none sm:h-auto sm:gap-1.5"
                    title={label}
                  >
                    <span className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-medium shadow-[0_0_0_3px_#EAEAEC] transition ${isActive ? 'border-[#FF7A50] bg-white text-[#FF7A50] ring-2 ring-[#FF7A50]/25' : isReached ? 'border-[#FF7A50] bg-[#FF7A50] text-white' : 'border-[#CBD5E1] bg-[#E5E7EB] text-[#64748B]'}`}>
                      {itemStep}
                    </span>
                    <span className={`block w-[calc(100vw/10-8px)] max-w-12 truncate text-center text-[6px] font-normal leading-[0.6rem] transition sm:w-full sm:max-w-none sm:text-[9px] sm:leading-tight ${isReached ? 'text-[#FF7A50]' : 'text-[#94A3B8]'}`}>
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

      {validationPopup && (
        <div className="fixed inset-0 z-[530] flex items-center justify-center bg-[#0F172A]/55 p-4 backdrop-blur-sm animate-fade-in">
          <div className="pu w-full max-w-sm rounded-[1.5rem] border border-white/60 p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FF7A50]/10 text-[#E05A30]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-heading text-sm font-extrabold text-[#1E293B]">
                  {validationPopup.title}
                </h4>
                <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-500">
                  {validationPopup.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValidationPopup(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                title={tr('common.close')}
                aria-label={tr('common.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setValidationPopup(null)}
              className="mt-4 w-full rounded-xl bg-[#FF7A50] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-[#E05A30] active:scale-95"
            >
              {tr('common.understood')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
