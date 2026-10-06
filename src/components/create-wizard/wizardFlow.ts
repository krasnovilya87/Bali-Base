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

const detailedTransportFlow: WizardStepKey[] = [
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

const usefulFlow: WizardStepKey[] = housingForRentFlow.filter(step => step !== 'features');

export const getWizardFlow = (category: string, subCategory: string): WizardStepKey[] => {
  if (category === 'transport' && ['scooters', 'motorcycles', 'cars'].includes(subCategory)) {
    return detailedTransportFlow;
  }

  if (category === 'useful') {
    return usefulFlow;
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
