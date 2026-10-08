import React from 'react';
import { Check } from 'lucide-react';
import { useI18n } from '../../../../i18nContext';
import type { ClassifiedSpecialField, ClassifiedSpecialValue } from '../../../../config/classifiedSpecial';

type Props = {
  field: ClassifiedSpecialField;
  value: ClassifiedSpecialValue | undefined;
  onChange: (value: string) => void;
};

const fieldTitleClass = 'text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1';
const colorSwatches: Record<string, string> = {
  black: '#111827', white: '#FFFFFF', gray: '#64748B', silver: '#C0C0C0',
  gold: '#D9AD55', blue: '#2563EB', red: '#EF4444', green: '#16A34A', yellow: '#FACC15',
  pink: '#EC4899', orange: '#F97316', brown: '#92400E', beige: '#D6C6A5', purple: '#9333EA'
};

const ClassifiedColorPicker: React.FC<Props> = ({ field, value, onChange }) => {
  const { tr } = useI18n();

  return (
    <div className="space-y-3">
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
              onClick={() => onChange(item.value)}
              className={`pl pl-interactive relative h-10 w-10 shrink-0 rounded-full border bg-white transition ${isActive ? 'border-[#FF7A50] ring-4 ring-[#FF7A50]/18' : 'border-white ring-1 ring-[#1E293B]/10 hover:ring-[#FF7A50]/45'}`}
            >
              <span
                className="absolute inset-1 rounded-full border border-[#1E293B]/10"
                style={{ background: item.value === 'other' ? 'conic-gradient(#EF4444, #FACC15, #16A34A, #2563EB, #9333EA, #EF4444)' : colorSwatches[item.value] }}
              />
              {isActive && <Check className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-[#FF7A50] p-0.5 text-white ring-2 ring-white" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ClassifiedColorPicker;
