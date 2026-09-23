import React, { useEffect, useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { ELECTRONICS_BRANDS, isElectronicsCategory } from '../../config/electronicsCatalog';
import type { ElectronicsCategory } from '../../config/electronicsCatalog';
import { MARKET_TRANSPORT_BRANDS } from '../../config/transportCatalog';
import type { MarketTransportCategory } from '../../config/transportCatalog';
import { MARKET_OTHER_BRANDS, isMarketOtherCategory } from '../../config/marketOtherCatalog';
import type { MarketOtherCategory } from '../../config/marketOtherCatalog';
import { getMarketBrandLogoSources } from '../../config/marketBrandLogos';
import { useI18n } from '../../i18nContext';
import { FilterState } from '../../types';

type Props = {
  subCategory: ElectronicsCategory | MarketTransportCategory | MarketOtherCategory;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
};

const titleClass = 'text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1';
const inputClass = 'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs font-bold text-[#1E293B] outline-none focus:border-[#FF7A50] focus:ring-2 focus:ring-[#FF7A50]/15';
type CatalogBrand = { name: string; models: readonly string[]; logoSlug?: string; logoUrl?: string };

const CatalogBrandModelFilters: React.FC<Props> = ({ subCategory, filters, setFilters }) => {
  const { tr } = useI18n();
  const [otherBrandOpen, setOtherBrandOpen] = useState(false);
  const [otherModelOpen, setOtherModelOpen] = useState(false);
  const [failedLogoSources, setFailedLogoSources] = useState<Record<string, number>>({});
  const brands: readonly CatalogBrand[] = isElectronicsCategory(subCategory)
    ? ELECTRONICS_BRANDS[subCategory]
    : isMarketOtherCategory(subCategory)
      ? MARKET_OTHER_BRANDS[subCategory]
      : MARKET_TRANSPORT_BRANDS[subCategory];
  const isActiveCategory = filters.classifiedSpecialSubCategory === subCategory;
  const brandQuery = isActiveCategory ? filters.classifiedSpecialText.classified_brand || '' : '';
  const modelQuery = isActiveCategory ? filters.classifiedSpecialText.classified_model || '' : '';
  const selectedBrand = brands.find(brand => brand.name.toLowerCase() === brandQuery.trim().toLowerCase());
  const showOtherBrand = otherBrandOpen || Boolean(brandQuery.trim() && !selectedBrand);
  const showOtherModel = otherModelOpen || Boolean(selectedBrand && modelQuery.trim() && !selectedBrand.models.some(model => model.toLowerCase() === modelQuery.trim().toLowerCase()));

  useEffect(() => {
    if (filters.classifiedSpecialSubCategory !== subCategory) {
      setOtherBrandOpen(false);
      setOtherModelOpen(false);
    }
  }, [filters.classifiedSpecialSubCategory, subCategory]);

  const updateBrand = (value: string) => setFilters(current => ({
    ...current,
    classifiedSpecialSubCategory: subCategory,
    classifiedSpecialText: { ...current.classifiedSpecialText, classified_brand: value, classified_model: '' }
  }));

  const updateModel = (value: string) => setFilters(current => ({
    ...current,
    classifiedSpecialSubCategory: subCategory,
    classifiedSpecialText: { ...current.classifiedSpecialText, classified_model: value }
  }));

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <span className={titleClass}>{tr('filters.classified.special.field.classified_brand')}</span>
        <div className="grid grid-cols-5 gap-2">
          {brands.map(brand => {
            const selected = selectedBrand?.name === brand.name && !otherBrandOpen;
            const logoKey = `${subCategory}:${brand.name}`;
            const logoSources = getMarketBrandLogoSources(brand);
            const logoSrc = logoSources[failedLogoSources[logoKey] || 0];
            return (
              <button
                key={brand.name}
                type="button"
                title={brand.name}
                aria-label={brand.name}
                aria-pressed={selected}
                onClick={() => {
                  setOtherBrandOpen(false);
                  setOtherModelOpen(false);
                  updateBrand(brand.name);
                }}
                className={`pl pl-interactive relative flex aspect-[4/3] min-h-12 items-center justify-center rounded-lg border bg-white p-2 transition ${selected ? 'border-[#FF7A50] ring-2 ring-[#FF7A50]/20' : 'border-[#E5E7EB] hover:border-[#FF7A50]'}`}
              >
                {!logoSrc ? (
                  <span className="break-words text-center text-[11px] font-extrabold leading-tight text-[#1E293B]" aria-hidden="true">{brand.name}</span>
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
              updateBrand('');
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
            value={brandQuery}
            onChange={event => updateBrand(event.target.value)}
            className={inputClass}
          />
        )}
      </div>

      {(selectedBrand || showOtherBrand) && (
        <div className="space-y-3">
          <span className={titleClass}>{tr('filters.classified.special.field.classified_model')}</span>
          {selectedBrand && !showOtherBrand && (
            <div className="flex flex-wrap gap-2">
              {selectedBrand.models.map(model => {
                const selected = !otherModelOpen && model.toLowerCase() === modelQuery.trim().toLowerCase();
                return (
                  <button
                    key={model}
                    type="button"
                    onClick={() => {
                      setOtherModelOpen(false);
                      updateModel(model);
                    }}
                    aria-pressed={selected}
                    className={`pl pl-interactive transport-pill min-h-10 rounded-full border px-3 py-2 text-xs font-extrabold transition ${selected ? 'selected border-[#FF7A50] bg-[#FF7A50] text-white' : 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50]'}`}
                  >
                    {model}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setOtherModelOpen(true);
                  updateModel('');
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
              value={modelQuery}
              onChange={event => updateModel(event.target.value)}
              className={inputClass}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CatalogBrandModelFilters;
