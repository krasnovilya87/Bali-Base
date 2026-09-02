import React from 'react';
import { Check } from 'lucide-react';
import { useI18n } from '../../../../i18nContext';
import {
  SCOOTER_WIZARD_COLOR_OPTIONS,
  SCOOTER_WIZARD_COLOR_SWATCHES,
  SCOOTER_WIZARD_MODEL_OPTIONS,
  getScooterModelDescription
} from '../../configs/scooterWizardConfig';

type FeatureScooterDetailsProps = {
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  isGeneratedScooterDescription: (value: string) => boolean;
  vehicleModel: string;
  setVehicleModel: React.Dispatch<React.SetStateAction<string>>;
  vehicleModelQuantity?: number;
  setVehicleModelQuantity: React.Dispatch<React.SetStateAction<number | undefined>>;
  vehicleColor: string;
  setVehicleColor: React.Dispatch<React.SetStateAction<string>>;
};

const fieldTitleClass = 'text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1';
const pillClass = 'pl pl-interactive transport-pill inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer select-none';
const activePillClass = 'border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]';
const inactivePillClass = 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]';

const FeatureScooterDetails: React.FC<FeatureScooterDetailsProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  isGeneratedScooterDescription,
  vehicleModel,
  setVehicleModel,
  vehicleModelQuantity,
  setVehicleModelQuantity,
  vehicleColor,
  setVehicleColor
}) => {
  const { tr } = useI18n();
  const selectedModelLabel = SCOOTER_WIZARD_MODEL_OPTIONS.find(model => model.value === vehicleModel)?.label || tr('wizard.transport.selectedModel');

  const selectModel = (value: string, label: string) => {
    setVehicleModel(value);
    if (!title.trim() || SCOOTER_WIZARD_MODEL_OPTIONS.some(model => model.label === title.trim())) {
      setTitle(label);
    }
    if (!description.trim() || isGeneratedScooterDescription(description)) {
      setDescription(getScooterModelDescription(value));
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-3">
        <span className={fieldTitleClass}>{tr('wizard.transport.model')}</span>
        <div className="flex flex-wrap gap-2">
          {SCOOTER_WIZARD_MODEL_OPTIONS.map(model => {
            const isActive = vehicleModel === model.value;
            return (
              <button
                key={model.value}
                type="button"
                onClick={() => selectModel(model.value, model.label)}
                aria-pressed={isActive}
                className={`${pillClass} ${isActive ? `selected ${activePillClass}` : inactivePillClass}`}
              >
                {model.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <span className={fieldTitleClass}>{tr('filters.transport.color')}</span>
        <div className="flex flex-wrap gap-3">
          {SCOOTER_WIZARD_COLOR_OPTIONS.map(color => {
            const isActive = vehicleColor === color;
            const colorLabel = tr(`filters.transport.color.${color}`);
            const isExclusive = color === 'exclusive';
            const ariaLabel = isExclusive ? tr('filters.transport.color.exclusiveHint') : colorLabel;
            const exclusiveLabel = tr('filters.transport.color.exclusiveShort');

            if (isExclusive) {
              return (
                <button
                  key={color}
                  type="button"
                  aria-label={ariaLabel}
                  title={ariaLabel}
                  aria-pressed={isActive}
                  onClick={() => setVehicleColor(color)}
                  className={`pl pl-interactive relative h-10 w-[116px] shrink-0 rounded-full border transition cursor-pointer select-none ${
                    isActive
                      ? 'border-[#FF7A50] ring-4 ring-[#FF7A50]/18 shadow-[0_10px_18px_rgba(255,122,80,0.16)]'
                      : 'border-white ring-1 ring-[#1E293B]/10 hover:ring-[#FF7A50]/45'
                  }`}
                >
                  <span
                    className="absolute inset-1 flex items-center justify-center rounded-full border border-[#1E293B]/10 bg-[linear-gradient(115deg,#7C3AED_0%,#EC4899_48%,#38BDF8_100%)] px-3 text-[10px] font-black uppercase leading-none text-white shadow-inner"
                  >
                    {exclusiveLabel}
                  </span>
                  {isActive && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF7A50] text-white ring-2 ring-white">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            }

            return (
              <button
                key={color}
                type="button"
                aria-label={ariaLabel}
                title={ariaLabel}
                aria-pressed={isActive}
                onClick={() => setVehicleColor(color)}
                className={`pl pl-interactive relative h-10 w-10 shrink-0 rounded-full border transition cursor-pointer select-none ${
                  isActive
                    ? 'border-[#FF7A50] ring-4 ring-[#FF7A50]/18 shadow-[0_10px_18px_rgba(255,122,80,0.16)]'
                    : 'border-white ring-1 ring-[#1E293B]/10 hover:ring-[#FF7A50]/45'
                }`}
              >
                <span className="absolute inset-1 rounded-full border border-[#1E293B]/10" style={{ backgroundColor: SCOOTER_WIZARD_COLOR_SWATCHES[color] || '#E5E7EB' }} />
                {isActive && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF7A50] text-white ring-2 ring-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
                <span className="sr-only">{colorLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold block text-xs text-[#1E293B]">
          {tr('wizard.transport.modelQuantity', { model: selectedModelLabel })}
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={vehicleModelQuantity ?? ''}
          onChange={event => {
            const digits = event.target.value.replace(/\D/g, '');
            setVehicleModelQuantity(digits ? Number(digits) : undefined);
          }}
          className="w-full bg-white border-0 rounded-2xl px-4 py-3 text-xs focus:ring-0 focus:outline-none transition-colors duration-150 font-sans"
        />
      </div>

    </div>
  );
};

export default FeatureScooterDetails;
