export const CAR_BRAND_GROUPS = [
  { value: 'all', labelKey: 'wizard.transport.carType.all' },
  { value: 'toyota', label: 'Toyota' },
  { value: 'daihatsu', label: 'Daihatsu' },
  { value: 'honda', label: 'Honda' },
  { value: 'suzuki', label: 'Suzuki' },
  { value: 'mitsubishi', label: 'Mitsubishi' },
  { value: 'hyundai', label: 'Hyundai' },
  { value: 'nissan', label: 'Nissan' },
  { value: 'porsche', label: 'Porsche' },
  { value: 'lamborghini', label: 'Lamborghini' },
  { value: 'ferrari', label: 'Ferrari' },
  { value: 'bmw', label: 'BMW' },
  { value: 'mercedes_benz', label: 'Mercedes-Benz' },
  { value: 'ford', label: 'Ford' },
  { value: 'mazda', label: 'Mazda' }
] as const;

export type CarBrandGroup = typeof CAR_BRAND_GROUPS[number]['value'];

export const CAR_TYPE_GROUPS = [
  { value: 'all', labelKey: 'wizard.transport.carType.all' },
  { value: 'hatchback', labelKey: 'wizard.transport.carType.hatchback' },
  { value: 'minivan', labelKey: 'wizard.transport.carType.minivan' },
  { value: 'crossover', labelKey: 'wizard.transport.carType.crossover' },
  { value: 'jeep', labelKey: 'wizard.transport.carType.jeep' },
  { value: 'sedan', labelKey: 'wizard.transport.carType.sedan' },
  { value: 'sports_car', labelKey: 'wizard.transport.carType.sportsCar' },
  { value: 'business', labelKey: 'wizard.transport.carType.business' },
  { value: 'convertible', labelKey: 'wizard.transport.carType.convertible' }
] as const;

export type CarTypeGroup = typeof CAR_TYPE_GROUPS[number]['value'];

export type CarCatalogModel = {
  value: string;
  label: string;
  brand: Exclude<CarBrandGroup, 'all'>;
  types: readonly Exclude<CarTypeGroup, 'all'>[];
  engineDisplacementsCc: readonly number[];
};

