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
import marketTransportScooter from '../assets/images/market_transport_scooter.webp';
// @ts-ignore
import marketTransportMotorcycle from '../assets/images/market_transport_motorcycle.webp';
// @ts-ignore
import marketTransportCar from '../assets/images/market_transport_car.webp';
// @ts-ignore
import marketTransportBicycle from '../assets/images/market_transport_bicycle.webp';
// @ts-ignore
import marketTransportYacht from '../assets/images/market_transport_yacht.webp';
// @ts-ignore
import menuL2Villas from '../assets/images/menu_l2_villas.webp';
// @ts-ignore
import menuL2CommercialRealEstate from '../assets/images/menu_l2_commercial_real_estate.png';
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
import menuL2Exhibitions from '../assets/images/menu_l2_exhibitions.webp';
// @ts-ignore
// @ts-ignore
import menuL2Buddies from '../assets/images/menu_l2_buddies.webp';
// @ts-ignore
import afishaParties from '../assets/images/menu_l2_afisha_parties.png';
// @ts-ignore
import afishaConcerts from '../assets/images/menu_l2_afisha_live_music.png';
// @ts-ignore
import afishaFestivals from '../assets/images/menu_l2_afisha_festivals.png';
// @ts-ignore
import afishaExhibitions from '../assets/images/menu_l2_afisha_exhibitions.png';
// @ts-ignore
import afishaCinema from '../assets/images/menu_l2_afisha_cinema_theatre.png';
// @ts-ignore
import afishaSports from '../assets/images/menu_l2_afisha_sports_events.png';
// @ts-ignore
import afishaWorkshops from '../assets/images/menu_l2_afisha_workshops.png';
// @ts-ignore
import afishaYoga from '../assets/images/menu_l2_afisha_yoga_wellness.png';
// @ts-ignore
import afishaBusiness from '../assets/images/menu_l2_afisha_business_networking.png';
// @ts-ignore
import afishaFamily from '../assets/images/menu_l2_afisha_family_events.png';
// @ts-ignore
import afishaMarkets from '../assets/images/menu_l2_afisha_markets_fairs.png';
// @ts-ignore
import afishaTours from '../assets/images/menu_l2_afisha_tours.png';
// @ts-ignore
import afishaOther from '../assets/images/menu_l2_afisha_other.png';

export type MenuSubcategory = { id: string; label: string; icon: string; customImage?: string; dividerBefore?: boolean };

