import React from 'react';
import { Camera, Check, Home, Key, Package, Shield, ShieldCheck, UsersRound, Waves, Wifi } from 'lucide-react';
import { useI18n } from '../../../../i18nContext';
import { getDistrictNamesFromGeoJSONSync, sortDistrictsByPopularity } from '../../../../utils/geo';
import { SCOOTER_WIZARD_CONDITION_OPTIONS } from '../../configs/scooterWizardConfig';
// @ts-ignore
import scooterConditionSprite from '../../../../assets/images/other/condition-sprites/scooter-condition-sprite.png';
// @ts-ignore
import carConditionSprite from '../../../../assets/images/other/condition-sprites/car-condition-sprite.png';
// @ts-ignore
import driverWithIcon from '../../../../assets/images/other/vehicle-parameters/car/driver-with.png';
// @ts-ignore
import driverWithoutIcon from '../../../../assets/images/other/vehicle-parameters/car/driver-without.png';
// @ts-ignore
import transmissionAutomaticIcon from '../../../../assets/images/other/vehicle-parameters/car/transmission-automatic.png';
// @ts-ignore
import transmissionManualIcon from '../../../../assets/images/other/vehicle-parameters/car/transmission-manual.png';
// @ts-ignore
import fuelGasolineIcon from '../../../../assets/images/other/vehicle-parameters/car/fuel-gasoline.png';
// @ts-ignore
import fuelDieselIcon from '../../../../assets/images/other/vehicle-parameters/car/fuel-diesel.png';
// @ts-ignore
import fuelHybridIcon from '../../../../assets/images/other/vehicle-parameters/car/fuel-hybrid.png';
// @ts-ignore
import fuelElectricIcon from '../../../../assets/images/other/vehicle-parameters/car/fuel-electric.png';
// @ts-ignore
import fuelGasIcon from '../../../../assets/images/other/vehicle-parameters/car/fuel-gas.png';
// @ts-ignore
import luggage2Icon from '../../../../assets/images/other/vehicle-parameters/car/luggage-2.svg';
// @ts-ignore
import luggage4Icon from '../../../../assets/images/other/vehicle-parameters/car/luggage-4.svg';
// @ts-ignore
import luggage6Icon from '../../../../assets/images/other/vehicle-parameters/car/luggage-6.svg';
// @ts-ignore
import luggage8Icon from '../../../../assets/images/other/vehicle-parameters/car/luggage-8.svg';