export const CAR_MODEL_OPTIONS = [
  { value: 'toyota_agya', label: 'Agya', brand: 'toyota', types: ['hatchback'], engineDisplacementsCc: [1000, 1200] },
  { value: 'toyota_calya', label: 'Calya', brand: 'toyota', types: ['minivan'], engineDisplacementsCc: [1200] },
  { value: 'toyota_avanza', label: 'Avanza', brand: 'toyota', types: ['minivan'], engineDisplacementsCc: [1300, 1500] },
  { value: 'toyota_veloz', label: 'Veloz', brand: 'toyota', types: ['minivan'], engineDisplacementsCc: [1500] },
  { value: 'toyota_raize', label: 'Raize', brand: 'toyota', types: ['crossover'], engineDisplacementsCc: [1000, 1200] },
  { value: 'toyota_rush', label: 'Rush', brand: 'toyota', types: ['crossover', 'jeep'], engineDisplacementsCc: [1500] },
  { value: 'toyota_innova_reborn', label: 'Innova Reborn', brand: 'toyota', types: ['minivan'], engineDisplacementsCc: [2000, 2400] },
  { value: 'toyota_innova_zenix', label: 'Innova Zenix', brand: 'toyota', types: ['minivan', 'business'], engineDisplacementsCc: [2000] },
  { value: 'toyota_fortuner', label: 'Fortuner', brand: 'toyota', types: ['jeep'], engineDisplacementsCc: [2400, 2700, 2800] },
  { value: 'toyota_yaris', label: 'Yaris', brand: 'toyota', types: ['hatchback'], engineDisplacementsCc: [1500] },
  { value: 'toyota_alphard', label: 'Alphard', brand: 'toyota', types: ['minivan', 'business'], engineDisplacementsCc: [2400, 2500, 3500] },
  { value: 'toyota_hiace', label: 'Hiace', brand: 'toyota', types: ['minivan'], engineDisplacementsCc: [2500, 2800, 3000] },
  { value: 'toyota_camry', label: 'Camry', brand: 'toyota', types: ['sedan', 'business'], engineDisplacementsCc: [2500] },
  { value: 'toyota_vios', label: 'Vios', brand: 'toyota', types: ['sedan'], engineDisplacementsCc: [1500] },
  { value: 'daihatsu_ayla', label: 'Ayla', brand: 'daihatsu', types: ['hatchback'], engineDisplacementsCc: [1000, 1200] },
  { value: 'daihatsu_sigra', label: 'Sigra', brand: 'daihatsu', types: ['minivan'], engineDisplacementsCc: [1000, 1200] },
  { value: 'daihatsu_xenia', label: 'Xenia', brand: 'daihatsu', types: ['minivan'], engineDisplacementsCc: [1300, 1500] },
  { value: 'daihatsu_rocky', label: 'Rocky', brand: 'daihatsu', types: ['crossover'], engineDisplacementsCc: [1000, 1200] },
  { value: 'daihatsu_terios', label: 'Terios', brand: 'daihatsu', types: ['crossover', 'jeep'], engineDisplacementsCc: [1500] },
  { value: 'honda_brio', label: 'Brio', brand: 'honda', types: ['hatchback'], engineDisplacementsCc: [1200] },
  { value: 'honda_jazz', label: 'Jazz', brand: 'honda', types: ['hatchback'], engineDisplacementsCc: [1500] },
  { value: 'honda_mobilio', label: 'Mobilio', brand: 'honda', types: ['minivan'], engineDisplacementsCc: [1500] },
  { value: 'honda_br_v', label: 'BR-V', brand: 'honda', types: ['crossover'], engineDisplacementsCc: [1500] },
  { value: 'honda_hr_v', label: 'HR-V', brand: 'honda', types: ['crossover'], engineDisplacementsCc: [1500] },
  { value: 'honda_civic', label: 'Civic', brand: 'honda', types: ['sedan'], engineDisplacementsCc: [1500] },
  { value: 'honda_city', label: 'City', brand: 'honda', types: ['sedan'], engineDisplacementsCc: [1500] },
  { value: 'suzuki_ignis', label: 'Ignis', brand: 'suzuki', types: ['hatchback', 'crossover'], engineDisplacementsCc: [1200] },
  { value: 'suzuki_s_presso', label: 'S-Presso', brand: 'suzuki', types: ['hatchback'], engineDisplacementsCc: [1000] },
  { value: 'suzuki_ertiga', label: 'Ertiga', brand: 'suzuki', types: ['minivan'], engineDisplacementsCc: [1500] },
  { value: 'suzuki_xl7', label: 'XL7', brand: 'suzuki', types: ['crossover', 'minivan'], engineDisplacementsCc: [1500] },
  { value: 'suzuki_apv', label: 'APV', brand: 'suzuki', types: ['minivan'], engineDisplacementsCc: [1500] },
  { value: 'suzuki_jimny', label: 'Jimny', brand: 'suzuki', types: ['jeep'], engineDisplacementsCc: [1300, 1500] },
  { value: 'mitsubishi_xpander', label: 'Xpander', brand: 'mitsubishi', types: ['minivan'], engineDisplacementsCc: [1500] },
  { value: 'mitsubishi_pajero_sport', label: 'Pajero Sport', brand: 'mitsubishi', types: ['jeep'], engineDisplacementsCc: [2400, 2500] },
  { value: 'hyundai_stargazer', label: 'Stargazer', brand: 'hyundai', types: ['minivan'], engineDisplacementsCc: [1500] },
  { value: 'hyundai_creta', label: 'Creta', brand: 'hyundai', types: ['crossover'], engineDisplacementsCc: [1500] },
  { value: 'nissan_juke', label: 'Juke', brand: 'nissan', types: ['crossover'], engineDisplacementsCc: [1500, 1600] },
  { value: 'porsche_718_boxster', label: '718 Boxster', brand: 'porsche', types: ['sports_car', 'convertible'], engineDisplacementsCc: [2000, 2500, 4000] },
  { value: 'porsche_718_cayman', label: '718 Cayman', brand: 'porsche', types: ['sports_car'], engineDisplacementsCc: [2000, 2500, 4000] },
  { value: 'porsche_911', label: '911', brand: 'porsche', types: ['sports_car'], engineDisplacementsCc: [3000, 3700, 4000] },
  { value: 'lamborghini_gallardo', label: 'Gallardo', brand: 'lamborghini', types: ['sports_car'], engineDisplacementsCc: [5000, 5200] },
  { value: 'lamborghini_huracan', label: 'Huracán', brand: 'lamborghini', types: ['sports_car'], engineDisplacementsCc: [5200] },
  { value: 'ferrari_488_gtb', label: '488 GTB', brand: 'ferrari', types: ['sports_car'], engineDisplacementsCc: [3900] },
  { value: 'ferrari_roma', label: 'Roma', brand: 'ferrari', types: ['sports_car', 'business'], engineDisplacementsCc: [3900] },
  { value: 'ferrari_portofino', label: 'Portofino', brand: 'ferrari', types: ['sports_car', 'convertible'], engineDisplacementsCc: [3900] },
  { value: 'bmw_z4', label: 'Z4', brand: 'bmw', types: ['sports_car', 'convertible'], engineDisplacementsCc: [2000, 3000] },
  { value: 'bmw_3_series', label: '3 Series', brand: 'bmw', types: ['sedan', 'business'], engineDisplacementsCc: [2000, 3000] },
  { value: 'bmw_5_series', label: '5 Series', brand: 'bmw', types: ['sedan', 'business'], engineDisplacementsCc: [2000, 3000] },
  { value: 'mercedes_benz_c_class', label: 'C-Class', brand: 'mercedes_benz', types: ['sedan', 'business'], engineDisplacementsCc: [1500, 2000] },
  { value: 'mercedes_benz_e_class', label: 'E-Class', brand: 'mercedes_benz', types: ['sedan', 'business'], engineDisplacementsCc: [2000, 3000] },
  { value: 'mercedes_benz_s_class', label: 'S-Class', brand: 'mercedes_benz', types: ['sedan', 'business'], engineDisplacementsCc: [3000, 4000] },
  { value: 'mercedes_benz_v_class', label: 'V-Class', brand: 'mercedes_benz', types: ['minivan', 'business'], engineDisplacementsCc: [2000, 2100, 2200] },
  { value: 'ford_mustang', label: 'Mustang', brand: 'ford', types: ['sports_car'], engineDisplacementsCc: [2300, 5000] },
  { value: 'mazda_mx_5', label: 'MX-5', brand: 'mazda', types: ['sports_car', 'convertible'], engineDisplacementsCc: [1500, 2000] }
] as const satisfies readonly CarCatalogModel[];

