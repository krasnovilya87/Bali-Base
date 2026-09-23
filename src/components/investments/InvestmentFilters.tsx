import React from 'react';
import { FilterState, Listing } from '../../types';
import { getInvestmentFields, INVESTMENT_SUBTYPES } from '../../config/investmentSpecial';
import { useI18n } from '../../i18nContext';
import ClassifiedRangeFilter, { RangeSpec } from '../classified/ClassifiedRangeFilter';
import { X } from 'lucide-react';

type Props = {
  subCategory: string;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  listings: Listing[];
};

const titleClass = 'text-xs font-semibold font-sans text-[#1E293B] tracking-wider block';
const inputClass = 'min-w-0 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#FF7A50]';
const pillClass = 'min-h-9 rounded-full border px-3 py-2 text-[11px] font-extrabold transition';

const INVESTMENT_RANGE_SPECS: Record<string, RangeSpec> = {
  bedrooms: { min: 0, max: 20, step: 1 },
  bathrooms: { min: 0, max: 20, step: 1 },
  building_area: { min: 0, max: 3000, step: 10 },
  land_area: { min: 0, max: 10000, step: 10 },
  year_built: { min: 1950, max: new Date().getFullYear() + 5, step: 1 },
  occupancy: { min: 0, max: 100, step: 1 },
  leasehold_remaining: { min: 0, max: 100, step: 1 },
  declared_yield: { min: 0, max: 50, step: 0.5 },
  payback_period: { min: 0, max: 50, step: 1 },
  premises_area: { min: 0, max: 10000, step: 10 },
  floors: { min: 0, max: 50, step: 1 },
  capacity: { min: 0, max: 5000, step: 10 },
  electric_power: { min: 0, max: 1000, step: 5 },
  access_road_width: { min: 0, max: 30, step: 0.5 },
  distance_to_ocean: { min: 0, max: 50000, step: 100 },
  business_age: { min: 0, max: 100, step: 1 },
  employees: { min: 0, max: 1000, step: 1 },
  lease_remaining: { min: 0, max: 100, step: 1 }
};

const fallbackMoneySpec: RangeSpec = { min: 0, max: 1000000000, step: 1000000 };

type SingleRangeDirection = 'min' | 'max';

const SINGLE_RANGE_DIRECTIONS: Record<string, SingleRangeDirection> = {
  bedrooms: 'min',
  bathrooms: 'min',
  leasehold_remaining: 'min',
  declared_yield: 'min',
  premises_area: 'min',
  floors: 'min',
  capacity: 'min',
  electric_power: 'min',
  access_road_width: 'min',
  lease_remaining: 'min',
  payback_period: 'max',
  distance_to_ocean: 'max'
};

type SingleRangeProps = {
  label: string;
  unit?: string;
  direction: SingleRangeDirection;
  spec: RangeSpec;
  value: { min?: number; max?: number };
  onChange: (value: { min?: number; max?: number }) => void;
  formatValue?: (value: number) => string;
};

