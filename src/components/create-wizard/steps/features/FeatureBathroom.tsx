import React from 'react';
import Polzunok from '../../../Polzunok';
import { useI18n } from '../../../../i18nContext';

type FeatureSectionProps = Record<string, any>;

const FeatureBathroom: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;
  const { tr } = useI18n();

  return (
    <>
                  {/* 11. Ванная комната */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">🚿 {tr('wizard.features.bathroom')}</span>

                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { value: 'hot_water', label: tr('wizard.features.bathroom.hotWater'), icon: '🔥' },
                        { value: 'tropical_shower', label: tr('wizard.features.bathroom.tropicalShower'), icon: '🌴' },
                        { value: 'double_sink', label: tr('wizard.features.bathroom.doubleSink'), icon: '🚰' },
                        { value: 'bathtub', label: tr('wizard.features.bathroom.bathtub'), icon: '🛁' },
                        { value: 'garden_view', label: tr('wizard.features.bathroom.gardenView'), icon: '🪴' },
                        { value: 'sauna_hammam', label: tr('wizard.features.bathroom.saunaHammam'), icon: '🧖' }
                      ].map(opt => {
                        const isActive = bathroomOptions.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleBathroomOption(opt.value)}
                            className={`pl pl-interactive wizard-choice-tile p-2.5 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none relative min-h-[105px] ${isActive
                              ? 'wizard-choice-tile--active'
                              : 'bg-white border-[#E5E7EB] text-gray-500 hover:border-[#FF7A50]'
                              }`}
                          >
                            {isActive && (
                              <span className="wizard-choice-check absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                            )}
                            <span className="text-3xl shrink-0">{opt.icon}</span>
                            <span className="text-xs font-sans font-extrabold leading-tight">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
    </>
  );
};

export default FeatureBathroom;

