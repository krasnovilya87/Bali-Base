import React from 'react';
import { useI18n } from '../../i18nContext';
import { FilterState } from '../../types';
import type { ClassifiedSpecialValue } from '../../config/classifiedSpecial';
import {
  CLASSIFIED_APPAREL_FITS,
  CLASSIFIED_APPAREL_SIZES,
  CLASSIFIED_SIZING_FIELD_IDS,
  CLASSIFIED_SIZING_GENDERS,
  getApparelSizeConversion,
  getShoeLengthRange,
  getShoeSizeConversion
} from '../../utils/classifiedSizing';
import type {
  ClassifiedApparelFit,
  ClassifiedApparelSize,
  ClassifiedSizingGender,
  ClassifiedSizingKind
} from '../../utils/classifiedSizing';

const titleClass = 'ml-1 block text-xs font-semibold tracking-wider text-gray-400';
const pillClass = 'pl pl-interactive transport-pill inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-40';
const activeClass = 'selected border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]';
const inactiveClass = 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]';

type SizingPanelProps = {
  kind: ClassifiedSizingKind;
  gender?: ClassifiedSizingGender;
  apparelSize?: ClassifiedApparelSize;
  apparelFit?: ClassifiedApparelFit;
  footLength?: number;
  allowClear?: boolean;
  onGender: (value?: ClassifiedSizingGender) => void;
  onApparelSize: (value?: ClassifiedApparelSize) => void;
  onApparelFit: (value?: ClassifiedApparelFit) => void;
  onFootLength: (value: number) => void;
};

