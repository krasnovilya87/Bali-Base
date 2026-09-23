import React from 'react';
import { X } from 'lucide-react';
import type { ElectronicsCategory } from '../../config/electronicsCatalog';
import { useI18n } from '../../i18nContext';

type Range = { min?: number; max?: number };
export type RangeSpec = { min: number; max: number; step: number };

export const ELECTRONICS_RANGE_SPECS: Record<ElectronicsCategory, Record<string, RangeSpec>> = {
  phones: {
    device_storage_gb: { min: 0, max: 1024, step: 16 },
    device_ram_gb: { min: 0, max: 32, step: 1 },
    device_battery_capacity: { min: 0, max: 10000, step: 50 },
    device_screen_inches: { min: 0, max: 8, step: 0.1 }
  },
  tablets: {
    device_storage_gb: { min: 0, max: 2048, step: 16 },
    device_ram_gb: { min: 0, max: 32, step: 1 },
    device_battery_capacity: { min: 0, max: 20000, step: 100 },
    device_screen_inches: { min: 0, max: 16, step: 0.1 }
  },
  computers: {
    device_storage_gb: { min: 0, max: 8192, step: 64 },
    device_ram_gb: { min: 0, max: 128, step: 1 },
    device_battery_capacity: { min: 0, max: 150, step: 1 },
    device_screen_inches: { min: 0, max: 40, step: 0.1 }
  },
  photo_video_gear: {
    device_battery_capacity: { min: 0, max: 10000, step: 50 },
    device_screen_inches: { min: 0, max: 8, step: 0.1 }
  },
  audio: {
    device_battery_capacity: { min: 0, max: 30000, step: 100 }
  },
  home_appliances: {
    appliance_power_w: { min: 0, max: 4000, step: 5 }
  },
  electronics_accessories: {
    device_storage_gb: { min: 0, max: 8192, step: 64 },
    device_battery_capacity: { min: 0, max: 50000, step: 100 }
  }
};

export const MARKET_TRANSPORT_RANGE_SPECS: Record<string, Record<string, RangeSpec>> = {
  ads_scooters: {
    vehicle_engine_displacement_cc: { min: 50, max: 1000, step: 10 },
    vehicle_engine_power_hp: { min: 1, max: 200, step: 1 },
    vehicle_mileage_km: { min: 0, max: 500000, step: 1000 }
  },
  ads_motorcycles: {
    vehicle_engine_displacement_cc: { min: 50, max: 2500, step: 25 },
    vehicle_engine_power_hp: { min: 1, max: 300, step: 1 },
    vehicle_mileage_km: { min: 0, max: 500000, step: 1000 }
  },
  ads_cars: {
    vehicle_engine_displacement_cc: { min: 500, max: 8000, step: 50 },
    vehicle_engine_power_hp: { min: 20, max: 1500, step: 5 },
    vehicle_mileage_km: { min: 0, max: 500000, step: 1000 }
  },
  bicycles: {
    vehicle_mileage_km: { min: 0, max: 500000, step: 1000 }
  },
  water_transport: {
    vehicle_engine_displacement_cc: { min: 0, max: 10000, step: 50 },
    vehicle_engine_power_hp: { min: 1, max: 2000, step: 5 },
    vehicle_mileage_km: { min: 0, max: 500000, step: 1000 }
  }
};

const MARKET_UNIT_RANGE_SPECS: Record<string, RangeSpec> = {
  kg: { min: 0, max: 250, step: 1 },
  g: { min: 0, max: 1000, step: 5 },
  cm: { min: 0, max: 400, step: 1 },
  mm: { min: 0, max: 500, step: 1 },
  in: { min: 0, max: 120, step: 0.5 },
  'sq in': { min: 0, max: 150, step: 1 },
  ft: { min: 0, max: 15, step: 0.5 },
  l: { min: 0, max: 200, step: 0.5 },
  m: { min: 0, max: 20, step: 0.1 },
  km: { min: 0, max: 100000, step: 100 },
  W: { min: 0, max: 3000, step: 10 },
  Wh: { min: 0, max: 2000, step: 10 },
  bar: { min: 0, max: 400, step: 5 },
  lbs: { min: 0, max: 50, step: 1 },
  EU: { min: 15, max: 50, step: 1 },
  h: { min: 0, max: 200, step: 1 },
  A: { min: 70, max: 105, step: 1 },
  '°': { min: 0, max: 70, step: 0.5 }
};

