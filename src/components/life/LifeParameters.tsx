import React from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays } from 'lucide-react';
import TwoMonthCalendar from '../TwoMonthCalendar';
import { useI18n } from '../../i18nContext';
import type { FilterState } from '../../types';
import type { ClassifiedSpecialValue } from '../../config/classifiedSpecial';
import { getLifeFields, LIFE_WEEKDAYS, normalizeLifeSubCategory } from '../../config/lifeSpecial';
import type { LifeField } from '../../config/lifeSpecial';

const pillClass = 'pl pl-interactive transport-pill inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer select-none';
const activeClass = 'selected border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]';
const inactiveClass = 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]';
const inputClass = 'min-h-11 w-full max-w-sm rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#1E293B] outline-none transition focus:border-[#FF7A50] focus:ring-2 focus:ring-[#FF7A50]/15';

const LifeFieldList: React.FC<{
  fields: LifeField[];
  getSelected: (field: LifeField) => string[];
  onToggle: (field: LifeField, value: string) => void;
  renderInput: (field: LifeField) => React.ReactNode;
}> = ({ fields, getSelected, onToggle, renderInput }) => {
  const { tr } = useI18n();
  return (
    <div className="space-y-5">
      {fields.map(field => {
        const selected = getSelected(field);
        return (
          <div key={field.id} className="space-y-3">
            <span className="ml-1 block text-xs font-semibold text-gray-500">{tr(field.labelKey)}</span>
            {field.options.length > 0 && <div className="flex flex-wrap gap-2">
              {field.options.map(option => {
                const active = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onToggle(field, option.value)}
                    aria-pressed={active}
                    className={`${pillClass} ${active ? activeClass : inactiveClass}`}
                  >
                    {option.flag && <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-base leading-none shadow-sm">{option.flag}</span>}
                    {tr(option.labelKey)}
                  </button>
                );
              })}
            </div>}
            {field.inputType && renderInput(field)}
          </div>
        );
      })}
    </div>
  );
};

