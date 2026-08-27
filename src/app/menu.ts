// @ts-ignore
import menuHousing from '../assets/images/menu_housing_firebase.webp';
// @ts-ignore
import menuTransport from '../assets/images/menu_transport_firebase.webp';
// @ts-ignore
import menuServices from '../assets/images/menu_services_firebase.webp';
// @ts-ignore
import menuAds from '../assets/images/menu_ads_firebase.webp';
// @ts-ignore
import menuAfisha from '../assets/images/menu_afisha_firebase.webp';
// @ts-ignore
import menuLife from '../assets/images/menu_life_firebase.webp';
// @ts-ignore
import menuInvestments from '../assets/images/menu_investments_firebase.webp';
// @ts-ignore
import menuUseful from '../assets/images/menu_useful_firebase.webp';
// @ts-ignore
import menuL2EntirePlace from '../assets/images/menu_l2_entire_place.webp';
// @ts-ignore
import menuL2PrivateSuite from '../assets/images/menu_l2_private_suite.webp';
// @ts-ignore
import menuL2PrivateRoom from '../assets/images/menu_l2_private_room.webp';
// @ts-ignore
import menuL2Scooters from '../assets/images/menu_l2_scooters_firebase.webp';
// @ts-ignore
import menuL2Motorcycles from '../assets/images/menu_l2_motorcycles_firebase.webp';
// @ts-ignore
import menuL2Cars from '../assets/images/menu_l2_cars_firebase.webp';
// @ts-ignore
import menuL2Villas from '../assets/images/menu_l2_villas.webp';
// @ts-ignore
import menuL2Land from '../assets/images/menu_l2_land.webp';
// @ts-ignore
import menuL2Business from '../assets/images/menu_l2_business.webp';
// @ts-ignore
import menuL2ForLeisure from '../assets/images/menu_l2_for_leisure.webp';
// @ts-ignore
import menuL2ForLiving from '../assets/images/menu_l2_for_living.webp';
// @ts-ignore
import menuL2HouseholdServices from '../assets/images/menu_l2_household_services.webp';
// @ts-ignore
import menuL2BeautyCare from '../assets/images/menu_l2_beauty_care.png';
// @ts-ignore
import menuL2Health from '../assets/images/menu_l2_health.webp';
// @ts-ignore
import menuL2Education from '../assets/images/menu_l2_education.webp';
// @ts-ignore
import menuL2PhotoVideo from '../assets/images/menu_l2_photo_video.webp';
// @ts-ignore
import menuL2SportService from '../assets/images/menu_l2_sport_service.webp';
// @ts-ignore
import menuL2OtherServices from '../assets/images/menu_l2_other_services.png';
// @ts-ignore
import menuL2Electronics from '../assets/images/menu_l2_electronics.webp';
// @ts-ignore
import menuL2TransSaleScooter from '../assets/images/menu_l2_trans_sale_scooter.webp';
// @ts-ignore
import menuL2Clothes from '../assets/images/menu_l2_clothes.webp';
// @ts-ignore
import menuL2HouseFurn from '../assets/images/menu_l2_house_furn.webp';
// @ts-ignore
import menuL2Festivals from '../assets/images/menu_l2_festivals.webp';
// @ts-ignore
import menuL2Seminars from '../assets/images/menu_l2_seminars.webp';
// @ts-ignore
import menuL2Exhibitions from '../assets/images/menu_l2_exhibitions.webp';
// @ts-ignore
import menuL2Meetings from '../assets/images/menu_l2_meetings.webp';
// @ts-ignore
import menuL2Buddies from '../assets/images/menu_l2_buddies.webp';

