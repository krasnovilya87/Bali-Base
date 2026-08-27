import { Listing, Review, BookingRequest } from './types';

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    authorName: 'Maxim S.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80',
    rating: 5.0,
    date: '2026-05-15',
    text: 'Абсолютно волшебная вилла! Полная приватность, отличный интернет (>150 Мб/с), идеальная чистота без намека на балийскую плесень. Обязательно вернусь.',
    cleanlinessLabels: ['Без плесени и запаха', 'Идеальная сантехника']
  },
  {
    id: 'rev-2',
    authorName: 'Sarah Connor',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80',
    rating: 4.8,
    date: '2026-05-20',
    text: 'Wayan was an incredible host. The location in Canggu is close to the beach but very quiet. The workspace was perfect for remote work.',
    cleanlinessLabels: ['Approved']
  },
  {
    id: 'rev-3',
    authorName: 'Wayan Putra',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80',
    rating: 4.5,
    date: '2026-05-10',
    text: 'Sangat bersih dan rapi. Tempat tidur king size sangat nyaman dan kolam renang pribadinya luar biasa.',
    cleanlinessLabels: ['Идеальная сантехника']
  }
];

type HousingSubCategory = 'entire_place' | 'private_suite' | 'private_room';

const GENERATED_HOUSING_COUNTS: Record<HousingSubCategory, number> = {
  entire_place: 18,
  private_suite: 20,
  private_room: 19
};

const GENERATED_HOUSING_START_IDS: Record<HousingSubCategory, number> = {
  entire_place: 4,
  private_suite: 22,
  private_room: 42
};

const BALI_DISTRICTS = [
  'Canggu',
  'Ubud',
  'Uluwatu',
  'Seminyak',
  'Sanur',
  'Pererenan',
  'Berawa',
  'Bingin',
  'Nusa Dua',
  'Kerobokan',
  'Jimbaran',
  'Amed',
  'Lovina',
  'Sidemen',
  'Seseh',
  'Ungasan',
  'Tabanan',
  'Kuta',
  'Denpasar',
  'Kintamani'
];

const HOUSING_IMAGE_SETS = [
  [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&fit=crop&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&fit=crop&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&fit=crop&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&fit=crop&q=80'
  ]
];

const OWNER_NAMES = [
  'Made Wirawan',
  'Kadek Sari',
  'Nyoman Pratama',
  'Komang Ayu',
  'Putu Mahendra',
  'Ketut Lestari',
  'Wayan Arimbawa',
  'Dewi Santika'
];

