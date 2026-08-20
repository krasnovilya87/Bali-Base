import React, { useEffect, useMemo, useState } from 'react';
import { Listing, BookingRequest } from '../types';
import {
  LayoutGrid, LineChart, Calendar as CalendarIcon, ClipboardList, Check, X,
  ExternalLink, Sparkles, Flame, Eye, Send, Play, Pause, Trash2, Clock, Globe, Star,
  ShieldAlert, KeyRound, HelpCircle, Edit, Plus, Crown, Zap, Tag, Settings,
  Rocket, ArrowUp, Sliders, SlidersHorizontal, Settings2, ShieldCheck
} from 'lucide-react';
import { setDocument } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import PromoteListingModal from './my-adds/PromoteListingModal';
import CalendarListingModal from './my-adds/CalendarListingModal';
import DropPriceModal from './my-adds/DropPriceModal';
import AnalyticsModal from './my-adds/AnalyticsModal';
import { useI18n } from '../i18nContext';
import { isListingVerified } from '../utils/listingVerification';
import Del from './Del';

interface MyAddsListingProps {
  listings: Listing[];
  bookings: BookingRequest[];
  onToggleStatus: (id: string) => void;
  onUpdateBookingStatus: (id: string, status: 'accepted' | 'declined') => void;
  onUpdateBooking: (booking: BookingRequest) => void;
  onAddBooking: (booking: BookingRequest) => void;
  onUpdateListing: (listing: Listing) => void;
  onClose: () => void;
  currencySymbol: string;
  currencyRate: number;
  onCreateClick?: () => void;
  onEditClick?: (listing: Listing) => void;
  onViewClick?: (listing: Listing) => void;
  onDeleteListing?: (id: string) => void;
  initialBookingsListingId?: string | null;
  onInitialBookingsOpened?: () => void;
}

import { THEME } from '../theme';

