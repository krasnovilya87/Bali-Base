import React from 'react';
import { X } from 'lucide-react';
import Polzunok from '../Polzunok';
import { useI18n } from '../../i18nContext';
import type { RangeSpec } from './ClassifiedRangeFilter';

type Props = {
  label: string;
  unit?: string;
  required?: boolean;
  spec: RangeSpec;
  value?: number;
  onChange: (value: number | undefined) => void;
  useGrouping?: boolean;
  formatValue?: (value: number) => string;
  formatScaleValue?: (value: number) => string;
  trackRemainderColor?: string;
};

const ClassifiedValueSlider: React.FC<Props> = ({
  label,
  unit,
  required = false,
  spec,
  value,
  onChange,
  useGrouping = true,
  formatValue,
  formatScaleValue,
  trackRemainderColor
}) => {
  const { tr } = useI18n();
  const selectedValue = typeof value === 'number' ? value : spec.min;
  const defaultFormat = (number: number) => `${number.toLocaleString(undefined, {
    maximumFractionDigits: 1,
    useGrouping
  })}${unit ? ` ${unit}` : ''}`;
  const format = formatValue || defaultFormat;
  const formatScale = formatScaleValue || format;
  const selectedPercent = spec.max === spec.min
    ? 0
    : Math.max(0, Math.min(100, (selectedValue - spec.min) / (spec.max - spec.min) * 100));

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between gap-3 pb-1 pt-1">
        <span className="min-w-0 text-xs font-semibold tracking-wider text-[#1E293B]">
          {label}{required ? ' *' : ''}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <span className={`pl inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${typeof value === 'number' ? 'bg-[#FF7A50]/10 text-[#FF7A50]' : 'bg-slate-100 text-slate-400'}`} aria-live="polite">
            {typeof value === 'number' ? format(value) : tr('details.life.notSpecified')}
          </span>
          {typeof value === 'number' && (
            <button
              type="button"
              title={tr('filters.classified.special.clearRange')}
              aria-label={`${tr('filters.classified.special.clearRange')}: ${label}`}
              onClick={() => onChange(undefined)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:text-[#FF7A50]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-0.5">
        <Polzunok
          min={spec.min}
          max={spec.max}
          step={spec.step}
          value={selectedValue}
          onChange={onChange}
          className={typeof value === 'number' ? '' : 'opacity-65'}
          style={trackRemainderColor ? {
            background: `linear-gradient(to right, #FF7A50 0%, #FF7A50 ${selectedPercent}%, ${trackRemainderColor} ${selectedPercent}%, ${trackRemainderColor} 100%)`,
            boxShadow: 'inset 0 0 0 1px #E5E7EB'
          } : undefined}
        />
      </div>

      <div className="mt-1 flex justify-between gap-3 text-[10px] font-bold text-[#94A3B8]">
        <span>{formatScale(spec.min)}</span>
        <span>{formatScale(spec.max)}</span>
      </div>
    </div>
  );
};

export default ClassifiedValueSlider;
