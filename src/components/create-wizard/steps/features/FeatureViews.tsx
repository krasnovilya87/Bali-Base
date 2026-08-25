import React from 'react';
import Polzunok from '../../../Polzunok';
import { useI18n } from '../../../../i18nContext';

type FeatureSectionProps = Record<string, any>;

const FeatureViews: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;
  const { tr } = useI18n();

  return (
    <>
                  {/* 9. Вид */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">🌅 {tr('wizard.features.view')}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { value: 'rice_fields', label: tr('wizard.features.view.riceFields'), icon: '🌾' },
                        { value: 'garden', label: tr('wizard.features.view.garden'), icon: '🌴' },
                        { value: 'pool', label: tr('wizard.features.view.pool'), icon: '💦' },
                        { value: 'ocean', label: tr('wizard.features.view.ocean'), icon: '🌊' },
                        { value: 'jungle', label: tr('wizard.features.view.jungle'), icon: '🌿' }
                      ].map(v => {
                        const isActive = selectedViews.includes(v.value);
                        return (
                          <button
                            key={v.value}
                            type="button"
                            onClick={() => toggleViewType(v.value)}
                            className={`pl pl-interactive wizard-choice-tile p-2.5 rounded-2xl text-center flex flex-col items-center justify-center gap-1 cursor-pointer select-none h-[95px] relative ${isActive
                              ? 'wizard-choice-tile--active'
                              : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                              }`}
                          >
                            {isActive && (
                              <span className="wizard-choice-check absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[7px] font-extrabold z-10 animate-scale-up">✓</span>
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

