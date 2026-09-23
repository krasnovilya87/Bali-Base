import type { ClassifiedSpecialOption } from './classifiedSpecial';

export type EventSpecialField = {
  id: string;
  labelKey: string;
  options: ClassifiedSpecialOption[];
  multiple?: boolean;
  inputType?: 'text' | 'number' | 'time' | 'url';
};

type LocalizedLabel = { en: string; ru: string };
const labels: Record<string, LocalizedLabel> = {};
const label = (id: string, en: string, ru: string) => {
  const key = `filters.event.${id}`;
  labels[key] = { en, ru };
  return key;
};
const field = (id: string, en: string, ru: string, values: Array<[string, string, string]> = [], multiple = false): EventSpecialField => ({
  id,
  labelKey: label(`field.${id}`, en, ru),
  multiple,
  options: values.map(([value, optionEn, optionRu]) => ({ value, labelKey: label(`option.${id}.${value}`, optionEn, optionRu) }))
});
const input = (id: string, en: string, ru: string, inputType: EventSpecialField['inputType'] = 'text'): EventSpecialField => ({
  ...field(id, en, ru), inputType
});

label('commonParameters', 'General parameters', 'Общие параметры');
label('categoryParameters', 'Category parameters', 'Параметры категории');
label('publicationRequired', 'Select a publication period.', 'Выберите срок публикации.');
label('invalidDuration', 'Enter a duration from 1 to 365 days.', 'Укажите продолжительность от 1 до 365 дней.');
label('registrationUrlRequired', 'Enter a valid link for registration or tickets.', 'Укажите корректную ссылку для регистрации или покупки билета.');

export const AFISHA_PUBLICATION_DAYS: Record<string, number> = { '24_hours': 1, '3_days': 3, '1_week': 7, '2_weeks': 14, '1_month': 30 };
export const getAfishaExpirationDate = (term: unknown, now = Date.now()) => {
  const days = AFISHA_PUBLICATION_DAYS[String(term || '')];
  return days ? new Date(now + days * 86400000).toISOString() : undefined;
};

export const EVENT_START_TIME_FIELD = input('afisha_start_time', 'Start time', 'Время начала', 'time');
export const EVENT_REGISTRATION_URL_FIELD = input('afisha_registration_url', 'Registration or ticket link', 'Ссылка для регистрации или билета', 'url');

export const EVENT_COMMON_FIELDS: EventSpecialField[] = [
  field('afisha_start_period', 'Start time', 'Время начала', [
    ['morning', 'Morning (before 12:00)', 'Утро (до 12:00)'], ['day', 'Day (12:00-17:00)', 'День (12:00-17:00)'],
    ['evening', 'Evening (17:00-22:00)', 'Вечер (17:00-22:00)'], ['night', 'Night (after 22:00)', 'Ночь (после 22:00)']
  ]),
  field('afisha_language', 'Event language', 'Язык мероприятия', [
    ['english', 'English', 'English'], ['indonesian', 'Indonesian', 'Indonesia'], ['russian', 'Russian', 'Русский'],
    ['french', 'French', 'Французский'], ['german', 'German', 'Немецкий'], ['other', 'Other', 'Другой'],
    ['multilingual', 'Multilingual / any language', 'Мультиязычный / любой язык']
  ], true),
  field('afisha_age', 'Age', 'Возраст', [
    ['all', 'All ages', 'Для всех'], ['18_plus', '18+', '18+'], ['21_plus', '21+', '21+'],
    ['kids', 'For kids', 'Для детей'], ['families', 'For families', 'Для семей']
  ]),
  field('afisha_format', 'Format', 'Формат', [
    ['offline', 'Offline', 'Офлайн'], ['online', 'Online', 'Онлайн'], ['hybrid', 'Hybrid', 'Смешанный']
  ]),
  field('afisha_venue', 'Venue', 'Место проведения', [
    ['indoors', 'Indoors', 'В помещении'], ['outdoors', 'Outdoors', 'На открытом воздухе'],
    ['beach', 'On the beach', 'На пляже'], ['online', 'Online', 'Онлайн']
  ]),
  field('afisha_admission', 'Admission', 'Участие', [
    ['free', 'Free entry', 'Свободный вход'], ['registration', 'Registration required', 'Нужна регистрация'],
    ['ticket', 'Ticket required', 'Нужен билет'], ['invitation', 'By invitation', 'По приглашению']
  ]),
  field('afisha_publication_term', 'Publication period', 'Срок публикации', [
    ['24_hours', '24 hours', '24 часа'], ['3_days', '3 days', '3 дня'], ['1_week', '1 week', '1 неделя'],
    ['2_weeks', '2 weeks', '2 недели'], ['1_month', '1 month', '1 месяц']
  ])
];