const SingleInvestmentRange: React.FC<SingleRangeProps> = ({ label, unit, direction, spec, value, onChange, formatValue }) => {
  const { tr } = useI18n();
  const active = direction === 'min' ? value.min !== undefined : value.max !== undefined;
  const midpoint = spec.min + Math.round(((spec.max - spec.min) / 2) / spec.step) * spec.step;
  const selected = direction === 'min' ? value.min ?? midpoint : value.max ?? midpoint;
  const percent = (selected - spec.min) / (spec.max - spec.min) * 100;
  const format = (number: number) => formatValue
    ? formatValue(number)
    : `${number.toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ''}`;
  const prefix = direction === 'min' ? tr('investments.from') : tr('investments.to');
  const background = `linear-gradient(to right, #FF7A50 0%, #FF7A50 ${percent}%, #FFFFFF ${percent}%, #FFFFFF 100%)`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className={titleClass}>{label}</span>
        <div className="flex shrink-0 items-center gap-1">
          <span className="pl inline-flex rounded-lg bg-[#FF7A50]/10 px-2.5 py-1 text-xs font-semibold text-[#FF7A50]">
            {active ? `${prefix} ${format(selected)}` : format(selected)}
          </span>
          {active && (
            <button type="button" title={tr('filters.classified.special.clearRange')} onClick={() => onChange({})} className="flex h-7 w-7 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:text-[#FF7A50]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={selected}
        onChange={event => {
          const next = Number(event.target.value);
          if (direction === 'min') onChange({ min: next === spec.min ? undefined : next });
          else onChange({ max: next === spec.max ? undefined : next });
        }}
        className="polzunok w-full"
        style={{ background, boxShadow: 'inset 0 0 0 1px #E5E7EB' }}
      />
      <div className="flex justify-between gap-3 text-[10px] font-bold text-[#94A3B8]">
        <span>{format(spec.min)}</span>
        <span>{format(spec.max)}</span>
      </div>
    </div>
  );
};

export default function InvestmentFilters({ subCategory, filters, setFilters, listings }: Props) {
  const { tr } = useI18n();
  const fields = getInvestmentFields(subCategory);
  const update = (patch: Partial<FilterState>) => setFilters(current => ({ ...current, ...patch }));

  const toggleOption = (fieldId: string, value: string) => {
    const current = filters.investmentOptions[fieldId] || [];
    update({ investmentOptions: { ...filters.investmentOptions, [fieldId]: current.includes(value) ? current.filter(item => item !== value) : [...current, value] } });
  };

  const getRangeSpec = (fieldId: string, isMoney: boolean): RangeSpec => {
    if (!isMoney) return INVESTMENT_RANGE_SPECS[fieldId] || { min: 0, max: 100, step: 1 };

    const values = listings
      .map(listing => Number(listing.investmentAttributes?.[fieldId]))
      .filter(value => Number.isFinite(value) && value >= 0);
    if (!values.length) return fallbackMoneySpec;

    const observedMin = Math.min(...values);
    const observedMax = Math.max(...values);
    const spread = Math.max(observedMax - observedMin, observedMax * 0.1, 1000000);
    const stepMagnitude = 10 ** Math.max(0, Math.floor(Math.log10(spread)) - 2);
    const step = Math.max(1000, stepMagnitude);
    const min = Math.max(0, Math.floor((observedMin - (observedMin === observedMax ? spread / 2 : 0)) / step) * step);
    const max = Math.ceil((observedMax + (observedMin === observedMax ? spread / 2 : 0)) / step) * step;
    return { min, max: Math.max(max, min + step), step };
  };

  const updateRange = (fieldId: string, range: { min?: number; max?: number }) => {
    const nextRanges = { ...filters.investmentNumberRanges };
    if (range.min === undefined && range.max === undefined) delete nextRanges[fieldId];
    else nextRanges[fieldId] = range;
    update({ investmentNumberRanges: nextRanges });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <span className={titleClass}>{tr('investments.subtype')}</span>
        <div className="flex flex-wrap gap-2">
          {(INVESTMENT_SUBTYPES[subCategory] || []).map(item => {
            const active = filters.investmentSubtypes.includes(item.value);
            return <button key={item.value} type="button" onClick={() => update({ investmentSubtypes: active ? filters.investmentSubtypes.filter(value => value !== item.value) : [...filters.investmentSubtypes, item.value] })} className={`${pillClass} ${active ? 'border-[#FF7A50] bg-[#FF7A50] text-white' : 'border-[#E5E7EB] bg-white text-[#1E293B]'}`}>{tr(item.labelKey)}</button>;
          })}
        </div>
      </div>

      {fields.map(field => (
        <div key={field.id} className="space-y-3">
          {field.type !== 'number' && <span className={titleClass}>{tr(field.labelKey)}</span>}
          {field.type === 'number' && (
            SINGLE_RANGE_DIRECTIONS[field.id] ? (
              <SingleInvestmentRange
                label={tr(field.labelKey)}
                unit={field.id === 'land_area' ? undefined : field.unitKey ? tr(field.unitKey) : undefined}
                direction={SINGLE_RANGE_DIRECTIONS[field.id]}
                spec={getRangeSpec(field.id, false)}
                value={filters.investmentNumberRanges[field.id] || {}}
                onChange={range => updateRange(field.id, range)}
                formatValue={field.id === 'land_area'
                  ? value => `${value.toLocaleString()} ${tr('investments.unit.sqm')} (${(value / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })} are)`
                  : undefined}
              />
            ) : (
              <ClassifiedRangeFilter
                label={tr(field.labelKey)}
                unit={field.unitKey ? tr(field.unitKey) : undefined}
                spec={getRangeSpec(field.id, field.unitKey === 'investments.unit.idr')}
                value={filters.investmentNumberRanges[field.id] || {}}
                onChange={range => updateRange(field.id, range)}
                formatValue={field.id === 'land_area'
                  ? value => `${value.toLocaleString()} ${tr('investments.unit.sqm')} (${(value / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })} are)`
                  : undefined}
                formatScaleValue={field.id === 'land_area'
                  ? value => `${value.toLocaleString()} ${tr('investments.unit.sqm')}`
                  : undefined}
              />
            )
          )}
          {field.type === 'text' && <input type="text" value={filters.investmentText[field.id] || ''} onChange={event => update({ investmentText: { ...filters.investmentText, [field.id]: event.target.value } })} className={inputClass} />}
          {(field.type === 'select' || field.type === 'multi' || field.type === 'boolean') && (
            <div className="flex flex-wrap gap-2">
              {(field.options || []).map(item => {
                const active = (filters.investmentOptions[field.id] || []).includes(item.value);
                return <button key={item.value} type="button" onClick={() => toggleOption(field.id, item.value)} className={`${pillClass} ${active ? 'border-[#FF7A50] bg-[#FF7A50] text-white' : 'border-[#E5E7EB] bg-white text-[#1E293B]'}`}>{tr(item.labelKey)}</button>;
              })}
            </div>
          )}
        </div>
      ))}

      <div className="space-y-3">
        <span className={titleClass}>{tr('investments.field.publication_date')}</span>
        <div className="flex flex-wrap gap-2">
          {['all', '1', '7', '30'].map(value => {
            const active = filters.investmentPublishedWithin === value;
            return <button key={value} type="button" onClick={() => update({ investmentPublishedWithin: value })} className={`${pillClass} ${active ? 'border-[#FF7A50] bg-[#FF7A50] text-white' : 'border-[#E5E7EB] bg-white text-[#1E293B]'}`}>{tr(`investments.published.${value}`)}</button>;
          })}
        </div>
      </div>
    </div>
  );
}