export const LifeWizardParameters: React.FC<{
  subCategory: string;
  attributes: Record<string, ClassifiedSpecialValue>;
  setAttributes: React.Dispatch<React.SetStateAction<Record<string, ClassifiedSpecialValue>>>;
}> = ({ subCategory, attributes, setAttributes }) => {
  const { tr, language } = useI18n();
  const normalizedSubCategory = normalizeLifeSubCategory(subCategory);
  const fields = getLifeFields(normalizedSubCategory);
  const [isDateCalendarOpen, setIsDateCalendarOpen] = React.useState(false);
  const meetingDate = typeof attributes.life_meeting_date === 'string' ? attributes.life_meeting_date : '';
  const formatMeetingDate = (value: string) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    const locale = { EN: 'en-US', RU: 'ru-RU', ID: 'id-ID', DE: 'de-DE', FR: 'fr-FR' }[language] || 'en-US';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };
  const meetingFormat = attributes.life_meeting_format === 'one_time' ? 'once'
    : attributes.life_meeting_format === 'regularly' ? 'regular'
      : attributes.life_meeting_format;
  const selectedWeekdays = Array.isArray(attributes.life_meeting_weekdays) ? attributes.life_meeting_weekdays : [];
  return (
    <div className="space-y-5 animate-fade-in">
      {fields.length > 0 && (
        <>
          <span className="block text-sm font-extrabold text-[#1E293B]">{tr(`subcategory.${normalizedSubCategory}`)}</span>
          <LifeFieldList
            fields={fields}
            getSelected={field => Array.isArray(attributes[field.id])
              ? attributes[field.id] as string[]
              : typeof attributes[field.id] === 'string' ? [attributes[field.id] as string] : []}
            onToggle={(field, value) => setAttributes(current => {
              const next = { ...current };
              if (field.multiple) {
                const selected = Array.isArray(current[field.id]) ? current[field.id] as string[] : [];
                const values = selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value];
                if (values.length) next[field.id] = values;
                else delete next[field.id];
              } else if (next[field.id] === value) delete next[field.id];
              else next[field.id] = value;
              return next;
            })}
            renderInput={field => <input
              type={field.inputType}
              inputMode={field.inputType === 'number' ? 'numeric' : undefined}
              min={field.inputType === 'number' ? 1 : undefined}
              max={field.inputType === 'number' ? 80 : undefined}
              step={field.inputType === 'number' ? 1 : undefined}
              value={typeof attributes[field.id] === 'string' && attributes[field.id] !== 'none' ? attributes[field.id] as string : ''}
              onChange={event => setAttributes(current => {
                const next = { ...current };
                if (event.target.value) next[field.id] = event.target.value;
                else delete next[field.id];
                return next;
              })}
              className={inputClass}
            />}
          />
        </>
      )}
      {normalizedSubCategory !== 'life_jobs' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="ml-1 block text-xs font-semibold text-gray-500">{tr('filters.life.meeting.date')}</span>
              <button
                type="button"
                aria-label={tr('filters.life.meeting.date')}
                aria-expanded={isDateCalendarOpen}
                onClick={() => setIsDateCalendarOpen(true)}
                className={`${inputClass} flex items-center justify-between gap-3 text-left cursor-pointer`}
              >
                <span>{meetingDate ? formatMeetingDate(meetingDate) : tr('filters.life.meeting.date')}</span>
                <CalendarDays className="h-4 w-4 shrink-0 text-[#5F6978]" />
              </button>
            </div>
            <label className="space-y-2">
              <span className="ml-1 block text-xs font-semibold text-gray-500">{tr('filters.life.meeting.time')}</span>
              <input
                type="time"
                value={typeof attributes.life_meeting_time === 'string' ? attributes.life_meeting_time : ''}
                onChange={event => setAttributes(current => ({ ...current, life_meeting_time: event.target.value }))}
                className={inputClass}
              />
            </label>
          </div>
          <div className="space-y-3">
            <span className="ml-1 block text-xs font-semibold text-gray-500">{tr('filters.life.meeting.format')}</span>
            <div className="flex flex-wrap gap-2">
              {(['once', 'regular'] as const).map(format => (
                <button
                  key={format}
                  type="button"
                  aria-pressed={meetingFormat === format}
                  onClick={() => setAttributes(current => {
                    const next = { ...current, life_meeting_format: format };
                    if (format === 'once') delete next.life_meeting_weekdays;
                    return next;
                  })}
                  className={`${pillClass} ${meetingFormat === format ? activeClass : inactiveClass}`}
                >
                  {tr(`filters.life.meeting.${format}`)}
                </button>
              ))}
            </div>
          </div>
          {meetingFormat === 'regular' && (
            <div className="space-y-3">
              <span className="ml-1 block text-xs font-semibold text-gray-500">{tr('filters.life.meeting.weekdays')}</span>
              <div className="flex flex-wrap gap-2">
                {LIFE_WEEKDAYS.map(day => {
                  const active = selectedWeekdays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setAttributes(current => {
                        const selected = Array.isArray(current.life_meeting_weekdays) ? current.life_meeting_weekdays : [];
                        const next = selected.includes(day.value)
                          ? selected.filter(value => value !== day.value)
                          : [...selected, day.value];
                        return { ...current, life_meeting_weekdays: next };
                      })}
                      className={`${pillClass} ${active ? activeClass : inactiveClass}`}
                    >
                      {tr(day.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <label className="block space-y-2">
            <span className="ml-1 block text-xs font-semibold text-gray-500">{tr('filters.life.meeting.maxParticipants')}</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={typeof attributes.life_participants_max === 'number' ? attributes.life_participants_max : ''}
              onChange={event => setAttributes(current => {
                const next = { ...current };
                const value = event.target.value;
                if (/^[1-9]\d*$/.test(value)) next.life_participants_max = Number(value);
                else delete next.life_participants_max;
                return next;
              })}
              className={inputClass}
            />
          </label>
        </div>
      )}
      {normalizedSubCategory === 'life_warnings' && (
        <p className="border-l-2 border-amber-500 pl-3 text-xs font-semibold leading-relaxed text-[#5F6978]">
          {tr('filters.life.manualReview')}
        </p>
      )}
      {isDateCalendarOpen && typeof document !== 'undefined' && createPortal(
        <>
          <button
            type="button"
            className="fixed inset-0 z-[510] cursor-default bg-black/40"
            aria-label={tr('calendar.close')}
            onClick={() => setIsDateCalendarOpen(false)}
          />
          <TwoMonthCalendar
            checkInDate={meetingDate}
            checkOutDate=""
            onChange={date => setAttributes(current => ({ ...current, life_meeting_date: date }))}
            onClose={() => setIsDateCalendarOpen(false)}
            singleDateMode
            singleDateTitle={tr('filters.life.meeting.date')}
            singleDateSummary={formatMeetingDate}
            modalPlacement
          />
        </>,
        document.body
      )}
    </div>
  );
};

export const LifeSpecialFilters: React.FC<{
  subCategory: string;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}> = ({ subCategory, filters, setFilters }) => {
  const fields = getLifeFields(subCategory);
  if (!fields.length) return null;

  return (
    <LifeFieldList
      fields={fields}
      getSelected={field => {
        const validValues = new Set(field.options.map(option => option.value));
        return (filters.classifiedSpecialOptions[field.id] || []).filter(value => validValues.has(value));
      }}
      onToggle={(field, value) => setFilters(current => {
        const validValues = new Set(field.options.map(option => option.value));
        const selected = (current.classifiedSpecialOptions[field.id] || []).filter(item => validValues.has(item));
        const next = selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value];
        return {
          ...current,
          classifiedSpecialOptions: { ...current.classifiedSpecialOptions, [field.id]: next },
          classifiedSpecialText: field.id === 'life_job_experience'
            ? { ...current.classifiedSpecialText, [field.id]: '' }
            : current.classifiedSpecialText
        };
      })}
      renderInput={field => <input
        type={field.inputType}
        inputMode={field.inputType === 'number' ? 'numeric' : undefined}
        min={field.inputType === 'number' ? 1 : undefined}
        max={field.inputType === 'number' ? 80 : undefined}
        step={field.inputType === 'number' ? 1 : undefined}
        value={filters.classifiedSpecialText[field.id] || ''}
        onChange={event => setFilters(current => ({
          ...current,
          classifiedSpecialOptions: field.id === 'life_job_experience'
            ? { ...current.classifiedSpecialOptions, [field.id]: [] }
            : current.classifiedSpecialOptions,
          classifiedSpecialText: { ...current.classifiedSpecialText, [field.id]: event.target.value }
        }))}
        className={inputClass}
      />}
    />
  );
};