const createGeneratedHousingListings = (
  subCategory: HousingSubCategory,
  count: number,
  startId: number
): Listing[] => {
  const categoryLabel = {
    entire_place: 'Villa',
    private_suite: 'Apartment',
    private_room: 'Private Room'
  }[subCategory];

  const titleStyles = [
    'Tropical',
    'Modern',
    'Quiet',
    'Sunlit',
    'Garden',
    'Ocean Breeze',
    'Rice Field',
    'Minimalist',
    'Family',
    'Nomad Ready',
    'Poolside',
    'Coastal',
    'Jungle View',
    'Fresh',
    'Premium',
    'Walkable',
    'Bright',
    'Serene',
    'Compact',
    'Resort Style'
  ];

  const housingTypesByCategory: Record<HousingSubCategory, string[]> = {
    entire_place: [
      'Privet Villa (must pool)',
      'House (no pool)',
      'Bungalow (standalone unit)',
      'Privet Villa (must pool)'
    ],
    private_suite: ['Apartment Complex (privet unit)', 'Apartment Complex (privet unit)', 'Bungalow (standalone unit)'],
    private_room: [
      'Guesthouse (privet room, shared property)',
      'Villa / House (privet room)',
      'Apartment (privet room)',
      'Hotel (privet room)'
    ]
  };

  return Array.from({ length: count }, (_, index) => {
    const idNumber = startId + index;
    const district = BALI_DISTRICTS[index % BALI_DISTRICTS.length];
    const ownerName = OWNER_NAMES[index % OWNER_NAMES.length];
    const hasPrivateSpace = subCategory !== 'private_room';
    const bedroomsCount = subCategory === 'private_room' ? 1 : (index % 4) + 1;
    const roomsTotal = subCategory === 'private_room' ? (index % 4) + 4 : bedroomsCount + 2;
    const priceBase = subCategory === 'entire_place' ? 420000 : subCategory === 'private_suite' ? 280000 : 165000;
    const pricePerDay = priceBase + (index % 8) * 35000;
    const pricePerMonth = Math.round(pricePerDay * (subCategory === 'entire_place' ? 23 : 24));
    const hasDropPrice = index % 3 === 0;
    const poolType = subCategory === 'private_room'
      ? (index % 4 === 0 ? 'none' : 'shared')
      : (index % 3 === 0 ? 'private' : index % 3 === 1 ? 'shared' : 'infinity');
    const kitchenType = subCategory === 'private_room'
      ? (index % 5 === 0 ? 'none' : 'basic')
      : (subCategory === 'private_suite' ? 'private_equipped' : 'equipped');
    const viewTypes = ['rice_fields', 'garden', 'pool', 'ocean', 'jungle'] as const;
    const interiorStyles = ['basic', 'bali_style', 'modern', 'luxury'] as const;
    const cleaningFrequencies = ['once_week', '2_times_week', '3_times_week', 'daily'] as const;
    const title = `${titleStyles[index % titleStyles.length]} ${district} ${categoryLabel}`;

    return {
      id: `house-${idNumber}`,
      ownerId: `owner-${(index % 8) + 4}`,
      category: 'housing',
      subCategory,
      title,
      description: `${title} with reliable internet, clear pricing, and practical access to cafes, beaches, gyms, and daily essentials. The space is prepared for comfortable stays in Bali, with clean rooms, good airflow, and responsive local support.`,
      district,
      address: `Jl. Bali Base ${idNumber}, ${district}, Bali`,
      images: HOUSING_IMAGE_SETS[index % HOUSING_IMAGE_SETS.length],
      rating: Number((4.55 + (index % 9) * 0.04).toFixed(1)),
      reviewsCount: 6 + index * 2,
      reviews: index % 2 === 0 ? [MOCK_REVIEWS[index % MOCK_REVIEWS.length]] : [],
      isApproved: index % 7 !== 0,
      isVerified: index % 4 === 0,
      isNew: index % 5 < 2,
      status: 'active',
      pricePerDay,
      pricePerMonth,
      bookingComPrice: pricePerDay + 120000 + (index % 4) * 25000,
      competitorPlatform: ['Booking', 'Airbnb', 'Agoda', 'Traveloka'][index % 4] as Listing['competitorPlatform'],
      hasDropPrice,
      dropPricePerDay: hasDropPrice ? pricePerDay - 45000 : undefined,
      dropPricePerMonth: hasDropPrice ? pricePerMonth - 900000 : undefined,
      dropPriceEndsAt: hasDropPrice ? new Date(Date.now() + 86400000 * ((index % 5) + 1)).toISOString() : undefined,
      roomsTotal,
      bedroomsCount,
      wallMaterial: index % 5 === 0 ? 'wood' : 'concrete',
      territoryType: hasPrivateSpace ? (index % 6 === 0 ? 'resort' : 'private') : 'shared',
      densityType: subCategory === 'private_room' ? (index % 3 === 0 ? 'medium' : 'cozy') : undefined,
      bedType: index % 3 === 0 ? 'king_size' : 'queen_size',
      bedTypes: index % 4 === 0 ? ['queen_size', 'single_bed'] : undefined,
      roomType: subCategory === 'private_room' ? (['standard', 'deluxe', 'super_deluxe', 'family'][index % 4] as Listing['roomType']) : undefined,
      unitType: subCategory !== 'private_room' ? (['type_1', 'type_2', 'type_3', 'type_4'][index % 4] as Listing['unitType']) : undefined,
      kitchenType,
      poolType,
      internetSpeed: 80 + (index % 7) * 25,
      bathroomType: (['standard', 'modern', 'designer'][index % 3] as Listing['bathroomType']),
      bathroomOptions: index % 2 === 0 ? ['tropical_shower', 'stone_sink'] : ['tropical_shower', 'garden_view'],
      amenities: [
        'AC',
        'parking',
        'workspace',
        ...(index % 2 === 0 ? ['smart_tv'] : []),
        ...(subCategory !== 'private_room' ? ['washing_machine'] : [])
      ],
      cleaningFrequency: cleaningFrequencies[index % cleaningFrequencies.length],
      viewType: viewTypes[index % viewTypes.length],
      extraOptions: [
        ...(index % 2 === 0 ? ['quiet_location'] : []),
        ...(index % 3 === 0 ? ['all_bills_included'] : []),
        ...(index % 5 === 0 ? ['breakfast_paid'] : [])
      ],
      yearBuilt: 2020 + (index % 6),
      yearRenovated: index % 3 === 0 ? 2025 : undefined,
      distanceToSeaMinutes: 3 + (index % 12),
      interiorStyle: interiorStyles[index % interiorStyles.length],
      housingType: housingTypesByCategory[subCategory][index % housingTypesByCategory[subCategory].length],
      area: subCategory === 'private_room' ? 22 + (index % 8) * 4 : 58 + (index % 10) * 18,
      whatsappNumber: `+62812${String(34000000 + idNumber).padStart(8, '0')}`,
      ownerName,
      ownerAvatar: `https://images.unsplash.com/photo-${index % 2 === 0 ? '1500648767791-00dcc994a43e' : '1535713875002-d1d0cf377fde'}?w=100&h=100&fit=crop&q=80`,
      clicksCount: 35 + index * 11,
      viewsCount: 260 + index * 74,
      isPromoTop: index % 11 === 0,
      isPromoPremium: index % 13 === 0
    };
  });
};

