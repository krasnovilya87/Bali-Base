import { FilterState, Listing } from '../types';

export const listingMatchesServiceFilters = (item: Listing, filters: FilterState, activeCategory: string): boolean => {
  const overlaps = (selected: string[] = [], values: string[] = []) =>
    selected.length === 0 || selected.some(value => values.includes(value));

  const matchesCategory = filters.serviceFilterCategory === activeCategory;
  return (!matchesCategory || overlaps(filters.serviceSubcategories, item.serviceSubcategory ? [item.serviceSubcategory] : []))
    && (!matchesCategory || activeCategory !== 'health' || !filters.serviceLicensedOnly || item.serviceLicensed === true)
    && (!matchesCategory || activeCategory !== 'health' || !filters.serviceCertifiedOnly || item.serviceCertified === true)
    && overlaps(filters.serviceFormats, item.serviceFormats)
    && overlaps(filters.serviceLanguages, item.serviceLanguages)
    && overlaps(filters.servicePriceTypes, item.servicePriceType ? [item.servicePriceType] : [])
    && overlaps(filters.serviceAvailability, item.serviceAvailability)
    && (item.serviceExperienceYears ?? 0) >= (filters.serviceExperienceMin ?? 0)
    && (!filters.serviceUrgentOnly || item.serviceUrgentAvailable === true)
    && (!filters.serviceFreeConsultationOnly || item.serviceFreeConsultation === true);
};
