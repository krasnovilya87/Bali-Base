import { Listing } from '../../types';
import { ListingSearchSuggestions, SearchGuide } from '../hooks/useListingSearch';

interface SearchSuggestionsProps {
  suggestions: ListingSearchSuggestions;
  tr: (key: string) => string;
  className?: string;
  onListingSelect: (item: Listing) => void;
  onGuideSelect: (guide: SearchGuide) => void;
}

export default function SearchSuggestions({
  suggestions,
  tr,
  className = '',
  onListingSelect,
  onGuideSelect
}: SearchSuggestionsProps) {
  const isEmpty = suggestions.housing.length === 0 && suggestions.transport.length === 0 && suggestions.guides.length === 0;

  return (
    <div
      className={`absolute top-11 inset-x-0 z-[9999] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden text-xs max-h-[350px] overflow-y-auto p-4 space-y-4 ${className}`}
    >
      {suggestions.housing.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold text-gray-400 block pb-1 border-b border-gray-100">
            🏠 {tr('search.housing')} ({suggestions.housing.length})
          </span>
          {suggestions.housing.map(item => (
            <div
              key={item.id}
              onClick={() => onListingSelect(item)}
              className="p-1 px-2 rounded-lg hover:bg-[#2F7D69]/5 cursor-pointer flex justify-between text-[#1E293B]"
            >
              <span className="font-semibold">{item.title}</span>
              <span className="text-[10px] text-gray-400">{item.district}</span>
            </div>
          ))}
        </div>
      )}

      {suggestions.transport.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold text-amber-600 block pb-1 border-b border-gray-100">
            🛵 {tr('search.transport')} ({suggestions.transport.length})
          </span>
          {suggestions.transport.map(item => (
            <div
              key={item.id}
              onClick={() => onListingSelect(item)}
              className="p-1 px-2 rounded-lg hover:bg-amber-50/50 cursor-pointer flex justify-between text-[#1E293B]"
            >
              <span className="font-semibold">{item.title}</span>
              <span className="text-[10px] text-gray-400">{item.district}</span>
            </div>
          ))}
        </div>
      )}

      {suggestions.guides.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold text-blue-600 block pb-1 border-b border-gray-100">
            📘 {tr('search.guides')} ({suggestions.guides.length})
          </span>
          {suggestions.guides.map(guide => (
            <div
              key={guide.id}
              onClick={() => onGuideSelect(guide)}
              className="p-1 px-2 rounded-lg hover:bg-blue-50/50 cursor-pointer flex flex-col gap-0.5"
            >
              <span className="font-semibold text-gray-800">{guide.title}</span>
              <span className="text-[9px] text-gray-400 line-clamp-1">{guide.description}</span>
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="text-center py-4 text-gray-400">
          {tr('search.empty')}
        </div>
      )}
    </div>
  );
}