export const SUBCATEGORIES_MAP: Record<string, Array<{ id: string; label: string; icon: string; customImage?: string }>> = {
  housing: [
    { id: 'entire_place', label: 'Private villa / house', icon: '🏡', customImage: menuL2EntirePlace },
    { id: 'private_suite', label: 'Apartments', icon: '🏢', customImage: menuL2PrivateSuite },
    { id: 'private_room', label: 'Private room', icon: '🛌', customImage: menuL2PrivateRoom }
  ],
  transport: [
    { id: 'scooters', label: 'Scooters', icon: '🛵', customImage: menuL2Scooters },
    { id: 'motorcycles', label: 'Motorcycles', icon: '🏍', customImage: menuL2Motorcycles },
    { id: 'cars', label: 'Cars', icon: '🚗', customImage: menuL2Cars }
  ],
  investments: [
    { id: 'villas', label: 'Villas & apartments', icon: '🏢', customImage: menuL2Villas },
    { id: 'land', label: 'Land plots', icon: '🏝', customImage: menuL2Land },
    { id: 'business', label: 'Ready business', icon: '💼', customImage: menuL2Business }
  ],
  services: [
    { id: 'household_services', label: 'Household services', icon: '🧰', customImage: menuL2HouseholdServices },
    { id: 'beauty_care', label: 'Beauty & care', icon: '✨', customImage: menuL2BeautyCare },
    { id: 'health', label: 'Health', icon: '🩺', customImage: menuL2Health },
    { id: 'education', label: 'Education', icon: '📚', customImage: menuL2Education },
    { id: 'sport', label: 'Sport', icon: '🏄‍♂️', customImage: menuL2SportService },
    { id: 'photo_video', label: 'Photo & video', icon: '📷', customImage: menuL2PhotoVideo },
    { id: 'consultations', label: 'Consultations', icon: '💡', customImage: menuL2ForLiving },
    { id: 'service_business', label: 'Business', icon: '💼', customImage: menuL2Business },
    { id: 'service_transport', label: 'Transport', icon: '🛵', customImage: menuL2TransSaleScooter },
    { id: 'other_services', label: 'Other services', icon: '⭐', customImage: menuL2OtherServices }
  ],
  ads: [
    { id: 'electronics', label: 'Electronics & photo', icon: '🔌', customImage: menuL2Electronics },
    { id: 'trans_sale', label: 'Transport for sale', icon: '🛵', customImage: menuL2TransSaleScooter },
    { id: 'clothes', label: 'Clothes and personal items', icon: '👕', customImage: menuL2Clothes },
    { id: 'house_furn', label: 'Home and interior', icon: '🏡', customImage: menuL2HouseFurn }
  ],
  afisha: [
    { id: 'festivals', label: 'Festivals & parties', icon: '🎉', customImage: menuL2Festivals },
    { id: 'seminars', label: 'Business seminars', icon: '💼', customImage: menuL2Seminars },
    { id: 'exhibitions', label: 'Exhibitions & kids', icon: '🎨', customImage: menuL2Exhibitions }
  ],
  life: [
    { id: 'meetings', label: 'Meetups & sport', icon: '💬', customImage: menuL2Meetings },
    { id: 'buddies', label: 'Travel buddies & trips', icon: '🛵', customImage: menuL2Buddies }
  ],
  useful: []
};

export const L1_CATEGORIES = [
  {
    id: 'housing',
    label: 'Housing',
    image: menuHousing,
    desc: 'Villas, townhouses and guesthouses directly from owners',
    l2: 'entire_place',
    icon: '🏡'
  },
  {
    id: 'transport',
    label: 'Transport',
    image: menuTransport,
    desc: 'Bike, scooter and car rentals without overpaying',
    l2: 'scooters',
    icon: '🛵'
  },
  {
    id: 'investments',
    label: 'Investments',
    image: menuInvestments,
    desc: 'Villas, land and ready businesses in Bali with strong returns',
    l2: 'villas',
    icon: '🏢'
  },
  {
    id: 'services',
    label: 'Services',
    image: menuServices,
    desc: 'Guides, nannies, chefs, cleaning and massage directly',
    l2: 'household_services',
    icon: '🧑‍💼'
  },
  {
    id: 'ads',
    label: 'Classifieds',
    image: menuAds,
    desc: 'Rent things, household appliances and shared living',
    l2: 'electronics',
    icon: '📢'
  },
  {
    id: 'afisha',
    label: 'Events',
    image: menuAfisha,
    desc: 'Upcoming concerts, parties and festivals in Bali',
    l2: 'festivals',
    icon: '🎉'
  },
  {
    id: 'life',
    label: 'Life',
    image: menuLife,
    desc: 'Community chats, visa tips, contacts and mutual help',
    l2: 'meetings',
    icon: '💬'
  },
  {
    id: 'useful',
    label: 'Useful',
    image: menuUseful,
    desc: 'Useful guides, visa information, Balinese names and life hacks',
    l2: '',
    icon: '🧭'
  }
];

