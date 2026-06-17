import React from 'react';
import Polzunok from '../../../Polzunok';

type FeatureSectionProps = Record<string, any>;

const FeatureViews: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;

  return (
    <>
                  {/* 9. Вид */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">🌅 Вид</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { value: 'rice_fields', label: 'Рис. поля', icon: '🌾' },
                        { value: 'garden', label: 'Сад', icon: '🌴' },
                        { value: 'pool', label: 'Бассейн', icon: '💦' },
                        { value: 'ocean', label: 'Океан', icon: '🌊' },
                        { value: 'jungle', label: 'Джунгли', icon: '🌿' }
                      ].map(v => {
                        const isActive = selectedViews.includes(v.value);
                        return (
                          <button
                            key={v.value}
                            type="button"
                            onClick={() => toggleViewType(v.value)}
                            className={`pl pl-interactive p-2.5 rounded-2xl text-center flex flex-col items-center justify-center gap-1 cursor-pointer select-none h-[95px] relative ${isActive
                              ? 'selected bg-[#FF7A50]/15 border-[#FF7A50] text-[#FF7A50] font-extrabold shadow-sm'
                              : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                              }`}
                          >
                            {isActive && (
                              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[7px] font-extrabold z-10 animate-scale-up">✓</span>
                            )}
                            <span className="text-2xl leading-none">{v.icon}</span>
                            <span className="text-xs font-sans font-bold leading-tight mt-1">{v.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
    </>
  );
};

export default FeatureViews;

