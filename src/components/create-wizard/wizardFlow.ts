export type WizardStepKey =
  | 'category'
  | 'subcategory'
  | 'title'
  | 'location'
  | 'photos'
  | 'features'
  | 'pricing'
  | 'ical'
  | 'contact'
  | 'preview';

const housingForRentFlow: WizardStepKey[] = [
  'category',
  'subcategory',
  'title',
  'location',
  'photos',
  'features',
  'pricing',
  'ical',
  'contact',
  'preview'
];

export const getWizardFlow = (_category: string, _subCategory: string): WizardStepKey[] => {
  return housingForRentFlow;
};

export const getWizardStepKey = (
  step: number,
  category: string,
  subCategory: string
): WizardStepKey | null => {
  return getWizardFlow(category, subCategory)[step - 1] || null;
};