const buildGeneratedHousingListings = (): Listing[] => [
  ...createGeneratedHousingListings('entire_place', GENERATED_HOUSING_COUNTS.entire_place, GENERATED_HOUSING_START_IDS.entire_place),
  ...createGeneratedHousingListings('private_suite', GENERATED_HOUSING_COUNTS.private_suite, GENERATED_HOUSING_START_IDS.private_suite),
  ...createGeneratedHousingListings('private_room', GENERATED_HOUSING_COUNTS.private_room, GENERATED_HOUSING_START_IDS.private_room)
];

export const MOCK_HOUSING_LISTINGS: Listing[] = [
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
    reviews: MOCK_REVIEWS,
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
    dropPriceEndsAt: new Date(Date.now() + 86400000 * 2.5).toISOString(), // 2.5 days from now
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
    extraOptions: ['pets_allowed', 'quiet_location', 'all_bills_included'],
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
    reviews: [MOCK_REVIEWS[1]],
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
    reviews: [MOCK_REVIEWS[0], MOCK_REVIEWS[2]],
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
    dropPriceEndsAt: new Date(Date.now() + 86400000 * 1.2).toISOString(),
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
  },
  ...buildGeneratedHousingListings()
];

export const MOCK_OTHER_LISTINGS: Listing[] = [
  {
    id: 'trans-1',
    ownerId: 'owner-1',
    category: 'transport',
    subCategory: 'scooters',
    title: 'Yamaha NMAX 2023 Premium Black Edition',
    description: 'Надежный городской скутер Yamaha NMAX 155cc с ABS, высоким лобовым стеклом и удобным креплением для серфа. Полностью обслужен, идеальный ремень и свежая резина. Скидка на аренду от месяца!',
    district: 'Canggu',
    address: 'Jl. Pantai Batu Mejan, Canggu, Bali',
    images: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&fit=crop&q=80'
    ],
    rating: 4.8,
    reviewsCount: 12,
    reviews: [],
    isApproved: true,
    isNew: false,
    status: 'active',
    pricePerDay: 130000,
    pricePerMonth: 2200000,
    bookingComPrice: 190000,
    competitorPlatform: 'Agoda',
    hasDropPrice: true,
    dropPricePerDay: 110000,
    dropPricePerMonth: 1900000,
    dropPriceEndsAt: new Date(Date.now() + 86400000 * 3.5).toISOString(),
    yearBuilt: 2023,
    amenities: ['helmet_included', 'phone_mount', 'surf_rack'],
    whatsappNumber: '+6281234567890',
    ownerName: 'Wayan Bikes Rental',
    clicksCount: 304,
    viewsCount: 1450,
    interiorStyle: 'modern'
  },
  {
    id: 'trans-2',
    ownerId: 'owner-3',
    category: 'transport',
    subCategory: 'motorcycles',
    title: 'Custom Cafe Racer Classic 250cc',
    description: 'Премиальный кастомный байк для ценителей классического стиля и атмосферных поездок по острову. Мощный глушитель с сочным басом, идеальное кожаное сиденье. Прекрасно подходит для съемок и долгих трипов в Кинтамани.',
    district: 'Seminyak',
    address: 'Jl. Raya Seminyak, Bali',
    images: [
      'https://images.unsplash.com/photo-1615887023516-9b6bcd559e87?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=800&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewsCount: 5,
    reviews: [],
    isApproved: true,
    isNew: true,
    status: 'active',
    pricePerDay: 350000,
    pricePerMonth: 7500000,
    bookingComPrice: 420000,
    competitorPlatform: 'Booking',
    hasDropPrice: false,
    yearBuilt: 2024,
    amenities: ['helmet_included', 'retro_look'],
    whatsappNumber: '+6287755331122',
    ownerName: 'Retro Wheels Bali',
    clicksCount: 45,
    viewsCount: 380,
    interiorStyle: 'luxury'
  },
  {
    id: 'srv-1',
    ownerId: 'owner-4',
    category: 'services',
    subCategory: 'sport',
    title: 'Индивидуальные уроки серфинга от Pro-инструктора',
    description: 'Прогрессируйте на Бали быстрее и без травм! Обучение от сертифицированного тренера с видеоразбором каждой волны. Все споты Чангу, Семиньяка и Букита. Аренда доски и рашгарда включена.',
    district: 'Canggu',
    address: 'Batu Bolong Surf Spot, Bali',
    images: [
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=800&fit=crop&q=80'
    ],
    rating: 5.0,
    reviewsCount: 42,
    reviews: [],
    isApproved: true,
    isNew: false,
    status: 'active',
    pricePerDay: 450000, // 300k normal
    bookingComPrice: 650000,
    competitorPlatform: 'Booking',
    hasDropPrice: true,
    dropPricePerDay: 380000,
    dropPriceEndsAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    yearBuilt: 2024,
    whatsappNumber: '+6281313131313',
    ownerName: 'Serega Surf School',
    clicksCount: 198,
    viewsCount: 920,
    interiorStyle: 'basic'
  },
  {
    id: 'ad-1',
    ownerId: 'owner-2',
    category: 'ads',
    subCategory: 'electronics',
    title: 'Sony Alpha 7 IV + LENS 28-70mm (Идеальное состояние)',
    description: 'Продаю личную топовую беззеркалку Sony A7 IV. Использовалась только для бережной домашней контент-съемки, коробка, чек, 1 хозяин. Пробег затвора всего 4k кадров. Бонусом отдам быструю флешку на 128Gb.',
    district: 'Ubud',
    address: 'Jl. Hanoman, Ubud, Bali',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&fit=crop&q=80'
    ],
    rating: 4.6,
    reviewsCount: 3,
    reviews: [],
    isApproved: false,
    isNew: false,
    status: 'active',
    pricePerDay: 21000000, // For sale category, dayprice represents entire price
    bookingComPrice: 24500000,
    competitorPlatform: 'Booking',
    hasDropPrice: false,
    yearBuilt: 2023,
    whatsappNumber: '+6289988776655',
    ownerName: 'Dmitry Tech',
    clicksCount: 12,
    viewsCount: 98,
    interiorStyle: 'modern'
  },
  {
    id: 'afisha-1',
    ownerId: 'owner-5',
    category: 'afisha',
    subCategory: 'festivals',
    title: 'Sunset Beach Electronic Music Festival 2026',
    description: 'Главное событие сезона на побережье Uluwatu! Именитые европейские диджеи, грандиозное лазерное шоу над океаном, вкуснейшие коктейли и лучшие закаты Бали. Торопитесь, лимитированная серия early bird билетов!',
    district: 'Uluwatu',
    address: 'Savaya Club, Uluwatu, Bali',
    images: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewsCount: 55,
    reviews: [],
    isApproved: true,
    isNew: true,
    status: 'active',
    pricePerDay: 600000, // Ticket price
    bookingComPrice: 850000,
    competitorPlatform: 'Booking',
    hasDropPrice: true,
    dropPricePerDay: 490000,
    dropPriceEndsAt: new Date(Date.now() + 86400000 * 0.8).toISOString(),
    yearBuilt: 2026,
    whatsappNumber: '+6281112223334',
    ownerName: 'Savaya Bali',
    clicksCount: 420,
    viewsCount: 3500,
    interiorStyle: 'luxury'
  },
  {
    id: 'life-1',
    ownerId: 'owner-6',
    category: 'life',
    subCategory: 'meetings',
    title: 'Поиск попутчиков: Поездка на вулканы Батур и Агунг',
    description: 'Привет! Собираем небольшую компанию на байках или комфортных авто для совместного восхождения на вулкан Батур для встречи невероятного рассвета. Стартуем из Чангу в 2:00 ночи. Опыт трекинга не важен.',
    district: 'Ubud',
    address: 'Mount Batur Trekking Starting Point',
    images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop&q=80'
    ],
    rating: 4.0,
    reviewsCount: 0,
    reviews: [],
    isApproved: false,
    isNew: true,
    status: 'active',
    pricePerDay: 50000, // Shared organization cost
    hasDropPrice: false,
    yearBuilt: 2026,
    whatsappNumber: '+6285511223344',
    ownerName: 'Nastasya Trip',
    clicksCount: 38,
    viewsCount: 290,
    interiorStyle: 'basic'
  },
  {
    id: 'inv-1',
    ownerId: 'owner-3',
    category: 'investments',
    subCategory: 'villas',
    title: 'Шикарный инвест-проект: Вилла в Чангу с 14.5% ROI',
    description: 'Полностью готовая под ключ премиум вилла в самом востребованном районе Бали — Чангу. Управляющая компания берет на себя всю операционную деятельность. Прогнозируемая доходность от сдачи в аренду составляет 14.5% годовых.',
    district: 'Canggu',
    address: 'Jl. Pantai Batu Bolong, Canggu, Bali',
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewsCount: 0,
    reviews: [],
    isApproved: true,
    isNew: true,
    status: 'active',
    pricePerDay: 4800000,
    pricePerMonth: 125000000,
    hasDropPrice: false,
    yearBuilt: 2025,
    whatsappNumber: '+6287755331122',
    ownerName: 'Bali Golden Investments',
    clicksCount: 92,
    viewsCount: 650,
    interiorStyle: 'luxury'
  },
  {
    id: 'inv-2',
    ownerId: 'owner-4',
    category: 'investments',
    subCategory: 'land',
    title: 'Панорамный участок земли под застройку, Улувату Cliffside',
    description: 'Уникальное инвестиционное предложение! Превосходный земельный участок на первой береговой линии у скалы в Улувату. Назначение земли — туристическая застройка (Pink zone). Получено разрешение на строительство комплекса вилл.',
    district: 'Uluwatu',
    address: 'Uluwatu Cliffside, Bali',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop&q=80'
    ],
    rating: 5.0,
    reviewsCount: 0,
    reviews: [],
    isApproved: true,
    isNew: false,
    status: 'active',
    pricePerDay: 15000000,
    pricePerMonth: 450000000,
    hasDropPrice: false,
    yearBuilt: 2026,
    whatsappNumber: '+6281313131313',
    ownerName: 'Vayan Land Holdings',
    clicksCount: 124,
    viewsCount: 880,
    interiorStyle: 'modern'
  },
  {
    id: 'inv-3',
    ownerId: 'owner-5',
    category: 'investments',
    subCategory: 'business',
    title: 'Готовый прибыльный ресторан в бохо-стиле, Убуд',
    description: 'Продается успешный действующий ресторан азиатской и европейской кухни в туристическом центре Убуда. Полностью укомплектован профессиональным оборудованием, штатом сотрудников и налаженной цепочкой поставок продуктов.',
    district: 'Ubud',
    address: 'Jl. Raya Ubud, Bali',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&fit=crop&q=80'
    ],
    rating: 4.8,
    reviewsCount: 0,
    reviews: [],
    isApproved: true,
    isNew: true,
    status: 'active',
    pricePerDay: 7500000,
    pricePerMonth: 180000000,
    hasDropPrice: false,
    yearBuilt: 2024,
    whatsappNumber: '+6281112223334',
    ownerName: 'Kadek Premium Business Broker',
    clicksCount: 56,
    viewsCount: 310,
    interiorStyle: 'luxury'
  }
];

