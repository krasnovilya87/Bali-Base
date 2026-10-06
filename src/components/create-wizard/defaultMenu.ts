// @ts-ignore
import menuL2Scooters from '../../assets/images/menu/l2/transport/menu_l2_scooters_firebase.webp';
// @ts-ignore
import menuL2Motorcycles from '../../assets/images/menu/l2/transport/menu_l2_motorcycles_firebase.webp';
// @ts-ignore
import menuL2ServiceHousehold from '../../assets/images/menu/l2/services/menu_l2_service_household.webp';
// @ts-ignore
import menuL2ServiceConsultations from '../../assets/images/menu/l2/services/menu_l2_service_consultations.webp';
// @ts-ignore
import menuL2ServiceBusiness from '../../assets/images/menu/l2/services/menu_l2_service_business.webp';
// @ts-ignore
import menuL2ServiceTransport from '../../assets/images/menu/l2/services/menu_l2_service_transport.webp';
// @ts-ignore
import menuL2KidsGoods from '../../assets/images/menu/l2/market/menu_l2_kids_goods.webp';
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
    { id: 'cars', label: 'Автомобили', icon: '' }
  ],
  investments: [
    { id: 'villas', label: 'Жилая недвижимость', icon: '🏢' },
    { id: 'commercial_real_estate', label: 'Коммерческая недвижимость', icon: '🏬' },
    { id: 'land', label: 'Участки Земли', icon: '🏝' },
    { id: 'business', label: 'Готовый Бизнес', icon: '💼' }
  ],
  services: [
    { id: 'household_services', label: 'Бытовые услуги', icon: '🧰', customImage: menuL2ServiceHousehold },
    { id: 'beauty_care', label: 'Красота и уход', icon: '✨' },
    { id: 'health', label: 'Здоровье', icon: '🩺' },
    { id: 'education', label: 'Обучение', icon: '📚' },
    { id: 'sport', label: 'Спорт', icon: '🏄‍♂️' },
    { id: 'photo_video', label: 'Фото и видео', icon: '📷' },
    { id: 'consultations', label: 'Консультации', icon: '💡', customImage: menuL2ServiceConsultations },
    { id: 'service_business', label: 'Бизнес', icon: '💼', customImage: menuL2ServiceBusiness },
    { id: 'service_transport', label: 'Транспорт', icon: '🛵', customImage: menuL2ServiceTransport },
    { id: 'other_services', label: 'Другие услуги', icon: '⭐' }
  ],
  ads: [
    { id: 'electronics', label: 'Электроника', icon: '🔌' },
    { id: 'ads_transport', label: 'Транспорт', icon: '🛵' },
    { id: 'home_living', label: 'Дом и быт', icon: '🏡' },
    { id: 'clothes_items', label: 'Одежда и вещи', icon: '👕' },
    { id: 'sport_hobby', label: 'Спорт и хобби', icon: '🏄‍♂️' },
    { id: 'kids_goods', label: 'Детские товары', icon: '', customImage: menuL2KidsGoods },
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
  useful: SUBCATEGORIES_MAP.useful
};
