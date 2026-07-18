import React from 'react';
import { Listing, ListingNearbySpot } from '../../types';
import { THEME } from '../../theme';
import { DetailMapPlace } from '../DetailMap';
import DetailMap from '../DetailMap';
import { Star, ShieldAlert } from 'lucide-react';
import { calculateGraphDailyPrice, calculateGraphTotalPrice, calculateSavingsDisplay } from '../../utils/pricing';
import { LanguageCode } from '../../i18n';
import TranslatedReviewText from './TranslatedReviewText';

type SectionId = 'description' | 'characteristics' | 'amenities' | 'nearby' | 'location' | 'reviews' | 'reportProblem';

interface SectionItem {
  key: string;
  icon: string;
  label: string;
  value: string;
}

interface AmenityGroup {
  key: string;
  name: string;
  config: {
    label: string;
    icon: string;
  };
}

interface ListingDetailsSectionsProps {
  listing: Listing;
  currencySymbol: string;
  currencyRate: number;
  diffDays: number;
  translatedDescription: string;
  isTranslating: boolean;
  housingDetailCharacteristics: SectionItem[];
  housingDetailAmenities: AmenityGroup[] | null;
  displayNearbySpots: ListingNearbySpot[];
  nearbyLoading: boolean;
  routeError: string;
  selectedNearbyIndex: number | null;
  onNearbySpotClick: (spot: ListingNearbySpot, index: number) => void;
  renderNearbyDescription: (desc: string) => string;
  mapPlaces: DetailMapPlace[];
  activeNearbyRoute: any;
  detailMapSelectedPlaceIndex: number | null;
  onProblemReportOpen: () => void;
  activeLanguage: LanguageCode;
  sections?: SectionId[];
  tr: (key: string, params?: Record<string, string | number>) => string;
}

const DEFAULT_SECTIONS: SectionId[] = [
  'description',
  'characteristics',
  'amenities',
  'nearby',
  'location',
  'reviews',
  'reportProblem',
];

const SECTION_SET = new Set<SectionId>(DEFAULT_SECTIONS);

const isSectionEnabled = (sections: SectionId[] | undefined, section: SectionId) =>
  (sections || DEFAULT_SECTIONS).includes(section) && SECTION_SET.has(section);

