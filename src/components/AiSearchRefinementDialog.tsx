import { useEffect, useState } from 'react';
import { Bot, Filter, Search, X } from 'lucide-react';
import { FilterState, Listing } from '../types';
import { useI18n } from '../i18nContext';
import { getListingVehicleColor, getListingVehicleCondition, getListingVehicleModel, getListingSellerType } from '../utils/scooterFilters';
import { hasTransportRentIntent } from '../utils/localAiSearchParser';

type RefineOption = {
  id: string;
  label: string;
  count: number;
  apply: () => void;
  disabled?: boolean;
};

type RefineQuestion = {
  title: string;
  options: RefineOption[];
};

interface AiSearchRefinementDialogProps {
  currentL1: string;
  currentL2: string[];
  sourceQuery: string;
  districtSearch: string[];
  filters: FilterState;
  results: Listing[];
  onClose: () => void;
  onDistrictChange: (districts: string[]) => void;
  onFiltersChange: (filters: FilterState) => void;
  onSubCategoriesChange: (subCategories: string[]) => void;
}

const formatNumber = (value: number) => value.toLocaleString('en-US');

const formatPrice = (value: number) => {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
};

const getTranslatedOption = (
  tr: (key: string, params?: Record<string, string | number>) => string,
  field: string,
  value: string,
  fallback: string
) => {
  const key = `details.option.${field}.${value}`;
  const translated = tr(key);
  return translated !== key ? translated : fallback;
};

