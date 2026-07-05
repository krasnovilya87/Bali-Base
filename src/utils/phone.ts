import {
  AsYouType,
  parsePhoneNumberFromString
} from 'libphonenumber-js/core';
import type { CountryCode, PhoneNumber } from 'libphonenumber-js';
import metadata from 'libphonenumber-js/metadata.max.json';
import {
  PHONE_COUNTRY_FORMATS,
  PhoneCountryFormat,
  getPhoneCountryFormat
} from './phoneFormats';

export type PhoneFormatResult = {
  displayValue: string;
  e164Number: string;
  whatsappNumber: string;
  country?: CountryCode;
  countryLabel?: string;
  countryMask?: string;
  isValid: boolean;
};

const countryDisplayNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl
  ? new Intl.DisplayNames(['ru', 'en'], { type: 'region' })
  : null;

const LOCAL_PARSE_PRIORITY: CountryCode[] = ['RU', 'KZ', 'BY', 'UA', 'ID', 'US', 'CA', 'GB'];

const getCountryLabel = (country?: CountryCode) => {
  if (!country) return undefined;
  return countryDisplayNames?.of(country) || country;
};

const normalizePrefix = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith('00')) {
    return `+${trimmed.replace(/\D/g, '').slice(2)}`;
  }
  return trimmed;
};

const toDigits = (value: string) => value.replace(/\D/g, '');

const regexMatches = (value: string, regex: string) => {
  try {
    return new RegExp(regex).test(value.trim());
  } catch {
    return false;
  }
};

const parseInternational = (value: string) => {
  const normalizedValue = normalizePrefix(value);
  if (!normalizedValue.startsWith('+')) return undefined;
  return parsePhoneNumberFromString(normalizedValue, undefined, metadata);
};

const getLocalCandidate = (rawValue: string, format: PhoneCountryFormat) => {
  const digits = toDigits(rawValue);
  if (!digits) return undefined;

  switch (format.iso) {
    case 'RU':
      if (/^89\d{9}$/.test(digits)) return `+7${digits.slice(1)}`;
      if (/^9\d{9}$/.test(digits)) return `+7${digits}`;
      if (/^79\d{9}$/.test(digits)) return `+${digits}`;
      return undefined;
    case 'KZ':
      if (/^87\d{9}$/.test(digits)) return `+7${digits.slice(1)}`;
      if (/^7\d{10}$/.test(digits)) return `+${digits}`;
      return undefined;
    case 'BY':
      if (/^80\d{9}$/.test(digits)) return `+375${digits.slice(2)}`;
      return undefined;
    case 'UA':
      if (/^0\d{9}$/.test(digits)) return `+380${digits.slice(1)}`;
      return undefined;
    case 'US':
    case 'CA':
      if (/^\d{10}$/.test(digits)) return `+1${digits}`;
      if (/^1\d{10}$/.test(digits)) return `+${digits}`;
      return undefined;
    case 'GB':
      if (/^0\d{9,10}$/.test(digits)) return `+44${digits.slice(1)}`;
      if (/^44\d{9,10}$/.test(digits)) return `+${digits}`;
      return undefined;
    case 'ID':
      if (/^0\d{9,13}$/.test(digits)) return `+62${digits.slice(1)}`;
      if (/^62\d{9,13}$/.test(digits)) return `+${digits}`;
      if (/^8\d{8,12}$/.test(digits)) return `+62${digits}`;
      return undefined;
    default:
      if (new RegExp(format.national.regex).test(rawValue.trim()) && format.national.mask.trim().startsWith('0') && digits.startsWith('0')) {
        return `+${format.countryCode}${digits.slice(1)}`;
      }
      if (new RegExp(format.national.regex).test(rawValue.trim())) {
        return `+${format.countryCode}${digits}`;
      }
      return undefined;
  }
};

const parseLocalByLibrary = (value: string) => {
  const digits = toDigits(value);
  if (!digits) return undefined;

  const orderedFormats = [
    ...LOCAL_PARSE_PRIORITY
      .map(country => getPhoneCountryFormat(country))
      .filter((format): format is PhoneCountryFormat => Boolean(format)),
    ...PHONE_COUNTRY_FORMATS.filter(format => !LOCAL_PARSE_PRIORITY.includes(format.iso))
  ];

  for (const format of orderedFormats) {
    const candidate = getLocalCandidate(value, format);
    if (candidate) {
      const parsed = parsePhoneNumberFromString(candidate, undefined, metadata);
      if (format.iso === 'ID' && parsed) return parsed;
      if (parsed?.isValid()) return parsed;
    }

    if (!regexMatches(value, format.national.regex)) continue;

    const parsed = parsePhoneNumberFromString(value, format.iso, metadata);
    if (parsed?.isValid()) return parsed;
  }

  return undefined;
};

const parsePhone = (value: string) => {
  return parseInternational(value) || parseLocalByLibrary(value);
};

export const toWhatsappNumber = (value: string) => value.replace(/[^0-9]/g, '');

const groupIndonesiaRest = (rest: string) => {
  const first = rest.slice(0, 3);
  const tail = rest.slice(3);
  const tailGroups = tail.match(/.{1,4}/g) || [];

  return [first, ...tailGroups].filter(Boolean).join('-');
};

const formatIndonesiaNumber = (rawValue: string, e164Number: string) => {
  const rawDigits = toDigits(rawValue);
  const e164Digits = toDigits(e164Number);
  const rest = e164Digits.startsWith('62') ? e164Digits.slice(2) : e164Digits;
  const formattedRest = groupIndonesiaRest(rest);

  if (rawValue.trim().startsWith('+') || rawValue.trim().startsWith('00') || rawDigits.startsWith('62')) {
    return formattedRest ? `+62 ${formattedRest}` : '+62';
  }

  return formattedRest ? `0${formattedRest}` : '0';
};

const formatDisplayValue = (parsed: PhoneNumber, rawValue: string) => {
  if (parsed.country === 'ID') return formatIndonesiaNumber(rawValue, parsed.number);
  if (parsed.isValid()) return parsed.formatNational();
  const country = parsed.country;
  return country ? new AsYouType(country, metadata).input(rawValue) : rawValue;
};

export const formatPhoneInput = (
  value: string,
  defaultCountry: CountryCode = 'RU'
): PhoneFormatResult => {
  const rawValue = value.trim();
  if (!rawValue) {
    return {
      displayValue: '',
      e164Number: '',
      whatsappNumber: '',
      isValid: false
    };
  }

  const parsed = parsePhone(rawValue);
  if (!parsed) {
    const fallback = normalizePrefix(rawValue);
    const defaultFormat = getPhoneCountryFormat(defaultCountry);
    return {
      displayValue: rawValue,
      e164Number: fallback.startsWith('+') ? fallback.replace(/[^\d+]/g, '') : '',
      whatsappNumber: toWhatsappNumber(fallback),
      country: defaultFormat?.iso,
      countryLabel: getCountryLabel(defaultFormat?.iso),
      countryMask: defaultFormat?.international.mask,
      isValid: false
    };
  }

  const country = parsed.country;
  const countryFormat = getPhoneCountryFormat(country);
  const e164Number = parsed.number;
  const isFormatValid = country === 'ID' && countryFormat
    ? regexMatches(e164Number, countryFormat.international.regex)
    : parsed.isValid();

  return {
    displayValue: formatDisplayValue(parsed, rawValue),
    e164Number,
    whatsappNumber: toWhatsappNumber(e164Number),
    country,
    countryLabel: getCountryLabel(country),
    countryMask: countryFormat?.international.mask,
    isValid: isFormatValid
  };
};