const MARKET_FIELD_RANGE_SPECS: Record<string, RangeSpec> = {
  cycling_year: { min: 1980, max: new Date().getFullYear(), step: 1 },
  swim_diopters: { min: -10, max: 10, step: 0.5 },
  swimwear_size: { min: 0, max: 20, step: 1 },
  cycling_gears: { min: 0, max: 33, step: 1 },
  cycling_mileage: { min: 0, max: 100000, step: 100 },
  running_shoe_mileage: { min: 0, max: 2000, step: 10 },
  volleyball_net_height: { min: 0, max: 4, step: 0.05 },
  tennis_string_tension: { min: 0, max: 40, step: 0.5 },
  golf_loft: { min: 0, max: 70, step: 0.5 },
  surf_length_inches: { min: 0, max: 12, step: 0.5 },
  surf_thickness_inches: { min: 0, max: 6, step: 0.1 },
  running_hydration_volume: { min: 0, max: 20, step: 0.5 },
  running_max_water: { min: 0, max: 20, step: 0.5 },
  trek_backpack_weight: { min: 0, max: 20, step: 0.1 }
};

export const getMarketNumberRangeSpec = (fieldId: string, unit?: string): RangeSpec =>
  MARKET_FIELD_RANGE_SPECS[fieldId]
    ?? MARKET_UNIT_RANGE_SPECS[unit || '']
    ?? { min: 0, max: 100, step: 1 };

const sliderClass = 'pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto';

type Props = {
  label: string;
  unit?: string;
  useGrouping?: boolean;
  spec: RangeSpec;
  value: Range;
  onChange: (value: Range) => void;
  formatValue?: (value: number) => string;
  formatScaleValue?: (value: number) => string;
};

const ClassifiedRangeFilter: React.FC<Props> = ({ label, unit, useGrouping = true, spec, value, onChange, formatValue, formatScaleValue }) => {
  const { tr } = useI18n();
  const min = Math.min(spec.min, value.min ?? spec.min, value.max ?? spec.min);
  const max = Math.max(spec.max, value.min ?? spec.max, value.max ?? spec.max);
  const selectedMin = value.min ?? min;
  const selectedMax = value.max ?? max;
  const percent = (number: number) => (number - min) / (max - min) * 100;
  const format = (number: number) => formatValue
    ? formatValue(number)
    : `${number.toLocaleString(undefined, { maximumFractionDigits: 1, useGrouping })}${unit ? ` ${unit}` : ''}`;
  const active = value.min !== undefined || value.max !== undefined;
  const selectAtPosition = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const nextValue = Math.max(min, Math.min(max, min + Math.round((fraction * (max - min)) / spec.step) * spec.step));
    if (Math.abs(nextValue - selectedMin) <= Math.abs(nextValue - selectedMax)) {
      const nextMin = Math.min(nextValue, selectedMax);
      onChange({ min: nextMin === min ? undefined : nextMin, max: value.max });
    } else {
      const nextMax = Math.max(nextValue, selectedMin);
      onChange({ min: value.min, max: nextMax === max ? undefined : nextMax });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="block min-w-0 text-xs font-semibold tracking-wider text-[#1E293B]">{label}</span>
        <div className="flex shrink-0 items-center gap-1">
          <span className="pl inline-flex rounded-lg bg-[#FF7A50]/10 px-2.5 py-1 text-xs font-semibold text-[#FF7A50]" aria-live="polite">
            {format(selectedMin)} - {format(selectedMax)}
          </span>
          {active && (
            <button
              type="button"
              title={tr('filters.classified.special.clearRange')}
              aria-label={`${tr('filters.classified.special.clearRange')}: ${label}`}
              onClick={() => onChange({})}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:text-[#FF7A50]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="polzunok-dual relative h-6 cursor-pointer touch-none" onPointerDown={selectAtPosition}>
        <div className="absolute inset-x-0 top-[9px] h-1.5 rounded-full bg-gray-100" />
        {active && (
          <div
            className="absolute top-[9px] h-1.5 rounded-full bg-[#FF7A50]"
            style={{ left: `${percent(selectedMin)}%`, width: `${percent(selectedMax) - percent(selectedMin)}%` }}
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={spec.step}
          value={selectedMin}
          aria-label={`${label}: ${tr('filters.classified.special.from')}`}
          aria-valuetext={format(selectedMin)}
          onChange={event => {
            const nextMin = Math.min(Number(event.target.value), selectedMax);
            onChange({ min: nextMin === min ? undefined : nextMin, max: value.max });
          }}
          className={sliderClass}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={spec.step}
          value={selectedMax}
          aria-label={`${label}: ${tr('filters.classified.special.to')}`}
          aria-valuetext={format(selectedMax)}
          onChange={event => {
            const nextMax = Math.max(Number(event.target.value), selectedMin);
            onChange({ min: value.min, max: nextMax === max ? undefined : nextMax });
          }}
          className={sliderClass}
        />
      </div>
      <div className="flex justify-between gap-3 text-[10px] font-bold text-[#94A3B8]">
        <span>{formatScaleValue ? formatScaleValue(min) : format(min)}</span>
        <span>{formatScaleValue ? formatScaleValue(max) : format(max)}</span>
      </div>
    </div>
  );
};

export default ClassifiedRangeFilter;
