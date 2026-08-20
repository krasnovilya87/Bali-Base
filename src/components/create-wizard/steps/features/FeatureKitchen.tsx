import React from 'react';
import Polzunok from '../../../Polzunok';
import { useI18n } from '../../../../i18nContext';

type FeatureSectionProps = Record<string, any>;

const FeatureKitchen: React.FC<FeatureSectionProps> = (props) => {
  const { category, subCategory, yearBuilt, recentYears, setYearBuilt, area, setArea, roomsTotal, setRoomsTotal, interiorStyle, setInteriorStyle, housingType, setHousingType, densityType, setDensityType, territoryType, setTerritoryType, selectedBedTypes, setSelectedBedTypes, kitchenType, setKitchenType, showKitchenTooltip, setShowKitchenTooltip, poolType, setPoolType, selectedViews, toggleViewType, internetSpeed, setInternetSpeed, bathroomOptions, toggleBathroomOption, cleanlinessTags, amenities, toggleCleanlinessTag, toggleAmenity, cleaningFrequency, setCleaningFrequency, extraOptions, toggleExtraOption } = props;
  const { tr } = useI18n();
  const kitchenOptions = [
    { value: 'none', label: tr('wizard.features.kitchen.none'), tick: tr('wizard.features.kitchen.any') },
    { value: 'basic', label: tr('wizard.features.kitchen.basic'), tick: tr('wizard.features.kitchen.basicShort') },
    { value: 'equipped', label: tr('wizard.features.kitchen.equipped'), tick: tr('wizard.features.kitchen.equippedShort') }
  ] as const;
  const hasPrivateKitchen = kitchenType === 'private_basic' || kitchenType === 'private_equipped';
  const baseKitchenType = kitchenType === 'private_basic' ? 'basic' : kitchenType === 'private_equipped' ? 'equipped' : kitchenType;
  const selectedKitchenIndex = Math.max(0, kitchenOptions.findIndex(option => option.value === baseKitchenType));
  const selectedKitchenLabel = hasPrivateKitchen && baseKitchenType !== 'none'
    ? tr('wizard.features.kitchen.privateLabel', { label: kitchenOptions[selectedKitchenIndex].label })
    : kitchenOptions[selectedKitchenIndex].label;

  return (
    <>
      {/* 7. Оснащение кухни */}
      <div className="pl p-5 rounded-3xl space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-500 tracking-wider block">🍳 {tr('wizard.features.kitchen')}</span>
          <span className="text-xs font-semibold text-[#FF7A50] bg-[#FF7A50]/10 px-2.5 py-1 rounded-full animate-fade-in">
            {selectedKitchenLabel}
          </span>
        </div>

        <div className="pt-2 relative">
          <Polzunok
            min={0}
            max={2}
            step={1}
            value={selectedKitchenIndex}
            onChange={v => {
              const nextBaseKitchenType = kitchenOptions[v]?.value || 'none';

              if (nextBaseKitchenType === 'none') {
                setKitchenType('none');
              } else if (hasPrivateKitchen) {
                setKitchenType(nextBaseKitchenType === 'equipped' ? 'private_equipped' : 'private_basic');
              } else {
                setKitchenType(nextBaseKitchenType);
              }
            }}
          />
          <div className="grid grid-cols-3 text-[10.5px] text-[#1E293B] font-semibold mt-1.5 px-0.5">
            {kitchenOptions.map((option, index) => (
              <span
                key={option.value}
                className={index === 0 ? 'text-left' : index === kitchenOptions.length - 1 ? 'text-right relative' : 'text-center'}
              >
                {option.value === 'equipped' ? (
                  <span className="inline-flex items-center justify-end gap-1">
                    <span>{option.tick}</span>
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
                          {tr('wizard.features.kitchen.tooltip')}
                        </span>
                        <span className="block">• {tr('wizard.features.kitchen.microwave')}</span>
                        <span className="block">• {tr('wizard.features.kitchen.blender')}</span>
                        <span className="block">• {tr('wizard.features.kitchen.nonstickPan')}</span>
                        <span className="block">• {tr('wizard.features.kitchen.ceramicDishes')}</span>
                        <span className="block">• {tr('wizard.features.kitchen.freezer')}</span>
                      </span>
                    )}
                  </span>
                ) : option.tick}
              </span>
            ))}
          </div>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => {
                if (hasPrivateKitchen) {
                  setKitchenType(baseKitchenType === 'equipped' ? 'equipped' : 'basic');
                } else if (baseKitchenType === 'equipped') {
                  setKitchenType('private_equipped');
                } else {
                  setKitchenType('private_basic');
                }
              }}
              className="pl pl-muted-option pl-interactive p-3 rounded-2xl w-full flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🍽️</span>
                <span className="text-xs font-semibold text-[#1E293B]">{tr('wizard.features.kitchen.private')}</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${hasPrivateKitchen
                ? 'border-[#FF7A50] bg-[#FF7A50] text-white'
                : 'border-[#E5E7EB] bg-white'
                }`}>
                {hasPrivateKitchen && <span className="text-[10px] font-bold">✓</span>}
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeatureKitchen;
