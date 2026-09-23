import React from 'react';
import { SERVICE_SUBCATEGORIES } from '../config/serviceSubcategories';
import { useI18n } from '../i18nContext';

type Props = {
  subCategory: string;
  selected: string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
  licensed: boolean;
  certified: boolean;
  onLicenseChange: (value: boolean) => void;
  onCertificatesChange: (value: boolean) => void;
};

export default function ServiceSubcategoryChoices({
  subCategory, selected, onChange, multiple = false,
  licensed, certified, onLicenseChange, onCertificatesChange
}: Props) {
  const { tr } = useI18n();
  const groups = subCategory ? [subCategory] : Object.keys(SERVICE_SUBCATEGORIES);
  const pillClass = (active: boolean) =>
    `pl pl-interactive transport-pill inline-flex min-h-10 max-w-full items-center rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer select-none ${active ? 'selected border-[#FF7A50] bg-[#FF7A50] text-white' : 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]'}`;

  return (
    <div className="space-y-5">
      {groups.map(group => (
        <fieldset key={group} className="min-w-0 space-y-3">
          <legend className="text-xs font-semibold text-[#1E293B]">
            {tr(subCategory ? 'services.subcategory' : `subcategory.${group}`)}
          </legend>
          <div className="flex flex-wrap gap-2">
            {(SERVICE_SUBCATEGORIES[group] || []).map(option => (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected.includes(option.id)}
                className={pillClass(selected.includes(option.id))}
                onClick={() => onChange(selected.includes(option.id)
                  ? selected.filter(value => value !== option.id)
                  : multiple ? [...selected, option.id] : [option.id])}
              >
                <span className="min-w-0 break-words">{tr(`services.type.${option.id}`)}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {subCategory === 'health' && (
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={licensed} className={pillClass(licensed)} onClick={() => onLicenseChange(!licensed)}>
            <span className="min-w-0 break-words">{tr('services.license')}</span>
          </button>
          <button type="button" aria-pressed={certified} className={pillClass(certified)} onClick={() => onCertificatesChange(!certified)}>
            <span className="min-w-0 break-words">{tr('services.certificates')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
