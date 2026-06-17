import { Listing } from '../types';

const asYear = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value !== 'other') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export function isListingFresh(listing: Pick<Listing, 'yearBuilt' | 'yearRenovated'>): boolean {
  const years = [asYear(listing.yearBuilt), asYear(listing.yearRenovated)].filter(
    (year): year is number => year !== null
  );

  if (!years.length) return false;

  const latestYear = Math.max(...years);
  return new Date().getFullYear() - latestYear <= 2;
}
