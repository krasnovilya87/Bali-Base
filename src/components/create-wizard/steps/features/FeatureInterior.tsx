import React from 'react';
import Polzunok from '../../../Polzunok';
import { useI18n } from '../../../../i18nContext';

type FeatureSectionProps = Record<string, any>;

const FeatureInterior: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;
  const { tr } = useI18n();

  return (
    <>
                  {/* 2. Дизайн и интерьер */}
                  {subCategory !== 'private_room' && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">🎨 {tr('wizard.features.interior')}</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 'basic', label: tr('wizard.features.interior.basic'), icon: '🪑' },
                        { value: 'bali_style', label: tr('wizard.features.interior.baliStyle'), icon: '🎋' },
                        { value: 'modern', label: tr('wizard.features.interior.modern'), icon: '🛋️' },
                        { value: 'luxury', label: tr('wizard.features.interior.luxury'), icon: '👑' }
                      ].map(style => {
                        const isActive = interiorStyle === style.value;
                        return (
                          <button
                            key={style.value}
                            type="button"
                            onClick={() => setInteriorStyle(style.value as any)}
                            className={`pl pl-interactive p-2 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none relative overflow-hidden h-[100px] ${isActive
                              ? 'selected bg-[#FF7A50]/10 border-[#FF7A50] text-[#FF7A50] font-extrabold shadow-sm scale-102'
                              : 'bg-white border-[#E5E7EB] text-gray-650 hover:border-[#FF7A50] hover:bg-gray-50/40'
                              }`}
                          >
                            {isActive && (
                              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-[900] z-10 animate-scale-up">✓</span>
                            )}
                            <span className="text-3xl leading-none">{style.icon}</span>
                            <span className="text-xs font-sans font-extrabold leading-tight">{style.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  )}
    </>
  );
};

export default FeatureInterior;

