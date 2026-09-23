import React from 'react';
import { Check } from 'lucide-react';
import { FilterState } from '../../types';
import { useI18n } from '../../i18nContext';
import { isElectronicsCategory } from '../../config/electronicsCatalog';
import { isMarketTransportCategory } from '../../config/transportCatalog';
import { isMarketOtherCategory } from '../../config/marketOtherCatalog';
import {
  CLASSIFIED_TRANSPORT_PRODUCTION_YEAR_LABEL_KEY,
  CLASSIFIED_GENERIC_SPECIAL_FIELDS,
  getClassifiedSpecialConfig,
  getVisibleClassifiedSpecialFields
} from '../../config/classifiedSpecial';
import type { ClassifiedSpecialField } from '../../config/classifiedSpecial';
import { getDefaultSurfboardFinConfiguration } from '../../utils/surfboardDimensions';
import {
  SurfboardFilterDimensions,
  SurfboardFinConfigurationSelector,
  SurfboardFinSystemSelector
} from './SurfboardDimensions';
import SurfProductIcon from './SurfProductIcon';
import YogaProductIcon from './YogaProductIcon';
import { ClassifiedSizingFilter } from './ClassifiedSizing';
import CatalogBrandModelFilters from './CatalogBrandModelFilters';
import ClassifiedRangeFilter, { ELECTRONICS_RANGE_SPECS, MARKET_TRANSPORT_RANGE_SPECS, getMarketNumberRangeSpec } from './ClassifiedRangeFilter';
import {
  getClassifiedSizingKind,
  LEGACY_CLASSIFIED_SIZE_FIELD_IDS
} from '../../utils/classifiedSizing';

type Props = {
  subCategory: string;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
};

const titleClass = 'text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1';
const pillClass = 'pl pl-interactive transport-pill inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer select-none';
const surfTileClass = 'pl pl-interactive flex h-24 w-24 shrink-0 flex-col items-center rounded-lg border px-2 py-2 text-center text-[10px] font-extrabold leading-tight transition cursor-pointer select-none';
const activeClass = 'selected border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]';
const inactiveClass = 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]';
const inputClass = 'w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs font-bold text-[#1E293B] outline-none transition placeholder:text-[#94A3B8] focus:border-[#FF7A50] focus:ring-2 focus:ring-[#FF7A50]/15';
const genericFieldIds = new Set(CLASSIFIED_GENERIC_SPECIAL_FIELDS.map(field => field.id));
const genericBrandModelFields = CLASSIFIED_GENERIC_SPECIAL_FIELDS.filter(field => field.id !== 'classified_purchase_year');
const purchaseYearField = CLASSIFIED_GENERIC_SPECIAL_FIELDS.find(field => field.id === 'classified_purchase_year');
const colorSwatches: Record<string, string> = {
  black: '#111827', white: '#FFFFFF', gray: '#64748B', silver: '#C0C0C0',
  gold: '#D9AD55', blue: '#2563EB', green: '#16A34A', red: '#EF4444',
  pink: '#EC4899', purple: '#9333EA', yellow: '#FACC15', orange: '#F97316',
  brown: '#92400E', beige: '#D6C6A5'
};
const surfboardDimensionFieldIds = new Set([
  'surf_length_feet',
  'surf_length_inches',
  'surf_width_inches',
  'surf_thickness_inches',
  'surf_volume_l',
  'surf_weight_kg'
]);

