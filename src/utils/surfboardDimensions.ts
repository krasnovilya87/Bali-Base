export type SurfboardPreset = {
  length: [number, number, number];
  width: [number, number, number];
  thickness: [number, number, number];
  volume: [number, number, number];
  coefficient: number;
  nose: 'pointed' | 'round' | 'wide';
  tail: 'pin' | 'squash' | 'swallow' | 'round';
};

const preset = (
  length: [number, number, number],
  width: [number, number, number],
  thickness: [number, number, number],
  volume: [number, number, number],
  coefficient: number,
  nose: SurfboardPreset['nose'],
  tail: SurfboardPreset['tail']
): SurfboardPreset => ({ length, width, thickness, volume, coefficient, nose, tail });

export const SURFBOARD_PRESETS: Record<string, SurfboardPreset> = {
  shortboard: preset([60, 74, 84], [17, 19.5, 22], [1.8, 2.5, 3.2], [18, 31, 48], 0.51, 'pointed', 'squash'),
  fish: preset([62, 68, 82], [19, 21.5, 24], [2.1, 2.65, 3.3], [24, 36, 55], 0.56, 'round', 'swallow'),
  hybrid: preset([64, 72, 88], [18, 20.5, 23], [2, 2.6, 3.3], [22, 35, 56], 0.54, 'round', 'squash'),
  egg: preset([66, 84, 96], [19, 22, 24], [2.2, 2.75, 3.5], [28, 45, 70], 0.57, 'round', 'round'),
  funboard: preset([76, 84, 102], [20, 22, 24.5], [2.4, 2.9, 3.6], [38, 52, 78], 0.56, 'round', 'round'),
  mid_length: preset([78, 90, 108], [20, 22, 24], [2.4, 2.9, 3.6], [40, 56, 85], 0.55, 'round', 'round'),
  longboard: preset([96, 108, 132], [21, 23, 25], [2.5, 3.1, 4], [52, 72, 110], 0.56, 'round', 'squash'),
  gun: preset([78, 96, 132], [18, 20, 22.5], [2.3, 2.8, 3.6], [34, 52, 85], 0.49, 'pointed', 'pin'),
  mini_mal: preset([84, 96, 112], [21, 22.5, 24.5], [2.5, 3, 3.8], [45, 62, 92], 0.56, 'round', 'round'),
  sup: preset([96, 126, 168], [26, 31, 36], [3.5, 4.8, 7], [85, 170, 330], 0.6, 'wide', 'squash'),
  other: preset([54, 84, 168], [16, 22, 36], [1.5, 3, 7], [15, 55, 330], 0.54, 'round', 'round')
};

export const getSurfboardPreset = (boardType?: string) => SURFBOARD_PRESETS[boardType || ''] || SURFBOARD_PRESETS.shortboard;

export const clampSurfboardValue = (value: number, range: [number, number, number]) => Math.min(range[2], Math.max(range[0], value));

export const surfboardLengthInchesToCm = (inches: number) => Math.round(inches * 2.54 * 100) / 100;
export const surfboardLengthCmToInches = (cm: number) => cm / 2.54;

export const formatSurfboardLength = (totalInches: number) => {
  const rounded = Math.round(totalInches);
  return `${Math.floor(rounded / 12)}'${rounded % 12}\"`;
};

export const calculateSurfboardVolumeRange = (
  lengthInches: number,
  widthInches: number,
  thicknessInches: number,
  boardType?: string
) => {
  const coefficient = getSurfboardPreset(boardType).coefficient;
  const center = lengthInches * 2.54 * widthInches * 2.54 * thicknessInches * 2.54 * coefficient / 1000;
  return [Math.max(1, center * 0.88), center * 1.12] as [number, number];
};

export const calculateSurfboardThicknessRange = (
  lengthInches: number,
  widthInches: number,
  volumeLiters: number,
  boardType?: string
) => {
  const coefficient = getSurfboardPreset(boardType).coefficient;
  const thicknessCm = volumeLiters * 1000 / Math.max(1, lengthInches * 2.54 * widthInches * 2.54 * coefficient);
  const center = thicknessCm / 2.54;
  return [Math.max(0.5, center - 0.14), center + 0.14] as [number, number];
};

export const getDefaultSurfboardFinConfiguration = (boardType?: string) => {
  if (boardType === 'fish') return 'twin';
  if (boardType === 'longboard') return 'single';
  if (['egg', 'funboard', 'mid_length', 'mini_mal', 'sup'].includes(boardType || '')) return 'two_plus_one';
  return 'thruster';
};

export const calculateSurfboardWeightRange = (
  volumeLiters: number,
  boardType?: string,
  material?: string
) => {
  const materialFactor: Record<string, number> = {
    pu_polyester: 1,
    eps_epoxy: 0.88,
    soft_top: 1.16,
    inflatable: 0.82,
    unknown: 1
  };
  const typeFactor = boardType === 'sup' ? 1.08 : boardType === 'longboard' ? 1.04 : 1;
  const center = (1.55 + volumeLiters * 0.066) * typeFactor * (materialFactor[material || 'unknown'] || 1);
  return [Math.max(1.2, center * 0.84), center * 1.16] as [number, number];
};

export const getSurfboardWeightLimits = (boardType?: string, material?: string) => {
  const current = getSurfboardPreset(boardType);
  const low = calculateSurfboardWeightRange(current.volume[0], boardType, material)[0];
  const suggested = calculateSurfboardWeightRange(current.volume[1], boardType, material);
  const high = calculateSurfboardWeightRange(current.volume[2], boardType, material)[1];
  return [
    Math.floor(low * 10) / 10,
    Math.round(((suggested[0] + suggested[1]) / 2) * 10) / 10,
    Math.ceil(high * 10) / 10
  ] as [number, number, number];
};

export const getDefaultSurfboardAttributes = () => {
  const current = SURFBOARD_PRESETS.shortboard;
  const lengthInches = current.length[1];
  const weight = getSurfboardWeightLimits('shortboard')[1];
  return {
    surf_board_type: 'shortboard',
    surf_fin_configuration: getDefaultSurfboardFinConfiguration('shortboard'),
    surf_length_feet: Math.floor(lengthInches / 12),
    surf_length_inches: lengthInches % 12,
    surf_length_cm: surfboardLengthInchesToCm(lengthInches),
    surf_width_inches: current.width[1],
    surf_thickness_inches: current.thickness[1],
    surf_volume_l: current.volume[1],
    surf_weight_kg: weight
  };
};
