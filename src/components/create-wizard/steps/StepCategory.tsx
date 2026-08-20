import React from 'react';

type CategoryItem = {
  id: string;
  label: string;
  icon: string;
  image?: string;
};

type StepCategoryProps = {
  categoriesList: CategoryItem[];
  category: string;
  onSelectCategory: (categoryId: string) => void;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

const StepCategory: React.FC<StepCategoryProps> = ({
  categoriesList,
  category,
  onSelectCategory,
  setStep
}) => (
  <div className="space-y-4 animate-fade-in">
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
      {categoriesList.map(item => {
        const isSelected = category === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onSelectCategory(item.id);
              setStep(2);
            }}
            className={`aspect-square w-full bg-white rounded-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 active:scale-95 shadow-2xs relative overflow-hidden text-center focus:outline-none p-1 sm:p-3.5 pb-2.5 sm:pb-3 ${isSelected
              ? 'border-[0.5px] border-[#FF7A50] ring-1 ring-[#FF7A50]'
              : 'border-[0.5px] border-[#94A3B8]/40 hover:border-[#FF7A50]'
              }`}
          >
            <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-[#FF7A50]/5 rounded-full filter blur-xl group-hover:scale-125 transition duration-300 pointer-events-none" />

            <div className="absolute inset-x-2 sm:inset-x-3 top-2 sm:top-2.5 bottom-7 sm:bottom-8 flex items-center justify-center">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.label}
                  className="w-full h-full max-w-[78%] max-h-[78%] sm:max-w-[74%] sm:max-h-[74%] object-contain filter drop-shadow hover:brightness-105 group-hover:scale-105 transition-all duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-3xl object-contain filter drop-shadow">{item.icon}</span>
              )}
            </div>

            <div className="absolute bottom-2.5 sm:bottom-3 left-1 right-1 flex justify-center text-center">
              <h3 className={`font-sans font-black text-center text-xs xs:text-sm sm:text-lg text-[#1E293B] group-hover:text-[#FF7A50] transition-colors leading-[1.2] tracking-tight px-1 py-0.5 truncate ${isSelected ? 'text-[#FF7A50]' : ''}`}>
                {item.label}
              </h3>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default StepCategory;
