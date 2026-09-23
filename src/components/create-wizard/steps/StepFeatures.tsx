import React from 'react';
import FeatureYearBuilt from './features/FeatureYearBuilt';
import FeatureSizeRooms from './features/FeatureSizeRooms';
import FeatureInterior from './features/FeatureInterior';
import FeatureObjectType from './features/FeatureObjectType';
import FeatureDensity from './features/FeatureDensity';
import FeatureTerritory from './features/FeatureTerritory';
import FeatureBeds from './features/FeatureBeds';
import FeatureKitchen from './features/FeatureKitchen';
import FeaturePool from './features/FeaturePool';
import FeatureViews from './features/FeatureViews';
import FeatureInternet from './features/FeatureInternet';
import FeatureBathroom from './features/FeatureBathroom';
import FeatureAmenities from './features/FeatureAmenities';
import FeatureCleaning from './features/FeatureCleaning';
import FeaturePreferences from './features/FeaturePreferences';
import FeatureScooterParameters from './features/FeatureScooterParameters';
import FeatureServicesParameters from './features/FeatureServicesParameters';
import FeatureClassifiedParameters from './features/FeatureClassifiedParameters';
import FeatureEventParameters from './features/FeatureEventParameters';
import FeatureInvestmentParameters from './features/FeatureInvestmentParameters';
import { LifeWizardParameters } from '../../life/LifeParameters';

type StepFeaturesProps = Record<string, any>;

const housingFeatureSections = [
  FeatureSizeRooms,
  FeatureInterior,
  FeatureObjectType,
  FeatureDensity,
  FeatureTerritory,
  FeatureBeds,
  FeatureKitchen,
  FeaturePool,
  FeatureViews,
  FeatureInternet,
  FeatureBathroom,
  FeatureAmenities,
  FeatureCleaning,
  FeaturePreferences
];

const StepFeatures: React.FC<StepFeaturesProps> = (props) => {
  const { category, subCategory } = props;

  if (category === 'transport' && subCategory === 'scooters') {
    return <FeatureScooterParameters {...props} />;
  }

  if (category === 'services') {
    return <FeatureServicesParameters {...props} />;
  }

  if (category === 'ads') {
    return <FeatureClassifiedParameters {...props} />;
  }

  if (category === 'afisha') {
    return <FeatureEventParameters {...props} />;
  }

  if (category === 'life') {
    return <LifeWizardParameters subCategory={subCategory} attributes={props.classifiedAttributes} setAttributes={props.setClassifiedAttributes} />;
  }

  if (category === 'investments') {
    return <FeatureInvestmentParameters {...props} />;
  }

  if (category === 'housing') return (
    <div className="space-y-6 animate-fade-in">
      <FeatureYearBuilt {...props} />
      <div className="space-y-6 pt-1">
        {housingFeatureSections.map((Section, index) => (
          <Section key={index} {...props} />
        ))}
      </div>
    </div>
  );

  if (category === 'transport') {
    return <FeatureYearBuilt {...props} />;
  }

  return null;
};

export default StepFeatures;
