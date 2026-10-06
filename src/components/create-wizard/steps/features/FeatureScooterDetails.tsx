import React from 'react';
import { Check } from 'lucide-react';
import { useI18n } from '../../../../i18nContext';
import {
  SCOOTER_WIZARD_COLOR_OPTIONS,
  SCOOTER_WIZARD_COLOR_SWATCHES,
  SCOOTER_WIZARD_MODEL_OPTIONS,
  getScooterModelDescription
} from '../../configs/scooterWizardConfig';
import {
  MOTORCYCLE_MODEL_GROUPS,
  MOTORCYCLE_MODEL_OPTIONS,
  MOTORCYCLE_TYPE_GROUPS,
  MOTORCYCLE_OTHER_MODEL_PREFIX,
  getMotorcycleEngineDisplacements,
  getMotorcycleModelsForGroup,
  type MotorcycleTypeGroup
} from '../../../../config/motorcycleCatalog';
import {
  CAR_BRAND_GROUPS,
  CAR_MODEL_OPTIONS,
  getCarEngineDisplacements,
  getCarModelsForGroup
} from '../../../../config/carCatalog';
import {
  SCOOTER_MODEL_GROUPS,
  getScooterModelsForGroup,
  type ScooterModelGroup
} from '../../../../utils/scooterFilters';

type FeatureScooterDetailsProps = {
  subCategory: string;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  isGeneratedScooterDescription: (value: string) => boolean;
  vehicleModel: string;
  setVehicleModel: React.Dispatch<React.SetStateAction<string>>;
  vehicleModelQuantity?: number;
  setVehicleModelQuantity: React.Dispatch<React.SetStateAction<number | undefined>>;
  vehicleEngineDisplacementCc?: number;
  setVehicleEngineDisplacementCc: React.Dispatch<React.SetStateAction<number | undefined>>;
  vehicleColor: string;
  setVehicleColor: React.Dispatch<React.SetStateAction<string>>;
};

const fieldTitleClass = 'text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1';
const pillClass = 'pl pl-interactive transport-pill inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer select-none';
const activePillClass = 'border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]';
const inactivePillClass = 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]';

