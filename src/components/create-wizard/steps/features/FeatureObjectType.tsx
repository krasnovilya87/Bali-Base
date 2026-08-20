import React from 'react';
import { useI18n } from '../../../../i18nContext';

type FeatureSectionProps = Record<string, any>;

const FeatureObjectType: React.FC<FeatureSectionProps> = (props) => {
  const {
    subCategory,
    housingType,
    setHousingType
  } = props;
  const { tr } = useI18n();

  const renderTypeButton = (type: { value: string; label: string; icon: string }) => {
    const isActive = housingType === type.value;
    return (
      <button
        key={type.value}
        type="button"
        onClick={() => setHousingType(type.value)}
        className={`pl pl-interactive p-3 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer relative min-h-[105px] ${isActive
          ? 'selected bg-[#FF7A50]/10 border-[#FF7A50] text-[#FF7A50] font-extrabold shadow-sm scale-102'
          : 'bg-white border-[#E5E7EB] text-gray-655 hover:border-[#FF7A50]'
        }`}
      >
        {isActive && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7A50] text-white flex items-center justify-center text-[8px] font-extrabold z-10 animate-scale-up">✓</span>
        )}
        <span className="text-3xl leading-none">{type.icon}</span>
        <span className="text-xs font-sans font-extrabold mt-1">{type.label}</span>
      </button>
    );
  };

  const typeOptions = subCategory === 'private_room'
    ? [
      { value: 'Guesthouse (privet room, shared property)', label: 'Guesthouse', icon: '🌴' },
      { value: 'Home stay (Host on-site)', label: 'Homestay', icon: '🏠' },
      { value: 'Hotel (privet room)', label: 'Hotel', icon: '🏨' },
      { value: 'Bungalow (standalone unit)', label: 'Bungalow', icon: '🛖' },
      { value: 'Villa / House (privet room)', label: tr('wizard.features.objectType.villaHouse'), icon: '🏘️' },
      { value: 'Apartment (privet room)', label: tr('wizard.features.objectType.apartments'), icon: '🏢' }
    ]
    : subCategory === 'private_suite'
      ? [
        { value: 'Apartment Complex (privet unit)', label: tr('wizard.features.objectType.apartments'), icon: '🏢' }
      ]
      : [
        { value: 'Privet Villa (must pool)', label: tr('wizard.features.objectType.villa'), icon: '🏘️' },
        { value: 'House (no pool)', label: tr('wizard.features.objectType.house'), icon: '🏡' },
        { value: 'Bungalow (standalone unit)', label: tr('wizard.features.objectType.bungalow'), icon: '🛖' }
      ];

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">🏘️ {tr('wizard.features.objectType')}</span>
      <div className={`grid gap-3 ${subCategory === 'private_room' ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-3'}`}>
        {typeOptions.map(renderTypeButton)}
      </div>
    </div>
  );
};

export default FeatureObjectType;
