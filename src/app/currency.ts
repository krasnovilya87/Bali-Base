export const CURRENCIES = {
  IDR: { symbol: 'Rp', rate: 1 },
  USD: { symbol: '$', rate: 0.000062 },
  EUR: { symbol: '€', rate: 0.000057 },
  AUD: { symbol: 'A$', rate: 0.000094 },
  RUB: { symbol: '₽', rate: 0.0055 }
};

export type CurrencyKey = keyof typeof CURRENCIES;

export const CURRENCY_STORAGE_KEY = 'bali_base_currency';

export const getStoredCurrency = (): CurrencyKey => {
  if (typeof window === 'undefined') return 'IDR';
  try {
    const saved = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return saved && saved in CURRENCIES ? saved as CurrencyKey : 'IDR';
  } catch {
    return 'IDR';
  }
};

export const storeCurrency = (currency: CurrencyKey) => {
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch {
    // Private mode or blocked storage: the choice just won't survive a reload.
  }
};
