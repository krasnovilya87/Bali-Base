import React, { useState } from 'react';
import { BarChart3, X } from 'lucide-react';
import { Listing } from '../../types';

interface AnalyticsModalProps {
  listing: Listing;
  listings: Listing[];
  onClose: () => void;
}

export default function AnalyticsModal({ listing, listings, onClose }: AnalyticsModalProps) {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const activeSimilar = listings.filter(item => item.category === listing.category && item.status === 'active');
  const sortedSimilar = [...activeSimilar].sort((a, b) => {
    if (a.isPromoTurbo !== b.isPromoTurbo) return a.isPromoTurbo ? -1 : 1;
    const pushDifference = (b.pushedAt ? new Date(b.pushedAt).getTime() : 0)
      - (a.pushedAt ? new Date(a.pushedAt).getTime() : 0);
    return pushDifference || b.viewsCount - a.viewsCount;
  });
  const position = sortedSimilar.findIndex(item => item.id === listing.id) + 1;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[510] p-4 animate-fade-in" id="analytics-promo-modal">
      <div className="pu max-w-xl w-full rounded-2xl p-5 border border-sky-50 shadow-2xl space-y-4 animate-scale-up text-[#1E293B]">
        <div className="pu-header -mx-5 -mt-5 px-5 py-4 flex justify-between items-center border-b border-[#D1D5DB]/30">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#2F7D69]" />
            <h3 className="font-display font-black text-sm uppercase">Статистика: {listing.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pu-body flex justify-between items-center">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block font-light">Динамика спроса за период</span>
          <div className="flex bg-gray-50 p-1 rounded-lg text-[10px] font-bold">
            {([7, 30, 90] as const).map(period => (
              <button
                key={period}
                onClick={() => setDays(period)}
                className={`px-2.5 py-1 rounded transition ${
                  days === period ? 'text-[#FF7A50] font-extrabold bg-[#FF7A50]/10' : 'text-gray-500 font-light hover:text-[#FF7A50]'
                }`}
              >
                {period}дн
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3.5 text-[#1E293B]">
          <Metric label="Просмотры" value={listing.viewsCount.toLocaleString()} className="text-[#FF7A50]" />
          <Metric label="Клики WA" value={listing.clicksCount.toLocaleString()} className="text-amber-500" />
          <Metric
            label="Клик CTR"
            value={`${listing.viewsCount > 0 ? ((listing.clicksCount / listing.viewsCount) * 100).toFixed(1) : '0'}%`}
            className="text-blue-600"
          />
          <Metric
            label="Рейтинг"
            value={listing.status === 'active' && position > 0 ? `${position}/${sortedSimilar.length}` : '—'}
            className="text-emerald-700"
          />
        </div>

        <AnalyticsChart listing={listing} days={days} />

        <div className="pu-footer -mx-5 -mb-5 px-5 py-4 border-t border-[#D1D5DB]/30">
          <button onClick={onClose} className="w-full py-2.5 bg-[#2F7D69] text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95">
            Закрыть статистику
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className="bg-gray-50/50 p-2 sm:p-3.5 rounded-xl border border-gray-100 flex flex-col justify-between">
      <span className="text-[10px] font-light text-gray-400 block uppercase">{label}</span>
      <span className={`text-sm sm:text-lg font-mono font-black mt-0.5 block ${className}`}>{value}</span>
    </div>
  );
}

function AnalyticsChart({ listing, days }: { listing: Listing; days: 7 | 30 | 90 }) {
  const pointsCount = days === 7 ? 7 : days === 30 ? 15 : 20;
  const viewsBase = listing.viewsCount > 0 ? listing.viewsCount : 85;
  const clicksBase = listing.clicksCount > 0 ? listing.clicksCount : 4;
  const periodFactor = days === 7 ? 0.8 : days === 30 ? 1 : 1.2;
  const viewsFactor = (viewsBase / pointsCount) * periodFactor;
  const clicksFactor = (clicksBase / pointsCount) * periodFactor;
  const views = Array.from({ length: pointsCount }, (_, index) =>
    Math.round(viewsFactor + Math.sin(index * 0.7) * viewsFactor * 0.2 + index * 0.1)
  );
  const clicks = Array.from({ length: pointsCount }, (_, index) =>
    Math.round(clicksFactor + Math.cos(index * 0.7) * clicksFactor * 0.2 + index * 0.02)
  );
  const width = 600;
  const height = 140;
  const padding = 20;
  const maxValue = Math.max(...views) * 1.1 || 10;
  const coordinates = (data: number[], index: number) => {
    const x = padding + (index / (pointsCount - 1)) * (width - padding * 2);
    const y = height - padding - (data[index] / maxValue) * (height - padding * 2);
    return `${x},${y}`;
  };

  return (
    <div className="pl p-4 rounded-2xl space-y-4 shadow-xs">
      <div className="flex justify-between items-center text-[11px] font-sans">
        <span className="font-bold text-gray-400 uppercase tracking-wider block">График динамики спроса</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF7A50]" />Просмотры</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Клики WA</span>
        </div>
      </div>
      <div className="relative w-full h-[140px] overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#F3F4F6" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#F3F4F6" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E5E7EB" strokeWidth="1.5" />
          <path d={`M ${views.map((_, index) => coordinates(views, index)).join(' L ')}`} fill="none" stroke="#FF7A50" strokeWidth="2.5" strokeLinecap="round" />
          <path d={`M ${clicks.map((_, index) => coordinates(clicks, index)).join(' L ')}`} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
