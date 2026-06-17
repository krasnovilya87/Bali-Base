import React from 'react';
import Polzunok from '../../../Polzunok';

type FeatureSectionProps = Record<string, any>;

const FeatureInternet: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;

  return (
    <>
                  {/* 10. Скорость интернета (WiFi) */}
                  <div className="pl p-5 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold font-sans text-[#1E293B] tracking-wider block font-bold">⚡ Скорость интернета</span>
                      <span className="text-xs font-bold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-lg">
                        {internetSpeed === 0 ? 'Без WiFi' : `${internetSpeed} Мб/с`}
                      </span>
                    </div>

                    <div className="pt-2 relative">
                      <Polzunok
                        min={0}
                        max={3}
                        step={1}
                        value={
                          internetSpeed === 200 ? 3 :
                            internetSpeed === 100 ? 2 :
                              internetSpeed === 50 ? 1 : 0
                        }
                        onChange={idx => {
                          const speedMap = [0, 50, 100, 200];
                          setInternetSpeed(speedMap[idx]);
                        }}
                      />
                      <div className="relative h-4 mt-1.5 text-[10px] text-gray-400 font-sans font-bold">
                        <span className="absolute left-0">Без WiFi</span>
                        <span className="absolute left-1/3 -translate-x-1/2 whitespace-nowrap">50 Мб/с</span>
                        <span className="absolute left-2/3 -translate-x-1/2 whitespace-nowrap">100 Мб/с</span>
                        <span className="absolute right-0">200 Мб/с</span>
                      </div>
                    </div>
                  </div>
    </>
  );
};

export default FeatureInternet;