export default function ListingDetailsSections({
  listing,
  currencySymbol,
  currencyRate,
  diffDays,
  translatedDescription,
  isTranslating,
  housingDetailCharacteristics,
  housingDetailAmenities,
  displayNearbySpots,
  nearbyLoading,
  routeError,
  selectedNearbyIndex,
  onNearbySpotClick,
  renderNearbyDescription,
  mapPlaces,
  activeNearbyRoute,
  detailMapSelectedPlaceIndex,
  onProblemReportOpen,
  activeLanguage,
  sections,
  tr,
}: ListingDetailsSectionsProps) {
  const baseDailyPrice = listing.hasDropPrice && listing.dropPricePerDay ? listing.dropPricePerDay : listing.pricePerDay;
  const baseMonthlyPrice = listing.hasDropPrice && listing.dropPricePerMonth ? listing.dropPricePerMonth : listing.pricePerMonth;
  const activeDailyPrice = calculateGraphDailyPrice({ days: diffDays, pricePerDay: baseDailyPrice, pricePerMonth: baseMonthlyPrice });
  const totalBudget = calculateGraphTotalPrice({ days: diffDays, pricePerDay: baseDailyPrice, pricePerMonth: baseMonthlyPrice });
  const activeCompetitorPrice = listing.bookingComPrice ? listing.bookingComPrice * diffDays : 0;
  const { hasSavings, savingsAmount, savingsPercent, showSavingsPercent } = calculateSavingsDisplay({
    stayDays: diffDays,
    competitorPrice: activeCompetitorPrice,
    directPrice: totalBudget,
  });

  return (
    <div className="lg:col-span-2 space-y-7">
      {isSectionEnabled(sections, 'description') && (
        <section className={`space-y-4 ${THEME.fonts.main}`}>
          <div className="space-y-4">
            <h3 className="font-display text-base font-extrabold text-[#1E293B]">{tr('details.descriptionTitle')}</h3>
            <div className="bg-[#F4F7F6] p-5 rounded-[24px] border border-[#E5E7EB]">
              {isTranslating ? (
                <div className="text-xs text-gray-400 font-medium">{tr('common.loading')}</div>
              ) : (
                <p className="text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                  {translatedDescription || listing.description}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {isSectionEnabled(sections, 'characteristics') && (
        <section className="space-y-4 pt-1">
          <h3 className={`text-base font-extrabold text-[#1E293B] ${THEME.fonts.heading}`}>{tr('details.characteristicsTitle')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {housingDetailCharacteristics.map(item => (
              <div key={item.key} className="bg-[#F4F7F6] rounded-2xl border border-[#E5E7EB] p-3.5 space-y-1">
                <div className="text-lg leading-none">{item.icon}</div>
                <div className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">{item.label}</div>
                <div className="text-sm font-bold text-[#1E293B]">{item.value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {isSectionEnabled(sections, 'amenities') && (
        <section className="space-y-4 pt-1">
          <h3 className={`text-base font-extrabold text-[#1E293B] ${THEME.fonts.heading}`}>{tr('details.amenitiesTitle')}</h3>
          <div className="space-y-3">
            {(housingDetailAmenities || []).map(group => (
              <div key={group.key} className="bg-[#F4F7F6] p-4 rounded-[24px] border border-[#E5E7EB]">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-lg leading-none">{group.config.icon}</span>
                  <span className="text-xs font-extrabold text-[#1E293B] uppercase tracking-wide">{group.config.label}</span>
                </div>
                <div className="text-sm text-[#1E293B] font-medium">{group.config.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {isSectionEnabled(sections, 'nearby') && (
        <section className="space-y-3">
          <h3 className={`text-base font-extrabold text-[#1E293B] ${THEME.fonts.heading}`}>{tr('details.nearbyTitle')}</h3>
          {nearbyLoading && (
            <div className="text-[10px] font-bold text-[#2F7D69] bg-[#2F7D69]/10 rounded-full px-3 py-1 w-fit">
              Google Maps...
            </div>
          )}
          {routeError && (
            <div className="text-[10px] font-bold text-[#FF3B30] bg-[#FF3B30]/10 rounded-full px-3 py-1 w-fit">
              {routeError}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {displayNearbySpots.map((spot, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onNearbySpotClick(spot, idx)}
                className={`pl-nearby nearby-pill min-h-[82px] p-2.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition ${selectedNearbyIndex === idx ? 'selected' : ''} cursor-pointer`}
              >
                <span className="text-lg sm:text-xl select-none leading-none">{spot.emoji}</span>
                <span className="listing-pill-main-text">{spot.title}</span>
                <span className="text-[9.5px] sm:text-[10px] text-gray-400 line-clamp-2 leading-tight">{renderNearbyDescription(spot.desc)}</span>
                {spot.time && <span className="text-[9.5px] sm:text-[10px] text-[#1E293B] font-semibold leading-tight">{spot.time}</span>}
                {spot.note && (
                  <span className={`text-[8px] font-extrabold text-[#2F7D69] bg-[#2F7D69]/10 border border-[#2F7D69]/20 px-1.5 py-0.5 rounded tracking-wider leading-none ${THEME.fonts.heading}`}>
                    {spot.note}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {isSectionEnabled(sections, 'location') && (
        <section className="space-y-4 pt-1">
          <h3 className="font-display text-[#1E293B] text-base font-extrabold">{tr('details.locationTitle')}</h3>
          <DetailMap
            listing={listing}
            currencySymbol={currencySymbol}
            currencyRate={currencyRate}
            mapPlaces={mapPlaces}
            activeRoute={activeNearbyRoute}
            selectedPlaceIndex={detailMapSelectedPlaceIndex}
          />
        </section>
      )}

      {isSectionEnabled(sections, 'reviews') && listing.reviews?.length > 0 && (
        <section className="space-y-4 pt-1">
          <h3 className="font-display text-[#1E293B] text-base font-extrabold">{tr('details.reviewsTitle')}</h3>
          <div className="space-y-3">
            {listing.reviews.map(review => (
              <div key={review.id} className="bg-[#F4F7F6] p-5 rounded-[24px] border border-[#E5E7EB] space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <img src={review.avatar} alt="Author" className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB]" referrerPolicy="no-referrer" />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-gray-800 block">{review.authorName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{review.date}</span>
                    </div>
                  </div>
                  <div className="flex bg-amber-50 px-2 py-0.5 rounded font-mono text-xs font-semibold text-amber-700 items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{review.rating.toFixed(1)}</span>
                  </div>
                </div>
                <TranslatedReviewText review={review} activeLanguage={activeLanguage} tr={tr} />
                {review.cleanlinessLabels && review.cleanlinessLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {review.cleanlinessLabels.map(label => (
                      <span key={label} className="text-[9px] font-bold text-[#FF7A50] bg-[#2F7D69]/10 px-2 py-0.5 rounded-md border border-[#2F7D69]/20">
                        вњ“ {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {isSectionEnabled(sections, 'reportProblem') && (
        <section className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onProblemReportOpen}
            title={tr('details.problem.tooltip')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-bold transition border bg-[#FFF7F2] text-[#FF7A50] border-[#FFD8C9] hover:bg-[#FF7A50]/10 hover:border-[#FF7A50]/40"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{tr('details.reportProblem')}</span>
          </button>
        </section>
      )}
    </div>
  );
}
