import React from 'react';
import Polzunok from '../../../Polzunok';
import { useI18n } from '../../../../i18nContext';

type FeatureSectionProps = Record<string, any>;

const FeaturePreferences: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;
  const { tr } = useI18n();

  return (
    <>
                  {/* 14. Особые преференции */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">🐾 {tr('wizard.features.preferences')}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {[
                        { value: 'pets_allowed', label: tr('wizard.features.preferences.pets'), icon: '🐾' },
                        { value: 'quiet_location', label: tr('wizard.features.preferences.quiet'), icon: '🔕' },
                        { value: 'all_bills_included', label: tr('wizard.features.preferences.bills'), icon: '⚡' },
                        { value: 'airport_transfer_included', label: tr('wizard.features.preferences.transferIncluded'), icon: '✈️' },
                        { value: 'airport_transfer_paid', label: tr('wizard.features.preferences.transferPaid'), icon: '🚕' },
                        { value: 'breakfast_included', label: tr('wizard.features.preferences.breakfastIncluded'), icon: '☕' },
                        { value: 'breakfast_paid', label: tr('wizard.features.preferences.breakfastPaid'), icon: '🥐' },
                      ].map(opt => {
                        const isActive = extraOptions.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleExtraOption(opt.value)}
                            className={`pl pl-interactive wizard-choice-tile w-full p-4 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none relative overflow-hidden h-[105px] ${isActive
                              ? 'wizard-choice-tile--active'
                              : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                              }`}
                          >
                            {isActive && (
                              <span className="wizard-choice-check absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                            )}
                            <span className="text-3xl leading-none">{opt.icon}</span>
                            <span className="text-xs font-extrabold font-sans leading-tight mt-0.5">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
    </>
  );
};

export default FeaturePreferences;

