import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ThreeDIcon } from '../../ThreeDIcon';
import { ADS_L3_SUBCATEGORIES } from '../../../app/menu';
import { useI18n } from '../../../i18nContext';

type SubcategoryItem = {
  id: string;
  label: string;
  icon: string;
  customImage?: string;
  dividerBefore?: boolean;
};

type StepSubcategoryProps = {
  category: string;
  subcategories: SubcategoryItem[];
  subCategory: string;
  setSubCategory: (subcategoryId: string) => void;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

const StepSubcategory: React.FC<StepSubcategoryProps> = ({
  category,
  subcategories,
  subCategory,
  setSubCategory,
  setStep
}) => {
  const { tr } = useI18n();
  const [activeAdsGroupId, setActiveAdsGroupId] = useState<string | null>(null);
  const activeAdsGroup = category === 'ads'
    ? subcategories.find(group => group.id === activeAdsGroupId)
    : undefined;
  const activeAdsOptions = activeAdsGroup
    ? ADS_L3_SUBCATEGORIES[activeAdsGroup.id] || []
    : [];

  useEffect(() => {
    if (!activeAdsGroup) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveAdsGroupId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAdsGroup]);

  return (
    <div className="space-y-4 animate-fade-in">
    {subcategories.length > 0 ? (
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
        {subcategories.map(sub => {
          const adsOptions = category === 'ads' ? ADS_L3_SUBCATEGORIES[sub.id] || [] : [];
          const isSelected = category === 'ads'
            ? adsOptions.some(option => option.id === subCategory)
            : subCategory === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => {
                if (category === 'ads') {
                  setActiveAdsGroupId(sub.id);
                  return;
                }
                setSubCategory(sub.id);
                setStep(3);
              }}
              className={`aspect-square w-full bg-white rounded-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 active:scale-95 shadow-2xs relative overflow-hidden text-center focus:outline-none p-1 sm:p-3.5 pb-2.5 sm:pb-3 ${isSelected
                ? 'border-[0.5px] border-[#FF7A50] ring-1 ring-[#FF7A50]'
                : 'border-[0.5px] border-[#94A3B8]/40 hover:border-[#FF7A50]'
                }`}
            >
              <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-[#FF7A50]/5 rounded-full filter blur-xl group-hover:scale-125 transition duration-300 pointer-events-none" />

              <div className="absolute inset-x-2 sm:inset-x-3 top-2 sm:top-2.5 bottom-7 sm:bottom-8 flex items-center justify-center">
                {sub.customImage ? (
                  <img
                    src={sub.customImage}
                    alt={category === 'afisha' ? tr(`subcategory.${sub.id}`) : sub.label}
                    className="w-full h-full max-w-[78%] max-h-[78%] sm:max-w-[74%] sm:max-h-[74%] object-contain filter drop-shadow hover:brightness-105 group-hover:scale-105 transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ThreeDIcon emoji={sub.icon} size={80} className="transition-all duration-200" />
                )}
              </div>

              <div className="absolute bottom-2.5 sm:bottom-3 left-1 right-1 flex justify-center text-center">
                <h3 className={`font-sans font-black text-center text-xs xs:text-sm sm:text-lg text-[#1E293B] group-hover:text-[#FF7A50] transition-colors leading-[1.2] tracking-tight px-1 py-0.5 truncate ${isSelected ? 'text-[#FF7A50]' : ''}`}>
                  {category === 'afisha' ? tr(`subcategory.${sub.id}`) : sub.label}
                </h3>
              </div>
            </button>
          );
        })}
      </div>
    ) : (
      <div className="p-10 text-center bg-white rounded-2xl border-[0.5px] border-[#94A3B8]/40 text-gray-400 text-xs">
        В категории <strong className="text-gray-700 font-sans">«Полезное»</strong> нет подразделов. Нажмите «Дальше».
      </div>
    )}

    {activeAdsGroup && createPortal(
      <div
        className="fixed inset-0 z-[560] flex items-end justify-center bg-[#0F172A]/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setActiveAdsGroupId(null);
          }
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ads-l3-dialog-title"
          className="flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-white/70 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.32)] sm:rounded-2xl"
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
            {activeAdsGroup.customImage ? (
              <img
                src={activeAdsGroup.customImage}
                alt=""
                className="h-11 w-11 shrink-0 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <ThreeDIcon emoji={activeAdsGroup.icon} size={44} className="shrink-0" />
            )}
            <h3 id="ads-l3-dialog-title" className="min-w-0 flex-1 text-base font-black leading-tight text-[#1E293B] sm:text-lg">
              {activeAdsGroup.label}
            </h3>
            <button
              type="button"
              onClick={() => setActiveAdsGroupId(null)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#64748B] transition hover:border-[#FF7A50] hover:text-[#FF7A50] active:scale-95"
              title={tr('common.close')}
              aria-label={tr('common.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto px-4 py-5 sm:px-5">
            <div className="flex flex-wrap gap-2">
              {activeAdsOptions.map(option => {
                const isOptionSelected = subCategory === option.id;
                return (
                  <React.Fragment key={option.id}>
                    {option.dividerBefore && <span className="my-2 h-px w-full bg-[#E5E7EB]" aria-hidden="true" />}
                    <button
                      type="button"
                      onClick={() => {
                        setSubCategory(option.id);
                        setActiveAdsGroupId(null);
                        setStep(3);
                      }}
                      aria-pressed={isOptionSelected}
                      className={`pl pl-interactive transport-pill inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer select-none ${
                        isOptionSelected
                          ? 'selected border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]'
                          : 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]'
                      }`}
                    >
                      {tr(`subcategory.${option.id}`)}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
  </div>
  );
};

export default StepSubcategory;
