import type { Listing } from '../types';

type Locale = 'en' | 'ru' | 'id' | 'de' | 'fr';
type LocalizedLabel = { en: string; ru: string; id?: string; de?: string; fr?: string };
type LifeOption = { value: string; labelKey: string; flag?: string };
export type LifeField = { id: string; labelKey: string; options: LifeOption[]; multiple?: boolean; inputType?: 'text' | 'number' };

export const LIFE_EXPENSE_PER_PERSON_KEY = 'life_expense_per_person';

export const getLifeExpensePerPerson = (listing: Listing): number | null => {
  const value = listing.classifiedAttributes?.[LIFE_EXPENSE_PER_PERSON_KEY];
  const amount = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

export const formatLifeExpensePerPerson = (amount: number, currencyRate: number, currencySymbol: string) =>
  `${amount === 0 ? '' : '≈ '}${Math.round(amount * currencyRate).toLocaleString('ru-RU')} ${currencySymbol}`;

const labels: Record<string, LocalizedLabel> = {};
const label = (key: string, en: string, ru: string, translations: Partial<Pick<LocalizedLabel, 'id' | 'de' | 'fr'>> = {}) => {
  labels[key] = { en, ru, ...translations };
  return key;
};

label('filters.life.meeting.date', 'Date', 'Дата', { id: 'Tanggal', de: 'Datum', fr: 'Date' });
label('filters.life.meeting.time', 'Time', 'Время', { id: 'Waktu', de: 'Uhrzeit', fr: 'Heure' });
label('filters.life.meeting.format', 'Format', 'Формат', { id: 'Format', de: 'Format', fr: 'Format' });
label('filters.life.meeting.once', 'One time', 'Один раз', { id: 'Sekali', de: 'Einmal', fr: 'Une fois' });
label('filters.life.meeting.regular', 'Regularly', 'Регулярно', { id: 'Rutin', de: 'Regelmäßig', fr: 'Régulièrement' });
label('filters.life.meeting.weekdays', 'Days of the week', 'Дни недели', { id: 'Hari dalam seminggu', de: 'Wochentage', fr: 'Jours de la semaine' });
label('filters.life.meeting.maxParticipants', 'Maximum participants', 'Максимальное количество участников', { id: 'Jumlah peserta maksimum', de: 'Maximale Teilnehmerzahl', fr: 'Nombre maximal de participants' });
label('filters.life.meeting.invalidParticipants', 'Enter a positive whole number of participants.', 'Укажите целое число участников больше нуля.', { id: 'Masukkan jumlah peserta bulat lebih dari nol.', de: 'Geben Sie eine positive ganze Teilnehmerzahl ein.', fr: 'Indiquez un nombre entier positif de participants.' });
label('details.life.weekdays', 'Days', 'Дни', { id: 'Hari', de: 'Tage', fr: 'Jours' });

export const LIFE_WEEKDAYS = [
  { value: 'mon', labelKey: label('filters.life.meeting.weekday.mon', 'Monday', 'Понедельник', { id: 'Senin', de: 'Montag', fr: 'Lundi' }) },
  { value: 'tue', labelKey: label('filters.life.meeting.weekday.tue', 'Tuesday', 'Вторник', { id: 'Selasa', de: 'Dienstag', fr: 'Mardi' }) },
  { value: 'wed', labelKey: label('filters.life.meeting.weekday.wed', 'Wednesday', 'Среда', { id: 'Rabu', de: 'Mittwoch', fr: 'Mercredi' }) },
  { value: 'thu', labelKey: label('filters.life.meeting.weekday.thu', 'Thursday', 'Четверг', { id: 'Kamis', de: 'Donnerstag', fr: 'Jeudi' }) },
  { value: 'fri', labelKey: label('filters.life.meeting.weekday.fri', 'Friday', 'Пятница', { id: 'Jumat', de: 'Freitag', fr: 'Vendredi' }) },
  { value: 'sat', labelKey: label('filters.life.meeting.weekday.sat', 'Saturday', 'Суббота', { id: 'Sabtu', de: 'Samstag', fr: 'Samedi' }) },
  { value: 'sun', labelKey: label('filters.life.meeting.weekday.sun', 'Sunday', 'Воскресенье', { id: 'Minggu', de: 'Sonntag', fr: 'Dimanche' }) }
];

const topic = (id: string, en: string, ru: string): LifeOption => ({
  value: id,
  labelKey: label(`filters.life.topic.${id}`, en, ru)
});

const field = (id: string, en: string, ru: string, options: LifeOption[], settings: Pick<LifeField, 'multiple' | 'inputType'> = {}): LifeField => ({
  id,
  labelKey: label(`filters.life.field.${id}.${en.toLowerCase().replace(/\W+/g, '_')}`, en, ru),
  options,
  ...settings
});
const jobOption = (fieldId: string, value: string, en: string, ru: string, flag?: string): LifeOption => ({
  value,
  labelKey: label(`filters.life.option.${fieldId}.${value}`, en, ru),
  flag
});

label('subcategory.life_communication', 'Communication', 'Общение', { id: 'Komunikasi', de: 'Kontakte', fr: 'Rencontres' });
label('subcategory.life_company', 'Looking for company', 'Ищу компанию', { id: 'Cari teman', de: 'Begleitung gesucht', fr: 'Cherche de la compagnie' });
label('subcategory.life_family', 'Family and kids', 'Семья и дети', { id: 'Keluarga dan anak', de: 'Familie und Kinder', fr: 'Famille et enfants' });
label('subcategory.life_sport', 'Sport', 'Спорт', { id: 'Olahraga', de: 'Sport', fr: 'Sport' });
label('subcategory.life_hobbies', 'Hobbies', 'Хобби', { id: 'Hobi', de: 'Hobbys', fr: 'Loisirs' });
label('subcategory.life_animals', 'Animals', 'Животные', { id: 'Hewan', de: 'Tiere', fr: 'Animaux' });
label('subcategory.life_help', 'Help', 'Помощь', { id: 'Bantuan', de: 'Hilfe', fr: 'Entraide' });
label('subcategory.life_lost_found', 'Lost and found', 'Бюро находок', { id: 'Barang hilang dan ditemukan', de: 'Fundbuero', fr: 'Objets trouves' });
label('subcategory.life_warnings', 'Warnings', 'Предупреждения', { id: 'Peringatan', de: 'Warnungen', fr: 'Alertes' });
label('subcategory.life_other', 'Other', 'Другое', { id: 'Lainnya', de: 'Sonstiges', fr: 'Autre' });
label('subcategory.life_jobs', 'Vacancies', 'Вакансии', { id: 'Lowongan kerja', de: 'Stellenangebote', fr: 'Offres d emploi' });
label('filters.life.manualReview', 'Warnings are published only after manual review.', 'Предупреждения публикуются только после ручной проверки.');
label('filters.life.required', 'Select {field}.', 'Выберите: {field}.');
label('filters.life.selectCategory', 'Select a Life section.', 'Выберите раздел «Жизни».');
label('filters.life.job.invalidExperience', 'Enter experience from 1 to 80 years or select No experience.', 'Укажите опыт от 1 до 80 лет или выберите «Без опыта».');

export const LIFE_FIELDS: Record<string, LifeField[]> = {
  life_jobs: [
    field('life_job_industry', 'Industry', 'Сфера деятельности', [], { inputType: 'text' }),
    field('life_job_format', 'Work format', 'Формат', [
      jobOption('life_job_format', 'on_site', 'On-site', 'На месте'),
      jobOption('life_job_format', 'remote', 'Remote', 'Удалённо'),
      jobOption('life_job_format', 'hybrid', 'Hybrid', 'Гибрид')
    ]),
    field('life_job_employment', 'Employment', 'Занятость', [
      jobOption('life_job_employment', 'full_time', 'Full-time', 'Полная'),
      jobOption('life_job_employment', 'part_time', 'Part-time', 'Частичная'),
      jobOption('life_job_employment', 'temporary', 'Temporary', 'Временная'),
      jobOption('life_job_employment', 'project', 'Project-based', 'Проектная')
    ]),
    field('life_job_schedule', 'Schedule', 'График', [
      jobOption('life_job_schedule', '5_2', '5/2', '5/2'),
      jobOption('life_job_schedule', '6_1', '6/1', '6/1'),
      jobOption('life_job_schedule', 'other', 'Other', 'Другой')
    ]),
    field('life_job_experience', 'Required experience, years', 'Требуемый опыт, лет', [
      jobOption('life_job_experience', 'none', 'No experience', 'Без опыта')
    ], { inputType: 'number' }),
    field('life_job_languages', 'Required languages', 'Необходимые языки', [
      jobOption('life_job_languages', 'en', 'English', 'English', '\u{1F1EC}\u{1F1E7}'),
      jobOption('life_job_languages', 'id', 'Indonesian', 'Indonesia', '\u{1F1EE}\u{1F1E9}'),
      jobOption('life_job_languages', 'ru', 'Russian', 'Русский', '\u{1F1F7}\u{1F1FA}'),
      jobOption('life_job_languages', 'fr', 'French', 'Французский', '\u{1F1EB}\u{1F1F7}'),
      jobOption('life_job_languages', 'de', 'German', 'Немецкий', '\u{1F1E9}\u{1F1EA}'),
      jobOption('life_job_languages', 'other', 'Other', 'Другой', '\u{1F30D}')
    ], { multiple: true })
  ],
  life_company: [field('life_topic', 'Activity', 'Чем заняться', [
    topic('walk', 'Walk', 'Прогулка'),
    topic('cafe_bar', 'Cafe or bar', 'Кафе или бар'),
    topic('beach', 'Beach', 'Пляж'),
    topic('party_event', 'Party or event', 'Вечеринка или мероприятие'),
    topic('company_sport', 'Sport', 'Спорт'),
    topic('bali_trip', 'Trip around Bali', 'Поездка по Бали'),
    topic('island_trip', 'Trip to other islands', 'Путешествие на другие острова'),
    topic('coworking', 'Work together', 'Совместная работа'),
    topic('company_other', 'Other', 'Другое')
  ])],
  life_family: [field('life_topic', 'Topic', 'Тема', [
    topic('parents', 'Parents', 'Родители'),
    topic('kids_meetups', 'Kids meetups', 'Детские встречи'),
    topic('babysitters', 'Babysitters', 'Няни'),
    topic('schools', 'Schools', 'Школы'),
    topic('family_leisure', 'Family activities', 'Совместный досуг')
  ])],
  life_sport: [field('life_topic', 'Sport', 'Вид спорта', [
    topic('padel', 'Padel', 'Падел'),
    topic('tennis', 'Tennis', 'Теннис'),
    topic('surfing', 'Surfing', 'Сёрфинг'),
    topic('training', 'Training', 'Тренировки'),
    topic('hiking', 'Hiking', 'Походы')
  ])],
  life_hobbies: [field('life_topic', 'Hobby', 'Хобби', [
    topic('book_club', 'Book clubs', 'Книжные клубы'),
    topic('board_games', 'Board games', 'Настольные игры'),
    topic('music', 'Music', 'Музыка'),
    topic('creativity', 'Arts and crafts', 'Творчество'),
    topic('language_club', 'Language clubs', 'Языковые клубы')
  ])],
  life_animals: [field('life_topic', 'Topic', 'Тема', [
    topic('animal_lost', 'Lost animals', 'Потерянные животные'),
    topic('animal_found', 'Found animals', 'Найденные животные'),
    topic('animal_help', 'Help animals', 'Помощь животным'),
    topic('foster', 'Foster care', 'Передержка'),
    topic('adoption', 'Adoption', 'Пристройство')
  ])],
  life_help: [field('life_topic', 'Help needed', 'Какая помощь нужна', [
    topic('borrow_tool', 'Borrow a tool', 'Одолжить инструмент'),
    topic('moving', 'Help moving', 'Помочь с переездом'),
    topic('donation', 'Donation', 'Донорство'),
    topic('volunteering', 'Volunteering', 'Волонтёрство')
  ])],
  life_lost_found: [
    field('life_status', 'Status', 'Статус', [
      topic('lost', 'Lost', 'Потеряно'),
      topic('found', 'Found', 'Найдено')
    ]),
    field('life_topic', 'Item', 'Вещь', [
      topic('documents', 'Documents', 'Документы'),
      topic('keys', 'Keys', 'Ключи'),
      topic('phones', 'Phones', 'Телефоны'),
      topic('other_items', 'Other items', 'Другие вещи')
    ])
  ],
  life_warnings: [field('life_topic', 'Risk', 'Риск', [
    topic('fraud', 'Fraud', 'Мошенничество'),
    topic('dangerous_places', 'Dangerous places', 'Опасные места'),
    topic('bad_landlords', 'Bad landlords', 'Недобросовестные арендодатели'),
    topic('other_risks', 'Other risks', 'Другие риски')
  ])],
  life_other: []
};

export const LIFE_FIELD_IDS = new Set(Object.values(LIFE_FIELDS).flat().map(item => item.id));

export const normalizeLifeSubCategory = (subCategory: string) => (
  subCategory === 'meetings' || subCategory === 'life_communication' || subCategory === 'buddies'
    ? 'life_company'
    : subCategory
);

export const getLifeFields = (subCategory: string) => LIFE_FIELDS[normalizeLifeSubCategory(subCategory)] || [];

export const listingMatchesLifeAttributes = (
  listing: Listing,
  selected: Record<string, string[]>,
  subCategory: string,
  selectedText: Record<string, string> = {}
) => getLifeFields(subCategory).every(item => {
  const validValues = new Set(item.options.map(option => option.value));
  const chosen = (selected[item.id] || []).filter(value => validValues.has(value));
  const value = listing.classifiedAttributes?.[item.id];
  if (chosen.length && !(Array.isArray(value)
    ? value.some(option => chosen.includes(option))
    : typeof value === 'string' && chosen.includes(value))) return false;

  const query = selectedText[item.id]?.trim();
  if (!query) return true;
  if (item.inputType === 'number') return Number(value) === Number(query);
  return typeof value === 'string' && value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
});

export const getLifeSpecialTranslations = (locale: Locale) => Object.fromEntries(
  Object.entries(labels).map(([key, value]) => [key, value[locale] || value.en])
);
