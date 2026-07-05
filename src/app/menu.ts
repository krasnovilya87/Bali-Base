// @ts-ignore
import menuHousing from '../assets/images/menu_housing_1780404154855.png';
// @ts-ignore
import menuTransport from '../assets/images/menu_transport_1780404170729.png';
// @ts-ignore
import menuServices from '../assets/images/menu_services_1780404187685.png';
// @ts-ignore
import menuAds from '../assets/images/menu_ads_1780404203502.png';
// @ts-ignore
import menuAfisha from '../assets/images/menu_afisha_1780404226444.png';
// @ts-ignore
import menuLife from '../assets/images/menu_life_1780404239433.png';

export const SUBCATEGORIES_MAP: Record<string, Array<{ id: string; label: string; icon: string }>> = {
  housing: [
    { id: 'entire_place', label: 'Private villa / house', icon: '🏡' },
    { id: 'private_suite', label: 'Apartments', icon: '🏢' },
    { id: 'private_room', label: 'Private room', icon: '🛌' }
  ],
  transport: [
    { id: 'scooters', label: 'Scooters', icon: '🛵' },
    { id: 'motorcycles', label: 'Motorcycles', icon: '🏍' },
    { id: 'cars', label: 'Cars', icon: '🚗' }
  ],
  investments: [
    { id: 'villas', label: 'Villas & apartments', icon: '🏢' },
    { id: 'land', label: 'Land plots', icon: '🏝' },
    { id: 'business', label: 'Ready business', icon: '💼' }
  ],
  services: [
    { id: 'for_leisure', label: 'Leisure & surfing', icon: '🏄‍♂️' },
    { id: 'for_living', label: 'Living & consultations', icon: '💼' }
  ],
  ads: [
    { id: 'electronics', label: 'Electronics & photo', icon: '🔌' },
    { id: 'trans_sale', label: 'Transport for sale', icon: '🏍' },
    { id: 'clothes', label: 'Clothes and personal items', icon: '👕' },
    { id: 'house_furn', label: 'Home and interior', icon: '🏡' }
  ],
  afisha: [
    { id: 'festivals', label: 'Festivals & parties', icon: '🎉' },
    { id: 'seminars', label: 'Business seminars', icon: '💼' },
    { id: 'exhibitions', label: 'Exhibitions & kids', icon: '🎨' }
  ],
  life: [
    { id: 'meetings', label: 'Meetups & sport', icon: '💬' },
    { id: 'buddies', label: 'Travel buddies & trips', icon: '🛵' }
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
    image: 'https://images.unsplash.com/photo-1638184984605-af1f05249a56?w=280&fit=crop&q=80',
    desc: 'Villas, land and ready businesses in Bali with strong returns',
    l2: 'villas',
    icon: '🏢'
  },
  {
    id: 'services',
    label: 'Services',
    image: menuServices,
    desc: 'Guides, nannies, chefs, cleaning and massage directly',
    l2: 'for_leisure',
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
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=280&fit=crop&q=80',
    desc: 'Useful guides, visa information, Balinese names and life hacks',
    l2: '',
    icon: '🧭'
  }
];

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
