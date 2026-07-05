import React, { useState } from 'react';
import { Calendar, Flame, X } from 'lucide-react';
import { Listing } from '../../types';
import TwoMonthCalendar from '../TwoMonthCalendar';
import { useI18n } from '../../i18nContext';

interface DropPriceModalProps {
  listing: Listing;
  onChange: (listing: Listing) => void;
  onClose: () => void;
}

export default function DropPriceModal({ listing, onChange, onClose }: DropPriceModalProps) {
  const { tr } = useI18n();
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const update = (changes: Partial<Listing>) => onChange({ ...listing, ...changes });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[510] p-4 animate-fade-in" id="promote-dropprice-modal">
      <div className="pu max-w-sm w-full rounded-2xl p-5 border border-amber-100 shadow-2xl space-y-4 animate-scale-up text-[#1E293B]">
        <div className="pu-header -mx-5 -mt-5 px-5 py-4 flex justify-between items-center border-b border-[#D1D5DB]/30">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="font-display font-black text-sm uppercase">{tr('dropPrice.title')}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pu-body space-y-3.5">


          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-xs font-bold text-gray-600">{tr('dropPrice.enable')}</span>
            <input
              type="checkbox"
              checked={listing.hasDropPrice}
              onChange={(event) => {
                const enabled = event.target.checked;
                update({
                  hasDropPrice: enabled,
                  ...enabled && !listing.dropPricePerDay
                    ? {
                      dropPricePerDay: Math.round(listing.pricePerDay * 0.8),
                      dropPriceEndsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
                    }
                    : {}
                });
              }}
              className="w-4 h-4 accent-[#FF7A50] text-[#FF7A50] focus:ring-[#FF7A50] rounded cursor-pointer"
            />
          </div>

          {listing.hasDropPrice && (
            <>
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-gray-600 block">{tr('dropPrice.oldPrice')}</label>
                <div className="p-2 border border-gray-150 bg-gray-50 text-gray-400 font-mono text-xs rounded-xl">
                  {listing.pricePerDay.toLocaleString()} IDR
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-gray-600 block">{tr('dropPrice.newPrice')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={listing.dropPricePerDay ? listing.dropPricePerDay.toLocaleString('ru-RU') : ''}
                  onChange={(event) => {
                    const numericValue = event.target.value.replace(/\D/g, '');
                    update({ dropPricePerDay: numericValue ? Number(numericValue) : 0 });
                  }}
                  className="w-full bg-white border border-gray-200 p-2 text-xs font-mono rounded-xl focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-gray-600 block">{tr('dropPrice.until')}</label>
                <button
                  type="button"
                  onClick={() => setShowDateCalendar(true)}
                  className="w-full bg-white border border-gray-200 p-2 text-xs font-mono rounded-xl hover:border-[#FF7A50] focus:border-[#FF7A50] focus:outline-none flex items-center justify-between gap-2 text-left transition"
                >
                  <span className={listing.dropPriceEndsAt ? 'text-gray-700' : 'text-gray-400'}>
                    {listing.dropPriceEndsAt
                      ? new Date(listing.dropPriceEndsAt).toLocaleDateString('ru-RU')
                      : tr('dropPrice.chooseDate')}
                  </span>
                  <Calendar className="w-4 h-4 text-[#FF7A50] shrink-0" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="pu-footer -mx-5 -mb-5 px-5 py-4 border-t border-[#D1D5DB]/30">
          <button onClick={onClose} className="w-full py-2 bg-[#FF7A50] hover:bg-[#E05A30] text-white text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer shadow-md">
            {tr('dropPrice.save')}
          </button>
        </div>
      </div>

      {showDateCalendar && (
        <>
          <div
            className="fixed inset-0 z-[519] bg-black/40"
            onClick={() => setShowDateCalendar(false)}
          />
          <div className="relative z-[520]">
            <TwoMonthCalendar
              checkInDate={listing.dropPriceEndsAt?.slice(0, 10) || ''}
              checkOutDate=""
              singleDateMode
              modalPlacement
              onChange={(date) => {
                if (date) {
                  update({ dropPriceEndsAt: new Date(`${date}T23:59:59`).toISOString() });
                }
              }}
              onClose={() => setShowDateCalendar(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
