import { useMemo, useState } from 'react';
import { Heart, Map, SlidersHorizontal, Star, X } from 'lucide-react';
import { Listing } from '../types';
import ListingCard from './ListingCard';
import { useI18n } from '../i18nContext';
import MapBox from './MapBox';

interface FavoritesTabProps {
  favorites: Listing[];
  currencySymbol: string;
  currencyRate: number;
  onViewListing: (listing: Listing) => void;
  onClose: () => void;
  onLogout: () => void;
  successMsg: string | null;
}

type SortBy = 'popular' | 'price_asc' | 'price_desc' | 'rating_desc' | 'distance_sea' | 'newest';

export default function FavoritesTab({
  favorites,
  currencySymbol,
  currencyRate,
  onViewListing,
  onClose,
  successMsg,
}: FavoritesTabProps) {
  const { tr } = useI18n();
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [showMap, setShowMap] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [hoveredListing, setHoveredListing] = useState<Listing | null>(null);
  const [selectedMapListing, setSelectedMapListing] = useState<Listing | null>(null);

  const districtOptions = useMemo(() => {
    const seen = new Set<string>();
    return favorites.reduce<string[]>((acc, item) => {
      if (!item.district || seen.has(item.district)) return acc;
      seen.add(item.district);
      acc.push(item.district);
      return acc;
    }, []);
  }, [favorites]);

  const activeFavorites = useMemo(() => {
    return favorites.filter((item) => !selectedDistrict || item.district === selectedDistrict);
  }, [favorites, selectedDistrict]);

  const getFavoritePrice = (item: Listing) => {
    if (item.hasDropPrice && item.dropPricePerDay) return item.dropPricePerDay;
    return item.pricePerDay;
  };

  const sortedFavorites = useMemo(() => {
    const list = [...activeFavorites];

    return list.sort((a, b) => {
      if (sortBy === 'price_asc') return getFavoritePrice(a) - getFavoritePrice(b);
      if (sortBy === 'price_desc') return getFavoritePrice(b) - getFavoritePrice(a);

      if (sortBy === 'rating_desc') {
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (b.reviewsCount !== a.reviewsCount) return b.reviewsCount - a.reviewsCount;
        return b.viewsCount - a.viewsCount;
      }

      if (sortBy === 'distance_sea') {
        return (a.distanceToSeaMinutes ?? 15) - (b.distanceToSeaMinutes ?? 15);
      }

      if (sortBy === 'newest') {
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (createdA !== createdB) return createdB - createdA;

        const pushedA = a.pushedAt ? new Date(a.pushedAt).getTime() : 0;
        const pushedB = b.pushedAt ? new Date(b.pushedAt).getTime() : 0;
        if (pushedA !== pushedB) return pushedB - pushedA;

        return b.viewsCount - a.viewsCount;
      }

      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.reviewsCount !== a.reviewsCount) return b.reviewsCount - a.reviewsCount;
      if (b.viewsCount !== a.viewsCount) return b.viewsCount - a.viewsCount;
      return a.title.localeCompare(b.title);
    });
  }, [activeFavorites, sortBy]);

  const selectedDistrictLabel = selectedDistrict;

  const sortOptions = [
    { value: 'popular' as const, label: tr('sort.popular.label'), desc: tr('sort.popular.desc') },
    { value: 'price_asc' as const, label: tr('sort.priceAsc.label'), desc: tr('sort.priceAsc.desc') },
    { value: 'price_desc' as const, label: tr('sort.priceDesc.label'), desc: tr('sort.priceDesc.desc') },
    { value: 'rating_desc' as const, label: tr('sort.rating.label'), desc: tr('sort.rating.desc') },
    { value: 'distance_sea' as const, label: tr('sort.distanceSea.label'), desc: tr('sort.distanceSea.desc') },
    { value: 'newest' as const, label: tr('sort.newest.label'), desc: tr('sort.newest.desc') }
  ];

  const emptyState = (
    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
      <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
        {selectedDistrict ? `${selectedDistrict} • ${tr('favorites.emptyTitle')}` : tr('favorites.emptyTitle')}
      </p>
      <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
        {tr('favorites.emptyBody')}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[500] p-3 sm:p-5">
      <div className="bg-white w-full max-w-2xl h-[85vh] max-h-[640px] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-scale-up border border-[#E5E7EB]">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#EAEAEC] shrink-0">
          <h3 className="font-heading text-[#1E293B] text-base font-extrabold">{tr('favorites.title')}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/70 rounded-full text-gray-400 hover:text-gray-600 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#F4F7F6]">
          {successMsg ? (
            <p className="h-full flex items-center justify-center text-sm font-bold text-gray-700">{successMsg}</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSortDropdown((value) => !value);
                      setShowDistrictDropdown(false);
                    }}
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-[0.5px] border-[#94A3B8]/30 transition active:scale-95 cursor-pointer shadow-xs shrink-0 ${showSortDropdown
                      ? 'bg-[#FF7A50] border-[#FF7A50] text-white shadow-md'
                      : 'bg-white text-[#FF7A50] hover:text-[#E05A30] hover:bg-[#FF7A50]/10'
                      }`}
                    title={tr('sort.title')}
                    aria-label={tr('sort.title')}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>

                  {showSortDropdown && (
                    <>
                      <button
                        type="button"
                        aria-label="Close sort menu"
                        className="fixed inset-0 z-40 cursor-default bg-transparent"
                        onClick={() => setShowSortDropdown(false)}
                      />
                      <div className="absolute top-12 left-0 min-w-[220px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-2 z-50 text-xs text-left animate-scale-up font-sans">
                        <div className="px-3.5 py-1.5 font-extrabold text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100 mb-1">
                          {tr('sort.title')}
                        </div>
                        {sortOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setSortBy(opt.value);
                              setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 hover:bg-[#FF7A50]/10 transition flex flex-col gap-0.5 ${sortBy === opt.value ? 'bg-[#FF7A50]/5 text-[#FF7A50] font-bold' : 'text-[#1E293B]'
                              }`}
                          >
                            <span>{opt.label}</span>
                            <span className={`text-[10px] font-normal ${sortBy === opt.value ? 'text-[#FF7A50]/85' : 'text-gray-400'}`}>
                              {opt.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDistrictDropdown((value) => !value);
                      setShowSortDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-full border-[0.5px] border-[#94A3B8]/30 bg-white text-[#1E293B] hover:text-[#FF7A50] hover:bg-[#FF7A50]/10 transition active:scale-95 cursor-pointer shadow-xs"
                    title={tr('location.chooseDistrict')}
                    aria-label={tr('location.chooseDistrict')}
                  >
                    <Map className="w-4 h-4 text-[#FF7A50] shrink-0" />
                    <span className="truncate text-left font-bold text-sm">
                      {selectedDistrictLabel || tr('favorites.districts')}
                    </span>
                  </button>

                  {showDistrictDropdown && (
                    <>
                      <button
                        type="button"
                        aria-label="Close district menu"
                        className="fixed inset-0 z-40 cursor-default bg-transparent"
                        onClick={() => setShowDistrictDropdown(false)}
                      />
                      <div className="absolute top-12 left-0 min-w-[220px] max-h-[300px] overflow-y-auto bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-2 z-50 text-xs text-left animate-scale-up font-sans">
                        <div className="px-3.5 py-1.5 font-extrabold text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100 mb-1">
                          {tr('favorites.districts')}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDistrict('');
                            setShowDistrictDropdown(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 hover:bg-gray-100 transition font-bold ${!selectedDistrict ? 'text-[#FF7A50] bg-[#FF7A50]/5' : 'text-[#1E293B]'
                            }`}
                        >
                          {tr('location.allDistricts')}
                        </button>
                        {districtOptions.map((dist) => (
                          <button
                            key={dist}
                            type="button"
                            onClick={() => {
                              setSelectedDistrict(dist);
                              setShowDistrictDropdown(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 hover:bg-[#FF7A50]/10 transition ${selectedDistrict === dist ? 'text-[#FF7A50] bg-[#FF7A50]/5 font-bold' : 'text-[#1E293B]'
                              }`}
                          >
                            {dist}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowMap((value) => !value)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full border-[0.5px] border-[#94A3B8]/30 transition active:scale-95 cursor-pointer shadow-xs shrink-0 ${showMap
                    ? 'bg-[#FF7A50] border-[#FF7A50] text-white shadow-md'
                    : 'bg-white text-[#FF7A50] hover:text-[#E05A30] hover:bg-[#FF7A50]/10'
                    }`}
                  title={tr('results.showMap')}
                  aria-label={tr('results.showMap')}
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <span>{tr('favorites.title')}</span>
                <span className="inline-flex items-center gap-1 text-[#FF7A50]">
                  <Star className="w-3 h-3 fill-current" />
                  {sortedFavorites.length}
                </span>
              </div>

              {showMap && sortedFavorites.length > 0 && (
                <div className="rounded-3xl overflow-hidden border border-[#E5E7EB] bg-white shadow-sm">
                  <div className="h-[280px]">
                    <MapBox
                      listings={sortedFavorites}
                      selectedListing={selectedMapListing}
                      hoveredListing={hoveredListing}
                      onListingHover={setHoveredListing}
                      onListingSelect={(listing) => {
                        setSelectedMapListing(listing);
                        onViewListing(listing);
                      }}
                      currencySymbol={currencySymbol}
                      currencyRate={currencyRate}
                      selectedDistricts={selectedDistrict ? [selectedDistrict] : []}
                    />
                  </div>
                </div>
              )}

              {sortedFavorites.length === 0 ? (
                emptyState
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {sortedFavorites.map((item) => (
                    <ListingCard
                      key={item.id}
                      listing={item}
                      onSelect={onViewListing}
                      currencySymbol={currencySymbol}
                      currencyRate={currencyRate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
