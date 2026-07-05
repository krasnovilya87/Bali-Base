import React from 'react';
import Polzunok from '../../../Polzunok';

type FeatureSectionProps = Record<string, any>;

const FeaturePreferences: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;

  return (
    <>
                  {/* 14. Особые преференции */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">🐾 Особые преференции</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {[
                        { value: 'pets_allowed', label: 'С питомцами', icon: '🐾' },
                        { value: 'quiet_location', label: 'Тишина', icon: '🔕' },
                        { value: 'all_bills_included', label: 'Bills включены', icon: '⚡' },
                        { value: 'airport_transfer_included', label: 'Трансфер включен', icon: '✈️' },
                        { value: 'airport_transfer_paid', label: 'Трансфер за доп плату', icon: '🚕' },
                        { value: 'breakfast_included', label: 'Завтрак включен', icon: '☕' },
                        { value: 'breakfast_paid', label: 'Завтрак за доп плату', icon: '🥐' },
                      ].map(opt => {
                        const isActive = extraOptions.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleExtraOption(opt.value)}
                            className={`pl pl-interactive w-full p-4 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none relative overflow-hidden h-[105px] ${isActive
                              ? 'selected bg-[#FF7A50]/15 border-[#FF7A50] text-[#FF7A50] font-extrabold scale-102 font-sans shadow-sm'
                              : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                              }`}
                          >
                            {isActive && (
                              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
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

