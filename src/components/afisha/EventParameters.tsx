import React from 'react';
import { useI18n } from '../../i18nContext';
import type { FilterState } from '../../types';
import type { ClassifiedSpecialValue } from '../../config/classifiedSpecial';
import { EVENT_CATEGORY_FIELD_IDS, EVENT_COMMON_FIELDS, EVENT_REGISTRATION_URL_FIELD, EVENT_START_TIME_FIELD, getEventCategoryFields } from '../../config/eventSpecial';
import type { EventSpecialField } from '../../config/eventSpecial';

const titleClass = 'ml-1 block text-xs font-semibold tracking-wider text-gray-400';
const pillClass = 'pl pl-interactive transport-pill inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer select-none';
const activeClass = 'selected border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]';
const inactiveClass = 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]';
const inputClass = 'min-h-11 w-full max-w-sm rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#1E293B] outline-none transition focus:border-[#FF7A50] focus:ring-2 focus:ring-[#FF7A50]/15';

type FieldListProps = {
  fields: EventSpecialField[];
  getSelected: (field: EventSpecialField) => string[];
  onToggle: (field: EventSpecialField, value: string) => void;
  renderInput: (field: EventSpecialField) => React.ReactNode;
};

const EventFieldList: React.FC<FieldListProps> = ({ fields, getSelected, onToggle, renderInput }) => {
  const { tr } = useI18n();
  return <div className="space-y-5">{fields.map(field => field.inputType ? (
    <React.Fragment key={field.id}>{renderInput(field)}</React.Fragment>
  ) : (
    <div key={field.id} className="space-y-3">
      <span className={titleClass}>{tr(field.labelKey)}</span>
      <div className="flex flex-wrap gap-2">{field.options.map(option => {
        const active = getSelected(field).includes(option.value);
        return <button key={option.value} type="button" onClick={() => onToggle(field, option.value)} aria-pressed={active}
          className={`${pillClass} ${active ? activeClass : inactiveClass}`}>{tr(option.labelKey)}</button>;
      })}</div>
    </div>
  ))}</div>;
};