const ClassifiedSizingPanel: React.FC<SizingPanelProps> = ({
  kind,
  gender,
  apparelSize,
  apparelFit,
  footLength,
  allowClear = false,
  onGender,
  onApparelSize,
  onApparelFit,
  onFootLength
}) => {
  const { tr } = useI18n();
  const shoeRange = getShoeLengthRange(gender);
  const displayedFootLength = footLength ?? shoeRange.initial;
  const selectGender = (value: ClassifiedSizingGender) => onGender(
    allowClear && gender === value ? undefined : value
  );
  const selectApparelSize = (value: ClassifiedApparelSize) => onApparelSize(
    allowClear && apparelSize === value ? undefined : value
  );
  const selectApparelFit = (value: ClassifiedApparelFit) => onApparelFit(
    allowClear && apparelFit === value ? undefined : value
  );
  const apparelConversion = gender && apparelSize
    ? getApparelSizeConversion(gender, apparelSize)
    : null;
  const shoeConversion = gender && footLength !== undefined
    ? getShoeSizeConversion(gender, footLength)
    : null;

  return (
    <div className="space-y-5 border-t border-[#E5E7EB] pt-5">
      <div className="space-y-3">
        <span className={titleClass}>{tr('filters.classified.special.sizing.gender')}</span>
        <div className="flex flex-wrap gap-2">
          {CLASSIFIED_SIZING_GENDERS.map(value => {
            const active = gender === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => selectGender(value)}
                aria-pressed={active}
                className={`${pillClass} ${active ? activeClass : inactiveClass}`}
              >
                {tr(`filters.classified.special.sizing.gender.${value}`)}
              </button>
            );
          })}
        </div>
      </div>

      {kind === 'apparel' ? (
        <>
          <div className="space-y-3">
            <span className={titleClass}>{tr('filters.classified.special.sizing.internationalSize')}</span>
            <div className="flex flex-wrap gap-2">
              {CLASSIFIED_APPAREL_SIZES.map(value => {
                const active = apparelSize === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!gender}
                    onClick={() => selectApparelSize(value)}
                    aria-pressed={active}
                    className={`${pillClass} ${active ? activeClass : inactiveClass}`}
                  >
                    {value.toUpperCase()}
                  </button>
                );
              })}
            </div>
            {apparelConversion && (
              <p className="scrollbar-none flex items-center gap-3 overflow-x-auto whitespace-nowrap px-1 text-xs font-semibold text-[#64748B] sm:gap-4" aria-live="polite">
                <span>EU {apparelConversion.eu}</span>
                <span aria-hidden="true">·</span>
                <span>US {apparelConversion.us}</span>
                <span aria-hidden="true">·</span>
                <span>UK {apparelConversion.uk}</span>
                <span aria-hidden="true">·</span>
                <span>RU {apparelConversion.ru}</span>
                <span aria-hidden="true">·</span>
                <span>Asia {apparelConversion.asia}</span>
              </p>
            )}
          </div>

          <div className="space-y-3">
            <span className={titleClass}>{tr('filters.classified.special.sizing.fit')}</span>
            <div className="flex flex-wrap gap-2">
              {CLASSIFIED_APPAREL_FITS.map(value => {
                const active = apparelFit === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!gender}
                    onClick={() => selectApparelFit(value)}
                    aria-pressed={active}
                    className={`${pillClass} ${active ? activeClass : inactiveClass}`}
                  >
                    {tr(`filters.classified.special.sizing.fit.${value}`)}
                  </button>
                );
              })}
            </div>
          </div>

        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className={titleClass}>{tr('filters.classified.special.sizing.footLength')}</span>
            <strong className="rounded-lg bg-[#F4F7F6] px-2.5 py-1 text-[10px] text-[#1E293B]">
              {footLength !== undefined
                ? `${footLength.toFixed(1)} cm`
                : tr('filters.classified.special.sizing.notSelected')}
            </strong>
          </div>
          <input
            type="range"
            min={shoeRange.min}
            max={shoeRange.max}
            step={0.5}
            value={displayedFootLength}
            disabled={!gender}
            onPointerDown={() => { if (footLength === undefined && gender) onFootLength(displayedFootLength); }}
            onChange={event => onFootLength(Number(event.target.value))}
            aria-label={tr('filters.classified.special.sizing.footLength')}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E2E8F0] accent-[#FF7A50] disabled:cursor-not-allowed disabled:opacity-40"
          />
          <div className="flex justify-between text-[10px] font-bold text-[#94A3B8]">
            <span>{shoeRange.min} cm</span>
            <span>{shoeRange.max} cm</span>
          </div>

          {shoeConversion && (
            <p className="scrollbar-none flex items-center gap-3 overflow-x-auto whitespace-nowrap px-1 text-xs font-semibold text-[#64748B] sm:gap-4" aria-live="polite">
              <span>EU {shoeConversion.eu}</span>
              <span aria-hidden="true">·</span>
              <span>US {shoeConversion.us}</span>
              <span aria-hidden="true">·</span>
              <span>UK {shoeConversion.uk}</span>
              <span aria-hidden="true">·</span>
              <span>JP {shoeConversion.jp}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const ClassifiedSizingWizard: React.FC<{
  kind: ClassifiedSizingKind;
  attributes: Record<string, ClassifiedSpecialValue>;
  setAttributes: React.Dispatch<React.SetStateAction<Record<string, ClassifiedSpecialValue>>>;
}> = ({ kind, attributes, setAttributes }) => {
  const setAttribute = (fieldId: string, value?: ClassifiedSpecialValue) => setAttributes(current => {
    const next = { ...current };
    if (value === undefined || value === '') delete next[fieldId];
    else next[fieldId] = value;
    return next;
  });

  return (
    <ClassifiedSizingPanel
      kind={kind}
      gender={attributes[CLASSIFIED_SIZING_FIELD_IDS.gender] as ClassifiedSizingGender | undefined}
      apparelSize={attributes[CLASSIFIED_SIZING_FIELD_IDS.apparelSize] as ClassifiedApparelSize | undefined}
      apparelFit={attributes[CLASSIFIED_SIZING_FIELD_IDS.apparelFit] as ClassifiedApparelFit | undefined}
      footLength={typeof attributes[CLASSIFIED_SIZING_FIELD_IDS.footLength] === 'number'
        ? attributes[CLASSIFIED_SIZING_FIELD_IDS.footLength] as number
        : undefined}
      onGender={value => setAttribute(CLASSIFIED_SIZING_FIELD_IDS.gender, value)}
      onApparelSize={value => setAttribute(CLASSIFIED_SIZING_FIELD_IDS.apparelSize, value)}
      onApparelFit={value => setAttribute(CLASSIFIED_SIZING_FIELD_IDS.apparelFit, value)}
      onFootLength={value => setAttribute(CLASSIFIED_SIZING_FIELD_IDS.footLength, value)}
    />
  );
};

export const ClassifiedSizingFilter: React.FC<{
  kind: ClassifiedSizingKind;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}> = ({ kind, filters, setFilters }) => {
  const selectedOption = (fieldId: string) => filters.classifiedSpecialOptions[fieldId]?.[0];
  const footRange = filters.classifiedSpecialNumberRanges[CLASSIFIED_SIZING_FIELD_IDS.footLength] || {};
  const footLength = footRange.min !== undefined && footRange.min === footRange.max
    ? footRange.min
    : undefined;
  const setOption = (fieldId: string, value?: string) => setFilters(current => ({
    ...current,
    classifiedSpecialOptions: {
      ...current.classifiedSpecialOptions,
      [fieldId]: value ? [value] : []
    }
  }));

  return (
    <ClassifiedSizingPanel
      kind={kind}
      gender={selectedOption(CLASSIFIED_SIZING_FIELD_IDS.gender) as ClassifiedSizingGender | undefined}
      apparelSize={selectedOption(CLASSIFIED_SIZING_FIELD_IDS.apparelSize) as ClassifiedApparelSize | undefined}
      apparelFit={selectedOption(CLASSIFIED_SIZING_FIELD_IDS.apparelFit) as ClassifiedApparelFit | undefined}
      footLength={footLength}
      allowClear
      onGender={value => setOption(CLASSIFIED_SIZING_FIELD_IDS.gender, value)}
      onApparelSize={value => setOption(CLASSIFIED_SIZING_FIELD_IDS.apparelSize, value)}
      onApparelFit={value => setOption(CLASSIFIED_SIZING_FIELD_IDS.apparelFit, value)}
      onFootLength={value => setFilters(current => ({
        ...current,
        classifiedSpecialNumberRanges: {
          ...current.classifiedSpecialNumberRanges,
          [CLASSIFIED_SIZING_FIELD_IDS.footLength]: { min: value, max: value }
        }
      }))}
    />
  );
};