const ClassifiedSpecialFilters: React.FC<Props> = ({ subCategory, filters, setFilters }) => {
  const { tr } = useI18n();
  const config = getClassifiedSpecialConfig(subCategory);
  const hasDirectFields = config?.productTypes.length === 0;
  const activeProductTypes = config && filters.classifiedSpecialSubCategory === subCategory
    ? filters.classifiedProductType
    : [];
  const sizingKind = getClassifiedSizingKind(subCategory, activeProductTypes[0] || '');
  const availableFields = getVisibleClassifiedSpecialFields(subCategory, activeProductTypes);
  const visibleFields = availableFields.filter(field => (
    !genericFieldIds.has(field.id)
    && !(sizingKind && LEGACY_CLASSIFIED_SIZE_FIELD_IDS.has(field.id))
  ));
  const toggleProductType = (value: string) => setFilters(current => ({
    ...current,
    classifiedSpecialSubCategory: subCategory,
    classifiedProductType: current.classifiedSpecialSubCategory === subCategory && current.classifiedProductType.includes(value)
      ? []
      : [value],
    classifiedSpecialOptions: {},
    classifiedSpecialNumberRanges: Object.fromEntries(
      Object.entries(current.classifiedSpecialNumberRanges).filter(([fieldId]) => genericFieldIds.has(fieldId))
    ),
    classifiedSpecialText: Object.fromEntries(
      Object.entries(current.classifiedSpecialText).filter(([fieldId]) => genericFieldIds.has(fieldId))
    ),
    classifiedSpecialDateRanges: {}
  }));

  const toggleOption = (fieldId: string, value: string) => setFilters(current => {
    const selected = current.classifiedSpecialOptions[fieldId] || [];
    const isVisualSingleSelect = fieldId === 'surf_board_type'
      || fieldId === 'surf_fin_configuration'
      || fieldId === 'surf_fin_system';
    const nextSelected = isVisualSingleSelect
      ? (selected.includes(value) ? [] : [value])
      : (selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]);
    const nextNumberRanges = fieldId === 'surf_board_type'
      ? Object.fromEntries(
          Object.entries(current.classifiedSpecialNumberRanges)
            .filter(([id]) => !surfboardDimensionFieldIds.has(id))
        )
      : current.classifiedSpecialNumberRanges;
    const nextOptions = {
      ...current.classifiedSpecialOptions,
      [fieldId]: nextSelected
    };
    if (fieldId === 'surf_board_type') {
      nextOptions.surf_fin_configuration = nextSelected.length
        ? [getDefaultSurfboardFinConfiguration(nextSelected[0])]
        : [];
    }
    return {
      ...current,
      classifiedSpecialSubCategory: subCategory,
      classifiedSpecialOptions: nextOptions,
      classifiedSpecialNumberRanges: nextNumberRanges
    };
  });

  const updateNumber = (fieldId: string, bound: 'min' | 'max', rawValue: string) => setFilters(current => ({
    ...current,
    classifiedSpecialSubCategory: subCategory,
    classifiedSpecialNumberRanges: {
      ...current.classifiedSpecialNumberRanges,
      [fieldId]: { ...current.classifiedSpecialNumberRanges[fieldId], [bound]: rawValue === '' ? undefined : Number(rawValue) }
    }
  }));

  const updateClassifiedRange = (fieldId: string, range: { min?: number; max?: number }) => setFilters(current => {
    const nextRanges = { ...current.classifiedSpecialNumberRanges };
    if (range.min === undefined && range.max === undefined) delete nextRanges[fieldId];
    else nextRanges[fieldId] = range;
    return {
      ...current,
      classifiedSpecialSubCategory: subCategory,
      classifiedSpecialNumberRanges: nextRanges
    };
  });

  const updateText = (fieldId: string, value: string) => setFilters(current => ({
    ...current,
    classifiedSpecialSubCategory: subCategory,
    classifiedSpecialText: { ...current.classifiedSpecialText, [fieldId]: value }
  }));

  const updateDate = (fieldId: string, bound: 'from' | 'to', value: string) => setFilters(current => ({
    ...current,
    classifiedSpecialSubCategory: subCategory,
    classifiedSpecialDateRanges: {
      ...current.classifiedSpecialDateRanges,
      [fieldId]: { ...current.classifiedSpecialDateRanges[fieldId], [bound]: value || undefined }
    }
  }));

  const renderField = (field: ClassifiedSpecialField) => {
    const includesBoardOrFins = activeProductTypes.includes('board') || activeProductTypes.includes('fins');

    if (field.id === 'device_color' || field.id === 'vehicle_color') {
      const selected = filters.classifiedSpecialOptions[field.id] || [];
      return (
        <div key={field.id} className="space-y-3">
          <span className={titleClass}>{tr(field.labelKey)}</span>
          <div className="flex flex-wrap gap-3">
            {(field.options || []).map(item => {
              const active = selected.includes(item.value);
              const colorLabel = tr(item.labelKey);
              return (
                <button
                  key={item.value}
                  type="button"
                  title={colorLabel}
                  aria-label={colorLabel}
                  aria-pressed={active}
                  onClick={() => toggleOption(field.id, item.value)}
                  className={`pl pl-interactive relative h-10 w-10 shrink-0 rounded-full border bg-white transition ${active ? 'border-[#FF7A50] ring-4 ring-[#FF7A50]/18' : 'border-white ring-1 ring-[#1E293B]/10 hover:ring-[#FF7A50]/45'}`}
                >
                  <span
                    className="absolute inset-1 rounded-full border border-[#1E293B]/10"
                    style={{ background: item.value === 'other' ? 'conic-gradient(#EF4444, #FACC15, #16A34A, #2563EB, #9333EA, #EF4444)' : colorSwatches[item.value] }}
                  />
                  {active && <Check className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-[#FF7A50] p-0.5 text-white ring-2 ring-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.id === 'surf_fin_configuration' && includesBoardOrFins) {
      const selected = filters.classifiedSpecialOptions[field.id] || [];
      return (
        <SurfboardFinConfigurationSelector
          key={field.id}
          labelKey={field.labelKey}
          options={field.options || []}
          value={selected[0] || ''}
          allowClear
          onChange={nextValue => toggleOption(field.id, nextValue || selected[0] || '')}
        />
      );
    }

    if (field.id === 'surf_fin_system' && includesBoardOrFins) {
      const selected = filters.classifiedSpecialOptions[field.id] || [];
      return (
        <SurfboardFinSystemSelector
          key={field.id}
          labelKey={field.labelKey}
          options={field.options || []}
          value={selected[0] || ''}
          allowClear
          onChange={nextValue => toggleOption(field.id, nextValue || selected[0] || '')}
        />
      );
    }

    if (field.kind === 'select' || field.kind === 'boolean') {
      const selected = filters.classifiedSpecialOptions[field.id] || [];
      const options = field.kind === 'boolean'
        ? [
            { value: 'true', labelKey: 'filters.classified.special.yes' },
            { value: 'false', labelKey: 'filters.classified.special.no' }
          ]
        : field.options || [];
      return (
        <div key={field.id} className="space-y-3">
          <span className={titleClass}>{tr(field.labelKey)}</span>
          <div className="flex flex-wrap gap-2">
            {options.map(item => {
              const active = selected.includes(item.value);
              return (
                <button key={item.value} type="button" onClick={() => toggleOption(field.id, item.value)} aria-pressed={active} className={`${pillClass} ${active ? activeClass : inactiveClass}`}>
                  {tr(item.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.kind === 'number') {
      const range = filters.classifiedSpecialNumberRanges[field.id] || {};
      const catalogRange = field.id === 'classified_purchase_year'
        ? { min: isElectronicsCategory(subCategory) ? 2000 : 1980, max: new Date().getFullYear(), step: 1 }
        : isElectronicsCategory(subCategory)
          ? ELECTRONICS_RANGE_SPECS[subCategory][field.id]
          : isMarketTransportCategory(subCategory)
            ? MARKET_TRANSPORT_RANGE_SPECS[subCategory]?.[field.id]
          : isMarketOtherCategory(subCategory)
            ? getMarketNumberRangeSpec(field.id, field.unit)
            : undefined;
      if (catalogRange) {
        return (
          <ClassifiedRangeFilter
            key={field.id}
            label={tr(
              isMarketTransportCategory(subCategory) && field.id === 'classified_purchase_year'
                ? CLASSIFIED_TRANSPORT_PRODUCTION_YEAR_LABEL_KEY
                : field.labelKey
            )}
            unit={field.unit}
            useGrouping={field.id !== 'classified_purchase_year' && field.id !== 'cycling_year'}
            spec={catalogRange}
            value={range}
            onChange={nextRange => updateClassifiedRange(field.id, nextRange)}
          />
        );
      }
      return (
        <div key={field.id} className="space-y-3">
          <span className={titleClass}>{tr(field.labelKey)}{field.unit ? `, ${field.unit}` : ''}</span>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min="0" step="any" inputMode="decimal" value={range.min ?? ''} onChange={event => updateNumber(field.id, 'min', event.target.value)} placeholder={tr('filters.classified.special.from')} className={inputClass} />
            <input type="number" min="0" step="any" inputMode="decimal" value={range.max ?? ''} onChange={event => updateNumber(field.id, 'max', event.target.value)} placeholder={tr('filters.classified.special.to')} className={inputClass} />
          </div>
        </div>
      );
    }

    if (field.kind === 'date') {
      const range = filters.classifiedSpecialDateRanges[field.id] || {};
      return (
        <div key={field.id} className="space-y-3">
          <span className={titleClass}>{tr(field.labelKey)}</span>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={range.from || ''} onChange={event => updateDate(field.id, 'from', event.target.value)} className={inputClass} />
            <input type="date" value={range.to || ''} onChange={event => updateDate(field.id, 'to', event.target.value)} className={inputClass} />
          </div>
        </div>
      );
    }

    return (
      <label key={field.id} className="block space-y-2">
        <span className={titleClass}>{tr(field.labelKey)}</span>
        <input type="search" value={filters.classifiedSpecialText[field.id] || ''} onChange={event => updateText(field.id, event.target.value)} placeholder={tr('filters.classified.special.textSearch')} className={inputClass} />
      </label>
    );
  };

  return (
    <div className="space-y-5">
      {isElectronicsCategory(subCategory) || isMarketTransportCategory(subCategory) || isMarketOtherCategory(subCategory) ? (
        <CatalogBrandModelFilters subCategory={subCategory} filters={filters} setFilters={setFilters} />
      ) : (
        <div className="space-y-5">{genericBrandModelFields.map(renderField)}</div>
      )}

      {config && config.productTypes.length > 0 && (
        <div className="space-y-3">
          <span className={titleClass}>{tr('filters.classified.special.productType')}</span>
          <div className="flex flex-wrap gap-2">
            {config.productTypes.map(item => {
              const active = activeProductTypes.includes(item.value);
              return (
                <button key={item.value} type="button" onClick={() => toggleProductType(item.value)} aria-pressed={active} className={`${subCategory === 'surfing' ? surfTileClass : pillClass} ${active ? activeClass : inactiveClass}`}>
                  {subCategory === 'surfing' && <SurfProductIcon productType={item.value} className="h-12 w-12 shrink-0" />}
                  {subCategory === 'yoga' && <YogaProductIcon productType={item.value} className="h-6 w-6 shrink-0" />}
                  <span className={subCategory === 'surfing' ? 'mt-auto line-clamp-2' : ''}>{tr(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(hasDirectFields || activeProductTypes.length > 0) && (
        <div className="space-y-5">
          {visibleFields.map(field => {
            if (subCategory === 'surfing' && activeProductTypes.includes('board')) {
              if (
                field.id === 'surf_tail_shape'
                || field.id === 'surf_board_damage'
                || field.id === 'classified_completeness'
              ) return null;
              if (field.id === 'surf_length_feet') {
                return <SurfboardFilterDimensions key="surfboard-dimensions" filters={filters} setFilters={setFilters} />;
              }
              if (surfboardDimensionFieldIds.has(field.id)) return null;
            }
            return renderField(field);
          })}
        </div>
      )}

      {sizingKind && (
        <ClassifiedSizingFilter kind={sizingKind} filters={filters} setFilters={setFilters} />
      )}

      {purchaseYearField && renderField(purchaseYearField)}
    </div>
  );
};

export default ClassifiedSpecialFilters;
