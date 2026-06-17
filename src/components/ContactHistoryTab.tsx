import { LogOut, MessageSquare, Trash2, X } from 'lucide-react';
import { Listing } from '../types';

export interface ContactHistoryItem {
  id: string;
  title?: string;
  pricePerDay?: number;
  image?: string;
  district?: string;
  clickedAt?: string;
}

interface ContactHistoryTabProps {
  history: ContactHistoryItem[];
  listings: Listing[];
  currencySymbol: string;
  currencyRate: number;
  onViewListing: (listing: Listing) => void;
  onClear: () => void;
  onClose: () => void;
  onLogout: () => void;
  successMsg: string | null;
}

export default function ContactHistoryTab({
  history,
  listings,
  currencySymbol,
  currencyRate,
  onViewListing,
  onClear,
  onClose,
  onLogout,
  successMsg,
}: ContactHistoryTabProps) {
  const formatPrice = (priceIdr: number) =>
    Math.round(priceIdr * currencyRate).toLocaleString();

  const content = (
    <div className="space-y-3">
      <div className="flex justify-between items-center shrink-0 mb-1">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          Объекты, по которым велся диалог в WhatsApp
        </span>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer transition"
          >
            <Trash2 className="w-3 h-3" />
            Очистить всё
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-[#F4F7F6]/50 rounded-2xl border border-dashed border-gray-200">
          <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            История контактов пуста
          </p>
          <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
            Здесь будут объявления, по которым вы отправляли запросы в WhatsApp.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              onClick={() => {
                const listing = listings.find((candidate) => candidate.id === item.id);
                if (listing) {
                  onViewListing(listing);
                } else {
                  alert('Данное объявление больше не существует на платформе.');
                }
              }}
              className="p-3 bg-white border border-[#E5E7EB] hover:border-emerald-400 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:shadow-sm transition duration-150 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-11 h-11 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title || 'Объявление'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-[9px] uppercase font-mono">
                      No img
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#1E293B] truncate leading-tight group-hover:text-emerald-600 transition-colors">
                    {item.title || 'Объявление'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[9px] text-[#2F7D69] font-bold font-mono mt-1">
                    <span className="bg-[#2F7D69]/5 border border-[#2F7D69]/10 px-1 rounded uppercase">
                      {item.district}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-400 font-normal">
                      {item.clickedAt ? new Date(item.clickedAt).toLocaleDateString() : 'Недавно'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                <span className="text-xs font-extrabold text-[#1E293B] font-mono leading-none">
                  {formatPrice(item.pricePerDay || 0)} {currencySymbol}
                </span>
                <span className="text-[8px] text-emerald-500 font-semibold uppercase tracking-wider mt-1 border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  WhatsApp <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[500] p-3 sm:p-5">
      <div className="bg-white w-full max-w-2xl h-[85vh] max-h-[640px] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-scale-up border border-[#E5E7EB]">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#EAEAEC] shrink-0">
          <div>
            <h3 className="font-heading text-[#1E293B] text-base font-extrabold">История контактов</h3>

          </div>
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
