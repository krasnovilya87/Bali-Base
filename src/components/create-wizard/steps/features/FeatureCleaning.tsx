import React from 'react';
import Polzunok from '../../../Polzunok';
import { useI18n } from '../../../../i18nContext';

type FeatureSectionProps = Record<string, any>;

const FeatureCleaning: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;
  const { tr } = useI18n();
  const cleaningLabel = cleaningFrequency === 'daily'
    ? tr('wizard.features.cleaning.daily')
    : cleaningFrequency === '3_times_week'
      ? tr('wizard.features.cleaning.threeTimesWeek')
      : cleaningFrequency === '2_times_week'
        ? tr('wizard.features.cleaning.twoTimesWeek')
        : cleaningFrequency === 'once_week'
          ? tr('wizard.features.cleaning.onceWeek')
          : tr('wizard.features.cleaning.none');

  return (
    <>
                  {/* 13. Периодичность уборки */}
                  <div className="pl p-5 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold font-sans text-[#1E293B] tracking-wider block font-bold">🧹 {tr('wizard.features.cleaning')}</span>
                      <span className="text-xs font-bold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-lg">
                        {cleaningLabel}
                      </span>
                    </div>

                    <div className="pt-2 relative">
                      <Polzunok
                        min={0}
                        max={4}
                        step={1}
                        value={
                          cleaningFrequency === 'daily' ? 4 :
                            cleaningFrequency === '3_times_week' ? 3 :
                              cleaningFrequency === '2_times_week' ? 2 :
                                cleaningFrequency === 'once_week' ? 1 : 0
                        }
                        onChange={idx => {
                          const freqMap: ('none' | 'once_week' | '2_times_week' | '3_times_week' | 'daily')[] = ['none', 'once_week', '2_times_week', '3_times_week', 'daily'];
                          setCleaningFrequency(freqMap[idx]);
                        }}
                      />
                      <div className="relative h-4 mt-1.5 text-[10px] text-gray-400 font-sans font-bold">
                        <span className="absolute left-0">{tr('wizard.features.cleaning.none')}</span>
                        <span className="absolute left-1/4 -translate-x-1/2 whitespace-nowrap">1</span>
                        <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">2</span>
                        <span className="absolute left-3/4 -translate-x-1/2 whitespace-nowrap">3</span>
                        <span className="absolute right-0">{tr('wizard.features.cleaning.daily')}</span>
                      </div>
                    </div>
                  </div>
    </>
  );
};

export default FeatureCleaning;

