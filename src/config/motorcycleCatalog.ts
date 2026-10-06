export const MOTORCYCLE_MODEL_GROUPS = [
  { value: 'all', labelKey: 'wizard.transport.motorcycleType.all' },
  { value: 'honda', label: 'Honda' },
  { value: 'kawasaki', label: 'Kawasaki' },
  { value: 'yamaha', label: 'Yamaha' },
  { value: 'suzuki', label: 'Suzuki' },
  { value: 'royal_enfield', label: 'Royal Enfield' },
  { value: 'ktm', label: 'KTM' },
  { value: 'bmw', label: 'BMW' },
  { value: 'harley_davidson', label: 'Harley-Davidson' },
  { value: 'triumph', label: 'Triumph' },
  { value: 'ducati', label: 'Ducati' }
] as const;

export type MotorcycleModelGroup = typeof MOTORCYCLE_MODEL_GROUPS[number]['value'];

export const MOTORCYCLE_TYPE_GROUPS = [
  { value: 'all', labelKey: 'wizard.transport.motorcycleType.all' },
  { value: 'enduro', labelKey: 'wizard.transport.motorcycleType.enduro' },
  { value: 'adventure', labelKey: 'wizard.transport.motorcycleType.adventure' },
  { value: 'road', labelKey: 'wizard.transport.motorcycleType.road' },
  { value: 'sport', labelKey: 'wizard.transport.motorcycleType.sport' },
  { value: 'cruiser', labelKey: 'wizard.transport.motorcycleType.cruiser' },
  { value: 'classic', labelKey: 'wizard.transport.motorcycleType.classic' }
] as const;

export type MotorcycleTypeGroup = typeof MOTORCYCLE_TYPE_GROUPS[number]['value'];

export type MotorcycleCatalogModel = {
  value: string;
  label: string;
  group: Exclude<MotorcycleModelGroup, 'all'>;
  types: readonly Exclude<MotorcycleTypeGroup, 'all'>[];
  engineDisplacementsCc: readonly number[];
};

