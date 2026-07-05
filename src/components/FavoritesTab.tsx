import { Heart, X } from 'lucide-react';
import { Listing } from '../types';
import ListingCard from './ListingCard';
import { useI18n } from '../i18nContext';

interface FavoritesTabProps {
  favorites: Listing[];
  currencySymbol: string;
  currencyRate: number;
  onViewListing: (listing: Listing) => void;
  onRemoveFavorite: (id: string) => void;
  onClose: () => void;
  onLogout: () => void;
  successMsg: string | null;
}

export default function FavoritesTab({
  favorites,
  currencySymbol,
  currencyRate,
  onViewListing,
  onRemoveFavorite,
  onClose,
  successMsg,
}: FavoritesTabProps) {
  const { tr } = useI18n();

  const content = favorites.length === 0 ? (
    <div className="text-center py-16 bg-[#F4F7F6]/50 rounded-2xl border border-dashed border-gray-200">
      <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
        {tr('favorites.emptyTitle')}
      </p>
      <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
        {tr('favorites.emptyBody')}
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {favorites.map((item) => (
        <ListingCard
          key={item.id}
          listing={item}
          onSelect={onViewListing}
          currencySymbol={currencySymbol}
          currencyRate={currencyRate}
          onFavoriteChange={(listingId, isFavorite) => {
            if (!isFavorite) onRemoveFavorite(listingId);
          }}
        />
      ))}
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
          {successMsg ? <p className="h-full flex items-center justify-center text-sm font-bold text-gray-700">{successMsg}</p> : content}
        </div>
      </div>
    </div>
  );
}