export default function MyAddsListing({
  listings,
  bookings,
  onToggleStatus,
  onUpdateBookingStatus,
  onUpdateBooking,
  onAddBooking,
  onUpdateListing,
  onClose,
  currencySymbol,
  currencyRate,
  onCreateClick,
  onEditClick,
  onViewClick,
  onDeleteListing,
  initialBookingsListingId,
  onInitialBookingsOpened
}: MyAddsListingProps) {
  const { tr } = useI18n();
  const { user } = useAuth();

  // Filtration for listings belonging to current user session
  const ownerListings = useMemo(() => listings
    .filter(item =>
      item.ownerId === user?.uid ||
      item.ownerId === 'owner-1' ||
      item.ownerId === 'owner-personal' ||
      item.ownerId === 'owner-direct'
    )
    .sort((a, b) => getListingActivityTime(b) - getListingActivityTime(a)), [listings, user?.uid]);

  // Sub-modal overlay states
  const [promoteListing, setPromoteListing] = useState<Listing | null>(null);
  const [calendarListing, setCalendarListing] = useState<Listing | null>(null);
  const [dropPriceListing, setDropPriceListing] = useState<Listing | null>(null);

  // Overall statistics and Booking overlay state for specific listings
  const [analyticsListing, setAnalyticsListing] = useState<Listing | null>(null);
  const [adjustListing, setAdjustListing] = useState<Listing | null>(null);

  useEffect(() => {
    if (!initialBookingsListingId) return;

    const matchedListing = ownerListings.find(item => item.id === initialBookingsListingId);
    if (matchedListing) {
      setCalendarListing(matchedListing);
    }
    onInitialBookingsOpened?.();
  }, [initialBookingsListingId, ownerListings, onInitialBookingsOpened]);

  // Helper type emoji labeling
  const getExpirationTimer = (item: Listing) => {
    switch (item.category) {
      case 'housing': return tr('myListings.expiration.housing');
      case 'transport': return tr('myListings.expiration.transport');
      case 'services': return tr('myListings.expiration.services');
      case 'ads': return tr('myListings.expiration.ads');
      case 'afisha': return tr('myListings.expiration.afisha');
      default: return tr('myListings.expiration.default');
    }
  };

  const convertPrice = (idrAmount: number) => {
    return Math.round(idrAmount * currencyRate).toLocaleString();
  };

  const getDropPriceDaysLeft = (endsAt?: string) => {
    if (!endsAt) return 0;
    return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  };

  const getStatusMeta = (item: Listing) => {
    switch (item.status) {
      case 'active':
        return {
          label: tr('myListings.status.active'),
          dotClass: 'bg-emerald-500',
          railClass: 'bg-gradient-to-b from-[#2F7D69] to-emerald-300',
          frameClass: 'bg-gradient-to-br from-[#2F7D69] to-emerald-200',
          textClass: 'text-[#2F7D69]',
          panelClass: 'bg-emerald-50 border-emerald-100 text-emerald-800'
        };
      case 'moderation':
        return {
          label: tr('myListings.status.moderation'),
          dotClass: 'bg-amber-500',
          railClass: 'bg-gradient-to-b from-amber-400 to-orange-300',
          frameClass: 'bg-gradient-to-br from-amber-400 to-orange-200',
          textClass: 'text-amber-600',
          panelClass: 'bg-amber-50 border-amber-100 text-amber-800'
        };
      case 'rejected':
        return {
          label: tr('myListings.status.rejected'),
          dotClass: 'bg-rose-500',
          railClass: 'bg-gradient-to-b from-rose-500 to-red-300',
          frameClass: 'bg-gradient-to-br from-rose-500 to-red-200',
          textClass: 'text-rose-600',
          panelClass: 'bg-rose-50 border-rose-100 text-rose-800'
        };
      case 'draft':
        return {
          label: tr('myListings.status.draft'),
          dotClass: 'bg-slate-400',
          railClass: 'bg-gradient-to-b from-slate-400 to-slate-200',
          frameClass: 'bg-gradient-to-br from-slate-400 to-slate-200',
          textClass: 'text-slate-500',
          panelClass: 'bg-slate-50 border-slate-200 text-slate-700'
        };
      default:
        return {
          label: tr('myListings.status.paused'),
          dotClass: 'bg-orange-500',
          railClass: 'bg-gradient-to-b from-orange-400 to-amber-200',
          frameClass: 'bg-gradient-to-br from-orange-400 to-amber-200',
          textClass: 'text-orange-600',
          panelClass: 'bg-orange-50 border-orange-100 text-orange-800'
        };
    }
  };


  const handlePushListing = (item: Listing) => {
    const updated = {
      ...item,
      pushedAt: new Date().toISOString()
    };
    onUpdateListing(updated);
    if (analyticsListing && analyticsListing.id === item.id) {
      setAnalyticsListing(updated);
    }
  };

  const getListingRatingFraction = (listingItem: Listing) => {
    const activeSimilar = listings.filter(
      x => x.category === listingItem.category && x.status === 'active'
    );

    const listToRank = [...activeSimilar];
    if (!listToRank.some(x => x.id === listingItem.id)) {
      listToRank.push(listingItem);
    }

    const sortedSimilar = listToRank.sort((a, b) => {
      if (a.isPromoTurbo && !b.isPromoTurbo) return -1;
      if (!a.isPromoTurbo && b.isPromoTurbo) return 1;

      const pushA = a.pushedAt ? new Date(a.pushedAt).getTime() : 0;
      const pushB = b.pushedAt ? new Date(b.pushedAt).getTime() : 0;
      if (pushA !== pushB) {
        return pushB - pushA;
      }

      return b.viewsCount - a.viewsCount;
    });

    const positionInSimilar = sortedSimilar.findIndex(x => x.id === listingItem.id) + 1;
    const totalSimilar = sortedSimilar.length;

    return { position: positionInSimilar, total: totalSimilar };
  };

  const handleListingCardClick = (event: React.MouseEvent<HTMLDivElement>, item: Listing) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea, label')) return;
    onViewClick?.(item);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[500] p-2 sm:p-5" id="cabinet-modal">
      <div className="bg-[#F4F7F6] w-full max-w-5xl h-full max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-scale-up border border-[#E2E8F0]">

        {/* Main Cabinet Top Nav Header */}
        <div
          className="p-3.5 sm:p-4 border-b border-[#E2E8F0] flex items-center justify-between z-20"
          style={{ backgroundColor: '#EAEAEC' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2F7D69]/10 border border-[#2F7D69]/20 flex items-center justify-center text-[#FF7A50]">
              <LayoutGrid className="w-5 h-5 text-[#2F7D69]" />
            </div>
            <div>
              <h2 className="font-display text-[#1E293B] text-base sm:text-lg font-black tracking-tight select-none">
                {tr('myListings.title', { count: ownerListings.length })}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateClick}
              className="px-4 py-2 bg-[#FF7A50] hover:bg-[#E05A30] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{tr('myListings.create')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition active:scale-95 shrink-0"
              title={tr('myListings.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrolling content list */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#F4F7F6]">

          {/* Main Listings Loop list */}
          {ownerListings.length === 0 ? (
            <div className="pl rounded-2xl p-12 text-center text-gray-400 max-w-md mx-auto mt-6">
              <LayoutGrid className="w-8 h-8 mx-auto text-gray-300 stroke-1 mb-3" />
              <p className="text-xs font-medium text-gray-500">{tr('myListings.empty')}</p>
              <button
                onClick={onCreateClick}
                className="mt-4 px-3.5 py-2 bg-[#2F7D69]/10 text-[#2F7D69] text-[11px] font-extrabold rounded-xl hover:bg-[#2F7D69]/20 transition"
              >
                {tr('myListings.createFirst')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ownerListings.map(item => {
                const statusMeta = getStatusMeta(item);
                const itemBookings = bookings.filter(b => b.listingId === item.id);
                const pendingCount = itemBookings.filter(b => b.status === 'pending').length;
                const hasRequests = itemBookings.length > 0;
                const hasNewRequests = pendingCount > 0;
                return (
                <div
                  key={item.id}
                  onClick={(event) => handleListingCardClick(event, item)}
                  className="relative overflow-hidden bg-white rounded-2xl p-3 shadow-[0_6px_18px_rgba(30,41,59,0.06)] hover:shadow-[0_10px_24px_rgba(30,41,59,0.10)] ring-1 ring-slate-200/70 transition-all duration-300 cursor-pointer"
                >
                  <div
                    className={`absolute inset-y-0 left-0 w-1 ${item.isPromoTop ? 'bg-gradient-to-b from-amber-400 to-[#FF7A50]' : statusMeta.railClass}`}
                  />
                  <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-xl bg-white">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
                      <button
                        type="button"
                        onClick={() => onViewClick?.(item)}
                        className="block h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7D69] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        title={item.title}
                      >
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>

                      <div className="absolute left-2 top-2 z-20 flex max-w-[68%] flex-col items-start gap-1">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide shadow-sm ${statusMeta.panelClass}`}>
                          {statusMeta.label}
                        </span>
                        {isListingVerified(item) && (
                          <span className="flex items-center gap-1 rounded bg-[#FFCD29] px-1.5 py-0.5 text-[8px] font-extrabold text-gray-950 shadow-md">
                            <ShieldCheck className="h-2.5 w-2.5 text-[#2F7D69]" />
                            {tr('listing.approvedBadge')}
                          </span>
                        )}
                        {item.isNew && (
                          <span className="rounded bg-[#FF7A50] px-1.5 py-0.5 text-[8px] font-extrabold text-white shadow-md">
                            {tr('listing.newBadge')}
                          </span>
                        )}
                        {item.isPromoPremium && (
                          <span className="rounded bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500 px-1.5 py-0.5 text-[8px] font-black text-white shadow-md">
                            VIP
                          </span>
                        )}
                        {item.isPromoTop && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-black text-amber-800 shadow-md">
                            TOP
                          </span>
                        )}
                        {item.isPromoTurbo && (
                          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[8px] font-black text-rose-800 shadow-md">
                            TURBO
                          </span>
                        )}
                      </div>

                      <div className="absolute right-2 top-2 z-30 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditClick?.(item)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow-md transition hover:scale-105 hover:text-[#E05A30] active:scale-95"
                          title={tr('myListings.edit')}
                          aria-label={tr('myListings.edit')}
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(item.id)}
                          disabled={item.status === 'rejected' || item.status === 'moderation'}
                          className={`flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition active:scale-95 ${
                            item.status === 'active'
                              ? 'text-[#E05A30] hover:scale-105'
                              : item.status === 'rejected' || item.status === 'moderation'
                                ? 'cursor-not-allowed text-slate-400'
                                : 'text-emerald-650 hover:scale-105'
                          }`}
                          title={item.status === 'active' ? tr('myListings.pause') : tr('myListings.start')}
                          aria-label={item.status === 'active' ? tr('myListings.pause') : tr('myListings.start')}
                        >
                          {item.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                        </button>
                        <Del
                          title={tr('myListings.deleteTitle')}
                          message={tr('myListings.deleteBody', { title: item.title })}
                          confirmLabel={tr('myListings.deleteConfirm')}
                          cancelLabel={tr('common.cancel')}
                          onConfirm={() => onDeleteListing?.(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-600 shadow-md transition hover:scale-105 hover:bg-red-50 active:scale-95"
                          titleAttr={tr('myListings.delete')}
                          ariaLabel={tr('myListings.delete')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Del>
                      </div>

                      {item.reviewsCount > 0 && (
                        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-[11px] font-bold text-white drop-shadow-md backdrop-blur-sm">
                          <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
                          <span>{item.rating.toFixed(2).replace('.', ',')}</span>
                          <span className="text-white/85 font-light">({item.reviewsCount})</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2.5 px-0 pt-2.5 pb-0">
                      <button
                        type="button"
                        onClick={() => onViewClick?.(item)}
                        className="text-left font-display text-base font-black leading-tight text-[#1E293B] line-clamp-2"
                        title={item.title}
                      >
                        {item.title}
                      </button>

                      <p className="line-clamp-2 text-xs leading-snug text-gray-500">
                        {item.district} | {item.category === 'housing' ? tr('myListings.category.housing') : item.category === 'transport' ? tr('myListings.category.transport') : tr('myListings.category.service')}
                      </p>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="min-w-0 rounded-lg bg-[#F4F7F6]/75 px-2 py-2">
                          <span className="block text-[8.5px] font-bold uppercase leading-none tracking-wide text-gray-400">{tr('myListings.perDay')}</span>
                          <span className="block truncate font-mono text-[clamp(10px,3vw,12px)] font-black leading-tight text-[#1E293B]">
                            {convertPrice(item.pricePerDay)} {currencySymbol}
                          </span>
                        </div>
                        <div className="min-w-0 rounded-lg bg-[#F4F7F6]/75 px-2 py-2">
                          <span className="block text-[8.5px] font-bold uppercase leading-none tracking-wide text-gray-400">{tr('myListings.perMonth')}</span>
                          <span className="block truncate font-mono text-[clamp(10px,3vw,12px)] font-black leading-tight text-[#1E293B]">
                            {convertPrice(item.pricePerMonth || item.pricePerDay * 30)} {currencySymbol}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDropPriceListing(item)}
                          className={`min-w-0 rounded-lg px-2 py-2 text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
                            item.hasDropPrice && item.dropPricePerDay
                              ? 'bg-[#FF7A50]/10 hover:bg-[#FF7A50]/15'
                              : 'bg-[#F4F7F6]/75'
                          }`}
                        >
                          <span className="block text-[8.5px] font-bold uppercase leading-none tracking-wide text-[#E05A30]">
                            {tr('myListings.dropPrice')}
                            {item.hasDropPrice && item.dropPricePerDay
                              ? ` | ${tr('myListings.daysLeftShort', { count: getDropPriceDaysLeft(item.dropPriceEndsAt) })}`
                              : ''}
                          </span>
                          <span className={`block truncate font-mono text-[clamp(10px,3vw,12px)] font-black leading-tight ${
                            item.hasDropPrice && item.dropPricePerDay ? 'text-[#FF7A50]' : 'text-gray-400'
                          }`}>
                            {item.hasDropPrice && item.dropPricePerDay
                              ? `${convertPrice(item.dropPricePerDay)} ${currencySymbol}`
                              : '-'}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-stretch gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAnalyticsListing(item)}
                          className="grid flex-1 grid-cols-4 gap-1 rounded-xl bg-slate-50/80 p-2 text-center font-mono text-[10px] transition hover:-translate-y-0.5 hover:bg-[#F4F7F6] hover:shadow-md active:scale-[0.99]"
                          title={tr('myListings.analytics')}
                          aria-label={tr('myListings.analytics')}
                        >
                          <span>
                            <span className="block font-sans text-[8px] font-bold uppercase text-gray-400">{tr('myListings.views')}</span>
                            <span className="text-[15px] font-extrabold text-gray-800 lg:text-sm">{item.viewsCount}</span>
                          </span>
                          <span>
                            <span className="block font-sans text-[8px] font-bold uppercase text-gray-400">WA</span>
                            <span className="text-[15px] font-extrabold text-amber-600 lg:text-sm">{item.clicksCount}</span>
                          </span>
                          <span>
                            <span className="block font-sans text-[8px] font-bold uppercase text-gray-400">{tr('myListings.ctr')}</span>
                            <span className="text-[15px] font-extrabold text-blue-600 lg:text-sm">{item.viewsCount > 0 ? ((item.clicksCount / item.viewsCount) * 100).toFixed(1) : '0'}%</span>
                          </span>
                          <span>
                            <span className="block font-sans text-[8px] font-bold uppercase text-emerald-700">{tr('myListings.rating')}</span>
                            <span className="text-[15px] font-black text-emerald-800 lg:text-sm">
                              {(() => {
                                const { position, total } = getListingRatingFraction(item);
                                return item.status === 'active' ? `${position}/${total}` : '-';
                              })()}
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePushListing(item)}
                          className="flex min-w-12 flex-col items-center justify-center rounded-xl bg-[#FF7A50]/10 px-2.5 text-[#E05A30] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FF7A50]/15 hover:shadow-md active:scale-95"
                          title={tr('myListings.push')}
                          aria-label={tr('myListings.push')}
                        >
                          <Rocket className="h-4 w-4" />
                          <span className="text-[9px] font-black uppercase">{tr('myListings.push')}</span>
                        </button>
                      </div>

                      {(item.category === 'housing' || item.category === 'transport' || item.category === 'services') ? (
                        <button
                          type="button"
                          onClick={() => setCalendarListing(item)}
                          className="mt-auto flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-50/80 px-2 py-2.5 text-center font-mono text-[10px] transition hover:-translate-y-1 hover:bg-[#F4F7F6] hover:shadow-[0_14px_30px_rgba(30,41,59,0.12),0_4px_10px_rgba(30,41,59,0.06)] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7D69] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          <ClipboardList className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-sans text-[13px] font-bold text-gray-700">
                            {tr('myListings.requests', { count: pendingCount })}
                          </span>
                        </button>
                      ) : (
                        <div className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-sans font-bold text-gray-400 opacity-50">
                          <ClipboardList className="h-3.5 w-3.5" />
                          <span>{tr('myListings.requests', { count: 0 })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="hidden">

                    {/* Item Image and metadata block */}
                    <div className="flex items-center gap-3 min-w-0 pr-16 lg:pr-0">
                      <div className="relative shrink-0">
                        <div className={`p-0.5 rounded-[14px] ${item.isPromoTop ? 'bg-gradient-to-br from-amber-400 to-[#FF7A50]' : statusMeta.frameClass}`}>
                          <button
                            type="button"
                            onClick={() => onViewClick?.(item)}
                            className="block rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7D69] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            title={item.title}
                          >
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="w-20 h-14 sm:w-24 sm:h-16 rounded-xl object-cover border-2 border-white transition duration-200 hover:brightness-95"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        </div>
                        <span className={`absolute -top-1.5 -right-1.5 w-3 h-3 ${statusMeta.dotClass} rounded-full border-2 border-white`} title={statusMeta.label} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wide ${statusMeta.panelClass}`}>
                            {statusMeta.label}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                            {item.category === 'housing' ? tr('myListings.category.housing') : item.category === 'transport' ? tr('myListings.category.transport') : tr('myListings.category.service')}
                          </span>
                          <span className="text-gray-300 text-[10px]">•</span>
                          <span className="text-[10px] font-mono text-gray-500">{item.district}</span>

                          {/* Active promotion attributes tags indicators */}
                          {item.isPromoTop && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded border border-amber-200">TOP ✨</span>
                          )}
                          {item.isPromoPremium && (
                            <span className="text-[9px] bg-orange-100 text-orange-800 font-extrabold px-1.5 py-0.2 rounded border border-orange-200">👑 VIP</span>
                          )}
                          {item.isPromoTurbo && (
                            <span className="text-[9px] bg-rose-100 text-rose-800 font-extrabold px-1.5 py-0.2 rounded border border-rose-200">⚡ TURBO</span>
                          )}
                        </div>

                        <h4 className="font-display font-black text-sm sm:text-[15px] leading-snug">
                          <button
                            type="button"
                            onClick={() => onViewClick?.(item)}
                            className="text-left text-[#1E293B] hover:text-[#2F7D69] line-clamp-2 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7D69] focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-md"
                            title={item.title}
                          >
                            {item.title}
                          </button>
                        </h4>

                        <p className={`text-[10px] font-mono font-semibold tracking-wide mt-0.5 ${item.status === 'active' ? '' : 'hidden'} ${statusMeta.textClass}`}>
                          {item.status === 'active' && tr('myListings.timer', { value: getExpirationTimer(item) })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-1.5 mt-2 lg:mt-0 lg:justify-end">
                      <div className="px-2 py-1 rounded-lg bg-[#F4F7F6]/75 border border-slate-200/70 min-w-[88px]">
                        <span className="text-[7.5px] uppercase tracking-wide text-gray-400 font-bold block leading-none">{tr('myListings.perDay')}</span>
                        <span className="text-[11px] font-mono font-black text-[#1E293B] leading-tight">
                          {convertPrice(item.pricePerDay)} {currencySymbol}
                        </span>
                      </div>

                      <div className="px-2 py-1 rounded-lg bg-[#F4F7F6]/75 border border-slate-200/70 min-w-[96px]">
                        <span className="text-[7.5px] uppercase tracking-wide text-gray-400 font-bold block leading-none">{tr('myListings.perMonth')}</span>
                        <span className="text-[11px] font-mono font-black text-[#1E293B] leading-tight">
                          {convertPrice(item.pricePerMonth || item.pricePerDay * 30)} {currencySymbol}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDropPriceListing(item)}
                        className={`px-2 py-1 rounded-lg border min-w-[104px] text-left transition active:scale-95 cursor-pointer ${
                          item.hasDropPrice && item.dropPricePerDay
                            ? 'bg-[#FF7A50]/10 border-[#FF7A50]/25 hover:bg-[#FF7A50]/15'
                            : 'bg-[#F4F7F6]/75 border-slate-200/70 hover:border-[#FF7A50]/40'
                        }`}
                      >
                        <span className={`text-[7.5px] uppercase tracking-wide font-bold block leading-none ${
                          item.hasDropPrice && item.dropPricePerDay ? 'text-[#E05A30]' : 'text-gray-400'
                        }`}>
                          {tr('myListings.dropPrice')}
                          {item.hasDropPrice && item.dropPricePerDay
                            ? ` · ${tr('myListings.daysLeftShort', { count: getDropPriceDaysLeft(item.dropPriceEndsAt) })}`
                            : ''}
                        </span>
                        <span className={`text-[11px] font-mono font-black leading-tight ${
                          item.hasDropPrice && item.dropPricePerDay ? 'text-[#FF7A50]' : 'text-gray-400'
                        }`}>
                          {item.hasDropPrice && item.dropPricePerDay
                            ? `${convertPrice(item.dropPricePerDay)} ${currencySymbol}${tr('map.pricePerDayShort')}`
                            : '—'}
                        </span>
                      </button>
                    </div>

                    {/* Compact stats strip right on the card */}
                    <button
                      type="button"
                      onClick={() => setAnalyticsListing(item)}
                      className="grid grid-cols-4 gap-1.5 font-mono text-center text-xs self-stretch lg:self-auto p-2 rounded-xl bg-slate-50/80 hover:bg-[#F4F7F6] border border-slate-200/70 hover:border-[#2F7D69]/35 min-w-full lg:min-w-[290px] transition active:scale-[0.99] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7D69] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      title={tr('myListings.analytics')}
                      aria-label={tr('myListings.analytics')}
                    >
                      <div>
                        <span className="text-gray-400 text-[8.5px] uppercase font-sans font-bold block">{tr('myListings.views')}</span>
                        <span className="font-extrabold text-gray-800 flex items-center gap-0.5 justify-center mt-0.5">
                          <Eye className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {item.viewsCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[8.5px] uppercase font-sans font-bold block">{tr('myListings.waClicks')}</span>
                        <span className="font-extrabold text-amber-600 flex items-center gap-0.5 justify-center mt-0.5">
                          <Send className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          {item.clicksCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[8.5px] uppercase font-sans font-bold block">{tr('myListings.ctr')}</span>
                        <span className="font-extrabold text-blue-600 block mt-0.5">
                          {item.viewsCount > 0 ? ((item.clicksCount / item.viewsCount) * 100).toFixed(1) : '0'}%
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-emerald-700 text-[8.5px] uppercase font-sans font-extrabold block">{tr('myListings.rating')}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-black text-emerald-800">
                            {(() => {
                              const { position, total } = getListingRatingFraction(item);
                              return item.status === 'active' ? `${position}/${total}` : '—';
                            })()}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Toggle listing activation status & Delete listing */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 shrink-0 justify-end lg:static">
                      <button
                        onClick={() => onEditClick?.(item)}
                        className="p-2 rounded-xl border border-slate-200 bg-[#F4F7F6]/90 text-gray-600 hover:text-[#E05A30] hover:bg-[#F4F7F6] transition active:scale-95 flex items-center justify-center cursor-pointer"
                        title={tr('myListings.edit')}
                        aria-label={tr('myListings.edit')}
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onToggleStatus(item.id)}
                        disabled={item.status === 'rejected' || item.status === 'moderation'}
                        className={`p-2 rounded-xl border transition active:scale-95 flex items-center justify-center cursor-pointer ${item.status === 'active'
                          ? 'bg-rose-50 border-rose-100 text-[#E05A30] hover:bg-rose-100'
                          : item.status === 'rejected' || item.status === 'moderation'
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-650 hover:bg-emerald-100'
                          }`}
                        title={item.status === 'active' ? tr('myListings.pause') : tr('myListings.start')}
                      >
                        {item.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </button>

                      <Del
                        title={tr('myListings.deleteTitle')}
                        message={tr('myListings.deleteBody', { title: item.title })}
                        confirmLabel={tr('myListings.deleteConfirm')}
                        cancelLabel={tr('common.cancel')}
                        onConfirm={() => onDeleteListing?.(item.id)}
                        className="p-2 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition active:scale-95 flex items-center justify-center cursor-pointer"
                        titleAttr={tr('myListings.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Del>
                    </div>

                  </div>

                  <div className="hidden">
                    <div className="px-2.5 py-1.5 rounded-xl bg-[#F4F7F6]/75 border border-slate-200/70">
                      <span className="text-[8.5px] uppercase tracking-wide text-gray-400 font-bold block">{tr('myListings.perDay')}</span>
                      <span className="text-xs font-mono font-black text-[#1E293B]">
                        {convertPrice(item.pricePerDay)} {currencySymbol}
                      </span>
                    </div>

                    <div className="px-2.5 py-1.5 rounded-xl bg-[#F4F7F6]/75 border border-slate-200/70">
                      <span className="text-[8.5px] uppercase tracking-wide text-gray-400 font-bold block">{tr('myListings.perMonth')}</span>
                      <span className="text-xs font-mono font-black text-[#1E293B]">
                        {convertPrice(item.pricePerMonth || item.pricePerDay * 30)} {currencySymbol}
                      </span>
                    </div>

                    {item.hasDropPrice && item.dropPricePerDay && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-[#FF7A50]/10 border border-[#FF7A50]/25">
                        <span className="text-[8.5px] uppercase tracking-wide text-[#E05A30] font-bold block">
                          {tr('myListings.dropPrice')} · {tr('myListings.daysLeftShort', { count: getDropPriceDaysLeft(item.dropPriceEndsAt) })}
                        </span>
                        <span className="text-xs font-mono font-black text-[#FF7A50]">
                          {convertPrice(item.dropPricePerDay)} {currencySymbol}{tr('map.pricePerDayShort')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="hidden">

                    {(item.category === 'housing' || item.category === 'transport' || item.category === 'services') ? (
                      <button
                        onClick={() => setCalendarListing(item)}
                        className={`pl pl-interactive border px-2.5 py-2 rounded-xl text-[11px] font-sans font-bold active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                          hasNewRequests
                            ? '!bg-[#FF7A50] border-[#FF7A50] text-white shadow-sm hover:!bg-[#E05A30]'
                            : '!bg-[#F4F7F6]/75 hover:!bg-[#F4F7F6]/80 border-slate-200/70 text-gray-600 hover:text-[#E05A30]'
                        }`}
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{tr('myListings.calendar')}</span>
                        {hasRequests && (
                          <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[9px] leading-none font-black ${
                            hasNewRequests ? 'bg-white/20 text-white' : 'bg-[#FF7A50]/10 text-[#FF7A50]'
                          }`}>
                            {itemBookings.length}
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="pl px-2.5 py-2 text-gray-400 rounded-xl text-[11px] font-sans font-bold flex items-center justify-center gap-1.5 select-none opacity-50 cursor-not-allowed">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{tr('myListings.calendarNA')}</span>
                      </div>
                    )}

                    {/* BUTTON 2: Drop Price button */}
                    <button
                      onClick={() => undefined}
                      style={item.hasDropPrice ? { color: '#FF7A50', borderColor: 'rgba(255, 122, 80, 0.4)' } : undefined}
                      className={`hidden pl pl-interactive border px-2.5 py-2 rounded-xl text-[11px] font-sans font-bold active:scale-95 items-center justify-center gap-1.5 cursor-pointer ${
                        item.hasDropPrice
                          ? '!bg-[#F4F7F6]/75 hover:!bg-[#F4F7F6]/80 ring-[0.5px] ring-[#FF7A50] ring-inset'
                          : '!bg-[#F4F7F6]/75 hover:!bg-[#F4F7F6]/80 border-slate-200/70 text-gray-600 hover:text-[#E05A30]'
                      }`}
                    >
                      <Flame
                        className="w-3.5 h-3.5"
                        style={item.hasDropPrice ? { color: '#FF7A50', fill: 'rgba(255, 122, 80, 0.2)' } : undefined}
                      />
                      <span style={item.hasDropPrice ? { color: '#FF7A50' } : undefined}>
                        {tr('myListings.dropPrice')} {item.hasDropPrice ? '✓' : ''}
                      </span>
                    </button>

                    {/* BUTTON 3: Bookings (Specific for this listing) */}
                    {(() => {
                      const itemBookings = bookings.filter(b => b.listingId === item.id);
                      const pendingRequestsCount = itemBookings.filter(b => b.status === 'pending').length;
                      return (
                        <button
                          onClick={() => setCalendarListing(item)}
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>
                            {tr('myListings.requests', {
                              count: pendingRequestsCount > 0
                                ? `(${pendingRequestsCount})`
                                : ''
                            })}
                          </span>
                        </button>
                      );
                    })()}

                    {/* BUTTON 4: Statistics (Specific for this listing) */}
                    <button
                      onClick={() => setAnalyticsListing(item)}
                      className="hidden pl pl-interactive !bg-[#F4F7F6]/75 hover:!bg-[#F4F7F6]/80 border border-slate-200/70 px-2.5 py-2 text-gray-600 hover:text-[#E05A30] rounded-xl text-[11px] font-sans font-bold active:scale-95 items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LineChart className="w-3.5 h-3.5" />
                      <span>{tr('myListings.analytics')}</span>
                    </button>

                    {/* BUTTON 5: Edit details button */}
                    <button
                      onClick={() => onEditClick?.(item)}
                      className="hidden pl pl-interactive !bg-[#F4F7F6]/75 hover:!bg-[#F4F7F6]/80 border border-slate-200/70 px-2.5 py-2 text-gray-600 hover:text-[#E05A30] rounded-xl text-[11px] font-sans font-bold active:scale-95 items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>{tr('myListings.edit')}</span>
                    </button>

                    {/* BUTTON 6: Promote button (🚀 Highlighted, distinctive design) */}
                    <button
                      onClick={() => setPromoteListing(item)}
                      className="pl pl-interactive !bg-[#F4F7F6]/75 hover:!bg-[#F4F7F6]/80 border border-slate-200/70 px-2.5 py-2 text-gray-600 hover:text-[#E05A30] rounded-xl text-[11px] font-display font-black active:scale-95 lg:tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-[#FF7A50] fill-[#FF7A50]/20" />
                      <span>{tr('myListings.promote')}</span>
                    </button>

                  </div>

                </div>
                );
              })}
            </div>
          )}

        </div>
        {promoteListing && (
          <PromoteListingModal
            listing={promoteListing}
            onChange={(updated) => {
              onUpdateListing(updated);
              setPromoteListing(updated);
            }}
            onClose={() => setPromoteListing(null)}
          />
        )}

        {calendarListing && (
          <CalendarListingModal
            listing={calendarListing}
            bookings={bookings}
            currencySymbol={currencySymbol}
            currencyRate={currencyRate}
            onChange={(updated) => {
              onUpdateListing(updated);
              setCalendarListing(updated);
            }}
            onUpdateStatus={onUpdateBookingStatus}
            onUpdateBooking={onUpdateBooking}
            onAddBooking={onAddBooking}
            onClose={() => setCalendarListing(null)}
          />
        )}

        {dropPriceListing && (
          <DropPriceModal
            listing={dropPriceListing}
            onChange={(updated) => {
              onUpdateListing(updated);
              setDropPriceListing(updated);
            }}
            onClose={() => setDropPriceListing(null)}
          />
        )}

        {analyticsListing && (
          <AnalyticsModal
            listing={analyticsListing}
            listings={listings}
            onClose={() => setAnalyticsListing(null)}
          />
        )}

        {/* ==================== SUB-MODAL: 🎛️ DISPLAY DETAILS & POSITION ADJUSTMENT MODAL ==================== */}
        {adjustListing && (() => {
          const activeSimilar = listings.filter(
            item => item.category === adjustListing.category && item.status === 'active'
          );
          const listToRank = [...activeSimilar];
          if (!listToRank.some(x => x.id === adjustListing.id)) {
            listToRank.push(adjustListing);
          }

          const sortedSimilar = listToRank.sort((a, b) => {
            if (a.isPromoTurbo && !b.isPromoTurbo) return -1;
            if (!a.isPromoTurbo && b.isPromoTurbo) return 1;

            const pushA = a.pushedAt ? new Date(a.pushedAt).getTime() : 0;
            const pushB = b.pushedAt ? new Date(b.pushedAt).getTime() : 0;
            if (pushA !== pushB) {
              return pushB - pushA;
            }

            return b.viewsCount - a.viewsCount;
          });

          const positionInSimilar = sortedSimilar.findIndex(x => x.id === adjustListing.id) + 1;
          const totalSimilar = sortedSimilar.length;

          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[510] p-4 animate-fade-in" id="adjust-visibility-modal">
              <div className="bg-white max-w-md w-full rounded-2xl p-5 border border-sky-50 shadow-2xl space-y-4 animate-scale-up text-[#1E293B]">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-[#2F7D69]" />
                    <h3 className="font-display font-black text-sm uppercase">{tr('myListings.displaySettings')}</h3>
                  </div>
                  <button
                    onClick={() => setAdjustListing(null)}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">{tr('myListings.listing')}</span>
                    <p className="text-xs font-bold font-sans text-gray-800 line-clamp-1 mt-0.5">{adjustListing.title}</p>
                  </div>

                  {/* 1. Push Button Adjustment */}
                  <div className="bg-emerald-50/40 p-4 border border-emerald-100/65 rounded-xl space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono block">{tr('myListings.searchPosition')}</span>
                        <div className="text-[13px] font-black text-gray-800 mt-1 flex items-center gap-1.5">
                          <span>{tr('myListings.rating')}:</span>
                          <span className="text-[#2F7D69] text-sm font-extrabold">{tr('myListings.positionOf', { position: positionInSimilar, total: totalSimilar })}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const nowStr = new Date().toISOString();
                          const updated = {
                            ...adjustListing,
                            pushedAt: nowStr
                          };
                          onUpdateListing(updated);
                          setAdjustListing(updated);
                        }}
                        className="px-3 py-2 bg-[#2F7D69] hover:bg-[#256353] text-white rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>{tr('myListings.push')}</span>
                      </button>
                    </div>
                    <p className="text-[10.5px] text-emerald-700/80 leading-snug">
                      {tr('myListings.pushInfo')}
                    </p>
                  </div>

                  {/* 2. Custom Reach Multiplier Slider */}
                  <div className="bg-gray-50/50 p-4 border border-gray-100 rounded-xl space-y-2.5">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block font-mono">{tr('myListings.audienceMultiplier')}</span>
                      <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                        {(adjustListing.reachMultiplier || 1.0).toFixed(1)}x
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.5"
                      value={adjustListing.reachMultiplier || 1.0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const updated = { ...adjustListing, reachMultiplier: val };
                        onUpdateListing(updated);
                        setAdjustListing(updated);
                      }}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2F7D69]"
                    />

                    <div className="flex justify-between text-[9px] font-bold text-gray-400 font-mono">
                      <span>1.0x ({tr('myListings.base')})</span>
                      <span>1.5x</span>
                      <span>2.0x ({tr('myListings.top')})</span>
                      <span>2.5x</span>
                      <span>3.0x ({tr('myListings.max')})</span>
                    </div>
                  </div>

                  {/* 3. Toggle visual badging formats */}
                  <div className="bg-gray-50/30 p-4 border border-gray-150/40 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block font-mono tracking-wider mb-1">{tr('myListings.visualMarkers')}</span>

                    <div className="grid grid-cols-2 gap-3.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!adjustListing.isPromoTurbo}
                          onChange={(e) => {
                            const updated = { ...adjustListing, isPromoTurbo: e.target.checked };
                            onUpdateListing(updated);
                            setAdjustListing(updated);
                          }}
                          className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                        />
                        <div className="text-[11px] font-medium text-gray-700 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                          <span>{tr('myListings.turboTariff')}</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!adjustListing.isPromoPremium}
                          onChange={(e) => {
                            const updated = { ...adjustListing, isPromoPremium: e.target.checked };
                            onUpdateListing(updated);
                            setAdjustListing(updated);
                          }}
                          className="rounded text-yellow-500 focus:ring-yellow-400 w-4 h-4 cursor-pointer"
                        />
                        <div className="text-[11px] font-medium text-gray-700 flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          <span>{tr('myListings.premiumFrame')}</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!adjustListing.hasDropPrice}
                          onChange={(e) => {
                            const updated = { ...adjustListing, hasDropPrice: e.target.checked };
                            onUpdateListing(updated);
                            setAdjustListing(updated);
                          }}
                          className="rounded text-green-650 focus:ring-green-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="text-[11px] font-medium text-gray-700 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-green-650" />
                          <span>{tr('myListings.priceDrop')}</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!adjustListing.isNew}
                          onChange={(e) => {
                            const updated = { ...adjustListing, isNew: e.target.checked };
                            onUpdateListing(updated);
                            setAdjustListing(updated);
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="text-[11px] font-medium text-gray-700 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          <span>{tr('myListings.newBadge')}</span>
                        </div>
                      </label>
                    </div>
                  </div>

                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setAdjustListing(null)}
                    className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 text-center shadow-xs text-center"
                  >
                    {tr('myListings.done')}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}

function getListingActivityTime(listing: Listing) {
  const updatedAt = listing.pushedAt ? new Date(listing.pushedAt).getTime() : 0;
  const createdAt = listing.createdAt ? new Date(listing.createdAt).getTime() : 0;
  return Math.max(
    Number.isFinite(updatedAt) ? updatedAt : 0,
    Number.isFinite(createdAt) ? createdAt : 0
  );
}
