export const snapRangeValue = (
  value: number,
  startValue: number,
  min: number,
  max: number,
  step: number
) => {
  const clampedValue = Math.max(min, Math.min(max, value));
  const lowerIndex = Math.floor((clampedValue - min) / step);
  const lower = Math.max(min, Math.min(max, min + lowerIndex * step));
  const upper = Math.max(min, Math.min(max, lower + step));

  if (lower === upper) return lower;

  const progress = (clampedValue - lower) / (upper - lower);

  if (clampedValue > startValue) {
    return progress >= 1 / 3 ? upper : lower;
  }

  if (clampedValue < startValue) {
    return progress <= 2 / 3 ? lower : upper;
  }

  return progress >= 0.5 ? upper : lower;
};

export const snapRangeValueToNearest = (
  value: number,
  min: number,
  max: number,
  step: number
) => {
  const clampedValue = Math.max(min, Math.min(max, value));
  const index = Math.round((clampedValue - min) / step);
  return Math.max(min, Math.min(max, min + index * step));
};
