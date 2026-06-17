import React from 'react';
import ListingCard from '../../ListingCard';
import { Listing } from '../../../types';

type StepPreviewProps = {
  buildListing: (id: string) => Listing;
  currencySymbol: string;
  currencyRate: number;
};

const StepPreview: React.FC<StepPreviewProps> = ({
  buildListing,
  currencySymbol,
  currencyRate
}) => (
  <div className="space-y-4 animate-fade-in">
    <div className="w-full max-w-sm mx-auto">
      <ListingCard
        listing={buildListing('listing-preview')}
        onSelect={() => {}}
        currencySymbol={currencySymbol}
        currencyRate={currencyRate}
      />
    </div>
  </div>
);

export default StepPreview;
