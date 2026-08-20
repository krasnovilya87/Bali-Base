import React from 'react';
import Polzunok from '../../../Polzunok';
import { useI18n } from '../../../../i18nContext';

type FeatureSectionProps = Record<string, any>;

const FeatureDensity: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;
  const { tr } = useI18n();

  return (
    <>
                  {/* 4. Плотность комплекса (только для апартаментов / комнат) */}
                  {(subCategory === 'private_suite' || subCategory === 'private_room') && (
                    <div className="space-y-3">
                      <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">🍀 {tr('wizard.features.density')}</span>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'cozy', label: tr('wizard.features.density.cozy'), desc: tr('wizard.features.density.cozyDesc'), icon: '🍃' },
                          { value: 'medium', label: tr('wizard.features.density.medium'), desc: tr('wizard.features.density.mediumDesc'), icon: '🍀' },
                          { value: 'large', label: tr('wizard.features.density.large'), desc: tr('wizard.features.density.largeDesc'), icon: '🌿' }
                        ].map(density => {
                          const isActive = densityType === density.value;
                          return (
                            <button
                              key={density.value}
                              type="button"
                              onClick={() => setDensityType(density.value as any)}
                              className={`pl pl-interactive p-3.5 rounded-2xl text-center flex flex-col items-center justify-center gap-1 cursor-pointer select-none relative overflow-hidden min-h-[110px] ${isActive
                                ? 'selected bg-[#FF7A50]/15 border-[#FF7A50] text-[#FF7A50] font-bold shadow-xs scale-102'
                                : 'bg-white border-[#E5E7EB] text-gray-600 hover:border-[#FF7A50] hover:bg-white'
                                }`}
                            >
                              {isActive && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                              )}
                              <span className="text-3xl leading-none">{density.icon}</span>
                              <span className="text-xs font-sans font-extrabold mt-1">{density.label}</span>
                              <span className="text-[9px] text-gray-400 font-semibold font-sans mt-0.5 leading-none">{density.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
    </>
  );
};

export default FeatureDensity;

