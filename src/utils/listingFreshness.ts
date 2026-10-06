import { Listing } from '../types';

const asYear = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value !== 'other') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export function isListingFresh(listing: Pick<Listing, 'category' | 'yearBuilt' | 'yearRenovated'>): boolean {
  if (listing.category !== 'housing' && listing.category !== 'transport') return false;

  const years = listing.category === 'housing'
    ? [asYear(listing.yearBuilt), asYear(listing.yearRenovated)]
    : [asYear(listing.yearBuilt)];
  const validYears = years.filter((year): year is number => year !== null);

  if (!validYears.length) return false;

  const latestYear = Math.max(...validYears);
  const maximumAge = listing.category === 'housing' ? 2 : 1;
  return new Date().getFullYear() - latestYear <= maximumAge;
}
