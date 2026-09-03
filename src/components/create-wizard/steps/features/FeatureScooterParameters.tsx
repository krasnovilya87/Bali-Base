import React from 'react';
import { Check, ChevronDown, Key, Shield, ShieldCheck, Waves } from 'lucide-react';
import { useI18n } from '../../../../i18nContext';
import { getDistrictNamesFromGeoJSONSync, sortDistrictsByPopularity } from '../../../../utils/geo';
import {
  SCOOTER_WIZARD_CONDITION_OPTIONS,
  getScooterWizardYearOptions
} from '../../configs/scooterWizardConfig';
// @ts-ignore
import scooterConditionSprite from '../../../../assets/images/scooter-condition-sprite.png';

type FeatureScooterParametersProps = {
  yearBuilt: string;
  setYearBuilt: React.Dispatch<React.SetStateAction<string>>;
  vehicleCondition: string;
  setVehicleCondition: React.Dispatch<React.SetStateAction<string>>;
  keyless: boolean;
  setKeyless: React.Dispatch<React.SetStateAction<boolean>>;
  abs: boolean;
  setAbs: React.Dispatch<React.SetStateAction<boolean>>;
  surfRack: boolean;
  setSurfRack: React.Dispatch<React.SetStateAction<boolean>>;
  insurance: boolean;
  setInsurance: React.Dispatch<React.SetStateAction<boolean>>;
  freeDeliveryDistricts: string[];
  toggleFreeDeliveryDistrict: (district: string) => void;
};

const fieldTitleClass = 'text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1';
const pillClass = 'pl pl-interactive transport-pill inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer select-none';
const activePillClass = 'border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]';
const inactivePillClass = 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]';

const FeatureScooterParameters: React.FC<FeatureScooterParametersProps> = ({
  yearBuilt,
  setYearBuilt,
  vehicleCondition,
  setVehicleCondition,
  keyless,
  setKeyless,
  abs,
  setAbs,
  surfRack,
  setSurfRack,
  insurance,
  setInsurance,
  freeDeliveryDistricts,
  toggleFreeDeliveryDistrict
}) => {
  const { tr } = useI18n();
  const currentYear = new Date().getFullYear();
  const districtOptions = sortDistrictsByPopularity(getDistrictNamesFromGeoJSONSync());
  const yearOptions = getScooterWizardYearOptions(currentYear);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-2">
        <span className={fieldTitleClass}>{tr('filters.transport.year')}</span>
        <div className="relative">
          <select
            value={yearBuilt}
            onChange={event => setYearBuilt(event.target.value)}
            className="w-full appearance-none rounded-2xl border-0 bg-white px-4 py-3 pr-10 text-xs font-extrabold text-[#1E293B] focus:outline-none focus:ring-0"
          >
            <option value="">{tr('wizard.features.year.select')}</option>
            {yearOptions.map(value => (
              <option key={value} value={value}>
                {value === 'other' ? tr('wizard.features.year.other') : value}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
        </div>
      </div>

      <div className="space-y-3">
        <span className={fieldTitleClass}>{tr('filters.transport.condition')}</span>
        <div className="grid grid-cols-3 gap-2.5">
          {SCOOTER_WIZARD_CONDITION_OPTIONS.map((condition, index) => {
            const isActive = vehicleCondition === condition;
            const conditionLabel = tr(`filters.transport.condition.${condition}`);
            return (
              <button
                key={condition}
                type="button"
                aria-label={conditionLabel}
                title={conditionLabel}
                aria-pressed={isActive}
                onClick={() => setVehicleCondition(condition)}
                className={`pl pl-interactive relative aspect-square overflow-hidden rounded-2xl border transition cursor-pointer select-none ${
                  isActive
                    ? 'border-[#FF7A50] ring-4 ring-[#FF7A50]/18 shadow-[0_12px_24px_rgba(255,122,80,0.18)]'
                    : 'border-white ring-1 ring-[#1E293B]/10 hover:ring-[#FF7A50]/45'
                }`}
              >
                <span
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 hover:scale-105"
                  style={{
                    backgroundImage: `url(${scooterConditionSprite})`,
                    backgroundSize: '300% 100%',
                    backgroundPosition: `${index * 50}% center`
                  }}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-[#1E293B]/20 via-transparent to-white/5" />
                <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] rounded-full bg-white/88 px-2.5 py-1 text-[10px] font-extrabold leading-tight text-[#1E293B] shadow-[0_8px_18px_rgba(15,23,42,0.14)] backdrop-blur-md">
                  {conditionLabel}
                </span>
                {isActive && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7A50] text-white ring-2 ring-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <span className={fieldTitleClass}>{tr('wizard.transport.freeDeliveryDistricts')}</span>
        <div className="flex flex-wrap gap-2">
          {districtOptions.map(districtName => {
            const isActive = freeDeliveryDistricts.includes(districtName);
            return (
              <button
                key={districtName}
                type="button"
                onClick={() => toggleFreeDeliveryDistrict(districtName)}
                aria-pressed={isActive}
                className={`${pillClass} ${isActive ? `selected ${activePillClass}` : inactivePillClass}`}
              >
                {districtName}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <span className={fieldTitleClass}>{tr('filters.transport.features')}</span>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { key: 'keyless', labelKey: 'filters.transport.features.keyless', Icon: Key, active: keyless, toggle: setKeyless },
            { key: 'abs', labelKey: 'filters.transport.features.abs', Icon: ShieldCheck, active: abs, toggle: setAbs },
            { key: 'surfRack', labelKey: 'filters.transport.features.surfRack', Icon: Waves, active: surfRack, toggle: setSurfRack },
            { key: 'insurance', labelKey: 'filters.transport.features.insurance', Icon: Shield, active: insurance, toggle: setInsurance }
          ].map(({ key, labelKey, Icon, active, toggle }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggle(current => !current)}
              aria-pressed={active}
              className={`pl pl-interactive rounded-2xl border p-3 transition cursor-pointer select-none flex items-center justify-between gap-2 text-left ${
                active
                  ? 'selected border-[#FF7A50] bg-[#FF7A50]/12 shadow-[0_10px_22px_rgba(255,122,80,0.12)]'
                  : 'border-[#E5E7EB] bg-white hover:border-[#FF7A50]/60'
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#FF7A50]' : 'text-[#64748B]'}`} />
                <span className="truncate text-xs font-extrabold text-[#1E293B] leading-tight">
                  {tr(labelKey)}
                </span>
              </span>
              <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${active ? 'bg-[#FF7A50]' : 'bg-[#CBD5E1]'}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureScooterParameters;
