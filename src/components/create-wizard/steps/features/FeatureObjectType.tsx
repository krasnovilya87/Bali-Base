import React from 'react';
import Polzunok from '../../../Polzunok';

type FeatureSectionProps = Record<string, any>;

const FeatureObjectType: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;

  return (
    <>
                  {/* 3. Тип объекта */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">🏘️ Тип объекта</span>
                    <div className={`grid gap-3 ${subCategory === 'private_room' ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-3'}`}>
                      {subCategory === 'private_room' ? (
                        [
                          { value: 'Guesthouse (privet room, shared property)', label: 'Guesthouse', icon: '🌴' },
                          { value: 'Home stay (Host on-site)', label: 'Homestay', icon: '🏠' },
                          { value: 'Hotel (privet room)', label: 'Hotel', icon: '🏨' },
                          { value: 'Bungalow (standalone unit)', label: 'Bungalow', icon: '🛖' },
                          { value: 'Villa / House (privet room)', label: 'Вилла, Дом', icon: '🏘️' },
                          { value: 'Apartment (privet room)', label: 'Апартаменты', icon: '🏢' }
                        ].map(t => {
                          const isActive = housingType === t.value;
                          return (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setHousingType(t.value)}
                              className={`pl pl-interactive p-3 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer relative min-h-[105px] ${isActive
                                ? 'selected bg-[#FF7A50]/10 border-[#FF7A50] text-[#FF7A50] font-extrabold shadow-sm scale-102'
                                : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                                }`}
                            >
                              {isActive && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                              )}
                              <span className="text-3xl leading-none">{t.icon}</span>
                              <span className="text-xs font-sans font-extrabold mt-1">{t.label}</span>
                            </button>
                          );
                        })
                      ) : subCategory === 'private_suite' ? (
                        [
                          { value: 'Apartment Complex (privet unit)', label: 'Апартаменты', icon: '🏢' }
                        ].map(t => {
                          const isActive = housingType === t.value;
                          return (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setHousingType(t.value)}
                              className={`pl pl-interactive p-3 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer relative min-h-[105px] ${isActive
                                ? 'selected bg-[#FF7A50]/10 border-[#FF7A50] text-[#FF7A50] font-extrabold shadow-sm scale-102'
                                : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                                }`}
                            >
                              {isActive && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                              )}
                              <span className="text-3xl leading-none">{t.icon}</span>
                              <span className="text-xs font-sans font-extrabold mt-1">{t.label}</span>
                            </button>
                          );
                        })
                      ) : (
                        [
                          { value: 'Privet Villa (must pool)', label: 'Вилла', icon: '🏘️' },
                          { value: 'House (no pool)', label: 'Дом', icon: '🏡' },
                          { value: 'Bungalow (standalone unit)', label: 'Бунгало', icon: '🛖' }
                        ].map(t => {
                          const isActive = housingType === t.value;
                          return (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setHousingType(t.value)}
                              className={`pl pl-interactive p-3 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer relative min-h-[105px] ${isActive
                                ? 'selected bg-[#FF7A50]/10 border-[#FF7A50] text-[#FF7A50] font-extrabold shadow-sm scale-102'
                                : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                                }`}
                            >
                              {isActive && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                              )}
                              <span className="text-3xl leading-none">{t.icon}</span>
                              <span className="text-xs font-sans font-extrabold mt-1">{t.label}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
    </>
  );
};

export default FeatureObjectType;

