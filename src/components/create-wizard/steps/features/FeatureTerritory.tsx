import React, { useState } from 'react';
import Polzunok from '../../../Polzunok';

type FeatureSectionProps = Record<string, any>;

const FeatureTerritory: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;
  const [showResortInfo, setShowResortInfo] = useState(false);

  return (
    <>
      {/* 5. Тип территории */}
      <div className="space-y-3">
        <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">🏡 Тип территории</span>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: 'private', label: 'Приватная', icon: '🔒', desc: 'Свой двор' },
            { value: 'shared', label: 'Общая', icon: '👥', desc: 'Общий двор' },
            { value: 'resort', label: 'Резорт', icon: '✨', desc: 'Закрытый сад' }
          ].map(t => {
            const isActive = territoryType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setTerritoryType(t.value as any);
                  if (t.value === 'resort') {
                    setShowResortInfo(true);
                  }
                }}
                className={`pl pl-interactive p-3.5 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer min-h-[120px] relative ${isActive
                  ? 'selected bg-[#FF7A50]/10 border-[#FF7A50] text-[#FF7A50] font-extrabold shadow-sm'
                  : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                  }`}
              >
                {isActive && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                )}
                <span className="text-3xl leading-none">{t.icon}</span>
                <span className="text-xs font-bold leading-tight mt-1">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showResortInfo && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#1E293B]/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="pu w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-white/50 text-[#1E293B] animate-scale-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF7A50]/10 flex items-center justify-center text-xl">
                ✨
              </div>
              <h3 className="text-base font-extrabold text-[#1E293B]">Резорт</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#1E293B]/80 mb-5">
              Резорт это крупный гостиничный комплекс с бассейнами, ресторанами, развлечениями и зонами отдыха
            </p>
            <button
              type="button"
              onClick={() => setShowResortInfo(false)}
              className="w-full py-3 bg-[#FF7A50] hover:bg-[#E05A30] text-white rounded-2xl text-xs font-extrabold transition active:scale-95 cursor-pointer"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureTerritory;
