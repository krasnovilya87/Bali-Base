import React from 'react';
import { Check } from 'lucide-react';
import { useI18n } from '../../../../i18nContext';
import {
  CLASSIFIED_FULFILLMENT_OPTIONS,
  CLASSIFIED_LEVEL_OPTIONS
} from '../../../../utils/classifiedFilters';
import { Listing } from '../../../../types';
import {
  CLASSIFIED_GENERIC_SPECIAL_FIELDS,
  CLASSIFIED_TRANSPORT_PRODUCTION_YEAR_LABEL_KEY,
  getClassifiedSpecialConfig,
  getVisibleClassifiedSpecialFields
} from '../../../../config/classifiedSpecial';
import type { ClassifiedSpecialField, ClassifiedSpecialValue } from '../../../../config/classifiedSpecial';
import { getDefaultSurfboardAttributes, getDefaultSurfboardFinConfiguration } from '../../../../utils/surfboardDimensions';
import {
  SurfboardFinConfigurationSelector,
  SurfboardFinSystemSelector,
  SurfboardWizardDimensions
} from '../../../classified/SurfboardDimensions';
import SurfProductIcon from '../../../classified/SurfProductIcon';
import YogaProductIcon from '../../../classified/YogaProductIcon';
import { ClassifiedConditionWizardSlider } from '../../../classified/ClassifiedConditionSlider';
import { ClassifiedSizingWizard } from '../../../classified/ClassifiedSizing';
import {
  getClassifiedSizingKind,
  LEGACY_CLASSIFIED_SIZE_FIELD_IDS
} from '../../../../utils/classifiedSizing';
import { isElectronicsCategory } from '../../../../config/electronicsCatalog';
import { isMarketTransportCategory } from '../../../../config/transportCatalog';
import { isMarketOtherCategory } from '../../../../config/marketOtherCatalog';
import {
  ELECTRONICS_RANGE_SPECS,
  MARKET_TRANSPORT_RANGE_SPECS,
  getMarketNumberRangeSpec,
  type RangeSpec
} from '../../../classified/ClassifiedRangeFilter';
import ClassifiedCatalogWizard, { hasClassifiedCatalog } from './ClassifiedCatalogWizard';
import ClassifiedValueSlider from '../../../classified/ClassifiedValueSlider';

type FeatureClassifiedParametersProps = {
  classifiedCondition: Listing['classifiedCondition'] | '';
  setClassifiedCondition: React.Dispatch<React.SetStateAction<Listing['classifiedCondition'] | ''>>;
  classifiedFulfillment: string[];
  setClassifiedFulfillment: React.Dispatch<React.SetStateAction<string[]>>;
  classifiedUrgentSale: boolean;
  setClassifiedUrgentSale: React.Dispatch<React.SetStateAction<boolean>>;
  classifiedAudience: Listing['classifiedAudience'] | '';
  setClassifiedAudience: React.Dispatch<React.SetStateAction<Listing['classifiedAudience'] | ''>>;
  classifiedLevel: Listing['classifiedLevel'] | '';
  setClassifiedLevel: React.Dispatch<React.SetStateAction<Listing['classifiedLevel'] | ''>>;
  subCategory: string;
  classifiedProductType: string;
  setClassifiedProductType: React.Dispatch<React.SetStateAction<string>>;
  classifiedAttributes: Record<string, ClassifiedSpecialValue>;
  setClassifiedAttributes: React.Dispatch<React.SetStateAction<Record<string, ClassifiedSpecialValue>>>;
};

const fieldTitleClass = 'text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1';
const pillClass = 'pl pl-interactive transport-pill inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer select-none';
const surfTileClass = 'pl pl-interactive flex h-24 w-24 shrink-0 flex-col items-center rounded-lg border px-2 py-2 text-center text-[10px] font-extrabold leading-tight transition cursor-pointer select-none';
const activePillClass = 'selected border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]';
const inactivePillClass = 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]';
const vehicleColorSwatches: Record<string, string> = {
  black: '#111827', white: '#FFFFFF', gray: '#64748B', silver: '#C0C0C0',
  gold: '#D9AD55', blue: '#2563EB', red: '#EF4444', green: '#16A34A', yellow: '#FACC15',
  pink: '#EC4899', orange: '#F97316', brown: '#92400E', beige: '#D6C6A5', purple: '#9333EA'
};
const surfboardDimensionFieldIds = new Set([
  'surf_length_feet',
  'surf_length_inches',
  'surf_width_inches',
  'surf_thickness_inches',
  'surf_volume_l',
  'surf_weight_kg'
]);