export const MOCK_BOOKINGS: BookingRequest[] = [
  {
    id: 'bk-1',
    listingId: 'house-1',
    listingTitle: 'Wayan Guesthouse & Boho Villa Premium',
    listingImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=100&fit=crop&q=80',
    listingCategory: 'housing',
    guestName: 'Алексей Иванов',
    guestPhone: '+79112223344',
    startDate: '2026-06-10',
    endDate: '2026-06-15',
    totalDays: 5,
    totalPrice: 2250000,
    status: 'pending',
    createdAt: '2026-06-01T10:30:00Z'
  },
  {
    id: 'bk-2',
    listingId: 'house-2',
    listingTitle: 'Ubud Jungle Sanctuary Bamboo Bungalow',
    listingImage: 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=100&fit=crop&q=80',
    listingCategory: 'housing',
    guestName: 'Emily Watson',
    guestPhone: '+1415998822',
    startDate: '2026-06-12',
    endDate: '2026-06-14',
    totalDays: 2,
    totalPrice: 800000,
    status: 'accepted',
    createdAt: '2026-05-30T14:15:00Z'
  },
  {
    id: 'bk-3',
    listingId: 'trans-1',
    listingTitle: 'Yamaha NMAX 2023 Premium Black Edition',
    listingImage: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=100&fit=crop&q=80',
    listingCategory: 'transport',
    guestName: 'Михаил Смирнов',
    guestPhone: '+79223334455',
    startDate: '2026-06-05',
    endDate: '2026-07-05',
    totalDays: 30,
    totalPrice: 1900000,
    status: 'pending',
    createdAt: '2026-06-01T12:00:00Z'
  }
];