export const CAR_ENGINE_DISPLACEMENT_MIN = 500;
export const CAR_ENGINE_DISPLACEMENT_MAX = 8000;

export const getCarModelsForGroup = (brand: CarBrandGroup, type: CarTypeGroup = 'all') =>
  CAR_MODEL_OPTIONS.filter(model =>
    (brand === 'all' || model.brand === brand) && (type === 'all' || (model.types as readonly string[]).includes(type))
  );

export const getCarModel = (value: string) => CAR_MODEL_OPTIONS.find(model => model.value === value);

export const getCarEngineDisplacements = (value: string): readonly number[] =>
  getCarModel(value)?.engineDisplacementsCc || [];

export const getCarModelLabel = (value: string) => getCarModel(value)?.label || '';

export const getCarBrandLabel = (value: string) => {
  const brandValue = getCarModel(value)?.brand;
  const brand = CAR_BRAND_GROUPS.find(group => group.value === brandValue);
  return brand && 'label' in brand ? brand.label : '';
};

export const carEngineMatchesRange = (
  savedDisplacement: number | undefined,
  min: number,
  max: number
) => savedDisplacement !== undefined
  ? savedDisplacement >= min && savedDisplacement <= max
  : min <= CAR_ENGINE_DISPLACEMENT_MIN && max >= CAR_ENGINE_DISPLACEMENT_MAX;