type FeatureScooterParametersProps = {
  subCategory: string;
  yearBuilt: string;
  setYearBuilt: React.Dispatch<React.SetStateAction<string>>;
  vehicleCondition: string;
  setVehicleCondition: React.Dispatch<React.SetStateAction<string>>;
  vehicleDriverOption: string;
  setVehicleDriverOption: React.Dispatch<React.SetStateAction<string>>;
  vehicleTransmission: string;
  setVehicleTransmission: React.Dispatch<React.SetStateAction<string>>;
  vehicleFuelType: string;
  setVehicleFuelType: React.Dispatch<React.SetStateAction<string>>;
  vehicleLuggageCapacity?: number;
  setVehicleLuggageCapacity: React.Dispatch<React.SetStateAction<number | undefined>>;
  keyless: boolean;
  setKeyless: React.Dispatch<React.SetStateAction<boolean>>;
  abs: boolean;
  setAbs: React.Dispatch<React.SetStateAction<boolean>>;
  airbag: boolean;
  setAirbag: React.Dispatch<React.SetStateAction<boolean>>;
  rearCamera: boolean;
  setRearCamera: React.Dispatch<React.SetStateAction<boolean>>;
  parkingSensors: boolean;
  setParkingSensors: React.Dispatch<React.SetStateAction<boolean>>;
  sunroof: boolean;
  setSunroof: React.Dispatch<React.SetStateAction<boolean>>;
  leatherInterior: boolean;
  setLeatherInterior: React.Dispatch<React.SetStateAction<boolean>>;
  childSeat: boolean;
  setChildSeat: React.Dispatch<React.SetStateAction<boolean>>;
  roofRack: boolean;
  setRoofRack: React.Dispatch<React.SetStateAction<boolean>>;
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
const imageOptionClass = 'group flex appearance-none flex-col items-center gap-1.5 border-0 bg-transparent p-0 text-center transition cursor-pointer select-none';

type ImageOptionProps = {
  label: string;
  image: string;
  isActive: boolean;
  onClick: () => void;
  compact?: boolean;
};

const ImageOption: React.FC<ImageOptionProps> = ({ label, image, isActive, onClick, compact = false }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={isActive}
    className={`${imageOptionClass} ${compact ? 'w-[136px]' : 'w-[84px]'}`}
  >
    <span className={`relative flex items-center justify-center overflow-hidden rounded-2xl border bg-white p-2 transition ${
      compact ? 'h-[74px] w-[132px]' : 'h-[76px] w-[76px]'
    } ${
      isActive
        ? 'selected border-[#FF7A50] bg-[#FFF8F5] shadow-[0_9px_18px_rgba(255,122,80,0.13)]'
        : 'border-[#E5E7EB] group-hover:border-[#FF7A50]/55'
    }`}>
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-contain"
      />
      {isActive && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7A50] text-white ring-2 ring-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
    </span>
    <span className="w-full text-[10.5px] font-normal leading-tight text-[#1E293B] sm:text-xs">
      {label}
    </span>
  </button>
);

const FeatureScooterParameters: React.FC<FeatureScooterParametersProps> = ({
  subCategory,
  yearBuilt,
  setYearBuilt,
  vehicleCondition,
  setVehicleCondition,
  vehicleDriverOption,
  setVehicleDriverOption,
  vehicleTransmission,
  setVehicleTransmission,
  vehicleFuelType,
  setVehicleFuelType,
  vehicleLuggageCapacity,
  setVehicleLuggageCapacity,
  keyless,
  setKeyless,
  abs,
  setAbs,
  airbag,
  setAirbag,
  rearCamera,
  setRearCamera,
  parkingSensors,
  setParkingSensors,
  sunroof,
  setSunroof,
  leatherInterior,
  setLeatherInterior,
  childSeat,
  setChildSeat,
  roofRack,
  setRoofRack,
  surfRack,
  setSurfRack,
  insurance,
  setInsurance,
  freeDeliveryDistricts,
  toggleFreeDeliveryDistrict
}) => {
  const { tr } = useI18n();
  const currentYear = new Date().getFullYear();
  const isCar = subCategory === 'cars';
  const districtOptions = sortDistrictsByPopularity(getDistrictNamesFromGeoJSONSync());
  const yearOptions = Array.from({ length: 7 }, (_, index) => String(currentYear - index));
  const oldestYear = currentYear - 7;
  const selectedYearNumber = Number(yearBuilt);
  const isOldestYearSelected = yearBuilt === 'other' || (
    Number.isFinite(selectedYearNumber) && selectedYearNumber <= oldestYear
  );
  const conditionSprite = subCategory === 'cars' ? carConditionSprite : scooterConditionSprite;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-3">
        <span className={fieldTitleClass}>{tr('filters.transport.year')}</span>
        <div className="grid grid-cols-8 gap-1">
          {yearOptions.map(value => {
            const isActive = yearBuilt === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setYearBuilt(value)}
                aria-pressed={isActive}
                className={`pl pl-interactive min-w-0 rounded-full border px-1 py-2 text-[11px] font-normal leading-none transition cursor-pointer select-none sm:text-xs ${
                  isActive ? `selected ${activePillClass}` : inactivePillClass
                }`}
              >
                {value}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setYearBuilt('other')}
            aria-pressed={isOldestYearSelected}
            className={`pl pl-interactive min-w-0 rounded-full border px-1 py-2 text-[11px] font-normal leading-none transition cursor-pointer select-none sm:text-xs ${
              isOldestYearSelected ? `selected ${activePillClass}` : inactivePillClass
            }`}
          >
            {oldestYear}−
          </button>
        </div>
      </div>

      {isCar && (
        <>
          <div className="space-y-3">
            <span className={fieldTitleClass}>{tr('filters.transport.driver')}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-3">
              <ImageOption
                label={tr('filters.transport.driver.with_driver')}
                image={driverWithIcon}
                isActive={vehicleDriverOption === 'with_driver'}
                onClick={() => setVehicleDriverOption('with_driver')}
              />
              <ImageOption
                label={tr('filters.transport.driver.without_driver')}
                image={driverWithoutIcon}
                isActive={vehicleDriverOption === 'without_driver'}
                onClick={() => setVehicleDriverOption('without_driver')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
            <div className="space-y-3">
              <span className={fieldTitleClass}>{tr('filters.transport.transmission')}</span>
              <div className="flex flex-wrap gap-x-3 gap-y-3">
                <ImageOption
                  label={tr('filters.transport.transmission.automatic')}
                  image={transmissionAutomaticIcon}
                  isActive={vehicleTransmission === 'automatic'}
                  onClick={() => setVehicleTransmission('automatic')}
                />
                <ImageOption
                  label={tr('filters.transport.transmission.manual')}
                  image={transmissionManualIcon}
                  isActive={vehicleTransmission === 'manual'}
                  onClick={() => setVehicleTransmission('manual')}
                />
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              <span className={fieldTitleClass}>{tr('filters.transport.fuel')}</span>
              <div className="flex flex-wrap gap-x-3 gap-y-3">
                {[
                  ['gasoline', fuelGasolineIcon],
                  ['diesel', fuelDieselIcon],
                  ['hybrid', fuelHybridIcon],
                  ['electric', fuelElectricIcon],
                  ['gas', fuelGasIcon]
                ].map(([value, image]) => (
                  <ImageOption
                    key={value}
                    label={tr(`filters.transport.fuel.${value}`)}
                    image={image}
                    isActive={vehicleFuelType === value}
                    onClick={() => setVehicleFuelType(value)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className={fieldTitleClass}>{tr('filters.transport.luggageCapacity')}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-3">
              {([ 
                [2, luggage2Icon],
                [4, luggage4Icon],
                [6, luggage6Icon],
                [8, luggage8Icon]
              ] as const).map(([value, image]) => (
                <ImageOption
                  key={value}
                  label={tr('filters.transport.luggageCapacityValue', { count: value })}
                  image={image}
                  isActive={vehicleLuggageCapacity === value}
                  onClick={() => setVehicleLuggageCapacity(Number(value))}
                  compact
                />
              ))}
            </div>
          </div>
        </>
      )}

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
                    backgroundImage: `url(${conditionSprite})`,
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
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {(isCar ? [
            { key: 'abs', labelKey: 'filters.transport.features.abs', Icon: ShieldCheck, active: abs, toggle: setAbs },
            { key: 'airbag', labelKey: 'filters.transport.features.airbag', Icon: Shield, active: airbag, toggle: setAirbag },
            { key: 'rearCamera', labelKey: 'filters.transport.features.rearCamera', Icon: Camera, active: rearCamera, toggle: setRearCamera },
            { key: 'parkingSensors', labelKey: 'filters.transport.features.parkingSensors', Icon: Wifi, active: parkingSensors, toggle: setParkingSensors },
            { key: 'sunroof', labelKey: 'filters.transport.features.sunroof', Icon: Home, active: sunroof, toggle: setSunroof },
            { key: 'leatherInterior', labelKey: 'filters.transport.features.leatherInterior', Icon: Package, active: leatherInterior, toggle: setLeatherInterior },
            { key: 'childSeat', labelKey: 'filters.transport.features.childSeat', Icon: UsersRound, active: childSeat, toggle: setChildSeat },
            { key: 'roofRack', labelKey: 'filters.transport.features.roofRack', Icon: Package, active: roofRack, toggle: setRoofRack },
            { key: 'insurance', labelKey: 'filters.transport.features.insurance', Icon: Shield, active: insurance, toggle: setInsurance }
          ] : [
            { key: 'keyless', labelKey: 'filters.transport.features.keyless', Icon: Key, active: keyless, toggle: setKeyless },
            { key: 'abs', labelKey: 'filters.transport.features.abs', Icon: ShieldCheck, active: abs, toggle: setAbs },
            { key: 'surfRack', labelKey: 'filters.transport.features.surfRack', Icon: Waves, active: surfRack, toggle: setSurfRack },
            { key: 'insurance', labelKey: 'filters.transport.features.insurance', Icon: Shield, active: insurance, toggle: setInsurance }
          ]).map(({ key, labelKey, Icon, active, toggle }) => (
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
