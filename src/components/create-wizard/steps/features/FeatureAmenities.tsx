import React from 'react';
import Polzunok from '../../../Polzunok';
import { useI18n } from '../../../../i18nContext';

type FeatureSectionProps = Record<string, any>;

const FeatureAmenities: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;
  const { tr } = useI18n();
  const roomOnlyAmenities = subCategory === 'private_room'
    ? [
      { value: 'room_fridge', label: tr('wizard.features.amenities.roomFridge'), icon: '🧊', type: 'amenity' },
      { value: 'water_cooler', label: tr('wizard.features.amenities.waterCooler'), icon: '💧', type: 'amenity' }
    ]
    : [];

  return (
    <>
                  {/* 12. Удобства и Комфорт */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">🛋️ {tr('wizard.features.amenities')}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { value: 'cold_AC', label: tr('wizard.features.amenities.ac'), icon: '🥶', type: 'amenity' },
                        { value: 'hair_dryer', label: tr('wizard.features.amenities.hairDryer'), icon: '💨', type: 'amenity' },
                        { value: 'washing_machine', label: tr('wizard.features.amenities.washingMachine'), icon: '👕', type: 'amenity' },
                        { value: 'smart_tv', label: 'Smart TV', icon: '📺', type: 'amenity' },
                        { value: 'workspace', label: tr('wizard.features.amenities.workspace'), icon: '💻', type: 'amenity' },
                        { value: 'yoga', label: tr('wizard.features.amenities.yoga'), icon: '🧘', type: 'amenity' },
                        ...roomOnlyAmenities,
                        { value: 'Без плесени и запаха', label: tr('wizard.features.amenities.noMold'), icon: '🧼', type: 'cleanliness' },
                        { value: 'Идеальная сантехника', label: tr('wizard.features.amenities.goodPlumbing'), icon: '🚿', type: 'cleanliness' },
                        { value: 'parking', label: tr('wizard.features.amenities.parking'), icon: '🚗', type: 'amenity' }
                      ].map(item => {
                        const isActive = item.type === 'cleanliness'
                          ? cleanlinessTags.includes(item.value)
                          : amenities.includes(item.value);

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              if (item.type === 'cleanliness') {
                                toggleCleanlinessTag(item.value);
                              } else {
                                toggleAmenity(item.value);
                              }
                            }}
                            className={`pl pl-interactive p-3 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none relative min-h-[90px] ${isActive
                              ? 'selected bg-[#FF7A50]/15 border-[#FF7A50] text-[#FF7A50] font-extrabold shadow-sm scale-102'
                              : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                              }`}
                          >
                            {isActive && (
                              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                            )}
                            <span className="text-2xl leading-none">{item.icon}</span>
                            <span className="text-xs font-sans font-extrabold mt-1 leading-tight">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
    </>
  );
};

export default FeatureAmenities;