export const ADS_L3_SUBCATEGORIES: Record<string, MenuSubcategory[]> = {
  electronics: [
    { id: 'phones', label: 'Phones', icon: '📱' },
    { id: 'tablets', label: 'Tablets', icon: '📱' },
    { id: 'computers', label: 'Computers', icon: '💻' },
    { id: 'photo_video_gear', label: 'Photo and video', icon: '📷' },
    { id: 'audio', label: 'Audio', icon: '🎧' },
    { id: 'home_appliances', label: 'Home appliances', icon: '🔌' },
    { id: 'electronics_accessories', label: 'Accessories', icon: '🔋' },
    { id: 'electronics_other', label: 'Other', icon: '⭐' }
  ],
  ads_transport: [
    { id: 'ads_scooters', label: 'Scooters', icon: '🛵', customImage: marketTransportScooter },
    { id: 'ads_motorcycles', label: 'Motorcycles', icon: '🏍', customImage: marketTransportMotorcycle },
    { id: 'ads_cars', label: 'Cars', icon: '🚗', customImage: marketTransportCar },
    { id: 'bicycles', label: 'Bicycles', icon: '🚲', customImage: marketTransportBicycle },
    { id: 'water_transport', label: 'Water transport', icon: '🚤', customImage: marketTransportYacht },
    { id: 'transport_parts', label: 'Parts', icon: '⚙️' }
  ],
  home_living: [
    { id: 'furniture', label: 'Furniture', icon: '🛋️' },
    { id: 'kitchenware', label: 'Kitchenware', icon: '🍽️' },
    { id: 'home_equipment', label: 'Home equipment', icon: '🧺' },
    { id: 'decor', label: 'Decor', icon: '🪴' },
    { id: 'textiles', label: 'Textiles', icon: '🧵' },
    { id: 'tools', label: 'Tools', icon: '🧰' },
    { id: 'home_other', label: 'Other', icon: '⭐' }
  ],
  clothes_items: [
    { id: 'mens_clothing', label: "Men's clothing", icon: '👕' },
    { id: 'womens_clothing', label: "Women's clothing", icon: '👗' },
    { id: 'shoes', label: 'Shoes', icon: '👟' },
    { id: 'bags', label: 'Bags', icon: '👜' },
    { id: 'fashion_accessories', label: 'Accessories', icon: '⌚' },
    { id: 'beauty_care_items', label: 'Beauty and care', icon: '✨' },
    { id: 'clothes_other', label: 'Other', icon: '⭐' }
  ],
  sport_hobby: [
    { id: 'surfing', label: 'Surfing', icon: '🏄' },
    { id: 'fitness', label: 'Fitness', icon: '🏋️' },
    { id: 'yoga', label: 'Yoga', icon: '🧘' },
    { id: 'padel', label: 'Padel', icon: '🎾' },
    { id: 'tennis', label: 'Tennis', icon: '🎾' },
    { id: 'swimming', label: 'Swimming', icon: '🏊' },
    { id: 'martial_arts', label: 'Martial arts', icon: '🥋' },
    { id: 'diving', label: 'Diving', icon: '🤿' },
    { id: 'snorkeling', label: 'Snorkeling', icon: '🤿' },
    { id: 'cycling', label: 'Cycling', icon: '🚴' },
    { id: 'football', label: 'Football', icon: '⚽' },
    { id: 'badminton', label: 'Badminton', icon: '🏸' },
    { id: 'skateboarding', label: 'Skateboarding', icon: '🛹' },
    { id: 'volleyball', label: 'Volleyball', icon: '🏐' },
    { id: 'running', label: 'Running', icon: '🏃' },
    { id: 'trekking_hiking', label: 'Trekking and hiking', icon: '🥾' },
    { id: 'golf', label: 'Golf', icon: '⛳' },
    { id: 'musical_instruments', label: 'Musical instruments', icon: '🎸', dividerBefore: true },
    { id: 'drawing_painting', label: 'Drawing and painting', icon: '🎨' },
    { id: 'handmade_crafts', label: 'Handmade and crafts', icon: '🧶' },
    { id: 'board_games_puzzles', label: 'Board games and puzzles', icon: '🧩' },
    { id: 'camping_travel', label: 'Camping and travel', icon: '⛺' },
    { id: 'gardening_plants', label: 'Gardening and plants', icon: '🪴' },
    { id: 'cooking', label: 'Cooking', icon: '🍳' },
    { id: 'collecting', label: 'Collecting', icon: '🗂️' },
    { id: 'sport_hobby_other', label: 'Other', icon: '⭐' }
  ],
  kids_goods: [
    { id: 'strollers_car_seats', label: 'Strollers and car seats', icon: '🧸' },
    { id: 'kids_clothing', label: 'Clothing', icon: '👕' },
    { id: 'toys', label: 'Toys', icon: '🧸' },
    { id: 'kids_furniture', label: 'Furniture', icon: '🛏️' },
    { id: 'kids_other', label: 'Other', icon: '⭐' }
  ],
  other_ads: [
    { id: 'other_ads', label: 'Other', icon: '⭐' }
  ]
};