const FeatureScooterDetails: React.FC<FeatureScooterDetailsProps> = ({
  subCategory,
  title,
  setTitle,
  description,
  setDescription,
  isGeneratedScooterDescription,
  vehicleModel,
  setVehicleModel,
  vehicleModelQuantity,
  setVehicleModelQuantity,
  vehicleEngineDisplacementCc,
  setVehicleEngineDisplacementCc,
  vehicleColor,
  setVehicleColor
}) => {
  const { tr } = useI18n();
  const isScooter = subCategory === 'scooters';
  const isMotorcycle = subCategory === 'motorcycles';
  const isCar = subCategory === 'cars';
  const [activeModelGroup, setActiveModelGroup] = React.useState<string>(subCategory === 'cars' ? 'toyota' : 'all');
  const [activeMotorcycleType, setActiveMotorcycleType] = React.useState<MotorcycleTypeGroup>('all');
  const [isCustomMotorcycleModel, setIsCustomMotorcycleModel] = React.useState(vehicleModel.startsWith(MOTORCYCLE_OTHER_MODEL_PREFIX));
  const modelGroups = isMotorcycle
    ? MOTORCYCLE_MODEL_GROUPS
    : isCar
      ? CAR_BRAND_GROUPS.filter(group => group.value !== 'all')
      : SCOOTER_MODEL_GROUPS;
  const visibleModelGroups = isMotorcycle && activeMotorcycleType !== 'all'
    ? MOTORCYCLE_MODEL_GROUPS.filter(group =>
        group.value === 'all' || MOTORCYCLE_MODEL_OPTIONS.some(model =>
          model.group === group.value && (model.types as readonly string[]).includes(activeMotorcycleType)
        )
      )
    : modelGroups;
  const modelOptions: ReadonlyArray<{ value: string; label: string }> = isMotorcycle
    ? MOTORCYCLE_MODEL_OPTIONS
    : isCar
      ? CAR_MODEL_OPTIONS
      : SCOOTER_WIZARD_MODEL_OPTIONS;
  const selectedModelLabel = vehicleModel.startsWith(MOTORCYCLE_OTHER_MODEL_PREFIX)
    ? vehicleModel.slice(MOTORCYCLE_OTHER_MODEL_PREFIX.length).trim() || tr('wizard.transport.selectedModel')
    : modelOptions.find(model => model.value === vehicleModel)?.label || tr('wizard.transport.selectedModel');
  const visibleModels = isMotorcycle
    ? getMotorcycleModelsForGroup(activeModelGroup as typeof MOTORCYCLE_MODEL_GROUPS[number]['value'], activeMotorcycleType)
    : isCar
      ? getCarModelsForGroup(activeModelGroup as typeof CAR_BRAND_GROUPS[number]['value'])
    : isScooter
      ? getScooterModelsForGroup(activeModelGroup as ScooterModelGroup)
      : [];
  const selectedEngineDisplacements = isMotorcycle && !isCustomMotorcycleModel
    ? getMotorcycleEngineDisplacements(vehicleModel)
    : isCar
      ? getCarEngineDisplacements(vehicleModel)
      : [];

  React.useEffect(() => {
    if (isMotorcycle) {
      const selectedOption = MOTORCYCLE_MODEL_OPTIONS.find(model => model.value === vehicleModel);
      setIsCustomMotorcycleModel(vehicleModel.startsWith(MOTORCYCLE_OTHER_MODEL_PREFIX));
      setActiveModelGroup(selectedOption?.group || 'all');
      return;
    }
    if (isCar) {
      const selectedOption = CAR_MODEL_OPTIONS.find(model => model.value === vehicleModel);
      setActiveModelGroup(selectedOption?.brand || 'toyota');
      return;
    }
    setActiveModelGroup('all');
  }, [isCar, isMotorcycle, subCategory, vehicleModel]);

  React.useEffect(() => {
    if ((!isMotorcycle && !isCar) || (isMotorcycle && vehicleModel.startsWith(MOTORCYCLE_OTHER_MODEL_PREFIX))) return;
    const engineOptions = isCar
      ? getCarEngineDisplacements(vehicleModel)
      : getMotorcycleEngineDisplacements(vehicleModel);
    if (engineOptions.length === 1) {
      setVehicleEngineDisplacementCc(engineOptions[0]);
    } else if (vehicleEngineDisplacementCc !== undefined && !engineOptions.includes(vehicleEngineDisplacementCc)) {
      setVehicleEngineDisplacementCc(undefined);
    }
  }, [isCar, isMotorcycle, setVehicleEngineDisplacementCc, vehicleEngineDisplacementCc, vehicleModel]);

  const selectModel = (value: string, label: string) => {
    setIsCustomMotorcycleModel(false);
    setVehicleModel(value);
    const engineOptions = isMotorcycle
      ? getMotorcycleEngineDisplacements(value)
      : isCar
        ? getCarEngineDisplacements(value)
        : [];
    setVehicleEngineDisplacementCc(engineOptions.length === 1 ? engineOptions[0] : undefined);
    if (
      !title.trim()
      || modelOptions.some(model => model.label === title.trim())
      || vehicleModel.startsWith(MOTORCYCLE_OTHER_MODEL_PREFIX)
      || (isMotorcycle && MOTORCYCLE_MODEL_OPTIONS.some(model => model.value === vehicleModel))
    ) {
      setTitle(label);
    }
    if (isScooter && (!description.trim() || isGeneratedScooterDescription(description))) {
      setDescription(getScooterModelDescription(value));
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {(isScooter || isMotorcycle || isCar) && <div className="space-y-3">
        <span className={fieldTitleClass}>{tr('wizard.transport.model')}</span>
        {isMotorcycle && (
          <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white/70 p-1.5">
            {MOTORCYCLE_TYPE_GROUPS.map(type => {
              const isActive = activeMotorcycleType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setActiveMotorcycleType(type.value);
                    if (type.value === 'all' || isCustomMotorcycleModel || activeModelGroup === 'all') return;
                    const selectedOption = MOTORCYCLE_MODEL_OPTIONS.find(model => model.value === vehicleModel);
                    if (selectedOption && !(selectedOption.types as readonly string[]).includes(type.value)) {
                      if (title.trim() === selectedOption.label) setTitle('');
                      setVehicleModel('');
                      setVehicleEngineDisplacementCc(undefined);
                    }
                    const activeBrandHasModels = MOTORCYCLE_MODEL_OPTIONS.some(model =>
                      model.group === activeModelGroup && (model.types as readonly string[]).includes(type.value)
                    );
                    if (!activeBrandHasModels) {
                      const firstMatchingModel = MOTORCYCLE_MODEL_OPTIONS.find(model => (model.types as readonly string[]).includes(type.value));
                      if (firstMatchingModel) setActiveModelGroup(firstMatchingModel.group);
                    }
                  }}
                  aria-pressed={isActive}
                  className={`pl pl-interactive transport-pill inline-flex min-h-8 items-center rounded-full px-3 py-1.5 text-[11px] font-extrabold transition cursor-pointer select-none ${
                    isActive
                      ? 'selected bg-[#1E293B] text-white shadow-[0_8px_16px_rgba(30,41,59,0.16)]'
                      : 'bg-transparent text-[#64748B] hover:bg-white hover:text-[#1E293B]'
                  }`}
                >
                  {tr(type.labelKey)}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white/70 p-1.5">
          {visibleModelGroups.map(group => {
            const isActive = activeModelGroup === group.value;
            return (
              <button
                key={group.value}
                type="button"
                onClick={() => {
                  setActiveModelGroup(group.value);
                  if (isMotorcycle && isCustomMotorcycleModel) {
                    const customModel = vehicleModel.slice(MOTORCYCLE_OTHER_MODEL_PREFIX.length).trim();
                    if (title.trim() === customModel) setTitle('');
                    setVehicleModel('');
                    setVehicleEngineDisplacementCc(undefined);
                    setIsCustomMotorcycleModel(false);
                  }
                }}
                aria-pressed={isActive}
                className={`pl pl-interactive transport-pill inline-flex min-h-8 items-center rounded-full px-3 py-1.5 text-[11px] font-extrabold transition cursor-pointer select-none ${
                  isActive
                    ? 'selected bg-[#FF7A50] text-white shadow-[0_8px_16px_rgba(255,122,80,0.16)]'
                    : 'bg-transparent text-[#64748B] hover:bg-white hover:text-[#1E293B]'
                }`}
              >
                {'label' in group ? group.label : tr(group.labelKey)}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleModels.map(model => {
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
          {isMotorcycle && (
            <button
              type="button"
              onClick={() => {
                const selectedOption = MOTORCYCLE_MODEL_OPTIONS.find(model => model.value === vehicleModel);
                if (selectedOption && title.trim() === selectedOption.label) setTitle('');
                setVehicleModel('');
                setVehicleEngineDisplacementCc(undefined);
                setIsCustomMotorcycleModel(true);
              }}
              aria-pressed={isCustomMotorcycleModel}
              className={`${pillClass} ${isCustomMotorcycleModel ? `selected ${activePillClass}` : inactivePillClass}`}
            >
              {tr('wizard.transport.modelGroup.other')}
            </button>
          )}
        </div>
        {isMotorcycle && isCustomMotorcycleModel && (
          <div className="space-y-3">
            <input
              type="text"
              value={vehicleModel.startsWith(MOTORCYCLE_OTHER_MODEL_PREFIX) ? vehicleModel.slice(MOTORCYCLE_OTHER_MODEL_PREFIX.length) : ''}
              onChange={event => {
                const customModel = event.target.value;
                setVehicleModel(customModel ? `${MOTORCYCLE_OTHER_MODEL_PREFIX}${customModel}` : '');
                setTitle(customModel);
              }}
              className="w-full bg-white border-0 rounded-2xl px-4 py-3 text-xs focus:ring-0 focus:outline-none transition-colors duration-150 font-sans"
            />
            <div className="space-y-1.5">
              <label className={fieldTitleClass}>{tr('wizard.transport.engineDisplacement')}</label>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={vehicleEngineDisplacementCc ?? ''}
                onChange={event => setVehicleEngineDisplacementCc(event.target.value ? Math.max(1, Number(event.target.value)) : undefined)}
                className="w-full bg-white border-0 rounded-2xl px-4 py-3 text-xs focus:ring-0 focus:outline-none transition-colors duration-150 font-sans"
              />
            </div>
          </div>
        )}
      </div>}

      {((isMotorcycle && !isCustomMotorcycleModel && selectedEngineDisplacements.length > 0)
        || (isCar && selectedEngineDisplacements.length > 1)) && (
        <div className="space-y-3">
          <span className={fieldTitleClass}>{tr('wizard.transport.engineDisplacement')}</span>
          <div className="flex flex-wrap gap-2">
            {selectedEngineDisplacements.map(displacement => {
              const isActive = vehicleEngineDisplacementCc === displacement;
              return (
                <button
                  key={displacement}
                  type="button"
                  onClick={() => setVehicleEngineDisplacementCc(displacement)}
                  aria-pressed={isActive}
                  className={`${pillClass} ${isActive ? `selected ${activePillClass}` : inactivePillClass}`}
                >
                  {tr('wizard.transport.engineDisplacementValue', { value: displacement })}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
          {tr(`wizard.transport.modelQuantity.${subCategory}`, { model: selectedModelLabel })}
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
