import React from 'react';
import type { ClassifiedSpecialValue } from '../../../../config/classifiedSpecial';
import { EventWizardParameters } from '../../../afisha/EventParameters';

type FeatureEventParametersProps = {
  subCategory: string;
  classifiedAttributes: Record<string, ClassifiedSpecialValue>;
  setClassifiedAttributes: React.Dispatch<React.SetStateAction<Record<string, ClassifiedSpecialValue>>>;
};

const FeatureEventParameters: React.FC<FeatureEventParametersProps> = ({
  subCategory,
  classifiedAttributes,
  setClassifiedAttributes
}) => (
  <EventWizardParameters
    subCategory={subCategory}
    attributes={classifiedAttributes}
    setAttributes={setClassifiedAttributes}
  />
);

export default FeatureEventParameters;
