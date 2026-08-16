import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { BookingRequest, Listing } from '../../types';
import BookingRequestControls from './BookingRequestControls';
import { useI18n } from '../../i18nContext';

interface CalendarListingModalProps {
  listing: Listing;
  bookings: BookingRequest[];
  currencySymbol: string;
  currencyRate: number;
  onChange: (listing: Listing) => void;
  onUpdateStatus: (id: string, status: 'accepted' | 'declined') => void;
  onUpdateBooking: (booking: BookingRequest) => void;
  onAddBooking: (booking: BookingRequest) => void;
  onClose: () => void;
}

export default function CalendarListingModal({
  listing,
  bookings,
  currencySymbol,
  currencyRate,
  onChange,
  onUpdateStatus,
  onUpdateBooking,
  onAddBooking,
  onClose
}: CalendarListingModalProps) {
  const { language, tr } = useI18n();
  const [blockedDates, setBlockedDates] = useState<string[]>(listing.blockedDates || []);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const [localAcceptedBookings, setLocalAcceptedBookings] = useState<BookingRequest[]>([]);
  const [reserveDraft, setReserveDraft] = useState<{
    startDate: string;
    endDate: string;
    totalDays: number;
    totalPrice: number;
  } | null>(null);
  const [baseMonth, setBaseMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const dragMovedRef = useRef(false);
  const dragPointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragGestureRef = useRef<'idle' | 'pending' | 'selecting' | 'scrolling'>('idle');
  const months = Array.from({ length: 2 }, (_, index) => (
    new Date(baseMonth.getFullYear(), baseMonth.getMonth() + index, 1)
  ));
  const ranges = getRanges(blockedDates);
  const requestBookings = [...localAcceptedBookings, ...bookings]
    .filter((booking, index, allBookings) =>
      booking.listingId === listing.id
      && isBookingVisible(booking)
      && allBookings.findIndex(item => item.id === booking.id) === index
    )
    .sort(sortBookingRequests);
  const calendarBookings = requestBookings.filter(booking => booking.status !== 'declined');
  const newRequestBookings = requestBookings.filter(booking => booking.status === 'pending');
  const currentRequestBookings = requestBookings.filter(booking => booking.status === 'accepted' && !isBookingCompleted(booking));
  const completedRequestBookings = requestBookings.filter(booking => booking.status === 'accepted' && isBookingCompleted(booking));
  const declinedRequestBookings = requestBookings.filter(booking => booking.status === 'declined');
  const ownerDisplayName = listing.ownerName.trim() || tr('details.listingAuthor');
  const activeDailyPrice = listing.hasDropPrice && listing.dropPricePerDay
    ? listing.dropPricePerDay
    : listing.pricePerDay;

  const canUseDateAsRangeStart = (date: string) => (
    !calendarBookings.some(booking => date >= booking.startDate && date < booking.endDate)
  );

  const canUseDateAsRangeEnd = (date: string) => (
    !calendarBookings.some(booking => date > booking.startDate && date < booking.endDate)
  );

  const rangeOverlapsBooking = (startDate: string, endDate: string) => (
    getNightDates(startDate, endDate).some(date =>
      calendarBookings.some(booking => date >= booking.startDate && date < booking.endDate)
    )
  );

  const buildReserveDraft = (firstDate: string, secondDate: string) => {
    const first = new Date(firstDate);
    const second = new Date(secondDate);
    const start = first <= second ? first : second;
    const checkout = first <= second ? second : first;
    if (formatDate(start) === formatDate(checkout)) {
      checkout.setDate(checkout.getDate() + 1);
    }
    const startDate = formatDate(start);
    const endDate = formatDate(checkout);
    const selectedDates = getNightDates(startDate, endDate);

    if (
      !canUseDateAsRangeStart(startDate)
      || !canUseDateAsRangeEnd(endDate)
      || rangeOverlapsBooking(startDate, endDate)
    ) return null;

    return {
      startDate,
      endDate,
      totalDays: selectedDates.length,
      totalPrice: selectedDates.length * activeDailyPrice
    };
  };

  const applyDateRange = (firstDate: string, secondDate: string) => {
    const nextDraft = buildReserveDraft(firstDate, secondDate);
    if (!nextDraft) return;
    setReserveDraft(nextDraft);
    setRangeStart(null);
    setHoverDate(null);
  };

  const clearReserveDraft = () => {
    setReserveDraft(null);
    setRangeStart(null);
    setHoverDate(null);
    resetDrag();
  };

  const reserveSelectedPeriod = () => {
    if (!reserveDraft) return;
    const reservedDates = getNightDates(reserveDraft.startDate, reserveDraft.endDate);
    const nextBlockedDates = blockedDates.filter(date => !reservedDates.includes(date));
    if (nextBlockedDates.length !== blockedDates.length) {
      setBlockedDates(nextBlockedDates);
      onChange({ ...listing, blockedDates: nextBlockedDates } as Listing);
    }
    const acceptedBooking: BookingRequest = {
      id: `reserve-${listing.id}-${Date.now()}`,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images[0],
      listingCategory: listing.category as BookingRequest['listingCategory'],
      guestName: ownerDisplayName,
      guestPhone: listing.whatsappNumber,
      startDate: reserveDraft.startDate,
      endDate: reserveDraft.endDate,
      totalDays: reserveDraft.totalDays,
      totalPrice: reserveDraft.totalPrice,
      status: 'accepted',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString()
    };
    setLocalAcceptedBookings(current => [acceptedBooking, ...current]);
    onAddBooking(acceptedBooking);
    clearReserveDraft();
  };

  const handleDateClick = (date: string, canStartDate = true, canEndDate = true) => {
    if (!rangeStart || reserveDraft) {
      if (!canStartDate) return;
      setReserveDraft(null);
      setRangeStart(date);
      setHoverDate(date);
      return;
    }
    if (!canEndDate) return;
    applyDateRange(rangeStart, date);
  };

  const resetDrag = () => {
    setDragStart(null);
    setDragEnd(null);
    dragMovedRef.current = false;
    dragPointerStartRef.current = null;
    dragGestureRef.current = 'idle';
  };

  const startDragSelection = (date: string) => {
    dragMovedRef.current = false;
    dragGestureRef.current = 'selecting';
    setDragStart(date);
    setDragEnd(date);
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    date: string,
    canUseDate: boolean
  ) => {
    if (!canUseDate || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.currentTarget.setPointerCapture(event.pointerId);

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      dragPointerStartRef.current = { x: event.clientX, y: event.clientY };
      dragGestureRef.current = 'pending';
      return;
    }

    event.preventDefault();
    startDragSelection(date);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    let activeDragStart = dragStart;

    if (dragGestureRef.current === 'pending') {
      const start = dragPointerStartRef.current;
      if (!start) return;

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < 8 && absY < 8) return;
      if (absX <= absY) {
        dragGestureRef.current = 'scrolling';
        setDragStart(null);
        setDragEnd(null);
        return;
      }

      const target = event.currentTarget.closest<HTMLElement>('[data-calendar-date]');
      const startDate = target?.dataset.calendarDate;
      if (!startDate) return;
      activeDragStart = startDate;
      startDragSelection(startDate);
    }

    if (!activeDragStart || dragGestureRef.current !== 'selecting') return;
    event.preventDefault();
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-calendar-date]');
    const hoveredDate = target?.dataset.calendarDate;
    if (!hoveredDate) return;
    const canUseHoveredDate = activeDragStart <= hoveredDate
      ? target?.dataset.canEnd === 'true'
      : target?.dataset.canStart === 'true';
    if (!canUseHoveredDate) return;
    if (hoveredDate !== activeDragStart) dragMovedRef.current = true;
    setDragEnd(hoveredDate);
  };

  const handlePointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
    fallbackDate: string,
    canStartDate = true,
    canEndDate = true
  ) => {
    if (dragGestureRef.current === 'scrolling') {
      resetDrag();
      return;
    }

    if (dragGestureRef.current === 'pending') {
      handleDateClick(fallbackDate, canStartDate, canEndDate);
      resetDrag();
      return;
    }

    if (!dragStart) return;
    event.preventDefault();
    const endDate = dragEnd || fallbackDate;
    if (dragMovedRef.current) {
      applyDateRange(dragStart, endDate);
    } else {
      handleDateClick(fallbackDate, canStartDate, canEndDate);
    }
    resetDrag();
  };

  const close = () => {
    setRangeStart(null);
    setHoverDate(null);
    setReserveDraft(null);
    resetDrag();
    onClose();
  };

  const updateBooking = (booking: BookingRequest) => {
    setLocalAcceptedBookings(current => current.map(item => (
      item.id === booking.id ? booking : item
    )));
    onUpdateBooking(booking);
  };

  const updateBookingStatus = (id: string, status: 'accepted' | 'declined') => {
    setLocalAcceptedBookings(current => current.map(item => (
      item.id === id
        ? {
          ...item,
          status,
          declinedAt: status === 'declined' ? new Date().toISOString() : undefined
        }
        : item
    )));
    onUpdateStatus(id, status);
  };

  const focusBooking = (bookingId: string) => {
    setHighlightedBookingId(bookingId);
    document.getElementById(`calendar-booking-${bookingId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    window.setTimeout(() => setHighlightedBookingId(null), 1600);
  };

  const showPreviousMonths = () => {
    setBaseMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const showNextMonths = () => {
    setBaseMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[510] p-3 sm:p-4 animate-fade-in" id="promote-calendar-modal">
      <div className="pu max-w-[1080px] w-full max-h-[90vh] rounded-[24px] sm:rounded-3xl shadow-2xl animate-scale-up text-gray-950 flex flex-col font-sans">
        <div className="pu-header px-5 py-4 border-b border-[#D1D5DB]/30 relative shrink-0">
          <div className="text-center">
            <h3 className="font-bold text-sm">{tr('calendarListing.title')}</h3>
          </div>
          <button onClick={close} className="absolute top-3.5 right-4 p-1 hover:bg-red-50 hover:text-red-500 rounded-full transition active:scale-95 cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="pu-body grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 p-5 overflow-y-auto">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={showPreviousMonths}
                className="h-8 w-8 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-[#FF7A50]/40 hover:text-[#E05A30] transition active:scale-95 flex items-center justify-center"
                title={tr('calendar.prevMonth')}
                aria-label={tr('calendar.prevMonth')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="h-px flex-1 bg-gray-200/70" />
              <button
                type="button"
                onClick={showNextMonths}
                className="h-8 w-8 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-[#FF7A50]/40 hover:text-[#E05A30] transition active:scale-95 flex items-center justify-center"
                title={tr('calendar.nextMonth')}
                aria-label={tr('calendar.nextMonth')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-7">
            {months.map(monthDate => {
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

            return (
              <div key={`${year}-${month}`} className="min-w-[240px]">
                <h4 className="text-center font-bold text-gray-950 text-sm mb-3">
                  {monthDate.toLocaleDateString(language.toLowerCase(), { month: 'long', year: 'numeric' })}
                </h4>
                <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] sm:text-xs font-semibold text-gray-400 mb-2">
                  {[
                    tr('calendar.monday'),
                    tr('calendar.tuesday'),
                    tr('calendar.wednesday'),
                    tr('calendar.thursday'),
                    tr('calendar.friday'),
                    tr('calendar.saturday'),
                    tr('calendar.sunday')
                  ].map((day, index) => (
                    <div key={day} className={index >= 5 ? 'text-rose-400' : ''}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                  {Array.from({ length: firstWeekday }).map((_, index) => (
                    <div key={`empty-${index}`} className="h-8 w-8" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isBlocked = blockedDates.includes(date);
                    const startsRange = ranges.some(range => range.start === date);
                    const endsRange = ranges.some(range => range.end === date);
                    const isRangeMiddle = ranges.some(range => date > range.start && date < range.end);
                    const bookingNight = calendarBookings.find(request => date >= request.startDate && date < request.endDate);
                    const bookingStart = calendarBookings.find(request => request.startDate === date);
                    const bookingCheckout = calendarBookings.find(request => request.endDate === date);
                    const booking = bookingNight || bookingStart || bookingCheckout;
                    const isBookingStart = !!bookingStart;
                    const isBookingCheckout = !!bookingCheckout;
                    const isBookingNight = !!bookingNight;
                    const isBookingBridge = isBookingStart && isBookingCheckout;
                    const isReserveLastNight = !!reserveDraft && date === previousDateString(reserveDraft.endDate);
                    const isDraftStart = !!reserveDraft && reserveDraft.startDate === date;
                    const isDraftNight = !!reserveDraft && date >= reserveDraft.startDate && date < reserveDraft.endDate;
                    const bookingRangeClass = booking
                      ? (bookingNight || bookingStart || bookingCheckout)?.status === 'accepted'
                        ? isBookingBridge
                          ? 'bg-emerald-500/20'
                          : isBookingStart
                          ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,rgb(16_185_129_/_0.18)_50%,rgb(16_185_129_/_0.18)_100%)]'
                          : isBookingCheckout
                            ? 'bg-[linear-gradient(to_right,rgb(16_185_129_/_0.18)_0%,rgb(16_185_129_/_0.18)_50%,transparent_50%,transparent_100%)]'
                            : isBookingNight
                              ? 'bg-emerald-500/20'
                              : ''
                        : isBookingStart
                          ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,rgb(255_122_80_/_0.15)_50%,rgb(255_122_80_/_0.15)_100%)]'
                          : isBookingCheckout
                            ? 'bg-[linear-gradient(to_right,rgb(255_122_80_/_0.15)_0%,rgb(255_122_80_/_0.15)_50%,transparent_50%,transparent_100%)]'
                            : isBookingNight
                              ? 'bg-[#FF7A50]/15'
                              : ''
                      : '';
                    const isDraftCheckout = !!reserveDraft && reserveDraft.endDate === date;
                    const previewAnchor = dragStart || (!reserveDraft ? rangeStart : null);
                    const previewTarget = dragStart ? dragEnd : hoverDate;
                    const previewStart = previewAnchor && previewTarget
                      ? (previewAnchor <= previewTarget ? previewAnchor : previewTarget)
                      : null;
                    const previewEnd = previewAnchor && previewTarget
                      ? (previewAnchor <= previewTarget ? previewTarget : previewAnchor)
                      : null;
                    const hasBooking = !!booking;
                    const canStartDate = canUseDateAsRangeStart(date);
                    const canEndDate = canUseDateAsRangeEnd(date);
                    const canUseDateForCurrentClick = (!rangeStart || reserveDraft) ? canStartDate : canEndDate;
                    const isPreviewRangeValid = !!previewStart
                      && !!previewEnd
                      && canUseDateAsRangeStart(previewStart)
                      && canUseDateAsRangeEnd(previewEnd)
                      && !rangeOverlapsBooking(previewStart, previewEnd);
                    const isPreview = isPreviewRangeValid
                      && date >= previewStart
                      && date <= previewEnd
                      && (
                        (date === previewStart && canStartDate)
                        || (date === previewEnd && canEndDate)
                        || (!hasBooking && date > previewStart && date < previewEnd)
                      );
                    const isPreviewStart = isPreview && date === previewStart;
                    const isPreviewEnd = isPreview && date === previewEnd;
                    const isSelectionBridge = isBookingCheckout && (rangeStart === date || isDraftStart || isPreviewStart);
                    const isCheckoutToBookingBridge = isBookingStart && (isDraftCheckout || isPreviewEnd);
                    const previewRangeClass = isPreview
                      ? isPreviewStart && !isPreviewEnd
                        ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,rgb(255_122_80_/_0.15)_50%,rgb(255_122_80_/_0.15)_100%)]'
                        : isPreviewEnd && !isPreviewStart
                          ? 'bg-[linear-gradient(to_right,rgb(255_122_80_/_0.15)_0%,rgb(255_122_80_/_0.15)_50%,transparent_50%,transparent_100%)]'
                          : isPreviewStart && isPreviewEnd
                            ? ''
                            : 'bg-[#FF7A50]/15'
                      : '';
                    const draftRangeClass = isDraftStart && !isDraftCheckout
                      ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,rgb(255_122_80_/_0.15)_50%,rgb(255_122_80_/_0.15)_100%)]'
                      : isDraftCheckout && !isDraftStart
                        ? 'bg-[linear-gradient(to_right,rgb(255_122_80_/_0.15)_0%,rgb(255_122_80_/_0.15)_50%,transparent_50%,transparent_100%)]'
                        : isDraftNight
                          ? 'bg-[#FF7A50]/15'
                          : '';
                    const blockedRangeClass = isDraftCheckout
                      ? 'bg-[linear-gradient(to_right,rgb(255_122_80_/_0.15)_0%,rgb(255_122_80_/_0.15)_50%,transparent_50%,transparent_100%)]'
                      : isReserveLastNight && !startsRange
                        ? 'bg-[#FF7A50]/15'
                      : isRangeMiddle
                        ? 'bg-[#FF7A50]/15'
                        : startsRange && !endsRange
                          ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,rgb(255_122_80_/_0.15)_50%,rgb(255_122_80_/_0.15)_100%)]'
                          : endsRange && !startsRange
                            ? 'bg-[linear-gradient(to_right,rgb(255_122_80_/_0.15)_0%,rgb(255_122_80_/_0.15)_50%,transparent_50%,transparent_100%)]'
                            : '';

                    return (
                      <div
                        key={date}
                        data-calendar-date={date}
                        data-has-booking={hasBooking ? 'true' : 'false'}
                        data-can-start={canStartDate ? 'true' : 'false'}
                        data-can-end={canEndDate ? 'true' : 'false'}
                        className={`h-[34px] relative flex items-center ${isSelectionBridge
                          ? 'bg-[linear-gradient(to_right,rgb(16_185_129_/_0.18)_0%,rgb(16_185_129_/_0.18)_50%,rgb(255_122_80_/_0.15)_50%,rgb(255_122_80_/_0.15)_100%)]'
                          : isCheckoutToBookingBridge
                            ? 'bg-[linear-gradient(to_right,rgb(255_122_80_/_0.15)_0%,rgb(255_122_80_/_0.15)_50%,rgb(16_185_129_/_0.18)_50%,rgb(16_185_129_/_0.18)_100%)]'
                          : bookingRangeClass || previewRangeClass || draftRangeClass || blockedRangeClass
                        }`}
                      >
                        <button
                          type="button"
                          onPointerDown={(event) => handlePointerDown(event, date, canUseDateForCurrentClick)}
                          onPointerMove={handlePointerMove}
                          onPointerEnter={() => {
                            const canUseHoveredDate = rangeStart <= date ? canEndDate : canStartDate;
                            if (rangeStart && !reserveDraft && canUseHoveredDate) {
                              setHoverDate(date);
                            }
                          }}
                          onPointerUp={(event) => handlePointerUp(event, date, canStartDate, canEndDate)}
                          onPointerCancel={resetDrag}
                          title={booking ? `${booking.guestName}: ${booking.startDate} - ${booking.endDate}` : undefined}
                          style={{ touchAction: 'pan-y' }}
                          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center transition cursor-pointer select-none font-bold ${
                            isCheckoutToBookingBridge
                              ? 'bg-[linear-gradient(to_right,#FF7A50_0%,#FF7A50_50%,rgb(16_185_129)_50%,rgb(16_185_129)_100%)] text-white ring-1 ring-[#FF7A50]/30 shadow-xs relative z-10'
                              : isBookingBridge
                              ? 'bg-emerald-500 text-white ring-1 ring-emerald-200 shadow-xs relative z-10'
                              : isSelectionBridge
                                ? 'bg-[linear-gradient(to_right,rgb(16_185_129)_0%,rgb(16_185_129)_50%,#FF7A50_50%,#FF7A50_100%)] text-white ring-1 ring-[#FF7A50]/30 shadow-xs relative z-10'
                              : booking && isBookingStart
                                ? booking.status === 'accepted'
                                  ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,rgb(16_185_129)_50%,rgb(16_185_129)_100%)] text-emerald-900 ring-1 ring-emerald-200 shadow-xs relative z-10'
                                  : 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,#FF7A50_50%,#FF7A50_100%)] text-[#8A341D] ring-1 ring-[#FF7A50]/30 shadow-xs relative z-10'
                              : booking && isBookingCheckout
                                ? booking.status === 'accepted'
                                  ? 'w-8 h-8 mx-auto rounded-full bg-[linear-gradient(to_right,rgb(16_185_129)_0%,rgb(16_185_129)_50%,transparent_50%,transparent_100%)] text-emerald-900 ring-1 ring-emerald-200 relative z-10'
                                  : 'w-8 h-8 mx-auto rounded-full bg-[linear-gradient(to_right,#FF7A50_0%,#FF7A50_50%,transparent_50%,transparent_100%)] text-[#8A341D] ring-1 ring-[#FF7A50]/30 relative z-10'
                              : booking
                                ? booking.status === 'accepted'
                                  ? 'w-full rounded-none bg-transparent text-emerald-700'
                                  : 'w-full rounded-none bg-transparent text-[#E05A30]'
                                : isPreviewStart
                                  ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,#FF7A50_50%,#FF7A50_100%)] text-[#8A341D] ring-1 ring-[#FF7A50]/30 shadow-xs relative z-10 scale-105'
                                  : isPreviewEnd
                                    ? 'bg-[linear-gradient(to_right,#FF7A50_0%,#FF7A50_50%,transparent_50%,transparent_100%)] text-[#8A341D] ring-1 ring-[#FF7A50]/30 shadow-xs relative z-10 scale-105'
                                  : isPreview
                                    ? 'w-full rounded-none bg-transparent text-[#E05A30]'
                                    : isDraftStart
                                      ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,#FF7A50_50%,#FF7A50_100%)] text-[#8A341D] ring-1 ring-[#FF7A50]/30 shadow-xs relative z-10'
                                    : isDraftCheckout
                                      ? 'bg-[linear-gradient(to_right,#FF7A50_0%,#FF7A50_50%,transparent_50%,transparent_100%)] text-[#8A341D] ring-1 ring-[#FF7A50]/30 shadow-xs relative z-10'
                                : rangeStart === date
                              ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,#FF7A50_50%,#FF7A50_100%)] text-[#8A341D] shadow-xs scale-105 ring-2 ring-[#FF7A50]/25'
                              : startsRange || (endsRange && !isReserveLastNight)
                                ? startsRange
                                  ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,#FF7A50_50%,#FF7A50_100%)] text-[#8A341D] shadow-xs scale-105 ring-1 ring-[#FF7A50]/25'
                                  : 'bg-[linear-gradient(to_right,#FF7A50_0%,#FF7A50_50%,transparent_50%,transparent_100%)] text-[#8A341D] shadow-xs scale-105 ring-1 ring-[#FF7A50]/25'
                                : isBlocked
                                  ? 'text-[#E05A30] bg-transparent'
                                  : 'text-gray-700 hover:bg-white'
                          }`}
                        >
                          {day}
                        </button>
                        {booking && isBookingStart && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              focusBooking(booking.id);
                            }}
                            className={`absolute z-20 left-1/2 bottom-0 px-2 py-0.5 rounded-md text-[9px] leading-none font-bold text-white shadow-md whitespace-nowrap hover:scale-105 transition ${
                              booking.status === 'accepted' ? 'bg-emerald-600' : 'bg-[#FF7A50]'
                            }`}
                            title={tr('calendarListing.openRequest', { name: booking.guestName })}
                          >
                            {booking.guestName}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>
          </div>

          <aside className="lg:border-l lg:border-gray-200/70 lg:pl-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-black uppercase text-gray-700">{tr('calendarListing.guestRequests')}</h4>
              <span className="text-[10px] font-bold text-[#FF7A50]">{requestBookings.length + (reserveDraft ? 1 : 0)}</span>
            </div>

            {reserveDraft && (
              <div className="rounded-2xl border border-[#FF7A50]/30 bg-[#FF7A50]/10 p-3 space-y-2 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-wide text-[#E05A30]">
                      {tr('calendarListing.reserveDraft')}
                    </p>
                    <p className="font-bold text-[#1E293B] truncate">{ownerDisplayName}</p>
                  </div>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#FF7A50] text-white shrink-0">
                    {tr('booking.status.new')}
                  </span>
                </div>

                <div className="rounded-xl bg-white/70 border border-white/80 px-2.5 py-2 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="text-gray-500">{tr('calendarListing.reservePeriod')}</span>
                    <span className="font-mono font-bold text-gray-800">
                      {formatShortDate(reserveDraft.startDate)} - {formatShortDate(reserveDraft.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="text-gray-500">{tr('booking.nights', { count: reserveDraft.totalDays })}</span>
                    <span className="font-mono font-bold text-gray-800">
                      {Math.round(reserveDraft.totalPrice * currencyRate).toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={reserveSelectedPeriod}
                    className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition active:scale-95"
                  >
                    {tr('calendarListing.reserve')}
                  </button>
                  <button
                    type="button"
                    onClick={clearReserveDraft}
                    className="py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] transition active:scale-95"
                  >
                    {tr('calendarListing.decline')}
                  </button>
                </div>
              </div>
            )}

            {requestBookings.length === 0 && !reserveDraft ? (
              <p className="text-[10.5px] text-gray-400 py-4">{tr('calendarListing.noRequests')}</p>
            ) : (
              <>
                {newRequestBookings.map(request => (
              <div
                key={request.id}
                id={`calendar-booking-${request.id}`}
                className={`rounded-2xl transition-all duration-300 ${
                  highlightedBookingId === request.id
                    ? 'ring-2 ring-[#FF7A50] ring-offset-2 ring-offset-[#F4F7F6] scale-[1.02]'
                    : ''
                }`}
              >
                <BookingRequestControls
                  request={request}
                  listing={listing}
                  currencySymbol={currencySymbol}
                  currencyRate={currencyRate}
                  onUpdateStatus={updateBookingStatus}
                  onUpdateBooking={updateBooking}
                  compact
                />
              </div>
                ))}
                {currentRequestBookings.length > 0 && newRequestBookings.length > 0 && (
                  <BookingDivider label={tr('booking.status.current')} />
                )}
                {currentRequestBookings.map(request => (
                  <div
                    key={request.id}
                    id={`calendar-booking-${request.id}`}
                    className={`rounded-2xl transition-all duration-300 ${
                      highlightedBookingId === request.id
                        ? 'ring-2 ring-[#FF7A50] ring-offset-2 ring-offset-[#F4F7F6] scale-[1.02]'
                        : ''
                    }`}
                  >
                    <BookingRequestControls
                      request={request}
                      listing={listing}
                      currencySymbol={currencySymbol}
                      currencyRate={currencyRate}
                      onUpdateStatus={updateBookingStatus}
                      onUpdateBooking={updateBooking}
                      compact
                    />
                  </div>
                ))}
                {completedRequestBookings.length > 0 && (
                  <BookingDivider label={tr('booking.status.completed')} />
                )}
                {completedRequestBookings.map(request => (
                  <div
                    key={request.id}
                    id={`calendar-booking-${request.id}`}
                    className={`rounded-2xl transition-all duration-300 ${
                      highlightedBookingId === request.id
                        ? 'ring-2 ring-[#FF7A50] ring-offset-2 ring-offset-[#F4F7F6] scale-[1.02]'
                        : ''
                    }`}
                  >
                    <BookingRequestControls
                      request={request}
                      listing={listing}
                      currencySymbol={currencySymbol}
                      currencyRate={currencyRate}
                      onUpdateStatus={updateBookingStatus}
                      onUpdateBooking={updateBooking}
                      compact
                    />
                  </div>
                ))}
                {declinedRequestBookings.length > 0 && (
                  <BookingDivider label={tr('booking.status.declined')} />
                )}
                {declinedRequestBookings.map(request => (
                  <div
                    key={request.id}
                    id={`calendar-booking-${request.id}`}
                    className={`rounded-2xl transition-all duration-300 ${
                      highlightedBookingId === request.id
                        ? 'ring-2 ring-[#FF7A50] ring-offset-2 ring-offset-[#F4F7F6] scale-[1.02]'
                        : ''
                    }`}
                  >
                    <BookingRequestControls
                      request={request}
                      listing={listing}
                      currencySymbol={currencySymbol}
                      currencyRate={currencyRate}
                      onUpdateStatus={updateBookingStatus}
                      onUpdateBooking={updateBooking}
                      compact
                    />
                  </div>
                ))}
              </>
            )}
          </aside>
        </div>

        <div className="pu-footer p-5 border-t border-[#D1D5DB]/30 mt-auto shrink-0 flex items-center justify-between gap-4">
          <p className="text-[9.5px] text-gray-400 leading-normal">{tr('calendarListing.icalSync')}</p>
          <button onClick={close} className="px-4 py-1.5 bg-[#FF7A50] hover:bg-[#E05A30] text-white text-xs font-bold rounded-lg transition cursor-pointer active:scale-95 shadow-sm shrink-0">
            {tr('calendar.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit'
  });
}

function previousDateString(date: string) {
  const previous = new Date(`${date}T00:00:00`);
  previous.setDate(previous.getDate() - 1);
  return formatDate(previous);
}

function getNightDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const checkout = new Date(`${endDate}T00:00:00`);

  while (cursor < checkout) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function isBookingVisible(booking: BookingRequest) {
  if (booking.status === 'accepted' && isBookingCompleted(booking)) {
    return Date.now() - new Date(`${booking.endDate}T00:00:00`).getTime() < 30 * 24 * 60 * 60 * 1000;
  }
  if (booking.status !== 'declined') return true;
  const declinedAt = booking.declinedAt || booking.createdAt;
  return Date.now() - new Date(declinedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

function sortBookingRequests(a: BookingRequest, b: BookingRequest) {
  const getSortGroup = (booking: BookingRequest) => (
    booking.status === 'pending'
      ? 0
      : booking.status === 'accepted' && !isBookingCompleted(booking)
        ? 1
        : booking.status === 'accepted'
          ? 2
          : 3
  );
  const groupDelta = getSortGroup(a) - getSortGroup(b);
  if (groupDelta !== 0) return groupDelta;
  if (a.status === 'pending') {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
  return a.startDate.localeCompare(b.startDate);
}

function isBookingCompleted(booking: BookingRequest) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${booking.endDate}T00:00:00`).getTime() < today.getTime();
}

function BookingDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-[9px] font-black uppercase tracking-wide text-gray-400">{label}</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

function getRanges(dates: string[]) {
  const ranges: Array<{ start: string; end: string }> = [];

  [...dates].sort().forEach(date => {
    const lastRange = ranges[ranges.length - 1];
    if (!lastRange) {
      ranges.push({ start: date, end: date });
      return;
    }

    const expectedDate = new Date(lastRange.end);
    expectedDate.setDate(expectedDate.getDate() + 1);
    if (date === formatDate(expectedDate)) {
      lastRange.end = date;
    } else {
      ranges.push({ start: date, end: date });
    }
  });

  return ranges;
}
