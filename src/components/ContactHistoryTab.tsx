import { useRef, useState, type PointerEvent } from 'react';
import { MessageSquare, Pin, Trash2, X } from 'lucide-react';
import { BookingRequest, Listing } from '../types';
import { useI18n } from '../i18nContext';

const HISTORY_ACTIONS_WIDTH = 104;
const HISTORY_SWIPE_OPEN_THRESHOLD = 42;
const HISTORY_SWIPE_CLICK_SUPPRESS_THRESHOLD = 6;

export interface ContactHistoryItem {
  id: string;
  title?: string;
  pricePerDay?: number;
  image?: string;
  district?: string;
  clickedAt?: string;
  pinned?: boolean;
  pinnedAt?: string;
  whatsappNumber?: string;
}

interface ContactHistoryTabProps {
  bookings: BookingRequest[];
  history: ContactHistoryItem[];
  listings: Listing[];
  currencySymbol: string;
  currencyRate: number;
  onViewListing: (listing: Listing) => void;
  onDeleteItem: (listingId: string) => void;
  onPinItem: (listingId: string) => void;
  onClear: () => void;
  onClose: () => void;
  onLogout: () => void;
  successMsg: string | null;
}

export default function ContactHistoryTab({
  bookings,
  history,
  listings,
  currencySymbol,
  currencyRate,
  onViewListing,
  onDeleteItem,
  onPinItem,
  onClear,
  onClose,
  successMsg,
}: ContactHistoryTabProps) {
  const { tr } = useI18n();
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ itemId: string; value: number } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const swipeGestureRef = useRef<{
    itemId: string;
    pointerId: number;
    startX: number;
    startY: number;
    baseOffset: number;
    latestOffset: number;
    isHorizontal: boolean;
    hasMoved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const formatPrice = (priceIdr: number) =>
    Math.round(priceIdr * currencyRate).toLocaleString();
  const formatShortDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    });
  const closeSwipeActions = () => setOpenActionsId(null);
  const closeDeleteConfirm = () => setPendingDeleteId(null);
  const buildWhatsAppUrl = (phone?: string) => {
    const cleanNumber = phone?.replace(/[^0-9]/g, '') || '';
    return cleanNumber ? `https://wa.me/${cleanNumber}` : '';
  };
  const openWhatsApp = (phone?: string) => {
    const url = buildWhatsAppUrl(phone);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const confirmDeleteItem = () => {
    if (!pendingDeleteId) return;
    onDeleteItem(pendingDeleteId);
    setPendingDeleteId(null);
    closeSwipeActions();
  };
  const clampSwipeOffset = (value: number) => Math.max(-HISTORY_ACTIONS_WIDTH, Math.min(0, value));
  const getCardOffset = (itemId: string) => {
    if (dragOffset?.itemId === itemId) return dragOffset.value;
    return openActionsId === itemId ? -HISTORY_ACTIONS_WIDTH : 0;
  };
  const handleSwipeStart = (itemId: string, event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const baseOffset = openActionsId === itemId ? -HISTORY_ACTIONS_WIDTH : 0;
    swipeGestureRef.current = {
      itemId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseOffset,
      latestOffset: baseOffset,
      isHorizontal: false,
      hasMoved: false
    };
    setDragOffset({ itemId, value: baseOffset });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleSwipeMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = swipeGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;

    if (!gesture.isHorizontal && Math.abs(deltaX) > 5) {
      gesture.isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (!gesture.isHorizontal) return;

    gesture.hasMoved = Math.abs(deltaX) > HISTORY_SWIPE_CLICK_SUPPRESS_THRESHOLD;
    gesture.latestOffset = clampSwipeOffset(gesture.baseOffset + deltaX);
    setDragOffset({ itemId: gesture.itemId, value: gesture.latestOffset });
  };
  const handleSwipeEnd = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = swipeGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    swipeGestureRef.current = null;
    setDragOffset(null);

    if (gesture.hasMoved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    const shouldOpen = Math.abs(gesture.latestOffset) >= HISTORY_SWIPE_OPEN_THRESHOLD;
    setOpenActionsId(shouldOpen ? gesture.itemId : null);
  };
  const getBookingNights = (booking: BookingRequest) => {
    if (Number.isFinite(booking.totalDays) && booking.totalDays > 0) return booking.totalDays;

    const start = new Date(`${booking.startDate}T00:00:00`).getTime();
    const end = new Date(`${booking.endDate}T00:00:00`).getTime();
    const days = Math.round((end - start) / (24 * 60 * 60 * 1000));

    return days > 0 ? days : 0;
  };
  const getRoomTypeLabel = (roomType?: Listing['roomType']) => (
    roomType ? tr(`listing.subtitle.roomType.${roomType}`) : ''
  );
  const getLatestBookingForListing = (listingId: string) => bookings
    .filter((booking) => booking.listingId === listingId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const getBookingStatusMeta = (status: BookingRequest['status']) => {
    if (status === 'accepted') {
      return {
        label: tr('history.bookingStatus.accepted'),
        className: 'border-emerald-100 bg-emerald-50 text-emerald-600'
      };
    }
    if (status === 'declined') {
      return {
        label: tr('history.bookingStatus.declined'),
        className: 'border-rose-100 bg-rose-50 text-rose-600'
      };
    }
    return {
      label: tr('history.bookingStatus.pending'),
      className: 'border-amber-100 bg-amber-50 text-amber-600'
    };
  };

  const content = (
    <div className="space-y-3">
      {history.length === 0 ? (
        <div className="text-center py-16 bg-[#F4F7F6]/50 rounded-2xl border border-dashed border-gray-200">
          <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            {tr('history.emptyTitle')}
          </p>
          <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
            {tr('history.emptyBody')}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map((item, index) => {
            const listing = listings.find((candidate) => candidate.id === item.id);
            const latestBooking = getLatestBookingForListing(item.id);
            const bookingStatusMeta = latestBooking ? getBookingStatusMeta(latestBooking.status) : null;
            const roomTypeLabel = getRoomTypeLabel(listing?.roomType);
            const bookingNights = latestBooking ? getBookingNights(latestBooking) : 0;
            const bookingPeriod = latestBooking
              ? `${formatShortDate(latestBooking.startDate)} - ${formatShortDate(latestBooking.endDate)}`
              : '';
            const whatsAppPhone = listing?.whatsappNumber || item.whatsappNumber;
            const whatsAppUrl = buildWhatsAppUrl(whatsAppPhone);
            const actionsOpen = openActionsId === item.id;
            const cardOffset = getCardOffset(item.id);
            const isDragging = dragOffset?.itemId === item.id;
            const cardTone = item.pinned
              ? 'border-[#E7C15F] bg-[#FFF9E8] shadow-[0_10px_24px_rgba(180,124,24,0.12)]'
              : 'border-[#DDE5E1] bg-white shadow-[0_8px_22px_rgba(30,41,59,0.06)] hover:border-[#2F7D69]/45 hover:shadow-[0_12px_30px_rgba(47,125,105,0.12)]';

            return (
              <div
                key={`${item.id}-${index}`}
                className="relative overflow-hidden rounded-2xl group"
                onMouseLeave={closeSwipeActions}
              >
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-y-0 left-0 right-13 bg-[#F4C765]" />
                  <div className="absolute inset-y-0 right-0 w-13 bg-rose-500" />
                </div>
                <div className="absolute inset-y-0 right-0 z-0 flex w-[104px] items-stretch justify-end overflow-hidden rounded-r-2xl">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onPinItem(item.id);
                      closeSwipeActions();
                    }}
                    className="flex w-13 items-center justify-center bg-[#F4C765] text-[#1E293B] focus:outline-none cursor-pointer"
                    aria-label={tr('history.pinItem')}
                    title={tr('history.pinItem')}
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPendingDeleteId(item.id);
                    }}
                    className="flex w-13 items-center justify-center bg-rose-500 text-white focus:outline-none cursor-pointer"
                    aria-label={tr('history.deleteItem')}
                    title={tr('history.deleteItem')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div
                  onClick={() => {
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false;
                      return;
                    }
                    if (actionsOpen) {
                      closeSwipeActions();
                      return;
                    }
                    if (listing) {
                      onViewListing(listing);
                    } else {
                      alert(tr('history.missingListing'));
                    }
                  }}
                  onPointerDown={(event) => handleSwipeStart(item.id, event)}
                  onPointerMove={handleSwipeMove}
                  onPointerUp={handleSwipeEnd}
                  onPointerCancel={handleSwipeEnd}
                  className={`relative z-10 min-h-[84px] border rounded-2xl flex items-stretch justify-between overflow-hidden cursor-pointer group ${cardTone} ${isDragging ? '' : 'transition-[transform,box-shadow,border-color] duration-200 ease-out'}`}
                  style={{
                    touchAction: 'pan-y',
                    transform: `translate3d(${cardOffset}px, 0, 0)`
                  }}
                >
                  <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 sm:p-3.5">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`relative h-16 w-16 rounded-xl overflow-hidden shrink-0 border shadow-sm ${item.pinned ? 'border-[#E7C15F] bg-[#FFF3C4]' : 'border-white bg-gray-100'}`}>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title || tr('history.listingFallback')}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-[9px] uppercase font-mono">
                            No img
                          </div>
                        )}
                        {item.pinned && (
                          <span className="absolute right-1 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#F4C765] text-[#1E293B] shadow-sm">
                            <Pin className="h-3 w-3 fill-current" />
                          </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className={`text-sm font-extrabold truncate leading-tight transition-colors ${item.pinned ? 'text-[#8A5B00]' : 'text-[#1E293B] group-hover:text-[#2F7D69]'}`}>
                          {item.title || tr('history.listingFallback')}{roomTypeLabel ? `. ${roomTypeLabel}` : ''}
                        </h4>
                        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide">
                          {item.district && (
                            <span className="max-w-[140px] truncate rounded-md border border-[#2F7D69]/10 bg-[#2F7D69]/5 px-1.5 py-0.5 text-[#2F7D69]">
                              {item.district}
                            </span>
                          )}
                          <span className="text-gray-400 font-normal">
                            {item.clickedAt ? new Date(item.clickedAt).toLocaleDateString() : tr('history.recently')}
                          </span>
                        </div>
                        {latestBooking && (
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-bold">
                            {bookingPeriod && (
                              <span className="rounded-md border border-sky-100 bg-sky-50 px-1.5 py-0.5 text-sky-700">
                                {bookingPeriod}
                              </span>
                            )}
                            {bookingNights > 0 && (
                              <span className="rounded-md border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-amber-700">
                                {tr('history.bookingNights', { count: bookingNights })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end justify-center gap-1 text-right">
                      <span className="rounded-lg bg-[#F4F7F6] px-2 py-1 text-xs font-extrabold text-[#1E293B] font-mono leading-none ring-1 ring-[#E5E7EB]">
                        {formatPrice(item.pricePerDay || 0)} {currencySymbol}
                      </span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {bookingStatusMeta && (
                          <span className={`text-[8px] font-semibold uppercase tracking-wider border px-1.5 py-0.5 rounded-md shadow-2xs ${bookingStatusMeta.className}`}>
                            {bookingStatusMeta.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (suppressClickRef.current) {
                        suppressClickRef.current = false;
                        return;
                      }
                      openWhatsApp(whatsAppPhone);
                    }}
                    aria-disabled={!whatsAppUrl}
                    aria-label={tr('history.openWhatsApp')}
                    title={tr('history.openWhatsApp')}
                    className={`flex w-[84px] shrink-0 items-center justify-center self-stretch border-l transition sm:w-[88px] ${
                      whatsAppUrl
                        ? 'border-[#2F7D69] bg-[#2F7D69] text-white hover:bg-emerald-600 cursor-pointer'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <svg className="h-9 w-9 fill-current shrink-0 drop-shadow-sm" viewBox="0 0 24 24">
                      <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.764.462 3.42 1.258 4.876L2 22l5.304-1.216A9.94 9.94 0 0 0 12.004 22c5.52 0 10-4.48 10-10.004C22.004 6.48 17.524 2 12.004 2zm5.72 13.92c-.22.624-1.076 1.156-1.748 1.296-.512.108-1.18.2-3.444-.736-2.892-1.196-4.736-4.14-4.88-4.332-.14-.192-1.136-1.512-1.136-2.884 0-1.372.716-2.044.972-2.316.22-.228.58-.336.872-.336.096 0 .18 0 .252.004.212.008.316.02.456.328.176.388.604 1.472.656 1.58.052.108.088.232.016.376-.072.148-.108.24-.216.368-.108.128-.22.252-.316.364-.1.108-.204.228-.088.428.116.196.516.852 1.112 1.384.768.684 1.412.896 1.612.996.2.1.316.084.432-.048.116-.132.504-.588.64-.788.136-.2.272-.164.456-.096.188.068 1.192.56 1.4.664.204.104.34.156.388.24.048.084.048.492-.172 1.116z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[500] p-3 sm:p-5">
      <div className="bg-white w-full max-w-2xl h-[85vh] max-h-[640px] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-scale-up border border-[#E5E7EB]">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#EAEAEC] shrink-0">
          <h3 className="font-heading text-[#1E293B] text-base font-extrabold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#2F7D69] shadow-sm border border-white/80">
              <MessageSquare className="h-4 w-4" />
            </span>
            {tr('history.title')}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/70 rounded-full text-gray-400 hover:text-gray-600 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#F4F7F6]">
          {successMsg ? <p className="h-full flex items-center justify-center text-sm font-bold text-gray-700">{successMsg}</p> : content}
        </div>

        {pendingDeleteId && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1E293B]/35 px-5 backdrop-blur-xs">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-history-delete-title"
              className="pu flex w-full max-w-xs flex-col overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-2xl animate-scale-up"
            >
              <div className="pu-head flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                  <Trash2 className="h-4 w-4" />
                </span>
                <h3 id="contact-history-delete-title">
                  {tr('history.confirmDeleteTitle')}
                </h3>
              </div>
              <div className="pu-footer">
                <button
                  type="button"
                  onClick={closeDeleteConfirm}
                  className="pu-button-secondary flex-1 focus:outline-none"
                >
                  {tr('history.cancelDelete')}
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteItem}
                  className="pu-button-primary flex-1 !bg-rose-500 hover:!bg-rose-600 focus:outline-none"
                >
                  {tr('history.deleteItem')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