const EventParameterSections: React.FC<Omit<FieldListProps, 'fields'> & { subCategory: string; commonFields: EventSpecialField[] }> = ({ subCategory, commonFields, ...props }) => {
  const { tr } = useI18n();
  const categoryFields = getEventCategoryFields(subCategory);
  return <div className="space-y-6">
    <div className="space-y-4">
      <span className="block text-sm font-extrabold text-[#1E293B]">{tr('filters.event.commonParameters')}</span>
      <EventFieldList {...props} fields={commonFields} />
    </div>
    {categoryFields.length > 0 && <div className="space-y-4 border-t border-[#E5E7EB] pt-6">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm font-extrabold text-[#1E293B]">{tr('filters.event.categoryParameters')}</span>
        <span className="text-xs font-semibold text-[#FF7A50]">{tr(`subcategory.${subCategory}`)}</span>
      </div>
      <EventFieldList {...props} fields={categoryFields} />
    </div>}
  </div>;
};

export const EventWizardParameters: React.FC<{
  subCategory: string;
  attributes: Record<string, ClassifiedSpecialValue>;
  setAttributes: React.Dispatch<React.SetStateAction<Record<string, ClassifiedSpecialValue>>>;
}> = ({ subCategory, attributes, setAttributes }) => {
  const { tr } = useI18n();
  const admission = attributes.afisha_admission;
  const getSelected = (field: EventSpecialField) => {
    const value = attributes[field.id];
    return Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : [];
  };
  const toggle = (field: EventSpecialField, value: string) => setAttributes(current => {
    const next = { ...current };
    const selected = Array.isArray(current[field.id]) ? current[field.id] as string[] : typeof current[field.id] === 'string' ? [current[field.id] as string] : [];
    if (field.multiple) {
      const values = value === 'multilingual' ? (selected.includes(value) ? [] : [value]) : selected.includes(value)
        ? selected.filter(item => item !== value) : [...selected.filter(item => item !== 'multilingual'), value];
      if (values.length) next[field.id] = values;
      else delete next[field.id];
    } else {
      next[field.id] = value;
      if (field.id === 'afisha_admission' && value !== 'registration' && value !== 'ticket') delete next.afisha_registration_url;
    }
    return next;
  });
  const renderInput = (field: EventSpecialField) => <label className="block space-y-3">
    <span className={titleClass}>{tr(field.labelKey)}</span>
    <input type={field.inputType} inputMode={field.inputType === 'number' ? 'numeric' : undefined}
      min={field.inputType === 'number' ? 1 : undefined}
      max={field.id === 'afisha_festival_duration' ? 365 : undefined}
      step={field.inputType === 'number' ? 1 : undefined}
      value={typeof attributes[field.id] === 'string' || typeof attributes[field.id] === 'number' ? String(attributes[field.id]) : ''}
      onChange={event => setAttributes(current => {
        const next = { ...current };
        if (!event.target.value) delete next[field.id];
        else next[field.id] = field.inputType === 'number' ? Number(event.target.value) : event.target.value;
        if (field.id === 'afisha_start_time') {
          const hour = Number(event.target.value.slice(0, 2));
          if (!event.target.value) delete next.afisha_start_period;
          else next.afisha_start_period = hour < 12 ? 'morning' : hour < 17 ? 'day' : hour < 22 ? 'evening' : 'night';
        }
        return next;
      })} className={inputClass} />
  </label>;
  const commonFields = [EVENT_START_TIME_FIELD, ...EVENT_COMMON_FIELDS.filter(field => field.id !== 'afisha_start_period'),
    ...((admission === 'registration' || admission === 'ticket') ? [EVENT_REGISTRATION_URL_FIELD] : [])];
  return <div className="animate-fade-in"><EventParameterSections subCategory={subCategory} commonFields={commonFields}
    getSelected={getSelected} onToggle={toggle} renderInput={renderInput} /></div>;
};

export const EventSpecialFilters: React.FC<{
  subCategory: string;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}> = ({ subCategory, filters, setFilters }) => {
  const { tr } = useI18n();
  React.useEffect(() => {
    setFilters(current => {
      if (!current.classifiedSpecialSubCategory || current.classifiedSpecialSubCategory === subCategory) return current;
      return {
        ...current,
        classifiedSpecialSubCategory: subCategory,
        classifiedSpecialOptions: Object.fromEntries(Object.entries(current.classifiedSpecialOptions)
          .filter(([fieldId]) => !EVENT_CATEGORY_FIELD_IDS.has(fieldId))),
        classifiedSpecialText: Object.fromEntries(Object.entries(current.classifiedSpecialText)
          .filter(([fieldId]) => !EVENT_CATEGORY_FIELD_IDS.has(fieldId)))
      };
    });
  }, [subCategory, setFilters]);
  const getSelected = (field: EventSpecialField) => filters.classifiedSpecialOptions[field.id] || [];
  const toggle = (field: EventSpecialField, value: string) => setFilters(current => {
    const previous = current.classifiedSpecialOptions[field.id] || [];
    const nextValues = field.multiple ? value === 'multilingual' ? (previous.includes(value) ? [] : [value])
      : previous.includes(value) ? previous.filter(item => item !== value)
        : [...previous.filter(item => item !== 'multilingual'), value]
      : previous.includes(value) ? [] : [value];
    const isCategoryField = EVENT_CATEGORY_FIELD_IDS.has(field.id);
    const nextOptions = { ...current.classifiedSpecialOptions, [field.id]: nextValues };
    const nextText = { ...current.classifiedSpecialText };
    return { ...current, classifiedSpecialSubCategory: isCategoryField ? subCategory : current.classifiedSpecialSubCategory,
      classifiedSpecialOptions: nextOptions, classifiedSpecialText: nextText };
  });
  const renderInput = (field: EventSpecialField) => <label className="block space-y-3">
    <span className={titleClass}>{tr(field.labelKey)}</span>
    <input type={field.inputType} inputMode={field.inputType === 'number' ? 'numeric' : undefined}
      min={field.inputType === 'number' ? 1 : undefined}
      max={field.id === 'afisha_festival_duration' ? 365 : undefined}
      step={field.inputType === 'number' ? 1 : undefined}
      value={filters.classifiedSpecialText[field.id] || ''}
      onChange={event => setFilters(current => ({ ...current,
        classifiedSpecialSubCategory: subCategory,
        classifiedSpecialText: { ...current.classifiedSpecialText, [field.id]: event.target.value }
      }))} className={inputClass} />
  </label>;
  return <div className="border-y border-[#E5E7EB] py-5"><EventParameterSections subCategory={subCategory} commonFields={EVENT_COMMON_FIELDS}
    getSelected={getSelected} onToggle={toggle} renderInput={renderInput} /></div>;
};
