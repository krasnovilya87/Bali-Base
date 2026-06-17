import React from 'react';
import Polzunok from '../../../Polzunok';

type FeatureSectionProps = Record<string, any>;

const FeatureTerritory: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;

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
                            onClick={() => setTerritoryType(t.value as any)}
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
    </>
  );
};

export default FeatureTerritory;

