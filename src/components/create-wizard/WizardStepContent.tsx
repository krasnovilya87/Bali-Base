import React from 'react';
import StepCategory from './steps/StepCategory';
import StepSubcategory from './steps/StepSubcategory';
import StepTitle from './steps/StepTitle';
import StepLocation from './steps/StepLocation';
import StepPhotos from './steps/StepPhotos';
import StepFeatures from './steps/StepFeatures';
import StepPricing from './steps/StepPricing';
import StepIcal from './steps/StepIcal';
import StepContact from './steps/StepContact';
import StepPreview from './steps/StepPreview';
import { getWizardStepKey } from './wizardFlow';

type WizardStepContentProps = Record<string, any>;

const WizardStepContent: React.FC<WizardStepContentProps> = (p) => {
  const {
    categoryState,
    locationState,
    photoState,
    featureState,
    pricingState,
    icalState,
    contactState,
    previewState
  } = p;
  const stepKey = getWizardStepKey(p.step, categoryState.category, categoryState.subCategory);

  switch (stepKey) {
    case 'category':
      return <StepCategory categoriesList={categoryState.categoriesList} category={categoryState.category} onSelectCategory={categoryState.handleSelectCategory} setStep={categoryState.setStep} />;
    case 'subcategory':
      return <StepSubcategory subcategories={categoryState.subcategories} subCategory={categoryState.subCategory} setSubCategory={categoryState.setSubCategory} setStep={categoryState.setStep} />;
    case 'title':
      return (
        <StepTitle
          category={categoryState.category}
          subCategory={categoryState.subCategory}
          title={categoryState.title}
          setTitle={categoryState.setTitle}
          description={categoryState.description}
          setDescription={categoryState.setDescription}
          getSeoLengthVerdict={categoryState.getSeoLengthVerdict}
          roomType={categoryState.roomType}
          setRoomType={categoryState.setRoomType}
          unitType={categoryState.unitType}
          setUnitType={categoryState.setUnitType}
          roomCount={categoryState.roomCount}
          setRoomCount={categoryState.setRoomCount}
          // location helpers for link parsing and suggestions
          mapSuggestions={locationState.mapSuggestions}
          showSuggestionsDropdown={locationState.showSuggestionsDropdown}
          setShowSuggestionsDropdown={locationState.setShowSuggestionsDropdown}
          handleAddressChange={locationState.handleAddressChange}
          triggerDirectSearch={locationState.triggerDirectSearch}
          handleSelectSuggestion={locationState.handleSelectSuggestion}
          setAddress={locationState.setAddress}
          setPickedCoords={locationState.setPickedCoords}
          isSearchingMap={locationState.isSearchingMap}
        />
      );
    case 'location':
      return <StepLocation {...locationState} />;
    case 'photos':
      return <StepPhotos {...photoState} />;
    case 'features':
      return <StepFeatures {...featureState} />;
    case 'pricing':
      return <StepPricing {...pricingState} />;
    case 'ical':
      return <StepIcal {...icalState} />;
    case 'contact':
      return <StepContact {...contactState} />;
    case 'preview':
      return <StepPreview {...previewState} />;
    default:
      return null;
  }
};

export default WizardStepContent;
