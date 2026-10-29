// The site's listing fields for the 4 Telegram import sections (market, services, afisha, life), built from
// the same config files the site uses, so the import always fills the current subcategories and options.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLASSIFIED_GENERIC_SPECIAL_FIELDS,
  CLASSIFIED_SPECIAL_CONFIG,
  getClassifiedSpecialTranslations
} from '../../config/classifiedSpecial';
import {
  EVENT_CATEGORY_FIELDS,
  EVENT_COMMON_FIELDS,
  EVENT_REGISTRATION_URL_FIELD,
  EVENT_START_TIME_FIELD,
  getEventSpecialTranslations
} from '../../config/eventSpecial';
import { LIFE_FIELDS, getLifeSpecialTranslations } from '../../config/lifeSpecial';
import { SERVICE_SUBCATEGORIES } from '../../config/serviceSubcategories';
import { MARKET_OTHER_BRANDS } from '../../config/marketOtherCatalog';
import { MARKET_SPORTS_BRANDS } from '../../config/marketSportsCatalog';
import { ELECTRONICS_BRANDS } from '../../config/electronicsCatalog';
import { MARKET_TRANSPORT_BRANDS } from '../../config/transportCatalog';

const APP_SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export type SchemaOption = { value: string; label: string };
export type SchemaField = {
  id: string;
  label: string;
  kind: string;
  multiple?: boolean;
  unit?: string;
  productTypes?: string[];
  options?: SchemaOption[];
};
export type AdsSubcategory = {
  id: string;
  group: string;
  label: string;
  productTypes: SchemaOption[];
  fields: SchemaField[];
  brands: string[];
};
export type SiteSchema = {
  ads: { common: Record<'condition' | 'fulfillment' | 'audience' | 'level', string[]>; subcategories: AdsSubcategory[] };
  services: {
    common: Record<'formats' | 'languages' | 'priceType' | 'availability' | 'providerType', string[]>;
    subcategories: Array<{ id: string; label: string; subcategories: Array<{ id: string; label: string }> }>;
  };
  afisha: { common: SchemaField[]; subcategories: Array<{ id: string; label: string; fields: SchemaField[] }> };
  life: { subcategories: Array<{ id: string; label: string; fields: SchemaField[] }> };
  districts: string[];
};

type RawField = {
  id: string;
  labelKey: string;
  kind?: string;
  inputType?: string;
  multiple?: boolean;
  unit?: string;
  options?: Array<{ value: string; labelKey: string }>;
  productTypes?: string[];
};

const toField = (field: RawField, labels: Record<string, string>): SchemaField => ({
  id: field.id,
  label: labels[field.labelKey] || field.id,
  kind: field.kind || (field.options?.length ? 'select' : field.inputType || 'text'),
  multiple: field.multiple || undefined,
  unit: field.unit,
  productTypes: field.productTypes?.length ? field.productTypes : undefined,
  options: field.options?.length
    ? field.options.map(option => ({ value: option.value, label: labels[option.labelKey] || option.value }))
    : undefined
});

// menu.ts imports images, so its subcategory lists are read as text instead of imported.
const readMenuBlock = (menuText: string, constName: string) => {
  const start = menuText.indexOf(`export const ${constName}`);
  const body = menuText.slice(start, menuText.indexOf('\n};', start));
  const groups: Record<string, Array<{ id: string; label: string }>> = {};
  let current = '';
  for (const line of body.split('\n')) {
    const group = line.match(/^ {2}([a-z_]+): \[/);
    if (group) {
      current = group[1];
      groups[current] = [];
      continue;
    }
    const item = line.match(/id: '([a-z_]+)', label: (?:'([^']*)'|"([^"]*)")/);
    if (item && current) groups[current].push({ id: item[1], label: item[2] ?? item[3] });
  }
  return groups;
};

const brandNames = (catalog: Record<string, unknown>) => Object.fromEntries(
  Object.entries(catalog).map(([subCategory, brands]) => [
    subCategory,
    Array.isArray(brands) ? brands.map((brand: { name: string }) => brand.name) : Object.keys(brands as object)
  ])
);

let cached: SiteSchema | null = null;

export const getSiteSchema = (): SiteSchema => {
  if (cached) return cached;
  const classifiedEn = getClassifiedSpecialTranslations('en');
  const eventEn = getEventSpecialTranslations('en');
  const lifeEn = getLifeSpecialTranslations('en');
  const menuText = readFileSync(path.join(APP_SRC, 'app/menu.ts'), 'utf8');
  const adsL3 = readMenuBlock(menuText, 'ADS_L3_SUBCATEGORIES');
  const l2 = readMenuBlock(menuText, 'SUBCATEGORIES_MAP');
  const brands: Record<string, string[]> = {
    ...brandNames(MARKET_OTHER_BRANDS),
    ...brandNames(MARKET_SPORTS_BRANDS),
    ...brandNames(ELECTRONICS_BRANDS as Record<string, unknown>),
    ...brandNames(MARKET_TRANSPORT_BRANDS as Record<string, unknown>)
  };

  cached = {
    ads: {
      common: {
        condition: ['new', 'like_new', 'good', 'fair', 'needs_repair', 'for_parts'],
        fulfillment: ['pickup', 'delivery_available', 'shipping_indonesia'],
        audience: ['men', 'women', 'unisex', 'kids'],
        level: ['beginner', 'intermediate', 'advanced', 'professional']
      },
      subcategories: Object.entries(adsL3).flatMap(([group, items]) => items.map(item => {
        const config = CLASSIFIED_SPECIAL_CONFIG[item.id];
        return {
          id: item.id,
          group,
          label: item.label,
          productTypes: config?.productTypes.map(option => ({ value: option.value, label: classifiedEn[option.labelKey] || option.value })) || [],
          fields: [...(config?.fields || []), ...CLASSIFIED_GENERIC_SPECIAL_FIELDS].map(field => toField(field, classifiedEn)),
          brands: brands[item.id] || []
        };
      }))
    },
    services: {
      common: {
        formats: ['provider_place', 'client_visit', 'online', 'specified_place'],
        languages: ['ru', 'en', 'id', 'other'],
        priceType: ['fixed', 'from', 'hourly', 'per_lesson', 'project', 'negotiable'],
        availability: ['appointment', 'today', '24_7'],
        providerType: ['private_specialist', 'team', 'company']
      },
      subcategories: l2.services.map(item => ({
        id: item.id,
        label: item.label,
        subcategories: (SERVICE_SUBCATEGORIES[item.id] || []).map(option => ({ id: option.id, label: option.en }))
      }))
    },
    afisha: {
      common: [EVENT_START_TIME_FIELD, EVENT_REGISTRATION_URL_FIELD, ...EVENT_COMMON_FIELDS]
        .filter(field => field.id !== 'afisha_publication_term')
        .map(field => toField(field, eventEn)),
      subcategories: l2.afisha.map(item => ({
        id: item.id,
        label: item.label,
        fields: (EVENT_CATEGORY_FIELDS[item.id] || []).map(field => toField(field, eventEn))
      }))
    },
    life: {
      subcategories: l2.life.map(item => ({
        id: item.id,
        label: item.label,
        fields: (LIFE_FIELDS[item.id] || []).map(field => toField(field as RawField, lifeEn))
      }))
    },
    districts: JSON.parse(readFileSync(path.resolve(APP_SRC, '../area.geojson'), 'utf8'))
      .features.map((feature: { properties: { name: string } }) => feature.properties.name)
  };
  return cached;
};
