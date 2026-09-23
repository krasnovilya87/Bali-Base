import React, { useEffect, useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { ELECTRONICS_BRANDS, isElectronicsCategory } from '../../../../config/electronicsCatalog';
import { MARKET_TRANSPORT_BRANDS, isMarketTransportCategory } from '../../../../config/transportCatalog';
import { MARKET_OTHER_BRANDS, isMarketOtherCategory } from '../../../../config/marketOtherCatalog';
import { getMarketBrandLogoSources } from '../../../../config/marketBrandLogos';
import { useI18n } from '../../../../i18nContext';

type CatalogBrand = { name: string; models: readonly string[]; logoSlug?: string; logoUrl?: string };

type Props = {
  subCategory: string;
  brand: string;
  model: string;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
};

const titleClass = 'text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1';
const inputClass = 'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs font-bold text-[#1E293B] outline-none focus:border-[#FF7A50] focus:ring-2 focus:ring-[#FF7A50]/15';

export const hasClassifiedCatalog = (subCategory: string) => (
  isElectronicsCategory(subCategory)
  || isMarketTransportCategory(subCategory)
  || isMarketOtherCategory(subCategory)
);

const ClassifiedCatalogWizard: React.FC<Props> = ({
  subCategory,
  brand,
  model,
  onBrandChange,
  onModelChange
}) => {
  const { tr } = useI18n();
  const [otherBrandOpen, setOtherBrandOpen] = useState(false);
  const [otherModelOpen, setOtherModelOpen] = useState(false);
  const [failedLogoSources, setFailedLogoSources] = useState<Record<string, number>>({});
  const brands: readonly CatalogBrand[] = isElectronicsCategory(subCategory)
    ? ELECTRONICS_BRANDS[subCategory]
    : isMarketOtherCategory(subCategory)
      ? MARKET_OTHER_BRANDS[subCategory]
      : isMarketTransportCategory(subCategory)
        ? MARKET_TRANSPORT_BRANDS[subCategory]
        : [];
  const selectedBrand = brands.find(item => item.name.toLowerCase() === brand.trim().toLowerCase());
  const showOtherBrand = otherBrandOpen || Boolean(brand.trim() && !selectedBrand);
  const showOtherModel = otherModelOpen || Boolean(
    selectedBrand && model.trim() && !selectedBrand.models.some(item => item.toLowerCase() === model.trim().toLowerCase())
  );

  useEffect(() => {
    setOtherBrandOpen(false);
    setOtherModelOpen(false);
    setFailedLogoSources({});
  }, [subCategory]);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <span className={titleClass}>{tr('filters.classified.special.field.classified_brand')}</span>
        <div className="grid grid-cols-5 gap-2">
          {brands.map(item => {
            const selected = selectedBrand?.name === item.name && !otherBrandOpen;
            const logoKey = `${subCategory}:${item.name}`;
            const logoSources = getMarketBrandLogoSources(item);
            const logoSrc = logoSources[failedLogoSources[logoKey] || 0];
            return (
              <button
                key={item.name}
                type="button"
                title={item.name}
                aria-label={item.name}
                aria-pressed={selected}
                onClick={() => {
                  setOtherBrandOpen(false);
                  setOtherModelOpen(false);
                  onBrandChange(item.name);
                  onModelChange('');
                }}
                className={`pl pl-interactive relative flex aspect-[4/3] min-h-12 items-center justify-center rounded-lg border bg-white p-2 transition ${selected ? 'border-[#FF7A50] ring-2 ring-[#FF7A50]/20' : 'border-[#E5E7EB] hover:border-[#FF7A50]'}`}
              >
                {!logoSrc ? (
                  <span className="break-words text-center text-[11px] font-extrabold leading-tight text-[#1E293B]" aria-hidden="true">{item.name}</span>
                ) : (
                  <img
                    src={logoSrc}
                    alt=""
                    loading="lazy"
                    className="max-h-8 max-w-full object-contain"
                    onError={() => setFailedLogoSources(current => ({ ...current, [logoKey]: (current[logoKey] || 0) + 1 }))}
                  />
                )}
                {selected && <Check className="absolute right-1 top-1 h-3.5 w-3.5 text-[#FF7A50]" strokeWidth={3} />}
              </button>
            );
          })}
          <button
            type="button"
            title={tr('filters.classified.special.other')}
            aria-label={tr('filters.classified.special.other')}
            aria-pressed={showOtherBrand}
            onClick={() => {
              setOtherBrandOpen(true);
              setOtherModelOpen(true);
              onBrandChange('');
              onModelChange('');
            }}
            className={`pl pl-interactive flex aspect-[4/3] min-h-12 flex-col items-center justify-center gap-1 rounded-lg border bg-white transition ${showOtherBrand ? 'border-[#FF7A50] text-[#FF7A50] ring-2 ring-[#FF7A50]/20' : 'border-[#E5E7EB] text-[#64748B] hover:border-[#FF7A50]'}`}
          >
            <Pencil className="h-4 w-4" />
            <span className="text-[10px] font-bold leading-none">{tr('filters.classified.special.other')}</span>
          </button>
        </div>
        {showOtherBrand && (
          <input
            type="search"
            autoFocus
            aria-label={tr('filters.classified.special.field.classified_brand')}
            placeholder={tr('filters.classified.special.enterBrand')}
            value={brand}
            onChange={event => onBrandChange(event.target.value)}
            className={inputClass}
          />
        )}
      </div>

      {(selectedBrand || showOtherBrand) && (
        <div className="space-y-3">
          <span className={titleClass}>{tr('filters.classified.special.field.classified_model')}</span>
          {selectedBrand && !showOtherBrand && (
            <div className="flex flex-wrap gap-2">
              {selectedBrand.models.map(item => {
                const selected = !otherModelOpen && item.toLowerCase() === model.trim().toLowerCase();
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setOtherModelOpen(false);
                      onModelChange(item);
                    }}
                    aria-pressed={selected}
                    className={`pl pl-interactive transport-pill min-h-10 rounded-full border px-3 py-2 text-xs font-extrabold transition ${selected ? 'selected border-[#FF7A50] bg-[#FF7A50] text-white' : 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50]'}`}
                  >
                    {item}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setOtherModelOpen(true);
                  onModelChange('');
                }}
                aria-pressed={showOtherModel}
                className={`pl pl-interactive transport-pill min-h-10 rounded-full border px-3 py-2 text-xs font-extrabold transition ${showOtherModel ? 'selected border-[#FF7A50] bg-[#FF7A50] text-white' : 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50]'}`}
              >
                {tr('filters.classified.special.other')}
              </button>
            </div>
          )}
          {(showOtherBrand || showOtherModel) && (
            <input
              type="search"
              autoFocus={!showOtherBrand}
              aria-label={tr('filters.classified.special.field.classified_model')}
              placeholder={tr('filters.classified.special.enterModel')}
              value={model}
              onChange={event => onModelChange(event.target.value)}
              className={inputClass}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ClassifiedCatalogWizard;
