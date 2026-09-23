// @ts-ignore
import menuL2Scooters from '../../assets/images/menu_l2_scooters_firebase.webp';
// @ts-ignore
import menuL2Motorcycles from '../../assets/images/menu_l2_motorcycles_firebase.webp';
// @ts-ignore
import menuL2Cars from '../../assets/images/menu_l2_cars_firebase.webp';
import { SUBCATEGORIES_MAP } from '../../app/menu';

export const defaultCategoriesList = [
  { id: 'housing', label: 'Жилье', icon: '🏡', desc: 'Виллы, апартаменты, дома' },
  { id: 'transport', label: 'Транспорт', icon: '🛵', desc: 'Скутеры, байки, авто' },
  { id: 'investments', label: 'Инвестиции', icon: '🏢', desc: 'Виллы, земля, готовые бизнесы на Бали с высокой окупаемостью' },
  { id: 'services', label: 'Услуги', icon: '🧑‍💼', desc: 'Серфинг, визы, трансферы' },
  { id: 'ads', label: 'Market', icon: '📢', desc: 'Продажа личных вещей' },
  { id: 'afisha', label: 'Афиша', icon: '🎉', desc: 'Мероприятия и встречи' },
  { id: 'life', label: 'Жизнь', icon: '💬', desc: 'Попутчики, тусовка, спорт' },
  { id: 'useful', label: 'Полезное', icon: '🧭', desc: 'Гайды, советы, разное' }
];

export const defaultSubcategoriesMap: Record<string, Array<{ id: string; label: string; icon: string; customImage?: string }>> = {
  housing: [
    { id: 'entire_place', label: 'Вилла / Дом', icon: '🏡' },
    { id: 'private_suite', label: 'Апартаменты', icon: '🏢' },
    { id: 'private_room', label: 'Комната', icon: '🛌' }
  ],
  transport: [
    { id: 'scooters', label: 'Скутеры', icon: '🛵', customImage: menuL2Scooters },
    { id: 'motorcycles', label: 'Мотоциклы', icon: '🏍', customImage: menuL2Motorcycles },
    { id: 'cars', label: 'Автомобили', icon: '🚗', customImage: menuL2Cars }
  ],
  investments: [
    { id: 'villas', label: 'Жилая недвижимость', icon: '🏢' },
    { id: 'commercial_real_estate', label: 'Коммерческая недвижимость', icon: '🏬' },
    { id: 'land', label: 'Участки Земли', icon: '🏝' },
    { id: 'business', label: 'Готовый Бизнес', icon: '💼' }
  ],
  services: [
    { id: 'household_services', label: 'Бытовые услуги', icon: '🧰' },
    { id: 'beauty_care', label: 'Красота и уход', icon: '✨' },
    { id: 'health', label: 'Здоровье', icon: '🩺' },
    { id: 'education', label: 'Обучение', icon: '📚' },
    { id: 'sport', label: 'Спорт', icon: '🏄‍♂️' },
    { id: 'photo_video', label: 'Фото и видео', icon: '📷' },
    { id: 'consultations', label: 'Консультации', icon: '💡' },
    { id: 'service_business', label: 'Бизнес', icon: '💼' },
    { id: 'service_transport', label: 'Транспорт', icon: '🛵' },
    { id: 'other_services', label: 'Другие услуги', icon: '⭐' }
  ],
  ads: [
    { id: 'electronics', label: 'Электроника', icon: '🔌' },
    { id: 'ads_transport', label: 'Транспорт', icon: '🛵' },
    { id: 'home_living', label: 'Дом и быт', icon: '🏡' },
    { id: 'clothes_items', label: 'Одежда и вещи', icon: '👕' },
    { id: 'sport_hobby', label: 'Спорт и хобби', icon: '🏄‍♂️' },
    { id: 'kids_goods', label: 'Детские товары', icon: '🧸' },
    { id: 'other_ads', label: 'Другое', icon: '⭐' }
  ],
  afisha: SUBCATEGORIES_MAP.afisha,
  life: [
    { id: 'life_company', label: 'Looking for company', icon: '🛵' },
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
