import React from 'react';
import Polzunok from '../../../Polzunok';

type FeatureSectionProps = Record<string, any>;

const FeatureCleaning: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;

  return (
    <>
                  {/* 13. Периодичность уборки */}
                  <div className="pl p-5 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold font-sans text-[#1E293B] tracking-wider block font-bold">🧹 Периодичность уборки</span>
                      <span className="text-xs font-bold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-lg">
                        {cleaningFrequency === 'daily' ? 'Ежедневно' :
                          cleaningFrequency === '3_times_week' ? '3 раза в неделю' :
                            cleaningFrequency === 'once_week' ? '1 раз в неделю' : 'Не включено'}
                      </span>
                    </div>

                    <div className="pt-2 relative">
                      <Polzunok
                        min={0}
                        max={3}
                        step={1}
                        value={
                          cleaningFrequency === 'daily' ? 3 :
                            cleaningFrequency === '3_times_week' ? 2 :
                              cleaningFrequency === 'once_week' ? 1 : 0
                        }
                        onChange={idx => {
                          const freqMap: ('none' | 'once_week' | '3_times_week' | 'daily')[] = ['none', 'once_week', '3_times_week', 'daily'];
                          setCleaningFrequency(freqMap[idx]);
                        }}
                      />
                      <div className="relative h-4 mt-1.5 text-[10px] text-gray-400 font-sans font-bold">
                        <span className="absolute left-0">Не включено</span>
                        <span className="absolute left-1/3 -translate-x-1/2 whitespace-nowrap">1 раз/нед</span>
                        <span className="absolute left-2/3 -translate-x-1/2 whitespace-nowrap">3 раза/нед</span>
                        <span className="absolute right-0">Ежедневно</span>
                      </div>
                    </div>
                  </div>
    </>
  );
};

export default FeatureCleaning;