export const MOCK_GUIDES = [
  {
    id: 'guide-1',
    title: 'Кто такой Ваян? Как разбираться в именах балийцев',
    category: 'Полезная информация',
    slug: 'who-is-wayan',
    image: 'https://images.unsplash.com/photo-1536697246787-1f7ae568d89a?w=400&fit=crop&q=80',
    description: 'Если вы живете на Бали дольше двух дней, вас окружают Ваяны, Кадеки, Маде и Ньоманы. Разбираемся в кастовой системе имен балийцев, чтобы сразу понимать, кто перед вами.'
  },
  {
    id: 'guide-2',
    title: 'Аренда байка на Бали без штрафов, обмана и царапин',
    category: 'Транспортная безопасность',
    slug: 'bali-scooter-rental-tips',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&fit=crop&q=80',
    description: 'Пошаговый гид по безопасному найму мототехники в 2026 году. Международные права, подводные камни со страховкой, фотофиксация царапин и общение на дорогах с полицией.'
  },
  {
    id: 'guide-3',
    title: 'Топ-5 абсолютно секретных диких пляжей полуострова Букит',
    category: 'Локации',
    slug: 'secret-beaches-bukit',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&fit=crop&q=80',
    description: 'Где спрятаться от толпы в Чангу? Лагуны с белейшим песком, бирюзовой чистейшей водой и абсолютным отсутствием коммерции. Координаты, время отливов и доступность на байке.'
  }
];

