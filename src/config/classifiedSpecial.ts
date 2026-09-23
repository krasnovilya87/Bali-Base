export type ClassifiedSpecialValue = string | number | boolean | string[];

export type ClassifiedSpecialOption = {
  value: string;
  labelKey: string;
};

export type ClassifiedSpecialField = {
  id: string;
  labelKey: string;
  kind: 'select' | 'number' | 'boolean' | 'text' | 'date';
  options?: ClassifiedSpecialOption[];
  unit?: string;
  productTypes?: string[];
  requiredFor?: string[];
};

export type ClassifiedSpecialConfig = {
  productTypes: ClassifiedSpecialOption[];
  fields: ClassifiedSpecialField[];
};

type LocalizedLabel = { en: string; ru: string };
const labels: Record<string, LocalizedLabel> = {};
const prefix = 'filters.classified.special';

const label = (id: string, en: string, ru: string) => {
  const key = `${prefix}.${id}`;
  labels[key] = { en, ru };
  return key;
};

const product = (category: string, id: string, en: string, ru: string): ClassifiedSpecialOption => ({
  value: id,
  labelKey: label(`${category}.product.${id}`, en, ru)
});

const option = (fieldId: string, id: string, en: string, ru: string): ClassifiedSpecialOption => ({
  value: id,
  labelKey: label(`option.${fieldId}.${id}`, en, ru)
});

const select = (
  id: string,
  en: string,
  ru: string,
  values: Array<[string, string, string]>,
  productTypes?: string[],
  requiredFor?: string[]
): ClassifiedSpecialField => ({
  id,
  labelKey: label(`field.${id}`, en, ru),
  kind: 'select',
  options: values.map(([value, optionEn, optionRu]) => option(id, value, optionEn, optionRu)),
  productTypes,
  requiredFor
});

const number = (id: string, en: string, ru: string, unit?: string, productTypes?: string[], requiredFor?: string[]): ClassifiedSpecialField => ({
  id,
  labelKey: label(`field.${id}`, en, ru),
  kind: 'number',
  unit,
  productTypes,
  requiredFor
});

const boolean = (id: string, en: string, ru: string, productTypes?: string[]): ClassifiedSpecialField => ({
  id,
  labelKey: label(`field.${id}`, en, ru),
  kind: 'boolean',
  productTypes
});

const text = (id: string, en: string, ru: string, productTypes?: string[]): ClassifiedSpecialField => ({
  id,
  labelKey: label(`field.${id}`, en, ru),
  kind: 'text',
  productTypes
});

const date = (id: string, en: string, ru: string, productTypes?: string[]): ClassifiedSpecialField => ({
  id,
  labelKey: label(`field.${id}`, en, ru),
  kind: 'date',
  productTypes
});

const other = ['other', 'Other', 'Другое'] as [string, string, string];

label('productType', 'Product type', 'Тип товара');
label('value', 'Exact value', 'Точное значение');
label('from', 'From', 'От');
label('to', 'To', 'До');
label('textSearch', 'Search by value', 'Поиск по значению');
label('yes', 'Yes', 'Да');
label('no', 'No', 'Нет');
label('required', 'Required', 'Обязательно');
label('chooseProductFirst', 'Choose a product type to see its parameters', 'Выберите тип товара, чтобы увидеть его параметры');
label('validation', 'Complete the field “{field}”.', 'Заполните поле «{field}».');
label('boardPreview', 'Board preview', 'Изометрия доски');
label('suggestedVolume', 'Suggested volume', 'Рекомендуемый объём');
label('suggestedThickness', 'Suggested thickness', 'Рекомендуемая толщина');
label('suggestedWeight', 'Suggested weight', 'Рекомендуемый вес');
label('approximate', 'Approximate calculation', 'Приблизительный расчёт');
label('selectedRange', 'Selected range', 'Выбранный диапазон');
label('clearRange', 'Clear range', 'Сбросить диапазон');
label('sizing.gender', 'Gender', 'Пол');
label('sizing.gender.men', 'Men', 'Мужской');
label('sizing.gender.women', 'Women', 'Женский');
label('sizing.gender.boy', 'Boy', 'Мальчик');
label('sizing.gender.girl', 'Girl', 'Девочка');
label('sizing.internationalSize', 'International size', 'Международный размер');
label('sizing.fit', 'Fit', 'Посадка');
label('sizing.fit.slim', 'Slim', 'Slim');
label('sizing.fit.regular', 'Regular', 'Regular');
label('sizing.fit.oversized', 'Oversized', 'Oversized');
label('sizing.conversion', 'Size conversion', 'Соответствие размеров');
label('sizing.chest', 'Chest', 'Грудь');
label('sizing.bust', 'Bust', 'Обхват груди');
label('sizing.height', 'Height', 'Рост');
label('sizing.footLength', 'Foot length', 'Длина стопы');
label('sizing.notSelected', 'Not selected', 'Не выбрано');

const deviceFields = (batteryUnit: string): ClassifiedSpecialField[] => [
  number('device_storage_gb', 'Storage capacity', 'Объём памяти', 'GB'),
  number('device_ram_gb', 'RAM capacity', 'Объём оперативной памяти', 'GB'),
  number('device_battery_capacity', 'Battery capacity', 'Ёмкость батареи', batteryUnit),
  number('device_screen_inches', 'Screen size', 'Размер экрана', 'in'),
  select('device_display_type', 'Display type', 'Тип дисплея', [
    ['lcd', 'LCD', 'LCD'], ['ips', 'IPS', 'IPS'], ['oled', 'OLED', 'OLED'],
    ['amoled', 'AMOLED', 'AMOLED'], ['mini_led', 'Mini-LED', 'Mini-LED'],
    ['tn', 'TN', 'TN'], ['va', 'VA', 'VA'], other
  ]),
  select('device_color', 'Color', 'Цвет', [
    ['black', 'Black', 'Чёрный'], ['white', 'White', 'Белый'],
    ['gray', 'Gray', 'Серый'], ['silver', 'Silver', 'Серебристый'],
    ['gold', 'Gold', 'Золотой'], ['blue', 'Blue', 'Синий'],
    ['green', 'Green', 'Зелёный'], ['red', 'Red', 'Красный'],
    ['pink', 'Pink', 'Розовый'], ['purple', 'Purple', 'Фиолетовый'], other
  ])
];

const vehicleColorField = (): ClassifiedSpecialField => select('vehicle_color', 'Color', 'Цвет', [
  ['black', 'Black', 'Чёрный'], ['white', 'White', 'Белый'],
  ['gray', 'Gray', 'Серый'], ['silver', 'Silver', 'Серебристый'],
  ['blue', 'Blue', 'Синий'], ['red', 'Red', 'Красный'],
  ['green', 'Green', 'Зелёный'], ['yellow', 'Yellow', 'Жёлтый'],
  ['orange', 'Orange', 'Оранжевый'], ['brown', 'Brown', 'Коричневый'],
  ['beige', 'Beige', 'Бежевый'], ['purple', 'Purple', 'Фиолетовый'], other
]);

export const CLASSIFIED_TRANSPORT_PRODUCTION_YEAR_LABEL_KEY = label(
  'field.vehicle_production_year',
  'Year of manufacture',
  'Год выпуска'
);

const vehicleMileageField = (): ClassifiedSpecialField => number(
  'vehicle_mileage_km',
  'Mileage',
  'Пробег',
  'km'
);

const motorVehicleFields = (): ClassifiedSpecialField[] => [
  vehicleColorField(),
  number('vehicle_engine_displacement_cc', 'Engine displacement', 'Объём двигателя', 'cc'),
  number('vehicle_engine_power_hp', 'Engine power', 'Мощность двигателя', 'hp'),
  vehicleMileageField()
];