const FeatureClassifiedParameters: React.FC<FeatureClassifiedParametersProps> = ({
  classifiedCondition,
  setClassifiedCondition,
  classifiedFulfillment,
  setClassifiedFulfillment,
  classifiedUrgentSale,
  setClassifiedUrgentSale,
  classifiedLevel,
  setClassifiedLevel,
  subCategory,
  classifiedProductType,
  setClassifiedProductType,
  classifiedAttributes,
  setClassifiedAttributes
}) => {
  const { tr } = useI18n();
  const specialConfig = getClassifiedSpecialConfig(subCategory);
  const sizingKind = getClassifiedSizingKind(subCategory, classifiedProductType);
  const hasCatalog = hasClassifiedCatalog(subCategory);
  const visibleSpecialFields = getVisibleClassifiedSpecialFields(
    subCategory,
    classifiedProductType ? [classifiedProductType] : []
  ).filter(field => (
    !CLASSIFIED_GENERIC_SPECIAL_FIELDS.some(genericField => genericField.id === field.id)
    && !(sizingKind && LEGACY_CLASSIFIED_SIZE_FIELD_IDS.has(field.id))
  ));

  const toggleFulfillment = (value: string) => {
    setClassifiedFulfillment(current => (
      current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value]
    ));
  };

  const getNumberSpec = (field: ClassifiedSpecialField): RangeSpec | null => {
    if (field.kind !== 'number') return null;
    if (field.id === 'classified_purchase_year') {
      return { min: isElectronicsCategory(subCategory) ? 2000 : 1980, max: new Date().getFullYear(), step: 1 };
    }
    if (isElectronicsCategory(subCategory) && ELECTRONICS_RANGE_SPECS[subCategory][field.id]) {
      return ELECTRONICS_RANGE_SPECS[subCategory][field.id];
    }
    if (isMarketTransportCategory(subCategory) && MARKET_TRANSPORT_RANGE_SPECS[subCategory]?.[field.id]) {
      return MARKET_TRANSPORT_RANGE_SPECS[subCategory][field.id];
    }
    if (isMarketOtherCategory(subCategory)) return getMarketNumberRangeSpec(field.id, field.unit);
    if (field.unit) return getMarketNumberRangeSpec(field.id, field.unit);
    return null;
  };

  const setSpecialAttribute = (fieldId: string, value: ClassifiedSpecialValue | '') => {
    setClassifiedAttributes(current => {
      const next = { ...current };
      if (value === '') {
        delete next[fieldId];
      } else {
        next[fieldId] = value;
      }

      if (fieldId === 'surf_board_type' && typeof value === 'string') {
        next.surf_fin_configuration = getDefaultSurfboardFinConfiguration(value);
      }

      if (fieldId === 'surf_length_feet' || fieldId === 'surf_length_inches') {
        const feet = Number(next.surf_length_feet || 0);
        const inches = Number(next.surf_length_inches || 0);
        if (feet > 0 || inches > 0) {
          next.surf_length_cm = Math.round(((feet * 12 + inches) * 2.54) * 100) / 100;
        } else {
          delete next.surf_length_cm;
        }
      }

      return next;
    });
  };

  const renderSpecialField = (field: ClassifiedSpecialField) => {
    const value = classifiedAttributes[field.id];
    const isRequired = Boolean(field.requiredFor?.includes(classifiedProductType));
    const isBoardOrFins = classifiedProductType === 'board' || classifiedProductType === 'fins';
    const numberSpec = getNumberSpec(field);

    if (numberSpec) {
      return (
        <ClassifiedValueSlider
          key={field.id}
          label={tr(
            isMarketTransportCategory(subCategory) && field.id === 'classified_purchase_year'
              ? CLASSIFIED_TRANSPORT_PRODUCTION_YEAR_LABEL_KEY
              : field.labelKey
          )}
          unit={field.unit}
          required={isRequired}
          useGrouping={field.id !== 'classified_purchase_year' && field.id !== 'cycling_year'}
          spec={numberSpec}
          value={typeof value === 'number' ? value : undefined}
          onChange={nextValue => setSpecialAttribute(field.id, nextValue ?? '')}
        />
      );
    }

    if (field.id === 'surf_fin_configuration' && subCategory === 'surfing' && isBoardOrFins) {
      return (
        <SurfboardFinConfigurationSelector
          key={field.id}
          labelKey={field.labelKey}
          options={field.options || []}
          value={typeof value === 'string' ? value : ''}
          onChange={nextValue => setSpecialAttribute(field.id, nextValue)}
        />
      );
    }

    if (field.id === 'surf_fin_system' && subCategory === 'surfing' && isBoardOrFins) {
      return (
        <SurfboardFinSystemSelector
          key={field.id}
          labelKey={field.labelKey}
          options={field.options || []}
          value={typeof value === 'string' ? value : ''}
          onChange={nextValue => setSpecialAttribute(field.id, nextValue)}
        />
      );
    }

    if (field.id === 'vehicle_color' || field.id === 'device_color') {
      return (
        <div key={field.id} className="space-y-3">
          <span className={fieldTitleClass}>{tr(field.labelKey)}</span>
          <div className="flex flex-wrap gap-3">
            {field.options?.map(item => {
              const isActive = value === item.value;
              const colorLabel = tr(item.labelKey);
              return (
                <button
                  key={item.value}
                  type="button"
                  title={colorLabel}
                  aria-label={colorLabel}
                  aria-pressed={isActive}
                  onClick={() => setSpecialAttribute(field.id, item.value)}
                  className={`pl pl-interactive relative h-10 w-10 shrink-0 rounded-full border bg-white transition ${isActive ? 'border-[#FF7A50] ring-4 ring-[#FF7A50]/18' : 'border-white ring-1 ring-[#1E293B]/10 hover:ring-[#FF7A50]/45'}`}
                >
                  <span
                    className="absolute inset-1 rounded-full border border-[#1E293B]/10"
                    style={{ background: item.value === 'other' ? 'conic-gradient(#EF4444, #FACC15, #16A34A, #2563EB, #9333EA, #EF4444)' : vehicleColorSwatches[item.value] }}
                  />
                  {isActive && <Check className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-[#FF7A50] p-0.5 text-white ring-2 ring-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.kind === 'select') {
      return (
        <div key={field.id} className="space-y-3">
          <span className={fieldTitleClass}>
            {tr(field.labelKey)}{isRequired ? ' *' : ''}
          </span>
          <div className="flex flex-wrap gap-2">
            {field.options?.map(item => {
              const isActive = value === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSpecialAttribute(field.id, item.value)}
                  aria-pressed={isActive}
                  className={`${pillClass} ${isActive ? activePillClass : inactivePillClass}`}
                >
                  {tr(item.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.kind === 'boolean') {
      return (
        <div key={field.id} className="space-y-3">
          <span className={fieldTitleClass}>{tr(field.labelKey)}</span>
          <div className="flex flex-wrap gap-2">
            {[true, false].map(optionValue => {
              const isActive = value === optionValue;
              return (
                <button
                  key={String(optionValue)}
                  type="button"
                  onClick={() => setSpecialAttribute(field.id, optionValue)}
                  aria-pressed={isActive}
                  className={`${pillClass} ${isActive ? activePillClass : inactivePillClass}`}
                >
                  {tr(`filters.classified.special.${optionValue ? 'yes' : 'no'}`)}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <label key={field.id} className="block space-y-2">
        <span className={fieldTitleClass}>
          {tr(field.labelKey)}{isRequired ? ' *' : ''}
        </span>
        <div className="relative">
          <input
            type={field.kind === 'date' ? 'date' : field.kind === 'number' ? 'number' : 'text'}
            inputMode={field.kind === 'number' ? 'decimal' : undefined}
            min={field.kind === 'number' ? 0 : undefined}
            step={field.kind === 'number' ? 'any' : undefined}
            value={value === undefined ? '' : String(value)}
            onChange={event => {
              const nextValue = event.target.value;
              setSpecialAttribute(
                field.id,
                field.kind === 'number' && nextValue !== '' ? Number(nextValue) : nextValue
              );
            }}
            placeholder={field.kind === 'text' ? tr('filters.classified.special.value') : undefined}
            aria-required={isRequired}
            className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 pr-14 text-xs font-extrabold text-[#1E293B] outline-none transition placeholder:text-[#94A3B8] focus:border-[#FF7A50] focus:ring-2 focus:ring-[#FF7A50]/15"
          />
          {field.unit && (
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-[#94A3B8]">
              {field.unit}
            </span>
          )}
        </div>
      </label>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="pl rounded-3xl p-5 space-y-5">
        {hasCatalog ? (
          <ClassifiedCatalogWizard
            subCategory={subCategory}
            brand={typeof classifiedAttributes.classified_brand === 'string' ? classifiedAttributes.classified_brand : ''}
            model={typeof classifiedAttributes.classified_model === 'string' ? classifiedAttributes.classified_model : ''}
            onBrandChange={value => setSpecialAttribute('classified_brand', value)}
            onModelChange={value => setSpecialAttribute('classified_model', value)}
          />
        ) : (
          CLASSIFIED_GENERIC_SPECIAL_FIELDS
            .filter(field => field.id !== 'classified_purchase_year')
            .map(renderSpecialField)
        )}
      </section>

      {specialConfig && (
        <section className="pl rounded-3xl p-5 space-y-5">
          {specialConfig.productTypes.length > 0 && <div className="space-y-3">
            <span className={fieldTitleClass}>{tr('filters.classified.special.productType')} *</span>
            <div className="flex flex-wrap gap-2">
              {specialConfig.productTypes.map(item => {
                const isActive = classifiedProductType === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      if (!isActive) {
                        setClassifiedProductType(item.value);
                        setClassifiedAttributes(current => {
                          const genericAttributes = Object.fromEntries(
                            Object.entries(current).filter(([fieldId]) => (
                              CLASSIFIED_GENERIC_SPECIAL_FIELDS.some(field => field.id === fieldId)
                            ))
                          );
                          const productDefaults = subCategory === 'surfing' && item.value === 'board'
                            ? getDefaultSurfboardAttributes()
                            : {};
                          return { ...genericAttributes, ...productDefaults };
                        });
                      }
                    }}
                    aria-pressed={isActive}
                    className={`${subCategory === 'surfing' ? surfTileClass : pillClass} ${isActive ? activePillClass : inactivePillClass}`}
                  >
                    {subCategory === 'surfing' && <SurfProductIcon productType={item.value} className="h-12 w-12 shrink-0" />}
                    {subCategory === 'yoga' && <YogaProductIcon productType={item.value} className="h-6 w-6 shrink-0" />}
                    <span className={subCategory === 'surfing' ? 'mt-auto line-clamp-2' : ''}>{tr(item.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>}

          {(classifiedProductType || specialConfig.productTypes.length === 0) && (
            <div className="space-y-5">
              {visibleSpecialFields.map(field => {
                if (subCategory === 'surfing' && classifiedProductType === 'board') {
                  if (
                    field.id === 'surf_tail_shape'
                    || field.id === 'surf_board_damage'
                    || field.id === 'classified_completeness'
                  ) return null;
                  if (field.id === 'surf_length_feet') {
                    return (
                      <SurfboardWizardDimensions
                        key="surfboard-dimensions"
                        attributes={classifiedAttributes}
                        setAttributes={setClassifiedAttributes}
                      />
                    );
                  }
                  if (surfboardDimensionFieldIds.has(field.id)) return null;
                }
                return renderSpecialField(field);
              })}
            </div>
          )}
        </section>
      )}

      {sizingKind && (
        <ClassifiedSizingWizard
          kind={sizingKind}
          attributes={classifiedAttributes}
          setAttributes={setClassifiedAttributes}
        />
      )}

      {subCategory === 'padel' && classifiedProductType === 'racket' && (
        <div className="pl rounded-3xl p-5 space-y-3">
          <span className={fieldTitleClass}>{tr('filters.classified.level')} *</span>
          <div className="flex flex-wrap gap-2">
            {CLASSIFIED_LEVEL_OPTIONS.map(value => {
              const isActive = classifiedLevel === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setClassifiedLevel(value)}
                  aria-pressed={isActive}
                  className={`${pillClass} ${isActive ? activePillClass : inactivePillClass}`}
                >
                  {tr(`filters.classified.level.${value}`)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <section className="pl rounded-3xl p-5 space-y-5">
        {CLASSIFIED_GENERIC_SPECIAL_FIELDS.filter(field => field.id === 'classified_purchase_year').map(renderSpecialField)}
      </section>

      <section className="pl rounded-3xl p-5">
        <ClassifiedConditionWizardSlider value={classifiedCondition} onChange={setClassifiedCondition} />
      </section>

      <section className="pl rounded-3xl p-5 space-y-5">
        <div className="space-y-3">
        <span className={fieldTitleClass}>{tr('filters.classified.fulfillment')}</span>
        <div className="flex flex-wrap gap-2">
          {CLASSIFIED_FULFILLMENT_OPTIONS.map(value => {
            const isActive = classifiedFulfillment.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleFulfillment(value)}
                aria-pressed={isActive}
                className={`${pillClass} ${isActive ? activePillClass : inactivePillClass}`}
              >
                {tr(`filters.classified.fulfillment.${value}`)}
              </button>
            );
          })}
        </div>
        </div>

        <button
          type="button"
          onClick={() => setClassifiedUrgentSale(current => !current)}
          aria-pressed={classifiedUrgentSale}
          className={`${pillClass} ${classifiedUrgentSale ? activePillClass : inactivePillClass}`}
        >
          {classifiedUrgentSale && <Check className="h-4 w-4" strokeWidth={3} />}
          {tr('filters.classified.urgentOnly')}
        </button>
      </section>

    </div>
  );
};

export default FeatureClassifiedParameters;
