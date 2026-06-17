import React from 'react';
import { Listing } from '../types';

type CompetitorPlatform = NonNullable<Listing['competitorPlatform']>;

const LOGO_URLS: Partial<Record<CompetitorPlatform, string>> = {
  Booking: 'https://firebasestorage.googleapis.com/v0/b/bali-base-90ca8.firebasestorage.app/o/logo%2FBooking.com_logo.svg?alt=media&token=eb07b7cd-05a1-4884-99ef-a298eb71f7f7',
  Traveloka: 'https://firebasestorage.googleapis.com/v0/b/bali-base-90ca8.firebasestorage.app/o/logo%2FTraveloka.svg?alt=media&token=e44b3536-f82e-4541-b362-af2105fed442',
  'Trip.com': 'https://firebasestorage.googleapis.com/v0/b/bali-base-90ca8.firebasestorage.app/o/logo%2FTrip.com_logo.svg?alt=media&token=cec6be0b-7c7e-4c4f-a94e-ac2fea6a3bba',
  Agoda: 'https://firebasestorage.googleapis.com/v0/b/bali-base-90ca8.firebasestorage.app/o/logo%2Fagoda-1.svg?alt=media&token=e6c21cbd-6032-4cc5-a8fb-28aa52a18c16',
  Airbnb: 'https://firebasestorage.googleapis.com/v0/b/bali-base-90ca8.firebasestorage.app/o/logo%2Fairbnb.svg?alt=media&token=4f5fcd34-6254-4185-a21a-5715a6c2b221',
  'Only Facebook': 'https://firebasestorage.googleapis.com/v0/b/bali-base-90ca8.firebasestorage.app/o/logo%2Ffacebook.svg?alt=media&token=d3cb3de1-29a6-4cc7-8d55-5bb0c0074610'
};

const TEXT_BADGE_CLASSES: Partial<Record<CompetitorPlatform, string>> = {
  'Only Facebook': 'bg-[#1877F2]'
};

type CompetitorLogoProps = {
  platform?: Listing['competitorPlatform'];
  size?: 'sm' | 'md';
};

const CompetitorLogo: React.FC<CompetitorLogoProps> = ({ platform = 'Booking', size = 'sm' }) => {
  const logoUrl = LOGO_URLS[platform];
  const heightClass = size === 'md' ? 'h-5' : 'h-4';

  if (logoUrl) {
    return (
      <span className="inline-flex items-center justify-center">
        <img
          src={logoUrl}
          alt={platform}
          className={`${heightClass} max-w-[74px] object-contain`}
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${TEXT_BADGE_CLASSES[platform] || 'bg-gray-700'} text-white text-[9.5px] font-extrabold px-2 py-0.5 rounded tracking-wide leading-none select-none shadow-xs`}>
      {platform === 'Only Facebook' ? 'Facebook' : platform}
    </span>
  );
};

export default CompetitorLogo;
