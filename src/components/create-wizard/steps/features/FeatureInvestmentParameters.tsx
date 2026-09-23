import React from 'react';
import { useI18n } from '../../../../i18nContext';
import {
  getInvestmentEvidenceFieldId,
  getInvestmentFields,
  INVESTMENT_EVIDENCE_OPTIONS,
  INVESTMENT_SUBTYPES,
  InvestmentValue
} from '../../../../config/investmentSpecial';
import ClassifiedValueSlider from '../../../classified/ClassifiedValueSlider';
import type { RangeSpec } from '../../../classified/ClassifiedRangeFilter';

type Props = {
  subCategory: string;
  classifiedAttributes: Record<string, InvestmentValue>;
  setClassifiedAttributes: React.Dispatch<React.SetStateAction<Record<string, InvestmentValue>>>;
};

const cardClass = 'pl p-5 rounded-3xl space-y-3';
const labelClass = 'text-xs font-semibold font-sans text-[#1E293B] tracking-wider block';
const inputClass = 'w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1E293B] outline-none focus:border-[#FF7A50]';
const pillClass = 'pl pl-interactive min-h-9 rounded-full border px-3 py-2 text-[11px] font-extrabold transition';

const INVESTMENT_VALUE_SPECS: Record<string, RangeSpec> = {
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

const FALLBACK_VALUE_SPEC: RangeSpec = { min: 0, max: 100, step: 1 };
const FALLBACK_MONEY_SPEC: RangeSpec = { min: 0, max: 1000000000, step: 1000000 };

export default function FeatureInvestmentParameters({ subCategory, classifiedAttributes, setClassifiedAttributes }: Props) {
  const { tr } = useI18n();
  const fields = getInvestmentFields(subCategory);

  const setValue = (fieldId: string, value: InvestmentValue | '') => {
    setClassifiedAttributes(current => {
      const next = { ...current };
      if (value === '' || (Array.isArray(value) && value.length === 0)) delete next[fieldId];
      else {
        next[fieldId] = value;
        const field = fields.find(item => item.id === fieldId);
        if (field?.financial && !next[getInvestmentEvidenceFieldId(fieldId)]) {
          next[getInvestmentEvidenceFieldId(fieldId)] = 'seller_declared';
        }
      }
      return next;
    });
  };

  const toggleMulti = (fieldId: string, value: string) => {
    const current = Array.isArray(classifiedAttributes[fieldId]) ? classifiedAttributes[fieldId] as string[] : [];
    setValue(fieldId, current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className={cardClass}>
        <span className={labelClass}>{tr('investments.subtype')}</span>
        <div className="flex flex-wrap gap-2">
          {(INVESTMENT_SUBTYPES[subCategory] || []).map(item => {
            const active = classifiedAttributes.investment_subtype === item.value;
            return (
              <button key={item.value} type="button" onClick={() => setValue('investment_subtype', item.value)} className={`${pillClass} ${active ? 'border-[#FF7A50] bg-[#FF7A50] text-white' : 'border-[#E5E7EB] bg-white text-[#1E293B]'}`}>
                {tr(item.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {fields.map(field => {
        const value = classifiedAttributes[field.id];
        return (
          <div key={field.id} className={cardClass}>
            {field.type === 'number' && (
              <ClassifiedValueSlider
                label={tr(field.labelKey)}
                unit={field.id === 'land_area' ? undefined : field.unitKey ? tr(field.unitKey) : undefined}
                spec={field.unitKey === 'investments.unit.idr'
                  ? FALLBACK_MONEY_SPEC
                  : INVESTMENT_VALUE_SPECS[field.id] || FALLBACK_VALUE_SPEC}
                value={typeof value === 'number' ? value : undefined}
                onChange={next => setValue(field.id, next === undefined ? '' : next)}
                useGrouping={field.id !== 'year_built'}
                formatValue={field.id === 'land_area'
                  ? number => `${number.toLocaleString()} ${tr('investments.unit.sqm')} (${(number / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })} are)`
                  : undefined}
                formatScaleValue={field.id === 'land_area'
                  ? number => `${number.toLocaleString()} ${tr('investments.unit.sqm')}`
                  : undefined}
                trackRemainderColor="#FFFFFF"
              />
            )}
            {field.type !== 'number' && <label className={labelClass}>{tr(field.labelKey)}</label>}
            {field.type === 'text' && <input type="text" value={typeof value === 'string' ? value : ''} onChange={event => setValue(field.id, event.target.value)} className={inputClass} />}
            {(field.type === 'select' || field.type === 'boolean') && (
              <div className="flex flex-wrap gap-2">
                {(field.options || []).map(item => {
                  const active = value === item.value || (field.type === 'boolean' && value === (item.value === 'yes'));
                  return <button key={item.value} type="button" onClick={() => setValue(field.id, field.type === 'boolean' ? item.value === 'yes' : item.value)} className={`${pillClass} ${active ? 'border-[#FF7A50] bg-[#FF7A50] text-white' : 'border-[#E5E7EB] bg-white text-[#1E293B]'}`}>{tr(item.labelKey)}</button>;
                })}
              </div>
            )}
            {field.type === 'multi' && (
              <div className="flex flex-wrap gap-2">
                {(field.options || []).map(item => {
                  const active = Array.isArray(value) && value.includes(item.value);
                  return <button key={item.value} type="button" onClick={() => toggleMulti(field.id, item.value)} className={`${pillClass} ${active ? 'border-[#FF7A50] bg-[#FF7A50] text-white' : 'border-[#E5E7EB] bg-white text-[#1E293B]'}`}>{tr(item.labelKey)}</button>;
                })}
              </div>
            )}
            {field.financial && value !== undefined && value !== '' && (
              <div className="pt-1 space-y-2">
                <span className="text-[11px] font-semibold text-amber-700">{tr('investments.financialEvidence')}</span>
                <div className="flex flex-wrap gap-2">
                  {INVESTMENT_EVIDENCE_OPTIONS.map(item => {
                    const evidenceId = getInvestmentEvidenceFieldId(field.id);
                    const active = classifiedAttributes[evidenceId] === item.value;
                    return <button key={item.value} type="button" onClick={() => setValue(evidenceId, item.value)} className={`${pillClass} ${active ? 'border-amber-500 bg-amber-500 text-white' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{tr(item.labelKey)}</button>;
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
