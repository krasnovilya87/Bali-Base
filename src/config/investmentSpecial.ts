export type InvestmentValue = string | number | boolean | string[];

export type InvestmentFieldType = 'select' | 'multi' | 'number' | 'boolean' | 'text';

export interface InvestmentOption {
  value: string;
  labelKey: string;
}

export interface InvestmentField {
  id: string;
  labelKey: string;
  type: InvestmentFieldType;
  unitKey?: string;
  options?: InvestmentOption[];
  financial?: boolean;
}

const option = (value: string): InvestmentOption => ({
  value,
  labelKey: `investments.option.${value}`
});

const select = (id: string, values: string[], financial = false): InvestmentField => ({
  id,
  labelKey: `investments.field.${id}`,
  type: 'select',
  options: values.map(option),
  financial
});

const multi = (id: string, values: string[]): InvestmentField => ({
  id,
  labelKey: `investments.field.${id}`,
  type: 'multi',
  options: values.map(option)
});

const number = (id: string, unitKey?: string, financial = false): InvestmentField => ({
  id,
  labelKey: `investments.field.${id}`,
  type: 'number',
  unitKey,
  financial
});

const boolean = (id: string): InvestmentField => ({
  id,
  labelKey: `investments.field.${id}`,
  type: 'boolean',
  options: ['yes', 'no'].map(option)
});

const text = (id: string): InvestmentField => ({
  id,
  labelKey: `investments.field.${id}`,
  type: 'text'
});

export const INVESTMENT_SUBTYPES: Record<string, InvestmentOption[]> = {
  villas: ['villa', 'house', 'apartments', 'townhouse', 'villa_complex', 'reconstruction'].map(option),
  commercial_real_estate: ['hotel_guesthouse', 'restaurant_cafe', 'shop_showroom', 'office', 'coworking', 'salon_spa', 'warehouse_production', 'multipurpose', 'whole_building'].map(option),
  land: ['land_house', 'land_villa_complex', 'land_commercial', 'land_hotel', 'agricultural_land', 'land_with_project', 'land_with_demolition'].map(option),
  business: ['hotel_guesthouse', 'managed_villas', 'restaurant_cafe', 'bar_club', 'salon_spa', 'fitness_yoga', 'shop', 'vehicle_rental', 'coworking', 'tourism_business', 'production', 'online_business', 'other_business'].map(option)
};

export const INVESTMENT_COMMON_FIELDS: InvestmentField[] = [
  select('ownership_type', ['freehold', 'leasehold']),
  number('leasehold_remaining', 'investments.unit.years'),
  boolean('leasehold_extension'),
  select('readiness', ['ready', 'under_construction', 'project']),
  boolean('installment'),
  boolean('income_property'),
  number('declared_yield', 'investments.unit.percent_year', true),
  number('payback_period', 'investments.unit.years', true),
  select('seller_type', ['owner', 'agency', 'developer'])
];

export const INVESTMENT_FIELDS: Record<string, InvestmentField[]> = {
  villas: [
    number('bedrooms'), number('bathrooms'), number('building_area', 'investments.unit.sqm'),
    number('land_area', 'investments.unit.sqm'), select('pool', ['private', 'shared', 'none']),
    select('furnishing', ['fully_furnished', 'partly_furnished', 'unfurnished']),
    select('condition', ['ready', 'under_construction', 'needs_renovation']), number('year_built'),
    boolean('parking'), multi('view', ['ocean', 'rice_fields', 'jungle', 'city']),
    boolean('management_company'), boolean('daily_rental_allowed'), number('occupancy', 'investments.unit.percent'),
    number('average_nightly_rate', 'investments.unit.idr', true), number('current_income', 'investments.unit.idr', true), select('income_period', ['monthly', 'yearly'])
  ],
  commercial_real_estate: [
    number('premises_area', 'investments.unit.sqm'), number('land_area', 'investments.unit.sqm'), number('floors'),
    boolean('separate_entrance'), boolean('parking'), number('capacity'), number('electric_power', 'investments.unit.kva'),
    boolean('water_sewerage'), boolean('ventilation'), boolean('furniture_equipment'), boolean('current_tenant'),
    number('rental_income', 'investments.unit.idr', true), text('premises_purpose'), boolean('repurposing_allowed')
  ],
  land: [
    number('land_area', 'investments.unit.sqm'), number('price_per_are', 'investments.unit.idr'), text('zoning'),
    text('permitted_use'), select('plot_shape', ['regular', 'irregular']), number('access_road_width', 'investments.unit.m'),
    boolean('paved_access'), boolean('electricity'), boolean('water_supply'), select('terrain', ['flat', 'slope']),
    multi('view', ['ocean', 'rice_fields', 'jungle', 'city']), number('distance_to_ocean', 'investments.unit.m'),
    boolean('building_permit'), boolean('project_included'), boolean('plot_division')
  ],
  business: [
    select('business_status', ['operating', 'temporarily_closed']), number('business_age', 'investments.unit.years'),
    number('monthly_revenue', 'investments.unit.idr', true), number('net_profit', 'investments.unit.idr', true), number('employees'),
    select('premises_tenure', ['owned', 'rented']), number('lease_remaining', 'investments.unit.years'),
    boolean('equipment_included'), boolean('inventory_included'), boolean('licenses_included'),
    boolean('social_website_included'), boolean('customer_base_included'), boolean('management_team_stays'),
    text('sale_reason'), select('financial_verification', ['seller_declared', 'documents_verified', 'calculated'])
  ]
};

export const INVESTMENT_EVIDENCE_OPTIONS = ['seller_declared', 'documents_verified', 'calculated'].map(option);

export const getInvestmentFields = (subCategory: string) => [
  ...INVESTMENT_COMMON_FIELDS,
  ...(INVESTMENT_FIELDS[subCategory] || [])
];

export const getInvestmentEvidenceFieldId = (fieldId: string) => `${fieldId}_evidence`;
