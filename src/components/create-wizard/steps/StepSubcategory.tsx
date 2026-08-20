import React from 'react';
import { ThreeDIcon } from '../../ThreeDIcon';

type SubcategoryItem = {
  id: string;
  label: string;
  icon: string;
  customImage?: string;
};

type StepSubcategoryProps = {
  subcategories: SubcategoryItem[];
  subCategory: string;
  setSubCategory: (subcategoryId: string) => void;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

const StepSubcategory: React.FC<StepSubcategoryProps> = ({
  subcategories,
  subCategory,
  setSubCategory,
  setStep
}) => (
  <div className="space-y-4 animate-fade-in">
    {subcategories.length > 0 ? (
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
        {subcategories.map(sub => {
          const isSelected = subCategory === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => {
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
                    alt={sub.label}
                    className="w-full h-full max-w-[78%] max-h-[78%] sm:max-w-[74%] sm:max-h-[74%] object-contain filter drop-shadow hover:brightness-105 group-hover:scale-105 transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ThreeDIcon emoji={sub.icon} size={80} className="transition-all duration-200" />
                )}
              </div>

              <div className="absolute bottom-2.5 sm:bottom-3 left-1 right-1 flex justify-center text-center">
                <h3 className={`font-sans font-black text-center text-xs xs:text-sm sm:text-lg text-[#1E293B] group-hover:text-[#FF7A50] transition-colors leading-[1.2] tracking-tight px-1 py-0.5 truncate ${isSelected ? 'text-[#FF7A50]' : ''}`}>
                  {sub.label}
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
  </div>
);

export default StepSubcategory;
