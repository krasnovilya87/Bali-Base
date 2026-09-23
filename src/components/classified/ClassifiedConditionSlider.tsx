import React from 'react';
import { useI18n } from '../../i18nContext';
import { CLASSIFIED_CONDITION_OPTIONS } from '../../utils/classifiedFilters';

type ConditionValue = typeof CLASSIFIED_CONDITION_OPTIONS[number];
const CONDITION_SCALE_OPTIONS = [...CLASSIFIED_CONDITION_OPTIONS].reverse() as ConditionValue[];

const rangeClass = 'absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent outline-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#FF7A50] [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(255,122,80,0.42)] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#FF7A50]';

const ConditionTrack: React.FC<{ start: number; end: number }> = ({ start, end }) => {
  const lastIndex = CONDITION_SCALE_OPTIONS.length - 1;
  const left = start / lastIndex * 100;
  const right = end / lastIndex * 100;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[9px] h-2 rounded-full bg-[#E2E8F0]">
      <span className="absolute h-2 rounded-full bg-[#FF7A50]" style={{ left: `${left}%`, width: `${right - left}%` }} />
      {CONDITION_SCALE_OPTIONS.map((condition, index) => (
        <span
          key={condition}
          className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${index >= start && index <= end ? 'bg-[#FF7A50]' : 'bg-[#CBD5E1]'}`}
          style={{ left: `${index / lastIndex * 100}%` }}
        />
      ))}
    </div>
  );
};

const ConditionLabels: React.FC = () => {
  const { tr } = useI18n();
  const first = CONDITION_SCALE_OPTIONS[0];
  const middle = CONDITION_SCALE_OPTIONS[Math.floor(CONDITION_SCALE_OPTIONS.length / 2)];
  const last = CONDITION_SCALE_OPTIONS[CONDITION_SCALE_OPTIONS.length - 1];
  return (
    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-[#94A3B8]">
      <span className="text-left">{tr(`filters.classified.condition.${first}`)}</span>
      <span className="text-center">{tr(`filters.classified.condition.${middle}`)}</span>
      <span className="text-right">{tr(`filters.classified.condition.${last}`)}</span>
    </div>
  );
};

export const ClassifiedConditionWizardSlider: React.FC<{
  value?: string;
  onChange: (value: ConditionValue) => void;
}> = ({ value, onChange }) => {
  const { tr } = useI18n();
  const valueIndex = CONDITION_SCALE_OPTIONS.indexOf(value as ConditionValue);
  const hasValue = valueIndex >= 0;
  const selectedIndex = hasValue ? valueIndex : Math.floor(CONDITION_SCALE_OPTIONS.length / 2);
  const selectedValue = CONDITION_SCALE_OPTIONS[selectedIndex];

  return (
    <div className="pb-1">
      <div className="flex items-center justify-between gap-3 pb-1 pt-1">
        <span className="ml-1 text-xs font-semibold tracking-wider text-gray-400">{tr('filters.classified.condition')} *</span>
        <strong className="rounded-lg bg-[#F4F7F6] px-2.5 py-1 text-[10px] text-[#1E293B]">
          {hasValue ? tr(`filters.classified.condition.${selectedValue}`) : tr('filters.classified.condition')}
        </strong>
      </div>
      <div className="relative mt-0.5 h-6">
        <ConditionTrack start={0} end={selectedIndex} />
        <input
          type="range"
          min={0}
          max={CONDITION_SCALE_OPTIONS.length - 1}
          step={1}
          value={selectedIndex}
          onPointerDown={() => { if (!hasValue) onChange(selectedValue); }}
          onChange={event => onChange(CONDITION_SCALE_OPTIONS[Number(event.target.value)])}
          className={rangeClass.replace('pointer-events-none', 'pointer-events-auto')}
        />
      </div>
      <div className="mt-1"><ConditionLabels /></div>
    </div>
  );
};

export const ClassifiedConditionFilterSlider: React.FC<{
  selected: string[];
  onChange: (selected: string[]) => void;
}> = ({ selected, onChange }) => {
  const { tr } = useI18n();
  const lastIndex = CONDITION_SCALE_OPTIONS.length - 1;
  const selectedIndex = CONDITION_SCALE_OPTIONS.indexOf(selected[0] as ConditionValue);
  const hasValue = selectedIndex >= 0;
  const displayIndex = hasValue
    ? selectedIndex
    : Math.floor(CONDITION_SCALE_OPTIONS.length / 2);
  const selectedValue = CONDITION_SCALE_OPTIONS[displayIndex];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="ml-1 text-xs font-semibold tracking-wider text-gray-400">{tr('filters.classified.condition')}</span>
        <strong className="rounded-lg bg-[#F4F7F6] px-2.5 py-1 text-[10px] text-[#1E293B]">
          {hasValue ? tr(`filters.classified.condition.${selectedValue}`) : tr('filters.classified.condition')}
        </strong>
      </div>
      <div className="relative h-6">
        <ConditionTrack start={0} end={displayIndex} />
        <input
          type="range"
          min={0}
          max={lastIndex}
          step={1}
          value={displayIndex}
          onPointerDown={() => { if (!hasValue) onChange([selectedValue]); }}
          onChange={event => onChange([CONDITION_SCALE_OPTIONS[Number(event.target.value)]])}
          className={rangeClass.replace('pointer-events-none', 'pointer-events-auto')}
        />
      </div>
      <ConditionLabels />
    </div>
  );
};
