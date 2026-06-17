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

export const defaultSubcategoriesMap: Record<string, Array<{ id: string; label: string; icon: string }>> = {
  housing: [
    { id: 'entire_place', label: 'Частная Вилла / Дом', icon: '🏡' },
    { id: 'private_suite', label: 'Апартаменты', icon: '🏢' },
    { id: 'private_room', label: 'Частная комната', icon: '🛌' }
  ],
  transport: [
    { id: 'scooters', label: 'Скутеры', icon: '🛵' },
    { id: 'motorcycles', label: 'Мотоциклы', icon: '🏍' },
    { id: 'cars', label: 'Автомобили', icon: '🚗' }
  ],
  investments: [
    { id: 'villas', label: 'Виллы & Апартаменты', icon: '🏢' },
    { id: 'land', label: 'Участки Земли', icon: '🏝' },
    { id: 'business', label: 'Готовый Бизнес', icon: '💼' }
  ],
  services: [
    { id: 'for_leisure', label: 'Для отдыха & Серфинг', icon: '🏄‍♂️' },
    { id: 'for_living', label: 'Для жизни & Консультации', icon: '💼' }
  ],
  ads: [
    { id: 'electronics', label: 'Электроника & Фото', icon: '🔌' },
    { id: 'trans_sale', label: 'Транспорт продажа', icon: '🏍' },
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