const preloadedMenuImageUrls = new Set<string>();
const LOCAL_L1_IMAGE_PRIORITY_IDS = new Set(['housing', 'transport', 'investments', 'services', 'ads', 'afisha', 'life', 'useful']);
const LOCAL_L2_IMAGE_PRIORITY_IDS = new Set(
  Object.values(SUBCATEGORIES_MAP)
    .flat()
    .filter(sub => Boolean(sub.customImage))
    .map(sub => sub.id)
);

const isCacheableMenuImageUrl = (value: unknown): value is string => {
  return typeof value === 'string'
    && value.length > 0
    && !value.startsWith('data:image/');
};

export const getMenuImageUrls = (overrides: any = {}) => {
  const urls = new Set<string>();

  L1_CATEGORIES.forEach(cat => {
    const image = getMenuCategoryImage(cat, overrides);
    if (isCacheableMenuImageUrl(image)) {
      urls.add(image);
    }
  });

  Object.values(SUBCATEGORIES_MAP).forEach(subcategories => {
    subcategories.forEach(sub => {
      const image = getMenuSubcategoryImage(sub, overrides);
      if (isCacheableMenuImageUrl(image)) {
        urls.add(image);
      }
    });
  });

  return Array.from(urls);
};

export const getMenuCategoryImage = (
  category: { id: string; image?: string },
  overrides: any = {}
) => {
  if (LOCAL_L1_IMAGE_PRIORITY_IDS.has(category.id)) {
    return category.image;
  }

  return overrides?.l1?.[category.id]?.image || category.image;
};

export const getMenuSubcategoryImage = (
  subcategory: { id: string; customImage?: string },
  overrides: any = {}
) => {
  if (LOCAL_L2_IMAGE_PRIORITY_IDS.has(subcategory.id)) {
    return subcategory.customImage;
  }

  return overrides?.l2?.[subcategory.id]?.customImage || subcategory.customImage;
};

export const preloadMenuImages = (overrides: any = {}) => {
  if (typeof window === 'undefined') return;

  getMenuImageUrls(overrides).forEach(url => {
    if (preloadedMenuImageUrls.has(url)) return;
    preloadedMenuImageUrls.add(url);

    const image = new window.Image();
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.src = url;
  });
};

export const sanitizeMenuOverrides = (overrides: any) => {
  if (!overrides) return overrides;
  const copy = JSON.parse(JSON.stringify(overrides));

  if (copy.l1) {
    Object.keys(copy.l1).forEach(key => {
      const item = copy.l1[key];
      if (item && typeof item.image === 'string' && item.image.startsWith('data:image/') && item.image.length > 100000) {
        console.warn(`Pruning oversized Base64 image in L1 category '${key}' (${item.image.length} chars)`);
        item.image = '';
      }
    });
  }

  if (copy.l2) {
    Object.keys(copy.l2).forEach(key => {
      const item = copy.l2[key];
      if (item && typeof item.image === 'string' && item.image.startsWith('data:image/') && item.image.length > 100000) {
        console.warn(`Pruning oversized Base64 image in L2 subcategory '${key}' (${item.image.length} chars)`);
        item.image = '';
      }
    });
  }

  return copy;
};