export const EVENT_CATEGORY_FIELDS: Record<string, EventSpecialField[]> = {
  parties: [
    field('afisha_music_genre', 'Music genre', 'Музыкальный жанр', [
      ['house', 'House', 'House'], ['techno', 'Techno', 'Techno'], ['electronic', 'Electronic', 'Electronic'],
      ['hip_hop_rnb', 'Hip-hop / R&B', 'Hip-hop / R&B'], ['pop', 'Pop', 'Pop'], ['reggae', 'Reggae', 'Reggae'],
      ['latin', 'Latin', 'Latin'], ['live_dj', 'Live DJ', 'Live DJ'], ['mixed', 'Mixed', 'Смешанный']
    ]),
    field('afisha_party_venue', 'Venue type', 'Тип площадки', [
      ['club', 'Club', 'Клуб'], ['bar', 'Bar', 'Бар'], ['beach_club', 'Beach club', 'Beach club'],
      ['villa', 'Villa party', 'Villa party'], ['rooftop', 'Rooftop', 'Rooftop'], ['beach', 'Beach', 'На пляже']
    ]),
    field('afisha_party_format', 'Party format', 'Формат вечеринки', [
      ['dj', 'DJ party', 'DJ party'], ['pool', 'Pool party', 'Pool party'], ['sunset', 'Sunset party', 'Sunset party'],
      ['afterparty', 'Afterparty', 'Afterparty'], ['private', 'Private party', 'Private party'], ['themed', 'Themed party', 'Тематическая вечеринка']
    ])
  ],
  live_music: [
    field('afisha_concert_genre', 'Genre', 'Жанр', [
      ['rock', 'Rock', 'Rock'], ['pop', 'Pop', 'Pop'], ['jazz', 'Jazz', 'Jazz'], ['blues', 'Blues', 'Blues'],
      ['electronic', 'Electronic', 'Electronic'], ['reggae', 'Reggae', 'Reggae'], ['indie', 'Indie', 'Indie'],
      ['acoustic', 'Acoustic', 'Акустика'], ['classical', 'Classical', 'Классика'], ['world', 'World music', 'World music']
    ]),
    field('afisha_performance_format', 'Performance format', 'Формат выступления', [
      ['concert', 'Concert', 'Концерт'], ['live', 'Live music', 'Живая музыка'], ['open_mic', 'Open mic', 'Open mic'],
      ['jam', 'Jam session', 'Jam session'], ['dj_set', 'DJ set', 'DJ set']
    ]),
    field('afisha_performer', 'Performer', 'Исполнитель', [
      ['solo', 'Solo artist', 'Сольный исполнитель'], ['band', 'Band', 'Группа'], ['orchestra', 'Orchestra', 'Оркестр'],
      ['multiple', 'Multiple artists', 'Несколько артистов']
    ])
  ],
  festivals: [
    field('afisha_festival_theme', 'Festival theme', 'Тематика фестиваля', [
      ['music', 'Music', 'Музыка'], ['culture', 'Culture', 'Культура'], ['food', 'Food', 'Еда'], ['art', 'Art', 'Искусство'],
      ['cinema', 'Cinema', 'Кино'], ['wellness', 'Wellness', 'Wellness'], ['spiritual', 'Spiritual practices', 'Духовные практики'],
      ['sport', 'Sport', 'Спорт'], ['family', 'Family', 'Семейный']
    ]),
    input('afisha_festival_duration', 'Duration in days', 'Продолжительность в днях', 'number'),
    field('afisha_festival_format', 'Festival format', 'Формат фестиваля', [
      ['city', 'City', 'Городской'], ['beach', 'Beach', 'Пляжный'], ['nature', 'Nature', 'На природе'],
      ['accommodation', 'With accommodation', 'С проживанием']
    ])
  ],
  exhibitions: [
    field('afisha_art_event_type', 'Event type', 'Тип события', [
      ['exhibition', 'Exhibition', 'Выставка'], ['gallery', 'Gallery', 'Галерея'], ['art_show', 'Art show', 'Арт-шоу'],
      ['performance', 'Performance', 'Перформанс'], ['installation', 'Installation', 'Инсталляция'],
      ['opening', 'Exhibition opening', 'Открытие выставки'], ['auction', 'Auction', 'Аукцион']
    ]),
    field('afisha_art_direction', 'Art discipline', 'Направление искусства', [
      ['painting', 'Painting', 'Живопись'], ['photography', 'Photography', 'Фотография'], ['sculpture', 'Sculpture', 'Скульптура'],
      ['digital', 'Digital art', 'Digital art'], ['contemporary', 'Contemporary art', 'Современное искусство'],
      ['traditional', 'Traditional art', 'Традиционное искусство'], ['design', 'Design', 'Дизайн']
    ])
  ],
  cinema_theatre: [
    field('afisha_show_type', 'Event type', 'Тип события', [
      ['cinema', 'Cinema', 'Кино'], ['theatre', 'Theatre', 'Театр'], ['standup', 'Comedy / stand-up', 'Комедия / стендап'],
      ['musical', 'Musical', 'Мюзикл'], ['dance', 'Dance performance', 'Танцевальное представление'],
      ['open_air', 'Open-air cinema', 'Кинопоказ под открытым небом']
    ]),
    field('afisha_show_genre', 'Genre', 'Жанр', [
      ['comedy', 'Comedy', 'Комедия'], ['drama', 'Drama', 'Драма'], ['documentary', 'Documentary', 'Документальное'],
      ['horror', 'Horror', 'Ужасы'], ['family', 'Family', 'Семейное'], ['arthouse', 'Arthouse', 'Авторское кино']
    ]),
    field('afisha_show_language', 'Screening language', 'Язык показа', [
      ['english', 'English', 'English'], ['indonesian', 'Indonesian', 'Indonesia'], ['russian', 'Russian', 'Русский'],
      ['french', 'French', 'Французский'], ['german', 'German', 'Немецкий'], ['other', 'Other', 'Другой']
    ]),
    field('afisha_subtitles', 'Subtitles', 'Субтитры', [
      ['subtitles', 'With subtitles', 'С субтитрами'], ['none', 'No subtitles', 'Без субтитров']
    ])
  ],
  sports_events: [
    field('afisha_sport', 'Sport', 'Вид спорта', [
      ['surfing', 'Surfing', 'Сёрфинг'], ['padel', 'Padel', 'Падел'], ['tennis', 'Tennis', 'Теннис'],
      ['football', 'Football', 'Футбол'], ['volleyball', 'Volleyball', 'Волейбол'], ['running', 'Running', 'Бег'],
      ['cycling', 'Cycling', 'Велоспорт'], ['swimming', 'Swimming', 'Плавание'], ['martial_arts', 'Martial arts', 'Единоборства'],
      ['fitness', 'Fitness', 'Фитнес'], ['other', 'Other', 'Другое']
    ]),
    field('afisha_sport_format', 'Participation format', 'Формат участия', [
      ['watch', 'Watch', 'Посмотреть'], ['participate', 'Participate', 'Принять участие'], ['tournament', 'Tournament', 'Турнир'],
      ['competition', 'Competition', 'Соревнование'], ['group_training', 'Group training', 'Совместная тренировка'],
      ['camp', 'Sports camp', 'Спортивный лагерь']
    ]),
    field('afisha_sport_level', 'Level', 'Уровень', [
      ['any', 'Any', 'Любой'], ['beginner', 'Beginner', 'Новичок'], ['intermediate', 'Intermediate', 'Средний'],
      ['advanced', 'Advanced', 'Продвинутый'], ['professional', 'Professional', 'Профессиональный']
    ])
  ],
  workshops: [
    field('afisha_workshop_theme', 'Topic', 'Тематика', [
      ['cooking', 'Cooking', 'Кулинария'], ['art', 'Art', 'Искусство'], ['craft', 'Craft', 'Ремесло'],
      ['music', 'Music', 'Музыка'], ['dance', 'Dance', 'Танцы'], ['photography', 'Photography', 'Фотография'],
      ['beauty', 'Beauty', 'Красота'], ['business', 'Business', 'Бизнес'], ['it', 'IT and technology', 'IT и технологии'],
      ['kids', 'For kids', 'Для детей']
    ]),
    field('afisha_workshop_level', 'Level', 'Уровень подготовки', [
      ['none', 'No experience', 'Без опыта'], ['beginner', 'Beginner', 'Начальный'],
      ['intermediate', 'Intermediate', 'Средний'], ['advanced', 'Advanced', 'Продвинутый']
    ]),
    field('afisha_materials', 'Materials', 'Материалы', [
      ['included', 'Included', 'Включены'], ['extra', 'Paid separately', 'Оплачиваются отдельно'],
      ['bring_own', 'Bring your own', 'Нужно принести свои']
    ])
  ],
  yoga_wellness: [
    field('afisha_wellness_direction', 'Discipline', 'Направление', [
      ['hatha', 'Hatha', 'Hatha'], ['vinyasa', 'Vinyasa', 'Vinyasa'], ['yin', 'Yin yoga', 'Yin yoga'],
      ['ashtanga', 'Ashtanga', 'Ashtanga'], ['kundalini', 'Kundalini', 'Kundalini'], ['meditation', 'Meditation', 'Медитация'],
      ['breathwork', 'Breathwork', 'Breathwork'], ['sound_healing', 'Sound healing', 'Sound healing'],
      ['massage', 'Massage', 'Массаж'], ['spa', 'Spa', 'Спа'], ['retreat', 'Retreat', 'Ретрит']
    ]),
    field('afisha_wellness_level', 'Level', 'Уровень', [
      ['any', 'Any', 'Любой'], ['beginner', 'Beginner', 'Новичок'], ['intermediate', 'Intermediate', 'Средний'],
      ['advanced', 'Advanced', 'Продвинутый']
    ]),
    field('afisha_wellness_intensity', 'Intensity', 'Интенсивность', [
      ['low', 'Low', 'Низкая'], ['medium', 'Medium', 'Средняя'], ['high', 'High', 'Высокая']
    ])
  ],
  seminars: [
    field('afisha_business_topic', 'Topic', 'Тематика', [
      ['entrepreneurship', 'Entrepreneurship', 'Предпринимательство'], ['investments', 'Investments', 'Инвестиции'],
      ['it_startups', 'IT and startups', 'IT и стартапы'], ['marketing', 'Marketing', 'Маркетинг'],
      ['real_estate', 'Real estate', 'Недвижимость'], ['crypto', 'Cryptocurrency', 'Криптовалюты'],
      ['career', 'Career', 'Карьера'], ['creative', 'Creative industries', 'Творческие индустрии']
    ]),
    field('afisha_business_type', 'Event type', 'Тип мероприятия', [
      ['networking', 'Networking', 'Нетворкинг'], ['conference', 'Conference', 'Конференция'], ['lecture', 'Lecture', 'Лекция'],
      ['seminar', 'Seminar', 'Семинар'], ['community', 'Community meetup', 'Встреча сообщества'],
      ['pitch', 'Pitch session', 'Pitch session'], ['coworking', 'Coworking meetup', 'Coworking meetup']
    ]),
    field('afisha_business_audience', 'Audience', 'Аудитория', [
      ['all', 'Everyone', 'Для всех'], ['entrepreneurs', 'Entrepreneurs', 'Предприниматели'],
      ['investors', 'Investors', 'Инвесторы'], ['professionals', 'Professionals', 'Специалисты'],
      ['startups', 'Startups', 'Стартапы'], ['expats', 'Expats', 'Экспаты']
    ])
  ],
  family_events: [
    field('afisha_child_age', 'Child age', 'Возраст ребёнка', [
      ['0_2', '0-2 years', '0-2 года'], ['3_5', '3-5 years', '3-5 лет'], ['6_9', '6-9 years', '6-9 лет'],
      ['10_13', '10-13 years', '10-13 лет'], ['14_17', '14-17 years', '14-17 лет'], ['whole_family', 'Whole family', 'Для всей семьи']
    ]),
    field('afisha_family_type', 'Event type', 'Тип мероприятия', [
      ['party', 'Party', 'Праздник'], ['workshop', 'Workshop', 'Мастер-класс'], ['show', 'Show', 'Спектакль'],
      ['games', 'Games', 'Игры'], ['sport', 'Sport', 'Спорт'], ['education', 'Education', 'Обучение'],
      ['festival', 'Family festival', 'Семейный фестиваль']
    ]),
    field('afisha_parents', 'Parent participation', 'Участие родителей', [
      ['required', 'Required', 'Обязательно'], ['optional', 'Optional', 'Необязательно'],
      ['without', 'Without parents', 'Без родителей']
    ])
  ],
  markets_fairs: [
    field('afisha_market_type', 'Market type', 'Тип маркета', [
      ['flea', 'Flea market', 'Flea market'], ['farmers', 'Farmers market', 'Farmers market'],
      ['night', 'Night market', 'Night market'], ['art', 'Art market', 'Art market'],
      ['fashion', 'Fashion market', 'Fashion market'], ['food', 'Food market', 'Food market'],
      ['handmade', 'Handmade market', 'Handmade market'], ['charity', 'Charity fair', 'Благотворительная ярмарка']
    ]),
    field('afisha_market_goods', 'Goods', 'Категории товаров', [
      ['food', 'Food', 'Еда'], ['clothes', 'Clothing', 'Одежда'], ['jewellery', 'Jewellery', 'Украшения'],
      ['art', 'Art', 'Искусство'], ['cosmetics', 'Cosmetics', 'Косметика'], ['home', 'Home goods', 'Товары для дома'],
      ['vintage', 'Vintage', 'Винтаж'], ['kids', 'Kids goods', 'Детские товары']
    ], true)
  ],
  tours: [
    field('afisha_tour_type', 'Tour type', 'Тип экскурсии', [
      ['cultural', 'Cultural', 'Культурная'], ['nature', 'Nature', 'Природа'], ['food', 'Food', 'Гастрономическая'],
      ['water', 'Water', 'Водная'], ['other', 'Other', 'Другое']
    ]),
    input('afisha_tour_duration', 'Duration in hours', 'Продолжительность в часах', 'number'),
    field('afisha_tour_transport', 'Transport', 'Транспорт', [
      ['walking', 'Walking', 'Пешком'], ['car', 'Car', 'Автомобиль'], ['boat', 'Boat', 'Лодка'],
      ['bike', 'Bike', 'Байк'], ['other', 'Other', 'Другое']
    ]),
    field('afisha_tour_difficulty', 'Difficulty', 'Сложность', [
      ['easy', 'Easy', 'Лёгкая'], ['moderate', 'Moderate', 'Средняя'], ['hard', 'Hard', 'Сложная']
    ])
  ],
  afisha_other: []
};

export const EVENT_COMMON_FIELD_IDS = new Set(EVENT_COMMON_FIELDS.map(item => item.id));
export const EVENT_CATEGORY_FIELD_IDS = new Set(Object.values(EVENT_CATEGORY_FIELDS).flat().map(item => item.id));
export const getEventCategoryFields = (subCategory: string) => EVENT_CATEGORY_FIELDS[subCategory] || [];
export const getEventSpecialTranslations = (locale: 'en' | 'ru' | 'id' | 'de' | 'fr') => Object.fromEntries(
  Object.entries(labels).map(([key, value]) => [key, locale === 'ru' ? value.ru : value.en])
);