const uniqueCounts = <T extends string>(
  items: Listing[],
  getValue: (item: Listing) => T | undefined | null
) => {
  const counts = new Map<T, number>();
  items.forEach(item => {
    const value = getValue(item);
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
};

const numberBuckets = (
  items: Listing[],
  getValue: (item: Listing) => number | undefined | null,
  candidates: number[]
) => {
  const values = items
    .map(getValue)
    .filter((value): value is number => Number.isFinite(value) && value > 0);

  return candidates
    .map(value => ({
      value,
      count: values.filter(itemValue => itemValue >= value).length
    }))
    .filter((item, index, list) => item.count > 0 && list.findIndex(candidate => candidate.count === item.count) === index)
    .sort((a, b) => b.value - a.value);
};

export default function AiSearchRefinementDialog({
  currentL1,
  currentL2,
  sourceQuery,
  districtSearch,
  filters,
  results,
  onClose,
  onDistrictChange,
  onFiltersChange,
  onSubCategoriesChange
}: AiSearchRefinementDialogProps) {
  const { tr } = useI18n();
  const [transportPurpose, setTransportPurpose] = useState<string | null>(() =>
    hasTransportRentIntent(sourceQuery) ? 'rent' : null
  );
  const resultCount = results.length;

  useEffect(() => {
    setTransportPurpose(hasTransportRentIntent(sourceQuery) ? 'rent' : null);
  }, [sourceQuery]);

  const applyArrayFilter = (key: keyof FilterState, value: string) => {
    const current = filters[key];
    if (!Array.isArray(current) || current.includes(value)) return;
    onFiltersChange({
      ...filters,
      [key]: [...current, value]
    });
  };

  const questions: RefineQuestion[] = [];

  const addDistrictQuestion = () => {
    const districtOptions = uniqueCounts(results, item => item.district)
      .slice(0, 4)
      .map(({ value, count }) => ({
        id: `district-${value}`,
        label: value,
        count,
        apply: () => onDistrictChange([value])
      }));
    if (districtOptions.length > 1) {
      questions.push({ title: tr('search.refine.location'), options: districtOptions });
    }
  };

  if (currentL2.length > 1) {
    const subCategoryOptions = uniqueCounts(results, item => item.subCategory)
      .slice(0, 4)
      .map(({ value, count }) => ({
        id: `subcategory-${value}`,
        label: tr(`filters.sub.${value}`) !== `filters.sub.${value}`
          ? tr(`filters.sub.${value}`)
          : value.replace(/_/g, ' '),
        count,
        apply: () => onSubCategoriesChange([value])
      }));
    if (subCategoryOptions.length > 1) {
      questions.push({ title: tr('search.refine.type'), options: subCategoryOptions });
    }
  }

  const prices = results
    .map(item => item.hasDropPrice && item.dropPricePerDay ? item.dropPricePerDay : item.pricePerDay)
    .filter(price => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);
  if (prices.length > 3 && filters.priceMax >= 30_000_000) {
    const priceCandidates = [0.35, 0.5, 0.7]
      .map(part => prices[Math.max(0, Math.min(prices.length - 1, Math.floor(prices.length * part)))])
      .filter((value, index, list) => value && list.indexOf(value) === index)
      .map(value => ({
        id: `price-${value}`,
        label: tr('search.refine.priceUpTo', { price: formatPrice(value) }),
        count: prices.filter(price => price <= value).length,
        apply: () => onFiltersChange({ ...filters, priceMax: value })
      }))
      .filter(option => option.count > 0 && option.count < resultCount);
    if (priceCandidates.length > 0) {
      questions.push({ title: tr('search.refine.price'), options: priceCandidates.slice(0, 3) });
    }
  }

  if (currentL1 === 'housing') {
    if (districtSearch.length === 0) addDistrictQuestion();

    if (filters.roomsMin <= 1) {
      const options = numberBuckets(results, item => item.roomsTotal, [5, 4, 3, 2, 1])
        .filter(option => option.count < resultCount)
        .slice(0, 4)
        .map(({ value, count }) => ({
          id: `rooms-${value}`,
          label: tr('search.refine.roomsAtLeast', { count: value }),
          count,
          apply: () => onFiltersChange({ ...filters, roomsMin: value })
        }));
      if (options.length > 0) questions.push({ title: tr('search.refine.rooms'), options });
    }

    if (filters.housingType.length === 0) {
      const options = uniqueCounts(results, item => item.housingType)
        .slice(0, 4)
        .map(({ value, count }) => ({
          id: `housingType-${value}`,
          label: getTranslatedOption(tr, 'housingType', value, value),
          count,
          apply: () => applyArrayFilter('housingType', value)
        }));
      if (options.length > 1) questions.push({ title: tr('search.refine.objectType'), options });
    }

    if (filters.territoryType.length === 0) {
      const options = uniqueCounts(results, item => item.territoryType)
        .slice(0, 4)
        .map(({ value, count }) => ({
          id: `territory-${value}`,
          label: getTranslatedOption(tr, 'territoryType', value, value),
          count,
          apply: () => applyArrayFilter('territoryType', value)
        }));
      if (options.length > 1) questions.push({ title: tr('search.refine.territory'), options });
    }

    if (filters.poolType.length === 0) {
      const options = uniqueCounts(results, item => item.poolType && item.poolType !== 'none' ? item.poolType : null)
        .slice(0, 3)
        .map(({ value, count }) => ({
          id: `pool-${value}`,
          label: getTranslatedOption(tr, 'poolType', value, value),
          count,
          apply: () => applyArrayFilter('poolType', value)
        }));
      if (options.length > 0) questions.push({ title: tr('search.refine.pool'), options });
    }

    if (filters.kitchenType.length === 0) {
      const options = uniqueCounts(results, item => item.kitchenType)
        .slice(0, 4)
        .map(({ value, count }) => ({
          id: `kitchen-${value}`,
          label: getTranslatedOption(tr, 'kitchenType', value, value),
          count,
          apply: () => applyArrayFilter('kitchenType', value)
        }));
      if (options.length > 1) questions.push({ title: tr('search.refine.kitchen'), options });
    }

    if (filters.interiorStyle.length === 0) {
      const options = uniqueCounts(results, item => item.interiorStyle)
        .slice(0, 4)
        .map(({ value, count }) => ({
          id: `interior-${value}`,
          label: getTranslatedOption(tr, 'interiorStyle', value, value),
          count,
          apply: () => applyArrayFilter('interiorStyle', value)
        }));
      if (options.length > 1) questions.push({ title: tr('search.refine.style'), options });
    }

    if (filters.amenities.length === 0) {
      const amenities = new Map<string, number>();
      results.forEach(item => {
        (item.amenities || []).forEach(value => amenities.set(value, (amenities.get(value) || 0) + 1));
      });
      const options = Array.from(amenities.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
        .map(({ value, count }) => ({
          id: `amenity-${value}`,
          label: getTranslatedOption(tr, 'amenities', value, value),
          count,
          apply: () => applyArrayFilter('amenities', value)
        }));
      if (options.length > 1) questions.push({ title: tr('search.refine.amenities'), options });
    }

    if (filters.cleaningFrequency.length === 0) {
      const options = uniqueCounts(results, item => item.cleaningFrequency && item.cleaningFrequency !== 'none' ? item.cleaningFrequency : null)
        .slice(0, 4)
        .map(({ value, count }) => ({
          id: `cleaning-${value}`,
          label: getTranslatedOption(tr, 'cleaningFrequency', value, value),
          count,
          apply: () => applyArrayFilter('cleaningFrequency', value)
        }));
      if (options.length > 1) questions.push({ title: tr('search.refine.cleaning'), options });
    }

    if (filters.viewType.length === 0) {
      const options = uniqueCounts(results, item => item.viewType)
        .slice(0, 4)
        .map(({ value, count }) => ({
          id: `view-${value}`,
          label: getTranslatedOption(tr, 'viewType', value, value),
          count,
          apply: () => applyArrayFilter('viewType', value)
        }));
      if (options.length > 1) questions.push({ title: tr('search.refine.view'), options });
    }
  }

  if (currentL1 === 'transport' && currentL2.includes('scooters')) {
    if (!transportPurpose) {
      questions.push({
        title: tr('search.refine.transportPurpose'),
        options: [
          {
            id: 'transport-purpose-rent',
            label: tr('search.refine.transportPurposeRent'),
            count: resultCount,
            apply: () => setTransportPurpose('rent')
          },
          {
            id: 'transport-purpose-buy',
            label: tr('search.refine.transportPurposeBuy'),
            count: 0,
            apply: () => setTransportPurpose('buy'),
            disabled: true
          },
          {
            id: 'transport-purpose-sell',
            label: tr('search.refine.transportPurposeSell'),
            count: 0,
            apply: () => setTransportPurpose('sell'),
            disabled: true
          },
          {
            id: 'transport-purpose-list-rent',
            label: tr('search.refine.transportPurposeListRent'),
            count: 0,
            apply: () => setTransportPurpose('list_for_rent'),
            disabled: true
          }
        ]
      });
    }

    if (filters.vehicleModel.length === 0) {
      const options = uniqueCounts(results, item => getListingVehicleModel(item))
        .slice(0, 5)
        .map(({ value, count }) => ({
          id: `vehicleModel-${value}`,
          label: value.replace(/_/g, ' ').toUpperCase(),
          count,
          apply: () => applyArrayFilter('vehicleModel', value)
        }));
      if (options.length > 1) questions.push({ title: tr('search.refine.model'), options });
    }

    if (filters.vehicleColor.length === 0) {
      const options = uniqueCounts(results, item => getListingVehicleColor(item))
        .slice(0, 4)
        .map(({ value, count }) => ({
          id: `vehicleColor-${value}`,
          label: tr(`filters.transport.color.${value}`),
          count,
          apply: () => applyArrayFilter('vehicleColor', value)
        }));
      if (options.length > 1) questions.push({ title: tr('search.refine.color'), options });
    }

    if (filters.vehicleCondition.length === 0) {
      const options = uniqueCounts(results, item => getListingVehicleCondition(item))
        .slice(0, 3)
        .map(({ value, count }) => ({
          id: `vehicleCondition-${value}`,
          label: tr(`filters.transport.condition.${value}`),
          count,
          apply: () => applyArrayFilter('vehicleCondition', value)
        }));
      if (options.length > 1) questions.push({ title: tr('search.refine.condition'), options });
    }

    if (filters.sellerType.length === 0) {
      const options = uniqueCounts(results, item => getListingSellerType(item))
        .slice(0, 2)
        .map(({ value, count }) => ({
          id: `sellerType-${value}`,
          label: tr(`filters.transport.sellerType.${value}`),
          count,
          apply: () => applyArrayFilter('sellerType', value)
        }));
      if (options.length > 1) questions.push({ title: tr('search.refine.seller'), options });
    }

    if (districtSearch.length === 0) addDistrictQuestion();
  }

  const question = questions.find(item => item.options.some(option => option.count < resultCount)) || questions[0];

  return (
    <div
      className="fixed inset-0 z-[635] flex items-end justify-center bg-[#0B1714]/55 px-3 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+16px)] backdrop-blur-md sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={tr('search.refine.title')}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/50 bg-white shadow-[0_30px_90px_rgba(11,23,20,0.34)] animate-scale-up">
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E293B] text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
            <h3 className="font-display text-base font-extrabold text-[#1E293B]">
              {tr('search.refine.title')}
            </h3>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-[#64748B]">
              {tr('search.refine.found', { count: formatNumber(resultCount) })}
            </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4F7F6] text-[#1E293B] transition hover:text-[#FF7A50] active:scale-95"
            title={tr('common.close')}
            aria-label={tr('common.close')}
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {question ? (
            <>
              <div className="rounded-3xl bg-[#F4F7F6] px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#FF7A50]">
                  <Filter className="h-4 w-4" />
                  {tr('search.refine.question')}
                </div>
                <p className="mt-1.5 text-sm font-extrabold leading-snug text-[#1E293B]">
                  {question.title}
                </p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-[#64748B]">
                  {tr('search.refine.tapToNarrow')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {question.options.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={option.apply}
                    disabled={option.disabled}
                    className="flex min-h-[58px] items-center justify-between gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-left transition hover:border-[#FF7A50]/45 hover:bg-[#FF7A50]/5 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#E5E7EB] disabled:hover:bg-white"
                  >
                    <span className="text-sm font-extrabold leading-tight text-[#1E293B]">
                      {option.label}
                    </span>
                    <span className="shrink-0 rounded-full bg-[#2F7D69]/10 px-2.5 py-1 text-xs font-black text-[#2F7D69]">
                      {formatNumber(option.count)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-[#F4F7F6] px-4 py-5 text-center">
              <p className="text-sm font-extrabold text-[#1E293B]">
                {tr('search.refine.done')}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF7A50] px-4 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(255,122,80,0.24)] transition hover:bg-[#E05A30] active:scale-95"
          >
            <Search className="h-4 w-4" />
            {tr('search.refine.showResults', { count: formatNumber(resultCount) })}
          </button>
        </div>
      </div>
    </div>
  );
}