const LEGACY_LISTINGS_CACHE_KEY = 'bali_base_listings';
const LEGACY_BOOKINGS_CACHE_KEY = 'bali_base_bookings';
const STATIC_LISTINGS_CACHE_KEY = 'bali_base_static_listings_cache';
const DELETED_LISTING_IDS_KEY = 'bali_base_deleted_listing_ids';

const DYNAMIC_LISTING_FIELDS = [
  'status',
  'expirationDate',
  'pricePerDay',
  'pricePerMonth',
  'bookingComPrice',
  'competitorPlatform',
  'competitorUrl',
  'hasDropPrice',
  'dropPricePerDay',
  'dropPricePerMonth',
  'dropPriceEndsAt',
  'blockedDates',
  'isApproved',
  'isNew',
  'rating',
  'reviewsCount',
  'reviews',
  'clicksCount',
  'viewsCount',
  'isPromoTop',
  'isPromoPremium',
  'isPromoTurbo',
  'pushedAt',
  'reachMultiplier',
  'googleReviewsUpdatedAt',
  'nearbySpots',
  'nearbySpotsUpdatedAt',
  'nearbySpotsStatus',
  'nearbySpotsError'
] as const;

const stripDynamicListingFields = (listing: Listing) => {
  const staticListing: Record<string, unknown> = { ...listing };
  DYNAMIC_LISTING_FIELDS.forEach(field => {
    delete staticListing[field];
  });
  return staticListing;
};

