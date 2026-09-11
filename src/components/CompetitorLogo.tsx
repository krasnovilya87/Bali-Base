import React from 'react';
import { Listing } from '../types';

type CompetitorPlatform = NonNullable<Listing['competitorPlatform']>;

const LOGO_URLS: Partial<Record<CompetitorPlatform, string>> = {
  Booking: '/logo/booking-com.svg',
  Traveloka: '/logo/traveloka.svg',
  'Trip.com': '/logo/trip-com.svg',
  Agoda: '/logo/agoda.svg',
  Airbnb: '/logo/airbnb.svg',
  'Only Facebook': '/logo/facebook.svg'
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
  const heightClass = platform === 'Booking'
    ? (size === 'md' ? 'h-[12px]' : 'h-[10.5px]')
    : platform === 'Traveloka'
      ? (size === 'md' ? 'h-[17px]' : 'h-[13px]')
      : (size === 'md' ? 'h-5' : 'h-4');
  const alignmentClass = platform === 'Traveloka' ? '-translate-y-[2px]' : platform === 'Booking' ? 'translate-y-px' : '';

  if (logoUrl) {
    return (
      <span className="inline-flex items-center justify-center">
        <img
          src={logoUrl}
          alt={platform}
          className={`${heightClass} max-w-[74px] object-contain ${alignmentClass}`}
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
