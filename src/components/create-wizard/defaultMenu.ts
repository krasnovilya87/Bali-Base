// @ts-ignore
import menuL2Scooters from '../../assets/images/menu_l2_scooters_firebase.webp';
// @ts-ignore
import menuL2Motorcycles from '../../assets/images/menu_l2_motorcycles_firebase.webp';
// @ts-ignore
import menuL2Cars from '../../assets/images/menu_l2_cars_firebase.webp';

export const defaultCategoriesList = [
  { id: 'housing', label: 'Жилье', icon: '🏡', desc: 'Виллы, апартаменты, дома' },
  { id: 'transport', label: 'Транспорт', icon: '🛵', desc: 'Скутеры, байки, авто' },
  { id: 'investments', label: 'Инвестиции', icon: '🏢', desc: 'Виллы, земля, готовые бизнесы на Бали с высокой окупаемостью' },
  { id: 'services', label: 'Услуги', icon: '🧑‍💼', desc: 'Серфинг, визы, трансферы' },
  { id: 'ads', label: 'Объявления', icon: '📢', desc: 'Продажа личных вещей' },
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
    { id: 'villas', label: 'Виллы & Апартаменты', icon: '🏢' },
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
    { id: 'electronics', label: 'Электроника & Фото', icon: '🔌' },
    { id: 'trans_sale', label: 'Транспорт продажа', icon: '🛵' },
    { id: 'clothes', label: 'Одежда и личные вещи', icon: '👕' },
    { id: 'house_furn', label: 'Дом и интерьер', icon: '🏡' }
  ],
  afisha: [
    { id: 'festivals', label: 'Фестивали & Вечеринки', icon: '🎉' },
    { id: 'seminars', label: 'Бизнес-семинары', icon: '💼' },
    { id: 'exhibitions', label: 'Выставки & Детские', icon: '🎨' }
  ],
  life: [
    { id: 'meetings', label: 'Встречи & Воркаут', icon: '💬' },
    { id: 'buddies', label: 'Попутчики & Поездки', icon: '🛵' }
  ],
  useful: []
};
