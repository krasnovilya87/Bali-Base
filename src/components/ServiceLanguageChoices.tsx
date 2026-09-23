import React from 'react';
import { useI18n } from '../i18nContext';

type ServiceLanguageChoicesProps = {
  selected: string[];
  onToggle: (value: string) => void;
};

const serviceLanguages = [
  { value: 'ru', flag: '🇷🇺' },
  { value: 'en', flag: '🇬🇧' },
  { value: 'id', flag: '🇮🇩' },
  { value: 'other', flag: '🌐' }
] as const;

const ServiceLanguageChoices: React.FC<ServiceLanguageChoicesProps> = ({ selected, onToggle }) => {
  const { tr } = useI18n();

  return (
    <div className="flex flex-wrap gap-2.5">
      {serviceLanguages.map(({ value, flag }) => {
        const isActive = selected.includes(value);
        const label = tr(`wizard.services.language.${value}`);

        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            aria-label={label}
            aria-pressed={isActive}
            title={label}
            className={`pl pl-interactive grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 transition cursor-pointer select-none ${
              isActive
                ? 'selected border-[#FF7A50] bg-[#FFF4F0] shadow-[0_8px_18px_rgba(255,122,80,0.22)] ring-2 ring-[#FF7A50]/15'
                : 'border-[#E5E7EB] bg-white hover:border-[#FF7A50] hover:bg-[#FFF8F5]'
            }`}
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[#F8FAFC] text-[25px] leading-none shadow-inner"
            >
              {flag}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ServiceLanguageChoices;