export const SUBCATEGORIES_MAP: Record<string, MenuSubcategory[]> = {
  housing: [
    { id: 'entire_place', label: 'Private villa / house', icon: '🏡', customImage: menuL2EntirePlace },
    { id: 'private_suite', label: 'Apartments', icon: '🏢', customImage: menuL2PrivateSuite },
    { id: 'private_room', label: 'Private room', icon: '🛌', customImage: menuL2PrivateRoom }
  ],
  transport: [
    { id: 'scooters', label: 'Scooters', icon: '🛵', customImage: marketTransportScooter },
    { id: 'motorcycles', label: 'Motorcycles', icon: '🏍', customImage: marketTransportMotorcycle },
    { id: 'cars', label: 'Cars', icon: '🚗', customImage: marketTransportCar }
  ],
  investments: [
    { id: 'villas', label: 'Residential real estate', icon: '🏢', customImage: menuL2Villas },
    { id: 'commercial_real_estate', label: 'Commercial real estate', icon: '🏬', customImage: menuL2CommercialRealEstate },
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
    { id: 'service_transport', label: 'Transport services', icon: '🛵', customImage: menuL2TransSaleScooter },
    { id: 'other_services', label: 'Other services', icon: '⭐', customImage: menuL2OtherServices }
  ],
  ads: [
    { id: 'electronics', label: 'Electronics', icon: '🔌', customImage: menuL2Electronics },
    { id: 'ads_transport', label: 'Transport', icon: '🛵', customImage: marketTransportScooter },
    { id: 'home_living', label: 'Home and living', icon: '🏡', customImage: menuL2HouseFurn },
    { id: 'clothes_items', label: 'Clothing and items', icon: '👕', customImage: menuL2Clothes },
    { id: 'sport_hobby', label: 'Sport and hobbies', icon: '🏄‍♂️', customImage: menuL2ForLeisure },
    { id: 'kids_goods', label: 'Kids goods', icon: '🧸', customImage: menuL2Exhibitions },
    { id: 'other_ads', label: 'Other', icon: '⭐', customImage: menuL2OtherServices }
  ],
  afisha: [
    { id: 'parties', label: 'Parties', icon: '🎉', customImage: afishaParties },
    { id: 'live_music', label: 'Concerts', icon: '🎤', customImage: afishaConcerts },
    { id: 'festivals', label: 'Festivals', icon: '🎪', customImage: afishaFestivals },
    { id: 'exhibitions', label: 'Exhibitions and art', icon: '🎨', customImage: afishaExhibitions },
    { id: 'cinema_theatre', label: 'Cinema and theatre', icon: '🎭', customImage: afishaCinema },
    { id: 'sports_events', label: 'Sports events', icon: '🏆', customImage: afishaSports },
    { id: 'workshops', label: 'Workshops', icon: '🛠️', customImage: afishaWorkshops },
    { id: 'yoga_wellness', label: 'Yoga and wellness', icon: '🧘', customImage: afishaYoga },
    { id: 'seminars', label: 'Business and networking', icon: '🤝', customImage: afishaBusiness },
    { id: 'family_events', label: 'Kids and family events', icon: '🧸', customImage: afishaFamily },
    { id: 'markets_fairs', label: 'Markets and fairs', icon: '🛍️', customImage: afishaMarkets },
    { id: 'tours', label: 'Tours and excursions', icon: '🗺️', customImage: afishaTours },
    { id: 'afisha_other', label: 'Other', icon: '⭐', customImage: afishaOther }
  ],
  life: [
    { id: 'life_company', label: 'Looking for company', icon: '🛵', customImage: menuL2Buddies },
    { id: 'life_jobs', label: 'Vacancies', icon: '💼' },
    { id: 'life_family', label: 'Family and kids', icon: '👨‍👩‍👧' },
    { id: 'life_sport', label: 'Sport', icon: '🎾' },
    { id: 'life_hobbies', label: 'Hobbies', icon: '🎲' },
    { id: 'life_animals', label: 'Animals', icon: '🐾' },
    { id: 'life_help', label: 'Help', icon: '🤝' },
    { id: 'life_lost_found', label: 'Lost and found', icon: '🔑' },
    { id: 'life_warnings', label: 'Warnings', icon: '⚠️' },
    { id: 'life_other', label: 'Other', icon: '⭐' }
  ],
  useful: [
    { id: 'useful_before_trip', label: 'Before your trip', icon: '🧳' },
    { id: 'useful_visas_documents', label: 'Visas and documents', icon: '🛂' },
    { id: 'useful_bali_areas', label: 'Bali areas', icon: '🗺️' },
    { id: 'useful_housing_daily_life', label: 'Housing and daily life', icon: '🏠' },
    { id: 'useful_transport', label: 'Transport', icon: '🛵' },
    { id: 'useful_money_connectivity', label: 'Money and connectivity', icon: '💳' },
    { id: 'useful_health', label: 'Health', icon: '🩺' },
    { id: 'useful_laws_safety', label: 'Laws and safety', icon: '⚖️' },
    { id: 'useful_work_business', label: 'Work and business', icon: '💼' },
    { id: 'useful_emergency_help', label: 'Emergency help', icon: '🆘' }
  ]
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
    label: 'Market',
    image: menuAds,
    desc: 'Rent things, household appliances and shared living',
    l2: 'electronics',
    icon: '📢'
  },
  {
    id: 'afisha',
    label: 'Events',
    image: menuAfisha,
    desc: 'Events, concerts and activities in Bali',
    l2: 'parties',
    icon: '🎉'
  },
  {
    id: 'life',
    label: 'Life',
    image: menuLife,
    desc: 'Community chats, visa tips, contacts and mutual help',
    l2: 'life_company',
    icon: '💬'
  },
  {
    id: 'useful',
    label: 'Useful',
    image: menuUseful,
    desc: 'Useful guides, visa information, Balinese names and life hacks',
    l2: 'useful_before_trip',
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
