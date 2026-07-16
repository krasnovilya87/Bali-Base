import React from 'react';
import Polzunok from '../../../Polzunok';

type FeatureSectionProps = Record<string, any>;

const FeaturePool: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;
  const sliderValue =
    poolType === 'none' ? 0 :
      (poolType === 'shared' || (poolType === 'infinity' && (territoryType === 'shared' || territoryType === 'resort'))) ? 1 : 2;
  const sliderBadgeText = sliderValue === 0 ? 'Любой / Нет' : sliderValue === 1 ? 'Общий' : 'Частный';

  return (
    <>
                  {/* 8. Бассейн */}
                  <div className="pl p-5 rounded-3xl space-y-4 font-sans">
                    <div className="flex justify-between items-center text-left">
                      <span className="text-xs font-bold text-gray-500 tracking-wider block">💦 Бассейн</span>
                      <span className="text-xs font-semibold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-full animate-fade-in">
                        {sliderBadgeText}
                      </span>
                    </div>

                    <div className="pt-2 relative">
                      <Polzunok
                        min={0}
                        max={2}
                        step={1}
                        value={sliderValue}
                        onChange={v => {
                          const hasInfinity = poolType === 'infinity';
                          if (v === 2) {
                            setPoolType(hasInfinity ? 'infinity' : 'private');
                            setTerritoryType('private');
                          } else if (v === 1) {
                            setPoolType(hasInfinity ? 'infinity' : 'shared');
                            setTerritoryType('shared');
                          } else {
                            setPoolType('none');
                          }
                        }}
                      />
                      <div className="grid grid-cols-3 text-[10.5px] text-[#1E293B] font-semibold mt-1.5 px-0.5">
                        <span className="text-left">Любой / Нет</span>
                        <span className="text-center">Общий</span>
                        <span className="text-right">Частный</span>
                      </div>
                    </div>

                    {/* Infinity check option */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const hasInfinity = poolType === 'infinity';
                          if (hasInfinity) {
                            if (territoryType === 'shared' || territoryType === 'resort') {
                              setPoolType('shared');
                            } else {
                              setPoolType('private');
                            }
                          } else {
                            setPoolType('infinity');
                            // Always make the slider slide to shared (position 1) when clicked as requested
                            setTerritoryType('shared');
                          }
                        }}
                        className="pl pl-muted-option pl-interactive p-3 rounded-2xl w-full flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">🌅</span>
                          <span className="text-xs font-semibold text-[#1E293B]">Бассейн инфинити</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${poolType === 'infinity'
                          ? 'border-[#FF7A50] bg-[#FF7A50] text-white'
                          : 'border-[#E5E7EB] bg-white'
                          }`}>
                          {poolType === 'infinity' && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                      </button>
                    </div>
                  </div>
    </>
  );
};

export default FeaturePool;

