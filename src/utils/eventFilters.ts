import type { Listing } from '../types';
import { EVENT_COMMON_FIELDS, getEventCategoryFields } from '../config/eventSpecial';

const matchesSelectedValues = (value: unknown, selected: string[]) => {
  if (!selected.length) return true;
  if (Array.isArray(value)) return value.some(item => selected.includes(String(item)));
  if (value === undefined || value === '') return false;
  return selected.includes(String(value));
};

export const isAfishaListingExpired = (listing: Listing, now = Date.now()) => {
  if (listing.category !== 'afisha' || !listing.expirationDate) return false;
  const expiresAt = Date.parse(listing.expirationDate);
  return Number.isFinite(expiresAt) && expiresAt <= now;
};

export const listingMatchesEventAttributes = (
  listing: Listing,
  selectedOptions: Record<string, string[]> = {},
  selectedSubCategory = '',
  selectedText: Record<string, string> = {}
) => {
  if (isAfishaListingExpired(listing)) return false;
  const attributes = listing.classifiedAttributes || {};
  for (const field of EVENT_COMMON_FIELDS) {
    const selected = selectedOptions[field.id] || [];
    if (field.id === 'afisha_language') {
      const languages = attributes[field.id];
      if (selected.length && !(Array.isArray(languages) && languages.includes('multilingual'))
        && !matchesSelectedValues(languages, selected)) return false;
    } else if (!matchesSelectedValues(attributes[field.id], selected)) return false;
  }

  const fields = getEventCategoryFields(selectedSubCategory);
  const hasCategoryFilters = fields.some(field => (selectedOptions[field.id] || []).length || selectedText[field.id]?.trim());
  if (!hasCategoryFilters) return true;
  if (listing.subCategory !== selectedSubCategory) return false;

  return fields.every(field => {
    if (field.inputType) {
      const query = selectedText[field.id]?.trim();
      if (!query) return true;
      const value = attributes[field.id];
      if (field.inputType === 'number') return Number(value) === Number(query);
      return typeof value === 'string' && value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    }
    return matchesSelectedValues(attributes[field.id], selectedOptions[field.id] || []);
  });
};
