import React from 'react';
import Polzunok from '../../../Polzunok';

type FeatureSectionProps = Record<string, any>;

const FeatureKitchen: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;

  return (
    <>
                  {/* 7. Оснащение кухни */}
                  <div className="pl p-5 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 tracking-wider block">🍳 Оснащение кухни</span>
                      <span className="text-xs font-semibold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-full animate-fade-in">
                        {kitchenType === 'equipped' ? 'Полностью оснащённая' :
                          kitchenType === 'basic' ? 'Базовая кухня' : 'Нет плиты / Без кухни'}
                      </span>
                    </div>

                    <div className="pt-2 relative">
                      <Polzunok
                        min={0}
                        max={2}
                        step={1}
                        value={
                          kitchenType === 'equipped' ? 2 :
                            kitchenType === 'basic' ? 1 : 0
                        }
                        onChange={v => {
                          if (v === 2) {
                            setKitchenType('equipped');
                          } else if (v === 1) {
                            setKitchenType('basic');
                          } else {
                            setKitchenType('none');
                          }
                        }}
                      />
                      <div className="grid grid-cols-3 text-[10.5px] text-[#1E293B] font-semibold mt-1.5 px-0.5">
                        <span className="text-left">Любая / Нет</span>
                        <span className="text-center">Базовая</span>
                        <span className="relative inline-flex items-center justify-end gap-1 text-right">
                          <span>Оснащенная</span>
                          <button
                            type="button"
                            onMouseEnter={() => setShowKitchenTooltip(true)}
                            onMouseLeave={() => setShowKitchenTooltip(false)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowKitchenTooltip(!showKitchenTooltip);
                            }}
                            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1E293B]/10 hover:bg-[#FF7A50]/20 text-[#1E293B] hover:text-[#FF7A50] text-[9.5px] font-extrabold cursor-pointer transition-colors"
                          >
                            i
                          </button>
                          {showKitchenTooltip && (
                            <span className="absolute bottom-full mb-2 right-0 w-[300px] p-3.5 bg-[#FFF1EB] text-gray-700 text-[10px] font-medium leading-relaxed rounded-xl border border-[#FF7A50]/20 shadow-xl z-50 text-left block">
                              <span className="block mb-2">
                                Кухня должна содержать всё необходимое оборудование для комфортного приготовления. Помимо базовых принадлежностей как минимум должно быть:
                              </span>
                              <span className="block">• Микроволновка</span>
                              <span className="block">• Блендер</span>
                              <span className="block">• Сковородка с антипригарным покрытием</span>
                              <span className="block">• Керамическая посуда</span>
                              <span className="block">• Морозилка</span>
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
    </>
  );
};

export default FeatureKitchen;