export const MOTORCYCLE_MODEL_OPTIONS = [
  { value: 'honda_crf_150l', label: 'CRF150L', group: 'honda', types: ['enduro'], engineDisplacementsCc: [149] },
  { value: 'honda_crf_250_rally', label: 'CRF250 Rally', group: 'honda', types: ['enduro', 'adventure'], engineDisplacementsCc: [250] },
  { value: 'honda_cb150x', label: 'CB150X', group: 'honda', types: ['road', 'adventure'], engineDisplacementsCc: [149] },
  { value: 'honda_cbr250rr', label: 'CBR250RR', group: 'honda', types: ['sport'], engineDisplacementsCc: [250] },
  { value: 'honda_cb500x', label: 'CB500X', group: 'honda', types: ['road', 'adventure'], engineDisplacementsCc: [471] },
  { value: 'honda_rebel_500', label: 'Rebel 500', group: 'honda', types: ['cruiser'], engineDisplacementsCc: [471] },
  { value: 'kawasaki_klx_150', label: 'KLX150', group: 'kawasaki', types: ['enduro'], engineDisplacementsCc: [144] },
  { value: 'kawasaki_klx_230', label: 'KLX230', group: 'kawasaki', types: ['enduro'], engineDisplacementsCc: [233] },
  { value: 'kawasaki_klx_250', label: 'KLX250', group: 'kawasaki', types: ['enduro'], engineDisplacementsCc: [249] },
  { value: 'kawasaki_ninja_250', label: 'Ninja 250', group: 'kawasaki', types: ['sport'], engineDisplacementsCc: [249] },
  { value: 'kawasaki_zx_25r', label: 'ZX-25R', group: 'kawasaki', types: ['sport'], engineDisplacementsCc: [250] },
  { value: 'kawasaki_w175', label: 'W175', group: 'kawasaki', types: ['classic', 'road'], engineDisplacementsCc: [177] },
  { value: 'kawasaki_versys_x_250', label: 'Versys-X 250', group: 'kawasaki', types: ['adventure', 'road'], engineDisplacementsCc: [249] },
  { value: 'kawasaki_z1000', label: 'Z1000', group: 'kawasaki', types: ['road'], engineDisplacementsCc: [1043] },
  { value: 'yamaha_xsr_155', label: 'XSR155', group: 'yamaha', types: ['classic', 'road'], engineDisplacementsCc: [155] },
  { value: 'yamaha_wr155r', label: 'WR155R', group: 'yamaha', types: ['enduro'], engineDisplacementsCc: [155] },
  { value: 'yamaha_mt_25', label: 'MT-25', group: 'yamaha', types: ['road'], engineDisplacementsCc: [250] },
  { value: 'yamaha_yzf_r25', label: 'YZF-R25', group: 'yamaha', types: ['sport'], engineDisplacementsCc: [250] },
  { value: 'yamaha_r15', label: 'R15', group: 'yamaha', types: ['sport'], engineDisplacementsCc: [155] },
  { value: 'suzuki_v_strom_250', label: 'V-Strom 250', group: 'suzuki', types: ['adventure', 'road'], engineDisplacementsCc: [248] },
  { value: 'royal_enfield_hunter_350', label: 'Hunter 350', group: 'royal_enfield', types: ['classic', 'road'], engineDisplacementsCc: [349] },
  { value: 'royal_enfield_classic_350_500', label: 'Classic 350', group: 'royal_enfield', types: ['classic'], engineDisplacementsCc: [349] },
  { value: 'royal_enfield_meteor_350', label: 'Meteor 350', group: 'royal_enfield', types: ['cruiser', 'classic'], engineDisplacementsCc: [349] },
  { value: 'royal_enfield_scram_411', label: 'Scram 411', group: 'royal_enfield', types: ['adventure', 'classic'], engineDisplacementsCc: [411] },
  { value: 'royal_enfield_himalayan', label: 'Himalayan 411', group: 'royal_enfield', types: ['adventure'], engineDisplacementsCc: [411] },
  { value: 'royal_enfield_himalayan_450', label: 'Himalayan 450', group: 'royal_enfield', types: ['adventure'], engineDisplacementsCc: [452] },
  { value: 'ktm_duke_250', label: 'Duke 250', group: 'ktm', types: ['road'], engineDisplacementsCc: [249] },
  { value: 'ktm_duke_390', label: 'Duke 390', group: 'ktm', types: ['road'], engineDisplacementsCc: [399] },
  { value: 'ktm_rc_250_390', label: 'RC 390', group: 'ktm', types: ['sport'], engineDisplacementsCc: [373, 399] },
  { value: 'bmw_g_310_gs', label: 'G 310 GS', group: 'bmw', types: ['adventure'], engineDisplacementsCc: [313] },
  { value: 'bmw_r_1250_1200_gs', label: 'R 1250 GS', group: 'bmw', types: ['adventure'], engineDisplacementsCc: [1254] },
  { value: 'harley_davidson_iron_883', label: 'Iron 883', group: 'harley_davidson', types: ['cruiser', 'classic'], engineDisplacementsCc: [883] },
  { value: 'harley_davidson_iron_1200', label: 'Iron 1200', group: 'harley_davidson', types: ['cruiser', 'classic'], engineDisplacementsCc: [1202] },
  { value: 'harley_davidson_street_bob_dyna', label: 'Street Bob', group: 'harley_davidson', types: ['cruiser', 'classic'], engineDisplacementsCc: [1585, 1690, 1746, 1868] },
  { value: 'harley_davidson_fat_boy', label: 'Fat Boy', group: 'harley_davidson', types: ['cruiser', 'classic'], engineDisplacementsCc: [1690, 1746, 1868] },
  { value: 'ducati_monster', label: 'Monster', group: 'ducati', types: ['road'], engineDisplacementsCc: [659, 696, 797, 821, 937, 1200] },
  { value: 'ducati_scrambler', label: 'Scrambler', group: 'ducati', types: ['classic', 'road'], engineDisplacementsCc: [399, 803, 1079] },
  { value: 'triumph_bonneville_t100', label: 'Bonneville T100', group: 'triumph', types: ['classic', 'road'], engineDisplacementsCc: [900] },
  { value: 'triumph_thruxton', label: 'Thruxton', group: 'triumph', types: ['classic', 'sport'], engineDisplacementsCc: [865, 900, 1200] },
  { value: 'triumph_bobber', label: 'Bobber', group: 'triumph', types: ['cruiser', 'classic'], engineDisplacementsCc: [1200] }
] as const satisfies readonly MotorcycleCatalogModel[];

export const MOTORCYCLE_OTHER_MODEL_PREFIX = 'other:';
export const MOTORCYCLE_ENGINE_DISPLACEMENT_MIN = 100;
export const MOTORCYCLE_ENGINE_DISPLACEMENT_MAX = 1900;

export const getMotorcycleModelsForGroup = (group: MotorcycleModelGroup, type: MotorcycleTypeGroup = 'all') =>
  MOTORCYCLE_MODEL_OPTIONS.filter(model =>
    (group === 'all' || model.group === group) && (type === 'all' || (model.types as readonly string[]).includes(type))
  );

export const getMotorcycleModel = (value: string) =>
  MOTORCYCLE_MODEL_OPTIONS.find(model => model.value === value);

export const getMotorcycleEngineDisplacements = (value: string): readonly number[] =>
  getMotorcycleModel(value)?.engineDisplacementsCc || [];

export const getMotorcycleModelLabel = (value: string) => {
  if (value.startsWith(MOTORCYCLE_OTHER_MODEL_PREFIX)) {
    return value.slice(MOTORCYCLE_OTHER_MODEL_PREFIX.length).trim();
  }
  return getMotorcycleModel(value)?.label || '';
};

export const motorcycleEngineMatchesRange = (
  modelValue: string,
  savedDisplacement: number | undefined,
  min: number,
  max: number
) => {
  if (savedDisplacement !== undefined) return savedDisplacement >= min && savedDisplacement <= max;
  const catalogDisplacements = getMotorcycleEngineDisplacements(modelValue);
  if (catalogDisplacements.length === 0) {
    return min <= MOTORCYCLE_ENGINE_DISPLACEMENT_MIN && max >= MOTORCYCLE_ENGINE_DISPLACEMENT_MAX;
  }
  return catalogDisplacements.some(value => value >= min && value <= max);
};