const readDeletedListingIds = () => {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const parsed = JSON.parse(localStorage.getItem(DELETED_LISTING_IDS_KEY) || '[]') as string[];
    return new Set(parsed);
  } catch {
    return new Set<string>();
  }
};

export const filterDeletedListings = (listings: Listing[]) => {
  const deletedIds = readDeletedListingIds();
  if (deletedIds.size === 0) return listings;
  return listings.filter(listing => !deletedIds.has(listing.id));
};

export const rememberDeletedListingId = (listingId: string) => {
  if (typeof window === 'undefined') return;

  const deletedIds = readDeletedListingIds();
  deletedIds.add(listingId);
  localStorage.setItem(DELETED_LISTING_IDS_KEY, JSON.stringify(Array.from(deletedIds)));
};

// Helper to load startup state. Dynamic listing data is server-owned and must not be restored from localStorage.
export const getStoredData = () => {
  if (typeof window === 'undefined') return { listings: [], bookings: [] };

  localStorage.removeItem(LEGACY_LISTINGS_CACHE_KEY);
  localStorage.removeItem(LEGACY_BOOKINGS_CACHE_KEY);

  return { listings: [], bookings: [] };
};

export const saveStoredData = (listings: Listing[], bookings: BookingRequest[]) => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LEGACY_LISTINGS_CACHE_KEY);
  localStorage.removeItem(LEGACY_BOOKINGS_CACHE_KEY);
  localStorage.setItem(STATIC_LISTINGS_CACHE_KEY, JSON.stringify(listings.map(stripDynamicListingFields)));
};
