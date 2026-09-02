export type WizardStepKey =
  | 'category'
  | 'subcategory'
  | 'title'
  | 'location'
  | 'photos'
  | 'features'
  | 'pricing'
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
  'contact',
  'preview'
];

const transportScooterFlow: WizardStepKey[] = [
  'category',
  'subcategory',
  'title',
  'location',
  'photos',
  'features',
  'pricing',
  'contact',
  'preview'
];

export const getWizardFlow = (category: string, subCategory: string): WizardStepKey[] => {
  if (category === 'transport' && subCategory === 'scooters') {
    return transportScooterFlow;
  }

  return housingForRentFlow;
};

export const getWizardStepKey = (
  step: number,
  category: string,
  subCategory: string
): WizardStepKey | null => {
  return getWizardFlow(category, subCategory)[step - 1] || null;
};
