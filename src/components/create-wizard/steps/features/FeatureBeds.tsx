import React from 'react';
import Polzunok from '../../../Polzunok';

type FeatureSectionProps = Record<string, any>;

const FeatureBeds: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;

  return (
    <>
                  {/* 6. Конфигурация кроватей */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">🛌 Конфигурация кроватей</span>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'queen_size', label: 'Queen size', icon: '🛏️', section: 'Спальня' },
                        { value: 'king_size', label: 'King size', icon: '👑', section: 'Спальня' },
                        ...(subCategory === 'private_room' ? [] : [
                          { value: 'single_1', label: '1 односпальная', icon: '🧸', section: 'Детская' },
                          { value: 'single_2', label: '2 односпальные', icon: '🛌', section: 'Детская' }
                        ])
                      ].map(bed => {
                        const isActive = selectedBedTypes.includes(bed.value);
                        const maxBeds = subCategory === 'private_room' ? 1 : Math.max(1, roomsTotal);
                        const isLimitReached = !isActive && selectedBedTypes.length >= maxBeds;
                        return (
                          <button
                            key={bed.value}
                            type="button"
                            onClick={() => {
                              if (isActive) {
                                setSelectedBedTypes(current => current.filter(value => value !== bed.value));
                              } else if (!isLimitReached) {
                                setSelectedBedTypes(current => [...current, bed.value]);
                              }
                            }}
                            title={isLimitReached ? `Можно выбрать не больше ${maxBeds}` : undefined}
                            className={`pl pl-interactive p-4 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer min-h-[120px] relative ${isActive
                              ? 'selected bg-[#FF7A50]/15 border-[#FF7A50] text-[#FF7A50] font-extrabold shadow-sm scale-102'
                              : isLimitReached
                                ? 'bg-white border-[#E5E7EB] text-gray-300 opacity-50 cursor-not-allowed'
                                : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
                              }`}
                          >
                            {isActive && (
                              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
                            )}
                            <span className="text-[9px] font-bold text-gray-400 leading-none">{bed.section}</span>
                            <span className="text-3xl leading-none my-0.5">{bed.icon}</span>
                            <span className="text-xs font-sans font-bold leading-tight">{bed.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
    </>
  );
};

export default FeatureBeds;

