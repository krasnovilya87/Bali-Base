import React from 'react';
import { getDistrictNamesFromGeoJSONSync, sortDistrictsByPopularity } from '../../../../utils/geo';
import { useI18n } from '../../../../i18nContext';
import ServiceSubcategoryChoices from '../../../ServiceSubcategoryChoices';
import ServiceLanguageChoices from '../../../ServiceLanguageChoices';
import Polzunok from '../../../Polzunok';

type FeatureServicesParametersProps = {
  subCategory: string;
  serviceSubcategory: string;
  setServiceSubcategory: (value: string) => void;
  serviceLicensed: boolean;
  setServiceLicensed: (value: boolean) => void;
  serviceCertified: boolean;
  setServiceCertified: (value: boolean) => void;
  serviceFormats: string[];
  toggleServiceFormat: (value: string) => void;
  serviceDistricts: string[];
  toggleServiceDistrict: (value: string) => void;
  serviceLanguages: string[];
  toggleServiceLanguage: (value: string) => void;
  serviceExperienceYears: number;
  setServiceExperienceYears: React.Dispatch<React.SetStateAction<number>>;
  servicePriceType: string;
  setServicePriceType: React.Dispatch<React.SetStateAction<string>>;
  serviceAvailability: string[];
  toggleServiceAvailability: (value: string) => void;
  serviceUrgentAvailable: boolean;
  setServiceUrgentAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  serviceFreeConsultation: boolean;
  setServiceFreeConsultation: React.Dispatch<React.SetStateAction<boolean>>;
};

const serviceFormatOptions = ['provider_place', 'client_visit', 'online', 'specified_place'];
const servicePriceTypeOptions = ['fixed', 'from', 'hourly', 'per_lesson', 'project', 'negotiable'];
const serviceAvailabilityOptions = ['appointment', 'today', '24_7'];

const FeatureServicesParameters: React.FC<FeatureServicesParametersProps> = ({
  subCategory, serviceSubcategory, setServiceSubcategory,
  serviceLicensed, setServiceLicensed, serviceCertified, setServiceCertified,
  serviceFormats,
  toggleServiceFormat,
  serviceDistricts,
  toggleServiceDistrict,
  serviceLanguages,
  toggleServiceLanguage,
  serviceExperienceYears,
  setServiceExperienceYears,
  servicePriceType,
  setServicePriceType,
  serviceAvailability,
  toggleServiceAvailability,
  serviceUrgentAvailable,
  setServiceUrgentAvailable,
  serviceFreeConsultation,
  setServiceFreeConsultation
}) => {
  const { tr } = useI18n();
  const districtOptions = sortDistrictsByPopularity(getDistrictNamesFromGeoJSONSync());
  const fieldTitleClass = 'text-xs font-semibold font-sans text-[#1E293B] tracking-wider block';
  const pillClass = 'pl pl-interactive transport-pill inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer select-none';
  const activePillClass = 'selected border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]';
  const inactivePillClass = 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]';

  const renderMultiChoice = (
    values: string[],
    activeValues: string[],
    onToggle: (value: string) => void,
    keyPrefix: string
  ) => (
    <div className="flex flex-wrap gap-2">
      {values.map(value => {
        const isActive = activeValues.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            aria-pressed={isActive}
            className={`${pillClass} max-w-full ${isActive ? activePillClass : inactivePillClass}`}
          >
            <span className="min-w-0 break-words">{tr(`${keyPrefix}.${value}`)}</span>
          </button>
        );
      })}
    </div>
  );

  const renderSingleChoice = (
    values: string[],
    activeValue: string,
    onSelect: (value: string) => void,
    keyPrefix: string
  ) => (
    <div className="flex flex-wrap gap-2">
      {values.map(value => {
        const isActive = activeValue === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            aria-pressed={isActive}
            className={`${pillClass} max-w-full ${isActive ? activePillClass : inactivePillClass}`}
          >
            <span className="min-w-0 break-words">{tr(`${keyPrefix}.${value}`)}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <ServiceSubcategoryChoices
        subCategory={subCategory}
        selected={serviceSubcategory ? [serviceSubcategory] : []}
        onChange={values => setServiceSubcategory(values[0] || '')}
        licensed={serviceLicensed}
        certified={serviceCertified}
        onLicenseChange={setServiceLicensed}
        onCertificatesChange={setServiceCertified}
      />
      <section className="space-y-3">
        <span className={fieldTitleClass}>{tr('wizard.services.format')}</span>
        {renderMultiChoice(serviceFormatOptions, serviceFormats, toggleServiceFormat, 'wizard.services.format')}
      </section>

      <section className="space-y-3">
        <span className={fieldTitleClass}>{tr('wizard.services.districts')}</span>
        <div className="flex flex-wrap gap-2">
          {districtOptions.map(districtName => {
            const isActive = serviceDistricts.includes(districtName);
            return (
              <button
                key={districtName}
                type="button"
                onClick={() => toggleServiceDistrict(districtName)}
                aria-pressed={isActive}
                className={`${pillClass} ${isActive ? activePillClass : inactivePillClass}`}
              >
                {districtName}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <span className={fieldTitleClass}>{tr('wizard.services.languages')}</span>
        <ServiceLanguageChoices selected={serviceLanguages} onToggle={toggleServiceLanguage} />
      </section>

      <section className="space-y-5">
        <fieldset className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className={fieldTitleClass}>{tr('wizard.services.experience')}</span>
            <span className="pl inline-flex rounded-lg bg-[#FF7A50]/10 px-2.5 py-1 text-xs font-semibold text-[#FF7A50]">
              {serviceExperienceYears}
            </span>
          </div>
          <Polzunok
            min={0}
            max={5}
            step={1}
            value={Math.max(0, Math.min(5, serviceExperienceYears))}
            onChange={setServiceExperienceYears}
          />
          <div className="relative mt-1.5 h-4 px-0.5 text-[10.5px] font-semibold text-[#1E293B]">
            {[0, 1, 2, 3, 4, 5].map((value, index, values) => <span
              key={value}
              className="absolute top-0 whitespace-nowrap"
              style={{
                left: `${index / (values.length - 1) * 100}%`,
                transform: index === 0 ? 'translateX(0)' : index === values.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)'
              }}
            >{value}</span>)}
          </div>
        </fieldset>

        <div className="space-y-2.5">
          <span className={fieldTitleClass}>{tr('wizard.services.priceType')}</span>
          {renderSingleChoice(servicePriceTypeOptions, servicePriceType, setServicePriceType, 'wizard.services.priceType')}
        </div>
      </section>

      <section className="space-y-3">
        <span className={fieldTitleClass}>{tr('wizard.services.availability')}</span>
        {renderMultiChoice(serviceAvailabilityOptions, serviceAvailability, toggleServiceAvailability, 'wizard.services.availability')}
      </section>

      <section className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setServiceUrgentAvailable(current => !current)}
          aria-pressed={serviceUrgentAvailable}
          className={`${pillClass} max-w-full ${serviceUrgentAvailable ? activePillClass : inactivePillClass}`}
        >
          <span className="min-w-0 break-words leading-tight">{tr('wizard.services.urgent')}</span>
        </button>
        <button
          type="button"
          onClick={() => setServiceFreeConsultation(current => !current)}
          aria-pressed={serviceFreeConsultation}
          className={`${pillClass} max-w-full ${serviceFreeConsultation ? activePillClass : inactivePillClass}`}
        >
          <span className="min-w-0 break-words leading-tight">{tr('wizard.services.freeConsultation')}</span>
        </button>
      </section>
    </div>
  );
};

export default FeatureServicesParameters;
