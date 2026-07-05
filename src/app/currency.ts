export const CURRENCIES = {
  IDR: { symbol: 'Rp', rate: 1 },
  USD: { symbol: '$', rate: 0.000062 },
  EUR: { symbol: '€', rate: 0.000057 },
  AUD: { symbol: 'A$', rate: 0.000094 },
  RUB: { symbol: '₽', rate: 0.0055 }
};

export type CurrencyKey = keyof typeof CURRENCIES;
