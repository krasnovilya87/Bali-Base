import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read config
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mock data to seed
const MOCK_HOUSING_LISTINGS = [
  {
    id: 'house-1',
    ownerId: 'owner-1',
    category: 'housing',
    subCategory: 'entire_place',
    title: 'Wayan Guesthouse & Boho Villa Premium',
    description: 'Новая просторная вилла в бохо-стиле с частным инфинити-бассейном среди рисовых полей в Чангу. Стены из качественного монолитного бетона и тикового дерева. Идеальный интернет 200 Мб/с для IT-специалистов. Никакого шума от дорог, чистый горный воздух и стильный минималистичный интерьер.',
    district: 'Canggu',
    address: 'Jl. Pantai Batu Bolong No.45, Canggu, Bali',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewsCount: 14,
    isApproved: true,
    isNew: true,
    status: 'active',
    pricePerDay: 500000,
    pricePerMonth: 12000000,
    bookingComPrice: 850000,
    competitorPlatform: 'Booking',
    hasDropPrice: true,
    dropPricePerDay: 450000,
    dropPricePerMonth: 10500000,
    roomsTotal: 4,
    bedroomsCount: 3,
    wallMaterial: 'concrete',
    territoryType: 'private',
    bedType: 'king_size',
    kitchenType: 'equipped',
    poolType: 'infinity',
    internetSpeed: 200,
    bathroomType: 'designer',
    bathroomOptions: ['tropical_shower', 'bathtub', 'stone_sink', 'garden_view'],
    amenities: ['AC', 'cold_AC', 'smart_tv', 'washing_machine', 'parking', 'workspace'],
    cleaningFrequency: 'daily',
    viewType: 'rice_fields',
    extraOptions: ['pets_allowed', 'quiet_location', 'all_bills_included', 'airport_transfer'],
    yearBuilt: 2025,
    distanceToSeaMinutes: 5,
    interiorStyle: 'luxury',
    whatsappNumber: '+6281234567890',
    ownerName: 'Wayan S.',
    ownerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80',
    clicksCount: 142,
    viewsCount: 1105
  },
  {
    id: 'house-2',
    ownerId: 'owner-1',
    category: 'housing',
    subCategory: 'entire_place',
    title: 'Ubud Jungle Sanctuary Bamboo Bungalow',
    description: 'Экологический бамбуковый дом ручной работы у реки в Убуде. Панорамный вид на каньон, дикий кокосовый лес и утренний туман. Терраса для йоги, уличная ванна из вулканического камня. Только экологичные материалы, приватная территория с тропическим садом.',
    district: 'Ubud',
    address: 'Jl. Raya Sayan No.18, Sayan, Ubud, Bali',
    images: [
      'https://images.unsplash.com/photo-1546548970-71785318a17b?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527030280862-64139fbe04ca?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&fit=crop&q=80'
    ],
    rating: 4.8,
    reviewsCount: 32,
    isApproved: true,
    isNew: false,
    status: 'active',
    pricePerDay: 400000,
    pricePerMonth: 9500000,
    bookingComPrice: 750000,
    competitorPlatform: 'Airbnb',
    hasDropPrice: false,
    roomsTotal: 2,
    bedroomsCount: 1,
    wallMaterial: 'wood',
    territoryType: 'private',
    bedType: 'queen_size',
    kitchenType: 'basic',
    poolType: 'shared',
    internetSpeed: 100,
    bathroomType: 'designer',
    bathroomOptions: ['tropical_shower', 'bathtub', 'garden_view'],
    amenities: ['AC', 'parking', 'workspace'],
    cleaningFrequency: '3_times_week',
    viewType: 'garden',
    extraOptions: ['quiet_location'],
    yearBuilt: 2024,
    distanceToSeaMinutes: 25,
    interiorStyle: 'bali_style',
    whatsappNumber: '+6281234567890',
    ownerName: 'Ketut Agung',
    ownerAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&q=80',
    clicksCount: 88,
    viewsCount: 720
  },
  {
    id: 'house-3',
    ownerId: 'owner-2',
    category: 'housing',
    subCategory: 'private_room',
    title: 'Modern Cozy Villa Room in Uluwatu Cliffs',
    description: 'Комната на дизайнерской вилле на вершине утеса Улувату. 3 соседа максимум. В пешей доступности лучшие серф-споты и лагуны (Padang Padang, Thomas Beach). Панорамные окна в пол, тропический душ в ванной, общий бассейн длиной 15 метров.',
    district: 'Uluwatu',
    address: 'Jl. Labuansait No.21, Uluwatu, Pecatu, Bali',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&fit=crop&q=80'
    ],
    rating: 4.7,
    reviewsCount: 8,
    isApproved: false,
    isNew: true,
    status: 'active',
    pricePerDay: 250000,
    pricePerMonth: 6000000,
    bookingComPrice: 380000,
    competitorPlatform: 'Booking',
    hasDropPrice: true,
    dropPricePerDay: 195000,
    dropPricePerMonth: 4800000,
    roomsTotal: 3,
    bedroomsCount: 1,
    wallMaterial: 'concrete',
    territoryType: 'shared',
    densityType: 'cozy',
    bedType: 'queen_size',
    kitchenType: 'basic',
    poolType: 'shared',
    internetSpeed: 150,
    bathroomType: 'modern',
    bathroomOptions: ['tropical_shower', 'stone_sink'],
    amenities: ['AC', 'smart_tv', 'parking', 'workspace'],
    cleaningFrequency: 'once_week',
    viewType: 'ocean',
    extraOptions: ['all_bills_included'],
    yearBuilt: 2025,
    distanceToSeaMinutes: 3,
    interiorStyle: 'modern',
    whatsappNumber: '+6289988776655',
    ownerName: 'Made Arta',
    ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80',
    clicksCount: 51,
    viewsCount: 410
  }
];

async function seed() {
  console.log('Starting Firestore seeding for housing_for_rent_listing...');
  for (const listing of MOCK_HOUSING_LISTINGS) {
    try {
      const docRef = doc(db, 'housing_for_rent_listing', listing.id);
      await setDoc(docRef, listing);
      console.log(`Successfully seeded: ${listing.title} (${listing.id})`);
    } catch (e) {
      console.error(`Error seeding ${listing.id}:`, e);
    }
  }
  console.log('Seeding completed!');
  process.exit(0);
}

seed();