export const CLASSIFIED_SPECIAL_CONFIG: Record<string, ClassifiedSpecialConfig> = {
  ads_scooters: { productTypes: [], fields: motorVehicleFields() },
  ads_motorcycles: { productTypes: [], fields: motorVehicleFields() },
  ads_cars: { productTypes: [], fields: motorVehicleFields() },
  bicycles: { productTypes: [], fields: [vehicleColorField(), vehicleMileageField()] },
  water_transport: { productTypes: [], fields: motorVehicleFields() },
  phones: { productTypes: [], fields: deviceFields('mAh') },
  tablets: { productTypes: [], fields: deviceFields('mAh') },
  computers: { productTypes: [], fields: deviceFields('Wh') },
  photo_video_gear: { productTypes: [], fields: [
    number('device_battery_capacity', 'Battery capacity', 'Ёмкость батареи', 'mAh'),
    number('device_screen_inches', 'Screen size', 'Размер экрана', 'in')
  ] },
  audio: { productTypes: [], fields: [
    number('device_battery_capacity', 'Battery capacity', 'Ёмкость батареи', 'mAh')
  ] },
  home_appliances: { productTypes: [], fields: [
    number('appliance_power_w', 'Power', 'Мощность', 'W')
  ] },
  electronics_accessories: { productTypes: [], fields: [
    number('device_storage_gb', 'Storage capacity', 'Объём памяти', 'GB'),
    number('device_battery_capacity', 'Battery capacity', 'Ёмкость батареи', 'mAh')
  ] },
  surfing: {
    productTypes: [
      product('surfing', 'board', 'Board', 'Доска'), product('surfing', 'fins', 'Fins', 'Плавники'),
      product('surfing', 'leash', 'Leash', 'Лиш'), product('surfing', 'bag', 'Board bag', 'Чехол'),
      product('surfing', 'wetsuit', 'Wetsuit', 'Гидрокостюм'), product('surfing', 'rashguard', 'Rashguard', 'Рашгард'),
      product('surfing', 'poncho', 'Surf poncho', 'Серф-пончо'), product('surfing', 'wax', 'Wax', 'Воск'),
      product('surfing', 'repair_kit', 'Repair kit', 'Ремонтный комплект'), product('surfing', 'rack', 'Mount or rack', 'Крепление/стойка'),
      product('surfing', 'other', 'Other', 'Другое')
    ],
    fields: [
      select('surf_board_type', 'Board type', 'Тип доски', [
        ['shortboard', 'Shortboard', 'Shortboard'], ['fish', 'Fish', 'Fish'], ['hybrid', 'Hybrid', 'Hybrid'],
        ['egg', 'Egg', 'Egg'], ['funboard', 'Funboard', 'Funboard'], ['mid_length', 'Mid-length', 'Mid-length'], ['longboard', 'Longboard', 'Longboard'],
        ['gun', 'Gun', 'Gun'], ['mini_mal', 'Mini-mal', 'Mini-mal'], ['sup', 'SUP', 'SUP'], other
      ], ['board'], ['board']),
      select('surf_fin_configuration', 'Fin configuration', 'Конфигурация плавников', [
        ['single', 'Single', 'Single'], ['twin', 'Twin', 'Twin'], ['thruster', 'Thruster', 'Thruster'],
        ['quad', 'Quad', 'Quad'], ['two_plus_one', '2+1', '2+1'], ['five_fin', 'Five-fin', 'Five-fin']
      ], ['board', 'fins']),
      number('surf_length_feet', 'Length, feet', 'Длина, футы', 'ft', ['board'], ['board']),
      number('surf_length_inches', 'Length, inches', 'Длина, дюймы', 'in', ['board']),
      number('surf_width_inches', 'Width', 'Ширина', 'in', ['board']),
      number('surf_thickness_inches', 'Thickness', 'Толщина', 'in', ['board']),
      number('surf_volume_l', 'Volume', 'Объём', 'l', ['board'], ['board']),
      number('surf_weight_kg', 'Board weight', 'Вес доски', 'kg', ['board']),
      select('surf_construction', 'Material', 'Материал', [
        ['pu_polyester', 'PU / Polyester', 'PU / Polyester'], ['eps_epoxy', 'EPS / Epoxy', 'EPS / Epoxy'],
        ['soft_top', 'Soft-top', 'Soft-top'], ['inflatable', 'Inflatable', 'Надувная'], ['unknown', 'Unknown', 'Неизвестно']
      ], ['board']),
      select('surf_fin_system', 'Fin system', 'Система плавников', [
        ['fcs_1', 'FCS I', 'FCS I'], ['fcs_2', 'FCS II', 'FCS II'], ['futures', 'Futures', 'Futures'],
        ['us_box', 'US Box / Longboard Box', 'US Box / Longboard Box'], ['glass_on', 'Glass-on', 'Glass-on'], other
      ], ['board', 'fins']),
      select('surf_tail_shape', 'Tail shape', 'Форма хвоста', [
        ['squash', 'Squash', 'Squash'], ['round', 'Round', 'Round'], ['round_pin', 'Round pin', 'Round pin'],
        ['pin', 'Pin', 'Pin'], ['swallow', 'Swallow', 'Swallow'], ['diamond', 'Diamond', 'Diamond'], other
      ], ['board']),
      select('surf_board_damage', 'Board damage', 'Состояние доски', [
        ['none', 'No damage', 'Без повреждений'], ['cosmetic', 'Cosmetic damage', 'Есть косметические повреждения'],
        ['repaired', 'Repaired damage', 'Есть отремонтированные повреждения'], ['needs_repair', 'Needs repair', 'Требуется ремонт'],
        ['takes_water', 'Takes on water', 'Набирает воду']
      ], ['board']),
      select('surf_bag_size', 'Size', 'Размер', [
        ['5_0', `5'0"`, `5'0"`], ['5_6', `5'6"`, `5'6"`], ['6_0', `6'0"`, `6'0"`],
        ['6_3', `6'3"`, `6'3"`], ['6_6', `6'6"`, `6'6"`], ['7_0', `7'0"`, `7'0"`],
        ['7_6', `7'6"`, `7'6"`], ['8_0', `8'0"`, `8'0"`], ['9_0', `9'0"`, `9'0"`],
        ['10_0', `10'0"`, `10'0"`], ['11_0', `11'0"`, `11'0"`], ['12_0', `12'0"`, `12'0"`]
      ], ['bag']),
      select('surf_wear_size', 'Size', 'Размер', [
        ['xs', 'XS', 'XS'], ['s', 'S', 'S'], ['m', 'M', 'M'], ['l', 'L', 'L'], ['xl', 'XL', 'XL'], ['xxl', 'XXL', 'XXL']
      ], ['wetsuit', 'rashguard', 'poncho']),
      select('surf_leash_length', 'Leash length', 'Длина лиша', [['5', '5 ft', '5 ft'], ['6', '6 ft', '6 ft'], ['7', '7 ft', '7 ft'], ['8', '8 ft', '8 ft'], ['9', '9 ft', '9 ft'], ['10', '10 ft', '10 ft'], ['12', '12 ft', '12 ft']], ['leash']),
      select('surf_leash_thickness', 'Leash thickness', 'Толщина лиша', [['regular', 'Regular', 'Обычный'], ['competition', 'Light competition', 'Лёгкий competition']], ['leash']),
      select('surf_leash_use', 'Leash use', 'Назначение лиша', [['regular', 'Regular', 'Обычный'], ['longboard', 'Longboard', 'Longboard'], ['sup', 'SUP', 'SUP']], ['leash']),
      select('surf_leash_attachment', 'Leash attachment', 'Крепление лиша', [['ankle', 'Ankle', 'Ankle'], ['calf', 'Calf', 'Calf']], ['leash']),
      select('surf_fin_size', 'Fin size', 'Размер плавников', [['xs', 'XS', 'XS'], ['s', 'S', 'S'], ['m', 'M', 'M'], ['l', 'L', 'L'], ['xl', 'XL', 'XL']], ['fins']),
      select('surf_fin_material', 'Fin material', 'Материал плавников', [['plastic', 'Plastic', 'Пластик'], ['fiberglass', 'Fiberglass', 'Fiberglass'], ['carbon', 'Carbon', 'Carbon'], other], ['fins'])
    ]
  },
  fitness: {
    productTypes: [
      product('fitness', 'dumbbell', 'Dumbbell', 'Гантели'), product('fitness', 'kettlebell', 'Kettlebell', 'Гири'),
      product('fitness', 'barbell', 'Barbell', 'Штанга'), product('fitness', 'bar', 'Bar', 'Гриф'),
      product('fitness', 'plates', 'Weight plates', 'Диски'), product('fitness', 'bench', 'Bench', 'Скамья'),
      product('fitness', 'rack', 'Rack or frame', 'Стойка/рама'), product('fitness', 'machine', 'Strength machine', 'Тренажёр'),
      product('fitness', 'cardio_machine', 'Cardio machine', 'Кардиотренажёр'), product('fitness', 'bands', 'Resistance bands', 'Резинки/эспандеры'),
      product('fitness', 'mat', 'Mat', 'Коврик'), product('fitness', 'medicine_ball', 'Medicine ball', 'Медбол'),
      product('fitness', 'fitball', 'Fitball', 'Фитбол'), product('fitness', 'jump_rope', 'Jump rope', 'Скакалка'),
      product('fitness', 'massage_roller', 'Massage roller', 'Ролл для массажа'), product('fitness', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      number('fitness_item_weight', 'Weight of one item', 'Вес одного предмета', 'kg', ['dumbbell', 'kettlebell', 'plates']),
      select('fitness_quantity_set', 'Quantity', 'Количество', [['one', 'One', 'Одна'], ['pair', 'Pair', 'Пара'], ['set', 'Set', 'Комплект']], ['dumbbell', 'kettlebell']),
      select('fitness_weight_type', 'Weight type', 'Тип', [['fixed', 'Fixed', 'Фиксированные'], ['plate_loaded', 'Plate-loaded', 'Разборные'], ['adjustable', 'Adjustable', 'Регулируемые']], ['dumbbell', 'kettlebell']),
      select('fitness_weight_material', 'Material', 'Материал', [['metal', 'Metal', 'Металл'], ['rubber', 'Rubber-coated', 'Обрезиненные'], ['neoprene', 'Neoprene', 'Неопрен'], ['plastic', 'Plastic', 'Пластик']], ['dumbbell', 'kettlebell']),
      number('fitness_adjustment_min', 'Minimum adjustable weight', 'Минимальный регулируемый вес', 'kg', ['dumbbell', 'kettlebell']),
      number('fitness_adjustment_max', 'Maximum adjustable weight', 'Максимальный регулируемый вес', 'kg', ['dumbbell', 'kettlebell']),
      select('fitness_bar_type', 'Bar type', 'Тип грифа', [['straight', 'Straight', 'Прямой'], ['ez', 'EZ', 'EZ'], ['olympic', 'Olympic', 'Олимпийский'], ['trap', 'Trap bar', 'Trap bar'], ['short', 'Short', 'Короткий']], ['bar', 'barbell']),
      number('fitness_bar_length', 'Bar length', 'Длина грифа', 'cm', ['bar', 'barbell']),
      number('fitness_bar_weight', 'Bar weight', 'Вес грифа', 'kg', ['bar', 'barbell']),
      select('fitness_sleeve_diameter', 'Sleeve diameter', 'Диаметр посадки', [['25', '25 mm', '25 мм'], ['28', '28 mm', '28 мм'], ['30', '30 mm', '30 мм'], ['50', '50 mm', '50 мм']], ['bar', 'barbell', 'plates']),
      number('fitness_max_load', 'Maximum load', 'Максимальная нагрузка', 'kg', ['bar', 'barbell', 'bench', 'rack', 'machine', 'cardio_machine']),
      select('fitness_plate_material', 'Plate material', 'Материал дисков', [['metal', 'Metal', 'Металл'], ['rubber', 'Rubber-coated', 'Обрезиненные'], ['bumper', 'Bumper plates', 'Bumper plates']], ['plates']),
      number('fitness_quantity', 'Quantity', 'Количество', undefined, ['plates']),
      select('fitness_machine_purpose', 'Purpose', 'Назначение', [['strength', 'Strength', 'Силовой'], ['cardio', 'Cardio', 'Кардио'], ['recovery', 'Recovery', 'Восстановление']], ['machine', 'cardio_machine']),
      text('fitness_machine_type', 'Machine type', 'Тип тренажёра', ['machine', 'cardio_machine']),
      number('fitness_max_user_weight', 'Maximum user weight', 'Максимальный вес пользователя', 'kg', ['machine', 'cardio_machine']),
      text('fitness_dimensions', 'Dimensions (L × W × H)', 'Размеры (Д × Ш × В)', ['machine', 'cardio_machine', 'bench', 'rack']),
      boolean('fitness_foldable', 'Foldable', 'Складной', ['machine', 'cardio_machine', 'bench']),
      select('fitness_usage_class', 'Usage class', 'Класс использования', [['home', 'Home', 'Домашний'], ['commercial', 'Commercial', 'Коммерческий']], ['machine', 'cardio_machine'])
    ]
  },
  yoga: {
    productTypes: [
      product('yoga', 'mat', 'Yoga mat', 'Коврик для йоги'), product('yoga', 'blocks', 'Yoga blocks', 'Блоки для йоги'),
      product('yoga', 'meditation_cushion', 'Cushions', 'Подушки'), product('yoga', 'strap', 'Yoga strap', 'Ремень для йоги'),
      product('yoga', 'bolster', 'Bolster', 'Болстер'),
      product('yoga', 'wheel', 'Yoga wheel', 'Колесо'), product('yoga', 'hammock', 'Hammock', 'Гамак'),
      product('yoga', 'blanket', 'Blanket', 'Одеяло'), product('yoga', 'accessories', 'Accessory sets', 'Наборы аксессуаров')
    ],
    fields: [
      number('yoga_length', 'Length', 'Длина', 'cm', ['mat', 'hammock']), number('yoga_width', 'Width', 'Ширина', 'cm', ['mat']),
      select('yoga_mat_thickness', 'Thickness', 'Толщина', [['up_to_2', 'Up to 2 mm', 'До 2 мм'], ['3_4', '3–4 mm', '3–4 мм'], ['5_6', '5–6 mm', '5–6 мм'], ['7_plus', '7 mm and more', '7 мм и больше']], ['mat']),
      select('yoga_mat_material', 'Material', 'Материал', [['natural_rubber', 'Natural rubber', 'Натуральный каучук'], ['tpe', 'TPE', 'TPE'], ['pvc', 'PVC', 'PVC'], ['cork', 'Cork', 'Пробка'], ['jute', 'Jute', 'Джут'], other], ['mat']),
      select('yoga_surface', 'Surface', 'Поверхность', [['smooth', 'Smooth', 'Гладкая'], ['textured', 'Textured', 'Текстурированная']], ['mat']),
      boolean('yoga_non_slip', 'Non-slip', 'Нескользящий', ['mat']), boolean('yoga_travel', 'Foldable or travel', 'Складной/дорожный', ['mat']),
      number('yoga_quantity', 'Quantity', 'Количество', undefined, ['blocks']),
      select('yoga_block_material', 'Block material', 'Материал блоков', [['cork', 'Cork', 'Пробка'], ['eva', 'EVA', 'EVA'], ['wood', 'Wood', 'Дерево']], ['blocks']),
      text('yoga_dimensions', 'Dimensions', 'Размеры', ['blocks', 'bolster', 'meditation_cushion']),
      select('yoga_shape', 'Shape', 'Форма', [['round', 'Round', 'Круглая'], ['rectangular', 'Rectangular', 'Прямоугольная'], ['crescent', 'Crescent', 'Полумесяц']], ['bolster', 'meditation_cushion']),
      text('yoga_filling', 'Filling', 'Наполнитель', ['bolster', 'meditation_cushion']), boolean('yoga_removable_cover', 'Removable cover', 'Съёмный чехол', ['bolster', 'meditation_cushion']),
      number('yoga_max_load', 'Maximum load', 'Максимальная нагрузка', 'kg', ['hammock']), boolean('yoga_mounts_included', 'Mounts included', 'Крепления в комплекте', ['hammock'])
    ]
  },
  padel: {
    productTypes: [
      product('padel', 'racket', 'Racket', 'Ракетка'), product('padel', 'balls', 'Balls', 'Мячи'), product('padel', 'bag', 'Bag', 'Сумка'),
      product('padel', 'shoes', 'Shoes', 'Обувь'), product('padel', 'clothing', 'Clothing', 'Одежда'), product('padel', 'protector', 'Racket protector', 'Защита ракетки'),
      product('padel', 'grip', 'Grip or overgrip', 'Грип/овергрип'), product('padel', 'net', 'Net', 'Сетка'), product('padel', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      select('padel_shape', 'Racket shape', 'Форма ракетки', [['round', 'Round', 'Круглая'], ['teardrop', 'Teardrop', 'Каплевидная'], ['diamond', 'Diamond', 'Ромбовидная']], ['racket'], ['racket']),
      number('padel_weight', 'Weight', 'Вес', 'g', ['racket'], ['racket']),
      select('padel_balance', 'Balance', 'Баланс', [['low', 'Low', 'Низкий'], ['medium', 'Medium', 'Средний'], ['high', 'High', 'Высокий']], ['racket']),
      select('padel_stiffness', 'Stiffness', 'Жёсткость', [['soft', 'Soft', 'Мягкая'], ['medium', 'Medium', 'Средняя'], ['hard', 'Hard', 'Жёсткая']], ['racket']),
      select('padel_surface_material', 'Surface material', 'Материал поверхности', [['fiberglass', 'Fiberglass', 'Fiberglass'], ['carbon_3k', 'Carbon 3K', 'Carbon 3K'], ['carbon_6k', 'Carbon 6K', 'Carbon 6K'], ['carbon_12k', 'Carbon 12K', 'Carbon 12K'], ['carbon_18k', 'Carbon 18K', 'Carbon 18K'], other], ['racket']),
      select('padel_surface', 'Surface', 'Поверхность', [['smooth', 'Smooth', 'Гладкая'], ['rough', 'Rough', 'Шероховатая']], ['racket']),
      select('padel_style', 'Playing style', 'Стиль игры', [['control', 'Control', 'Контроль'], ['all_round', 'All-round', 'Универсальная'], ['attack', 'Attack', 'Атакующая']], ['racket']),
      boolean('padel_protective_tape', 'Protective tape', 'Защитная лента', ['racket']),
      select('padel_cracks', 'Cracks', 'Трещины', [['none', 'None', 'Нет'], ['cosmetic', 'Cosmetic', 'Косметические'], ['repaired', 'Repaired', 'Отремонтированные']], ['racket']),
      number('padel_ball_quantity', 'Quantity', 'Количество', undefined, ['balls']),
      boolean('padel_ball_packaging', 'Packaging included', 'Есть упаковка', ['balls'])
    ]
  },
  tennis: {
    productTypes: [
      product('tennis', 'racket', 'Racket', 'Ракетка'), product('tennis', 'balls', 'Balls', 'Мячи'), product('tennis', 'bag', 'Bag', 'Сумка'),
      product('tennis', 'net', 'Net', 'Сетка'), product('tennis', 'strings', 'Strings', 'Струны'), product('tennis', 'stringing_machine', 'Stringing machine', 'Машинка для натяжки'),
      product('tennis', 'shoes', 'Shoes', 'Обувь'), product('tennis', 'clothing', 'Clothing', 'Одежда'), product('tennis', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      select('tennis_age_class', 'Age class', 'Возрастная категория', [['adult', 'Adult', 'Взрослая'], ['junior', 'Junior', 'Юниорская']], ['racket']),
      number('tennis_length', 'Length', 'Длина', 'in', ['racket']), number('tennis_head_size', 'Head size', 'Размер головы', 'sq in', ['racket']),
      number('tennis_weight', 'Unstrung weight', 'Вес без струн', 'g', ['racket']),
      select('tennis_balance', 'Balance', 'Баланс', [['head_light', 'Head light', 'В ручку'], ['even', 'Even', 'Нейтральный'], ['head_heavy', 'Head heavy', 'В голову']], ['racket']),
      select('tennis_grip_size', 'Grip size', 'Размер ручки', [['l0', 'L0', 'L0'], ['l1', 'L1', 'L1'], ['l2', 'L2', 'L2'], ['l3', 'L3', 'L3'], ['l4', 'L4', 'L4'], ['l5', 'L5', 'L5']], ['racket']),
      select('tennis_string_pattern', 'String pattern', 'Струнная формула', [['16x19', '16×19', '16×19'], ['16x20', '16×20', '16×20'], ['18x20', '18×20', '18×20'], other], ['racket']),
      number('tennis_string_tension', 'String tension', 'Натяжение струн', 'kg', ['racket']),
      select('tennis_material', 'Material', 'Материал', [['aluminum', 'Aluminum', 'Алюминий'], ['graphite', 'Graphite', 'Graphite'], ['carbon_composite', 'Carbon / composite', 'Carbon / composite']], ['racket']),
      boolean('tennis_strung', 'Strung', 'Со струнами', ['racket']),
      number('tennis_ball_quantity', 'Quantity', 'Количество', undefined, ['balls']),
      boolean('tennis_ball_packaging', 'Packaging included', 'Есть упаковка', ['balls'])
    ]
  },
  swimming: {
    productTypes: [
      product('swimming', 'goggles', 'Goggles', 'Очки'), product('swimming', 'fins', 'Fins', 'Ласты'), product('swimming', 'paddles', 'Paddles', 'Лопатки'),
      product('swimming', 'kickboard', 'Kickboard', 'Доска'), product('swimming', 'pull_buoy', 'Pull buoy', 'Колобашка'), product('swimming', 'snorkel', 'Training snorkel', 'Трубка тренировочная'),
      product('swimming', 'cap', 'Cap', 'Шапочка'), product('swimming', 'swimwear', 'Swimwear', 'Купальник/плавки'), product('swimming', 'racing_suit', 'Racing suit', 'Стартовый костюм'),
      product('swimming', 'set', 'Set', 'Набор'), product('swimming', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      select('swim_goggles_use', 'Goggles use', 'Назначение очков', [['training', 'Training', 'Тренировочные'], ['racing', 'Racing', 'Стартовые'], ['open_water', 'Open water', 'Открытая вода']], ['goggles']),
      select('swim_goggles_age', 'Age group', 'Возрастная группа', [['adult', 'Adult', 'Взрослые'], ['kids', 'Kids', 'Детские']], ['goggles']),
      select('swim_lens', 'Lens type', 'Тип линз', [['clear', 'Clear', 'Прозрачные'], ['tinted', 'Tinted', 'Затемнённые'], ['mirrored', 'Mirrored', 'Зеркальные'], ['polarized', 'Polarized', 'Поляризационные'], ['prescription', 'Prescription', 'С диоптриями']], ['goggles']),
      number('swim_diopters', 'Diopters', 'Диоптрии', undefined, ['goggles']), boolean('swim_adjustable_bridge', 'Adjustable nose bridge', 'Регулируемая переносица', ['goggles']),
      select('swim_fin_length', 'Fin length', 'Длина ласт', [['short', 'Short', 'Короткие'], ['long', 'Long', 'Длинные']], ['fins']),
      number('swim_foot_size', 'Foot size', 'Размер ноги', 'EU', ['fins']),
      select('swim_fin_stiffness', 'Fin stiffness', 'Жёсткость ласт', [['soft', 'Soft', 'Мягкие'], ['medium', 'Medium', 'Средние'], ['hard', 'Hard', 'Жёсткие']], ['fins']),
      select('swim_fin_heel', 'Heel type', 'Тип пятки', [['open', 'Open heel', 'Открытая'], ['closed', 'Closed heel', 'Закрытая']], ['fins']),
      select('swim_paddle_size', 'Paddle size', 'Размер лопаток', [['xs', 'XS', 'XS'], ['s', 'S', 'S'], ['m', 'M', 'M'], ['l', 'L', 'L'], ['xl', 'XL', 'XL']], ['paddles']),
      text('swim_paddle_shape', 'Paddle shape', 'Форма лопаток', ['paddles']), boolean('swim_paddle_straps', 'With straps', 'С ремнями', ['paddles']),
      number('swimwear_size', 'Size', 'Размер', undefined, ['swimwear', 'racing_suit']),
      select('swimwear_use', 'Swimwear use', 'Назначение', [['training', 'Training', 'Тренировочное'], ['racing', 'Racing', 'Стартовое']], ['swimwear', 'racing_suit']),
      select('swimwear_compression', 'Construction', 'Конструкция', [['single_layer', 'Single layer', 'Однослойная'], ['compression', 'Compression', 'Компрессионная']], ['swimwear', 'racing_suit'])
    ]
  },
  martial_arts: {
    productTypes: [
      product('martial_arts', 'gloves', 'Gloves', 'Перчатки'), product('martial_arts', 'helmet', 'Helmet', 'Шлем'), product('martial_arts', 'mouthguard', 'Mouthguard', 'Капа'),
      product('martial_arts', 'wraps', 'Wraps', 'Бинты'), product('martial_arts', 'shin_guards', 'Shin guards', 'Защита голени'), product('martial_arts', 'body_protection', 'Body protection', 'Защита корпуса'),
      product('martial_arts', 'groin_guard', 'Groin guard', 'Ракушка'), product('martial_arts', 'pads', 'Pads', 'Лапы/пэды'), product('martial_arts', 'punching_bag', 'Punching bag', 'Боксёрский мешок'),
      product('martial_arts', 'gi', 'Gi', 'Кимоно/ги'), product('martial_arts', 'uniform', 'Shorts or uniform', 'Шорты/форма'), product('martial_arts', 'tatami', 'Tatami', 'Татами'), product('martial_arts', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      select('martial_discipline', 'Discipline', 'Дисциплина', [['boxing', 'Boxing', 'Бокс'], ['muay_thai', 'Muay Thai', 'Муай-тай'], ['mma', 'MMA', 'MMA'], ['bjj', 'BJJ', 'BJJ'], ['judo', 'Judo', 'Дзюдо'], ['karate', 'Karate', 'Карате'], ['taekwondo', 'Taekwondo', 'Тхэквондо'], ['wrestling', 'Wrestling', 'Борьба'], other]),
      select('martial_glove_type', 'Glove type', 'Тип перчаток', [['training', 'Training', 'Тренировочные'], ['sparring', 'Sparring', 'Спарринговые'], ['bag', 'Bag', 'Снарядные'], ['mma', 'MMA', 'MMA']], ['gloves']),
      select('martial_glove_weight', 'Glove weight', 'Вес перчаток', [['4', '4 oz', '4 oz'], ['6', '6 oz', '6 oz'], ['8', '8 oz', '8 oz'], ['10', '10 oz', '10 oz'], ['12', '12 oz', '12 oz'], ['14', '14 oz', '14 oz'], ['16', '16 oz', '16 oz'], ['18', '18 oz', '18 oz']], ['gloves']),
      select('martial_size', 'Size', 'Размер', [['s', 'S', 'S'], ['m', 'M', 'M'], ['l', 'L', 'L'], ['xl', 'XL', 'XL']], ['gloves']),
      select('martial_glove_material', 'Material', 'Материал', [['leather', 'Genuine leather', 'Натуральная кожа'], ['synthetic', 'Synthetic leather', 'Искусственная кожа']], ['gloves']),
      select('martial_fastener', 'Fastener', 'Застёжка', [['velcro', 'Velcro', 'Липучка'], ['laces', 'Laces', 'Шнуровка']], ['gloves']),
      text('martial_gi_size', 'Manufacturer size', 'Размер производителя', ['gi']), number('martial_user_height', 'User height', 'Рост пользователя', 'cm', ['gi']), number('martial_user_weight', 'User weight', 'Вес пользователя', 'kg', ['gi']),
      text('martial_color', 'Color', 'Цвет', ['gi']), boolean('martial_belt_included', 'Belt included', 'Пояс в комплекте', ['gi']),
      select('martial_bag_type', 'Bag type', 'Тип мешка', [['hanging', 'Hanging', 'Подвесной'], ['floor', 'Free-standing', 'Напольный'], ['wall', 'Wall-mounted', 'Настенный']], ['punching_bag']),
      number('martial_bag_weight', 'Bag weight', 'Вес мешка', 'kg', ['punching_bag']), number('martial_bag_height', 'Bag height', 'Высота мешка', 'cm', ['punching_bag']),
      text('martial_filling', 'Filling', 'Наполнитель', ['punching_bag']), boolean('martial_mounts_included', 'Mounts included', 'Крепления в комплекте', ['punching_bag'])
    ]
  },
  diving: {
    productTypes: [
      product('diving', 'regulator', 'Regulator', 'Регулятор'), product('diving', 'octopus', 'Octopus', 'Октопус'), product('diving', 'bcd', 'BCD', 'BCD'),
      product('diving', 'computer', 'Dive computer', 'Дайв-компьютер'), product('diving', 'tank', 'Tank', 'Баллон'), product('diving', 'wetsuit', 'Wetsuit', 'Гидрокостюм'),
      product('diving', 'mask', 'Mask', 'Маска'), product('diving', 'fins', 'Fins', 'Ласты'), product('diving', 'weights', 'Weights', 'Грузы'),
      product('diving', 'gauge', 'Gauge or console', 'Манометр/консоль'), product('diving', 'light', 'Light', 'Фонарь'), product('diving', 'set', 'Set', 'Комплект'), product('diving', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      select('diving_regulator_stage', 'Regulator part', 'Часть регулятора', [['first', 'First stage', 'Первая ступень'], ['second', 'Second stage', 'Вторая ступень'], ['set', 'Set', 'Комплект']], ['regulator']),
      select('diving_connector', 'Connector', 'Тип соединения', [['din', 'DIN', 'DIN'], ['yoke', 'Yoke', 'Yoke']], ['regulator']), boolean('diving_cold_water', 'Cold-water rated', 'Для холодной воды', ['regulator']),
      number('diving_stage_count', 'Stages in set', 'Количество ступеней в комплекте', undefined, ['regulator']), date('diving_last_service', 'Last service date', 'Дата последнего обслуживания', ['regulator', 'bcd']),
      boolean('diving_service_docs', 'Service documents', 'Документы об обслуживании', ['regulator', 'bcd']),
      select('diving_bcd_type', 'BCD type', 'Тип BCD', [['jacket', 'Jacket', 'Jacket'], ['back_inflate', 'Back-inflate', 'Back-inflate'], ['wing', 'Wing', 'Wing'], ['sidemount', 'Sidemount', 'Sidemount']], ['bcd']),
      select('diving_size', 'Size', 'Размер', [['xxs', 'XXS', 'XXS'], ['xs', 'XS', 'XS'], ['s', 'S', 'S'], ['m', 'M', 'M'], ['l', 'L', 'L'], ['xl', 'XL', 'XL'], ['xxl', 'XXL', 'XXL']], ['bcd', 'wetsuit']),
      number('diving_lift', 'Lift capacity', 'Подъёмная сила', 'kg', ['bcd']), boolean('diving_integrated_weights', 'Integrated weights', 'Интегрированные грузы', ['bcd']),
      select('diving_tank_material', 'Tank material', 'Материал баллона', [['aluminum', 'Aluminum', 'Алюминий'], ['steel', 'Steel', 'Сталь']], ['tank']),
      number('diving_tank_volume', 'Tank volume', 'Объём баллона', 'l', ['tank']), number('diving_pressure', 'Working pressure', 'Рабочее давление', 'bar', ['tank']),
      select('diving_valve', 'Valve', 'Вентиль', [['din', 'DIN', 'DIN'], ['yoke_compatible', 'Yoke-compatible', 'Yoke-compatible']], ['tank']),
      date('diving_manufactured', 'Manufacture date', 'Дата производства', ['tank']), date('diving_visual_check', 'Last visual inspection', 'Дата последней визуальной проверки', ['tank']), date('diving_hydro_test', 'Hydrostatic test date', 'Дата гидростатического теста', ['tank']),
      select('diving_wetsuit_thickness', 'Wetsuit thickness', 'Толщина гидрокостюма', [['1', '1 mm', '1 мм'], ['1_5', '1.5 mm', '1,5 мм'], ['2', '2 mm', '2 мм'], ['3', '3 mm', '3 мм'], ['5', '5 mm', '5 мм'], ['7', '7 mm', '7 мм']], ['wetsuit']),
      select('diving_wetsuit_type', 'Wetsuit type', 'Тип гидрокостюма', [['shorty', 'Shorty', 'Shorty'], ['full', 'Full suit', 'Full suit'], ['two_piece', 'Two-piece', 'Two-piece']], ['wetsuit']),
      select('diving_zipper', 'Zipper', 'Молния', [['back', 'Back', 'Сзади'], ['front', 'Front', 'Спереди'], ['zipless', 'Zipless', 'Без молнии']], ['wetsuit'])
    ]
  },
  snorkeling: {
    productTypes: [
      product('snorkeling', 'mask', 'Mask', 'Маска'), product('snorkeling', 'full_face_mask', 'Full-face mask', 'Полнолицевая маска'), product('snorkeling', 'snorkel', 'Snorkel', 'Трубка'),
      product('snorkeling', 'fins', 'Fins', 'Ласты'), product('snorkeling', 'vest', 'Vest', 'Жилет'), product('snorkeling', 'set', 'Set', 'Комплект'), product('snorkeling', 'bag', 'Bag', 'Сумка'), product('snorkeling', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      select('snorkeling_age', 'Age group', 'Возрастная группа', [['adult', 'Adult', 'Взрослый'], ['kids', 'Kids', 'Детский']]), text('snorkeling_size', 'Size', 'Размер'),
      select('snorkeling_mask_type', 'Mask type', 'Тип маски', [['regular', 'Regular', 'Обычная'], ['full_face', 'Full-face', 'Полнолицевая']], ['mask', 'full_face_mask']),
      select('snorkeling_lens_count', 'Lens count', 'Количество стёкол', [['one', 'One', 'Одно'], ['two', 'Two', 'Два']], ['mask']), boolean('snorkeling_prescription', 'Prescription lenses', 'Линзы с диоптриями', ['mask']),
      select('snorkeling_tube_type', 'Snorkel type', 'Тип трубки', [['regular', 'Regular', 'Обычная'], ['dry_top', 'Dry-top', 'Dry-top'], ['semi_dry', 'Semi-dry', 'Semi-dry']], ['snorkel']),
      select('snorkeling_fin_length', 'Fin length', 'Длина ласт', [['short', 'Short', 'Короткие'], ['long', 'Long', 'Длинные']], ['fins']),
      select('snorkeling_heel', 'Heel type', 'Тип пятки', [['closed', 'Closed', 'Закрытая'], ['open', 'Open', 'Открытая']], ['fins']), number('snorkeling_foot_size', 'Foot size', 'Размер ноги', 'EU', ['fins'])
    ]
  },
  cycling: {
    productTypes: [
      product('cycling', 'bicycle', 'Bicycle', 'Велосипед'), product('cycling', 'frame', 'Frame', 'Рама'), product('cycling', 'fork', 'Fork', 'Вилка'), product('cycling', 'wheels', 'Wheels', 'Колёса'),
      product('cycling', 'tires', 'Tires', 'Покрышки'), product('cycling', 'drivetrain', 'Drivetrain', 'Трансмиссия'), product('cycling', 'brakes', 'Brakes', 'Тормоза'),
      product('cycling', 'saddle', 'Saddle', 'Седло'), product('cycling', 'helmet', 'Helmet', 'Шлем'), product('cycling', 'computer', 'Bike computer', 'Велокомпьютер'),
      product('cycling', 'trainer', 'Bike trainer', 'Велостанок'), product('cycling', 'parts', 'Parts', 'Запчасти'), product('cycling', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      select('cycling_type', 'Bicycle type', 'Тип велосипеда', [['road', 'Road', 'Road'], ['gravel', 'Gravel', 'Gravel'], ['mtb_hardtail', 'MTB Hardtail', 'MTB Hardtail'], ['mtb_full', 'MTB Full Suspension', 'MTB Full Suspension'], ['city', 'City', 'City'], ['cruiser', 'Cruiser', 'Cruiser'], ['folding', 'Folding', 'Folding'], ['bmx', 'BMX', 'BMX'], ['electric', 'Electric', 'Электрический'], ['kids', 'Kids', 'Детский']], ['bicycle']),
      text('cycling_frame_size', 'Frame size', 'Размер рамы', ['bicycle', 'frame']), number('cycling_user_height_min', 'Minimum user height', 'Минимальный рост пользователя', 'cm', ['bicycle']), number('cycling_user_height_max', 'Maximum user height', 'Максимальный рост пользователя', 'cm', ['bicycle']),
      select('cycling_wheel_size', 'Wheel size', 'Размер колёс', [['12', '12″', '12″'], ['14', '14″', '14″'], ['16', '16″', '16″'], ['20', '20″', '20″'], ['24', '24″', '24″'], ['26', '26″', '26″'], ['27_5', '27.5″', '27,5″'], ['28', '28″', '28″'], ['29', '29″', '29″'], ['700c', '700C', '700C']], ['bicycle', 'wheels']),
      select('cycling_frame_material', 'Frame material', 'Материал рамы', [['steel', 'Steel', 'Сталь'], ['aluminum', 'Aluminum', 'Алюминий'], ['carbon', 'Carbon', 'Carbon'], ['titanium', 'Titanium', 'Titanium']], ['bicycle', 'frame']),
      number('cycling_gears', 'Number of gears', 'Количество скоростей', undefined, ['bicycle', 'drivetrain', 'parts']),
      select('cycling_brakes', 'Brake type', 'Тип тормозов', [['rim', 'Rim', 'Ободные'], ['mechanical_disc', 'Mechanical disc', 'Дисковые механические'], ['hydraulic_disc', 'Hydraulic disc', 'Дисковые гидравлические']], ['bicycle', 'brakes']),
      select('cycling_suspension', 'Suspension', 'Подвеска', [['none', 'Rigid', 'Без амортизации'], ['front', 'Front', 'Передняя'], ['full', 'Full', 'Полная']], ['bicycle', 'fork']),
      number('cycling_motor_power', 'Motor power', 'Мощность двигателя', 'W', ['bicycle']), number('cycling_battery', 'Battery capacity', 'Ёмкость батареи', 'Wh', ['bicycle']), number('cycling_range', 'Range', 'Запас хода', 'km', ['bicycle']), number('cycling_mileage', 'Mileage', 'Пробег', 'km', ['bicycle']),
      number('cycling_year', 'Year', 'Год выпуска', undefined, ['bicycle']), text('cycling_part_type', 'Part type', 'Тип детали', ['parts']), text('cycling_compatibility', 'Compatible brand or model', 'Совместимый бренд/модель', ['parts']), text('cycling_standard', 'Standard or size', 'Стандарт/размер', ['parts']), number('cycling_diameter', 'Diameter', 'Диаметр', 'mm', ['parts']), select('cycling_position', 'Position', 'Расположение', [['front', 'Front', 'Передняя'], ['rear', 'Rear', 'Задняя']], ['parts']), boolean('cycling_part_new', 'New part', 'Новая деталь', ['parts'])
    ]
  },
  football: {
    productTypes: [
      product('football', 'ball', 'Ball', 'Мяч'), product('football', 'boots', 'Boots', 'Бутсы'), product('football', 'uniform', 'Uniform', 'Форма'), product('football', 'shin_guards', 'Shin guards', 'Щитки'),
      product('football', 'goalkeeper_gloves', 'Goalkeeper gloves', 'Перчатки вратаря'), product('football', 'goals', 'Goals', 'Ворота'), product('football', 'net', 'Net', 'Сетка'),
      product('football', 'cones', 'Cones', 'Конусы'), product('football', 'training', 'Training equipment', 'Тренировочный инвентарь'), product('football', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      select('football_ball_size', 'Ball size', 'Размер мяча', [['1', '1', '1'], ['2', '2', '2'], ['3', '3', '3'], ['4', '4', '4'], ['5', '5', '5']], ['ball']),
      select('football_ball_use', 'Ball use', 'Назначение мяча', [['field', 'Full-size field', 'Большое поле'], ['futsal', 'Futsal', 'Футзал'], ['beach', 'Beach football', 'Пляжный футбол'], ['training', 'Training', 'Тренировочный'], ['souvenir', 'Souvenir', 'Сувенирный']], ['ball']),
      text('football_cover_material', 'Cover material', 'Материал покрытия', ['ball']), select('football_stitching', 'Stitching', 'Сшивка', [['machine', 'Machine', 'Машинная'], ['hand', 'Hand', 'Ручная']], ['ball']), text('football_certification', 'Certification', 'Сертификация', ['ball']),
      number('football_shoe_size', 'Shoe size', 'Размер обуви', 'EU', ['boots']), select('football_surface', 'Playing surface', 'Покрытие', [['fg', 'FG — firm ground', 'FG — натуральная трава'], ['ag', 'AG — artificial grass', 'AG — искусственная трава'], ['sg', 'SG — soft ground', 'SG — мягкий грунт'], ['tf', 'TF — turf', 'TF — сороконожки'], ['ic', 'IC — indoor', 'IC — зал']], ['boots']),
      number('football_goal_width', 'Goal width', 'Ширина ворот', 'cm', ['goals', 'net']), number('football_goal_height', 'Goal height', 'Высота ворот', 'cm', ['goals', 'net']), select('football_goal_installation', 'Installation', 'Установка', [['portable', 'Portable', 'Переносные'], ['fixed', 'Fixed', 'Стационарные']], ['goals']), boolean('football_goal_foldable', 'Foldable', 'Складные', ['goals']), boolean('football_net_included', 'Net included', 'Сетка в комплекте', ['goals'])
    ]
  },
  badminton: {
    productTypes: [
      product('badminton', 'racket', 'Racket', 'Ракетка'), product('badminton', 'shuttlecocks', 'Shuttlecocks', 'Воланы'), product('badminton', 'net', 'Net', 'Сетка'), product('badminton', 'posts', 'Posts', 'Стойки'),
      product('badminton', 'bag', 'Bag', 'Сумка'), product('badminton', 'shoes', 'Shoes', 'Обувь'), product('badminton', 'strings', 'Strings', 'Струны'), product('badminton', 'grip', 'Grip', 'Грип'), product('badminton', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      select('badminton_weight_class', 'Weight class', 'Весовая категория', [['2u', '2U', '2U'], ['3u', '3U', '3U'], ['4u', '4U', '4U'], ['5u', '5U', '5U'], ['6u', '6U', '6U']], ['racket']), number('badminton_weight', 'Weight', 'Вес', 'g', ['racket']),
      select('badminton_balance', 'Balance', 'Баланс', [['head_light', 'Head light', 'В ручку'], ['even', 'Even', 'Нейтральный'], ['head_heavy', 'Head heavy', 'В голову']], ['racket']),
      select('badminton_stiffness', 'Shaft stiffness', 'Жёсткость стержня', [['flexible', 'Flexible', 'Гибкий'], ['medium', 'Medium', 'Средний'], ['stiff', 'Stiff', 'Жёсткий']], ['racket']),
      select('badminton_grip_size', 'Grip size', 'Размер ручки', [['g2', 'G2', 'G2'], ['g3', 'G3', 'G3'], ['g4', 'G4', 'G4'], ['g5', 'G5', 'G5'], ['g6', 'G6', 'G6']], ['racket']),
      number('badminton_max_tension', 'Maximum string tension', 'Максимальное натяжение', 'lbs', ['racket']), boolean('badminton_strung', 'Strung', 'Со струнами', ['racket']),
      select('badminton_game_type', 'Game type', 'Тип игры', [['singles', 'Singles', 'Одиночная'], ['doubles', 'Doubles', 'Парная']], ['racket']),
      select('badminton_shuttle_material', 'Shuttlecock type', 'Тип воланов', [['feather', 'Feather', 'Перьевые'], ['nylon', 'Nylon', 'Нейлоновые']], ['shuttlecocks']),
      select('badminton_shuttle_speed', 'Speed', 'Скорость', [['slow', 'Slow', 'Медленная'], ['medium', 'Medium', 'Средняя'], ['fast', 'Fast', 'Быстрая']], ['shuttlecocks']), number('badminton_quantity', 'Quantity', 'Количество', undefined, ['shuttlecocks']), boolean('badminton_new', 'New', 'Новые', ['shuttlecocks'])
    ]
  },
  skateboarding: {
    productTypes: [
      product('skateboarding', 'skateboard', 'Skateboard', 'Skейтборд'), product('skateboarding', 'longboard', 'Longboard', 'Лонгборд'), product('skateboarding', 'cruiser', 'Cruiser', 'Круизер'),
      product('skateboarding', 'surfskate', 'Surfskate', 'Сёрфскейт'), product('skateboarding', 'deck', 'Deck', 'Дека'), product('skateboarding', 'trucks', 'Trucks', 'Подвески'),
      product('skateboarding', 'wheels', 'Wheels', 'Колёса'), product('skateboarding', 'bearings', 'Bearings', 'Подшипники'), product('skateboarding', 'protection', 'Protection', 'Защита'), product('skateboarding', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      text('skate_type', 'Type', 'Тип', ['skateboard', 'longboard', 'cruiser', 'surfskate', 'deck']), number('skate_length', 'Length', 'Длина', 'in', ['skateboard', 'longboard', 'cruiser', 'surfskate', 'deck']), number('skate_width', 'Width', 'Ширина', 'in', ['skateboard', 'longboard', 'cruiser', 'surfskate', 'deck']),
      text('skate_deck_material', 'Deck material', 'Материал деки', ['skateboard', 'longboard', 'cruiser', 'surfskate', 'deck']), boolean('skate_complete', 'Complete board', 'Комплектная доска', ['skateboard', 'longboard', 'cruiser', 'surfskate', 'deck']),
      select('skate_age', 'For whom', 'Для кого', [['child', 'Child', 'Ребёнок'], ['adult', 'Adult', 'Взрослый']], ['skateboard', 'longboard', 'cruiser', 'surfskate']), number('skate_max_user_weight', 'Maximum user weight', 'Максимальный вес пользователя', 'kg', ['skateboard', 'longboard', 'cruiser', 'surfskate']),
      number('skate_wheel_diameter', 'Wheel diameter', 'Диаметр колёс', 'mm', ['wheels']), number('skate_wheel_width', 'Wheel width', 'Ширина колёс', 'mm', ['wheels']), number('skate_wheel_hardness', 'Wheel hardness', 'Жёсткость колёс', 'A', ['wheels']), number('skate_wheel_quantity', 'Quantity', 'Количество', undefined, ['wheels']),
      number('skate_truck_width', 'Axle width', 'Ширина оси', 'mm', ['trucks']), select('skate_truck_position', 'Position', 'Расположение', [['front', 'Front', 'Передняя'], ['rear', 'Rear', 'Задняя'], ['set', 'Set', 'Комплект']], ['trucks']), number('skate_compatible_deck', 'Compatible deck width', 'Совместимая ширина деки', 'in', ['trucks']),
      text('surfskate_system', 'Truck system', 'Система подвески', ['surfskate']), number('surfskate_wheelbase', 'Wheelbase', 'Wheelbase', 'in', ['surfskate']), text('surfskate_system_brand', 'System brand', 'Бренд системы', ['surfskate'])
    ]
  },
  volleyball: {
    productTypes: [
      product('volleyball', 'ball', 'Ball', 'Мяч'), product('volleyball', 'net', 'Net', 'Сетка'), product('volleyball', 'posts', 'Posts', 'Стойки'), product('volleyball', 'uniform', 'Uniform', 'Форма'),
      product('volleyball', 'shoes', 'Shoes', 'Обувь'), product('volleyball', 'knee_pads', 'Knee pads', 'Наколенники'), product('volleyball', 'training', 'Training equipment', 'Тренировочный инвентарь'), product('volleyball', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      select('volleyball_ball_type', 'Ball type', 'Тип мяча', [['classic', 'Classic', 'Классический'], ['beach', 'Beach', 'Пляжный'], ['training', 'Training', 'Тренировочный'], ['kids', 'Kids', 'Детский']], ['ball']),
      select('volleyball_ball_size', 'Ball size', 'Размер мяча', [['4', '4', '4'], ['5', '5', '5']], ['ball']), text('volleyball_ball_material', 'Material', 'Материал', ['ball']),
      select('volleyball_use', 'Use', 'Назначение', [['indoor', 'Indoor', 'Для зала'], ['outdoor', 'Outdoor', 'Для улицы'], ['beach', 'Beach', 'Для пляжа']], ['ball']),
      select('volleyball_net_type', 'Net type', 'Тип сетки', [['beach', 'Beach', 'Пляжная'], ['classic', 'Classic', 'Классическая']], ['net']), number('volleyball_net_length', 'Net length', 'Длина сетки', 'm', ['net']), number('volleyball_net_height', 'Net height', 'Высота сетки', 'm', ['net']), number('volleyball_cell_size', 'Cell size', 'Размер ячейки', 'mm', ['net']), boolean('volleyball_posts_included', 'Posts included', 'Стойки в комплекте', ['net']),
      number('volleyball_shoe_size', 'Shoe size', 'Размер обуви', 'EU', ['shoes']), select('volleyball_protection_size', 'Protection size', 'Размер защиты', [['xs', 'XS', 'XS'], ['s', 'S', 'S'], ['m', 'M', 'M'], ['l', 'L', 'L'], ['xl', 'XL', 'XL']], ['knee_pads'])
    ]
  },
  running: {
    productTypes: [
      product('running', 'shoes', 'Running shoes', 'Кроссовки'), product('running', 'clothing', 'Clothing', 'Одежда'), product('running', 'hydration_vest', 'Hydration vest', 'Гидрационный жилет'),
      product('running', 'belt', 'Belt', 'Пояс'), product('running', 'bottle', 'Bottle', 'Фляга'), product('running', 'watch', 'Sports watch', 'Спортивные часы'),
      product('running', 'heart_rate', 'Heart-rate monitor', 'Пульсометр'), product('running', 'headlamp', 'Headlamp', 'Налобный фонарь'), product('running', 'poles', 'Trail poles', 'Трейловые палки'), product('running', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      number('running_shoe_size', 'Shoe size', 'Размер обуви', 'EU', ['shoes']),
      select('running_surface', 'Surface', 'Покрытие', [['road', 'Road', 'Асфальт'], ['trail', 'Trail', 'Трейл'], ['track', 'Track', 'Стадион'], ['all_round', 'All-round', 'Универсальное']], ['shoes']),
      select('running_use', 'Use', 'Назначение', [['daily', 'Daily training', 'Ежедневные тренировки'], ['tempo', 'Tempo', 'Темповые'], ['race', 'Racing', 'Соревновательные'], ['recovery', 'Recovery', 'Восстановительные']], ['shoes']),
      select('running_support', 'Support', 'Поддержка', [['neutral', 'Neutral', 'Нейтральная'], ['stability', 'Stability', 'Стабилизирующая']], ['shoes']),
      boolean('running_waterproof', 'Waterproof membrane', 'Водонепроницаемая мембрана', ['shoes']), number('running_shoe_mileage', 'Approximate shoe mileage', 'Примерный пробег обуви', 'km', ['shoes']),
      select('running_hydration_type', 'Hydration carrier type', 'Тип системы гидратации', [['vest', 'Vest', 'Жилет'], ['belt', 'Belt', 'Пояс'], ['backpack', 'Backpack', 'Рюкзак']], ['hydration_vest', 'belt']),
      number('running_hydration_volume', 'Volume', 'Объём', 'l', ['hydration_vest', 'belt']), text('running_hydration_size', 'Size', 'Размер', ['hydration_vest', 'belt']), number('running_bottle_count', 'Number of bottles', 'Количество фляг', undefined, ['hydration_vest', 'belt']), boolean('running_bottles_included', 'Bottles included', 'Фляги в комплекте', ['hydration_vest', 'belt']), number('running_max_water', 'Maximum water volume', 'Максимальный объём воды', 'l', ['hydration_vest', 'belt']),
      boolean('running_watch_gps', 'GPS', 'GPS', ['watch']), boolean('running_watch_hr', 'Heart-rate monitor', 'Пульсометр', ['watch']), boolean('running_watch_navigation', 'Navigation', 'Навигация', ['watch']), boolean('running_watch_music', 'Music', 'Музыка', ['watch']), number('running_watch_battery', 'Battery life', 'Время работы батареи', 'h', ['watch']), text('running_watch_compatibility', 'Phone compatibility', 'Совместимость с телефоном', ['watch'])
    ]
  },
  trekking_hiking: {
    productTypes: [
      product('trekking_hiking', 'backpack', 'Backpack', 'Рюкзак'), product('trekking_hiking', 'shoes', 'Footwear', 'Обувь'), product('trekking_hiking', 'poles', 'Trekking poles', 'Трекинговые палки'),
      product('trekking_hiking', 'clothing', 'Clothing', 'Одежда'), product('trekking_hiking', 'headlamp', 'Headlamp', 'Налобный фонарь'), product('trekking_hiking', 'navigator', 'Navigator', 'Навигатор'),
      product('trekking_hiking', 'hydration', 'Hydration system', 'Питьевая система'), product('trekking_hiking', 'raincoat', 'Raincoat', 'Дождевик'), product('trekking_hiking', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      select('trek_backpack_volume', 'Backpack volume', 'Объём рюкзака', [['up_to_15', 'Up to 15 l', 'До 15 л'], ['16_30', '16–30 l', '16–30 л'], ['31_50', '31–50 l', '31–50 л'], ['51_70', '51–70 l', '51–70 л'], ['over_70', 'More than 70 l', 'Более 70 л']], ['backpack']),
      text('trek_back_length', 'Back length or size', 'Размер спины', ['backpack']), select('trek_backpack_frame', 'Frame', 'Каркас', [['framed', 'Framed', 'Каркасный'], ['frameless', 'Frameless', 'Бескаркасный']], ['backpack']), boolean('trek_rain_cover', 'Rain cover', 'Накидка от дождя', ['backpack']), boolean('trek_hydration_included', 'Hydration system included', 'Питьевая система в комплекте', ['backpack']), number('trek_backpack_weight', 'Backpack weight', 'Вес рюкзака', 'kg', ['backpack']),
      select('trek_shoe_type', 'Footwear type', 'Тип обуви', [['boots', 'Boots', 'Ботинки'], ['low_shoes', 'Low shoes', 'Полуботинки'], ['sandals', 'Sandals', 'Сандалии']], ['shoes']), number('trek_shoe_size', 'Shoe size', 'Размер обуви', 'EU', ['shoes']), select('trek_shoe_height', 'Shoe height', 'Высота обуви', [['low', 'Low', 'Низкие'], ['mid', 'Mid', 'Средние'], ['high', 'High', 'Высокие']], ['shoes']), boolean('trek_membrane', 'Membrane', 'Мембрана', ['shoes']), select('trek_terrain', 'Terrain', 'Покрытие', [['easy', 'Easy trails', 'Лёгкие тропы'], ['mountain', 'Mountain routes', 'Горные маршруты'], ['all_round', 'All-round', 'Универсальные']], ['shoes']),
      select('trek_pole_type', 'Pole type', 'Тип палок', [['telescopic', 'Telescopic', 'Телескопические'], ['folding', 'Folding', 'Складные'], ['fixed', 'Fixed', 'Фиксированные']], ['poles']), number('trek_pole_min', 'Minimum length', 'Минимальная длина', 'cm', ['poles']), number('trek_pole_max', 'Maximum length', 'Максимальная длина', 'cm', ['poles']), select('trek_pole_material', 'Material', 'Материал', [['aluminum', 'Aluminum', 'Алюминий'], ['carbon', 'Carbon', 'Carbon']], ['poles']), select('trek_pole_count', 'Quantity', 'Количество', [['one', 'One', 'Одна'], ['pair', 'Pair', 'Пара']], ['poles']), number('trek_pole_weight', 'Weight', 'Вес', 'g', ['poles'])
    ]
  },
  golf: {
    productTypes: [
      product('golf', 'club_set', 'Club set', 'Набор клюшек'), product('golf', 'driver', 'Driver', 'Driver'), product('golf', 'fairway_wood', 'Fairway wood', 'Fairway wood'),
      product('golf', 'hybrid', 'Hybrid', 'Hybrid'), product('golf', 'irons', 'Irons', 'Irons'), product('golf', 'wedge', 'Wedge', 'Wedge'), product('golf', 'putter', 'Putter', 'Putter'),
      product('golf', 'balls', 'Balls', 'Мячи'), product('golf', 'bag', 'Bag', 'Сумка'), product('golf', 'trolley', 'Trolley', 'Тележка'), product('golf', 'shoes', 'Shoes', 'Обувь'),
      product('golf', 'rangefinder', 'Rangefinder', 'Дальномер'), product('golf', 'accessories', 'Accessories', 'Аксессуары')
    ],
    fields: [
      text('golf_club_type', 'Club type', 'Тип клюшки', ['club_set', 'driver', 'fairway_wood', 'hybrid', 'irons', 'wedge', 'putter']),
      select('golf_hand', 'Hand', 'Рука', [['right', 'Right', 'Правая'], ['left', 'Left', 'Левая']], ['club_set', 'driver', 'fairway_wood', 'hybrid', 'irons', 'wedge', 'putter']),
      select('golf_player', 'Player category', 'Категория игрока', [['men', 'Men', 'Мужская'], ['women', 'Women', 'Женская'], ['junior', 'Junior', 'Юниорская']], ['club_set', 'driver', 'fairway_wood', 'hybrid', 'irons', 'wedge', 'putter']),
      number('golf_loft', 'Club number or loft', 'Номер клюшки или loft', '°', ['driver', 'fairway_wood', 'hybrid', 'irons', 'wedge', 'putter']),
      select('golf_shaft_material', 'Shaft material', 'Материал шафта', [['steel', 'Steel', 'Steel'], ['graphite', 'Graphite', 'Graphite']], ['club_set', 'driver', 'fairway_wood', 'hybrid', 'irons', 'wedge', 'putter']),
      select('golf_shaft_flex', 'Shaft flex', 'Жёсткость шафта', [['ladies', 'Ladies', 'Ladies'], ['senior', 'Senior', 'Senior'], ['regular', 'Regular', 'Regular'], ['stiff', 'Stiff', 'Stiff'], ['extra_stiff', 'Extra Stiff', 'Extra Stiff']], ['club_set', 'driver', 'fairway_wood', 'hybrid', 'irons', 'wedge', 'putter']),
      select('golf_club_length', 'Club length', 'Длина клюшки', [['standard', 'Standard', 'Стандартная'], ['shortened', 'Shortened', 'Укороченная'], ['extended', 'Extended', 'Удлинённая']], ['club_set', 'driver', 'fairway_wood', 'hybrid', 'irons', 'wedge', 'putter']),
      number('golf_club_count', 'Number of clubs', 'Количество клюшек', undefined, ['club_set']), boolean('golf_headcovers', 'Headcovers included', 'Чехлы в комплекте', ['club_set']),
      select('golf_ball_condition', 'Ball condition', 'Состояние мячей', [['new', 'New', 'Новые'], ['practice', 'Practice', 'Тренировочные'], ['found', 'Found', 'Найденные']], ['balls']), number('golf_ball_quantity', 'Quantity', 'Количество', undefined, ['balls']), select('golf_ball_construction', 'Ball construction', 'Конструкция мяча', [['2_piece', '2-piece', '2-piece'], ['3_piece', '3-piece', '3-piece'], ['4_piece', '4-piece', '4-piece']], ['balls']),
      select('golf_bag_type', 'Bag type', 'Тип сумки', [['carry', 'Carry', 'Carry'], ['stand', 'Stand', 'Stand'], ['cart', 'Cart', 'Cart'], ['tour', 'Tour', 'Tour']], ['bag']), number('golf_bag_sections', 'Number of sections', 'Количество секций', undefined, ['bag']), boolean('golf_bag_legs', 'Legs', 'Ножки', ['bag']), boolean('golf_rain_cover', 'Rain cover', 'Дождевой чехол', ['bag']), boolean('golf_carry_straps', 'Carry straps', 'Ремни для переноски', ['bag'])
    ]
  }
};

export const getClassifiedSpecialConfig = (subCategory: string) => CLASSIFIED_SPECIAL_CONFIG[subCategory];

export const CLASSIFIED_GENERIC_SPECIAL_FIELDS: ClassifiedSpecialField[] = [
  text('classified_brand', 'Brand', 'Бренд'),
  text('classified_model', 'Model', 'Модель'),
  number('classified_purchase_year', 'Purchase year', 'Год покупки')
];

export const getClassifiedSpecialTranslations = (locale: 'en' | 'ru' | 'id' | 'de' | 'fr') => (
  Object.fromEntries(
    Object.entries(labels).map(([key, value]) => [key, locale === 'ru' ? value.ru : value.en])
  )
);

export const getVisibleClassifiedSpecialFields = (
  subCategory: string,
  productTypes: string[]
) => {
  const config = getClassifiedSpecialConfig(subCategory);
  if (!config) return CLASSIFIED_GENERIC_SPECIAL_FIELDS;
  return [...config.fields, ...CLASSIFIED_GENERIC_SPECIAL_FIELDS].filter(field => (
    !field.productTypes?.length || field.productTypes.some(productType => productTypes.includes(productType))
  ));
};

export const getMissingClassifiedSpecialFieldKey = (
  subCategory: string,
  productType: string,
  attributes: Record<string, ClassifiedSpecialValue>,
  classifiedLevel?: string
) => {
  const config = getClassifiedSpecialConfig(subCategory);
  if (!config) return '';
  if (!productType && config.productTypes.length > 0) return `${prefix}.productType`;
  if (subCategory === 'padel' && productType === 'racket' && !classifiedLevel) {
    return 'filters.classified.level';
  }
  const missingField = config.fields.find(field => (
    field.requiredFor?.includes(productType)
    && (attributes[field.id] === undefined || attributes[field.id] === '')
  ));
  return missingField?.labelKey || '';
};
