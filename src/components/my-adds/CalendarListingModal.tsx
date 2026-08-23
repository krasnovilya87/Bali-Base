import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const [rangeStartRoomIndex, setRangeStartRoomIndex] = useState(0);
  const [dragStartRoomIndex, setDragStartRoomIndex] = useState(0);
  const [draggingBookingId, setDraggingBookingId] = useState<string | null>(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [statsYear, setStatsYear] = useState(() => new Date().getFullYear());
  const [localAcceptedBookings, setLocalAcceptedBookings] = useState<BookingRequest[]>([]);
  const [reserveDraft, setReserveDraft] = useState<{
    startDate: string;
    endDate: string;
    totalDays: number;
    totalPrice: number;
    roomIndex: number;
    roomNumber: string;
  } | null>(null);
  const [baseMonth, setBaseMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });
  const dragMovedRef = useRef(false);
  const dragPointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragGestureRef = useRef<'idle' | 'pending' | 'selecting' | 'scrolling'>('idle');
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
  const roomTypeLabel = listing.roomType
    ? tr(`listing.subtitle.roomType.${listing.roomType}`)
    : tr(`subcategory.${listing.subCategory}`);
  const todayDate = formatDate(new Date());
  const visibleCalendarDays = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(baseMonth);
    date.setDate(baseMonth.getDate() + index);
    return date;
  });
  const monthGroups = visibleCalendarDays.reduce<Array<{ key: string; monthDate: Date; dates: Date[] }>>((groups, date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const currentGroup = groups[groups.length - 1];
    if (currentGroup?.key === key) {
      currentGroup.dates.push(date);
      return groups;
    }
    groups.push({
      key,
      monthDate: new Date(date.getFullYear(), date.getMonth(), 1),
      dates: [date]
    });
    return groups;
  }, []);
  const roomRowCount = Math.max(1, Math.min(50, listing.roomCount || listing.roomNumbers?.length || 1));
  const roomRows = Array.from({ length: roomRowCount }, (_, index) => (
    listing.roomNumbers?.[index] || (index === 0 ? listing.roomNumber || '' : '')
  ));
  const getRoomDisplayName = (roomIndex: number) => (
    roomRows[roomIndex]?.trim() || String(roomIndex + 1)
  );
  const getBookingRoomIndex = (booking: BookingRequest) => {
    if (Number.isInteger(booking.roomIndex)) {
      return Math.max(0, Math.min(roomRowCount - 1, booking.roomIndex || 0));
    }

    const roomNumberIndex = booking.roomNumber
      ? roomRows.findIndex(roomNumber => roomNumber.trim() === booking.roomNumber?.trim())
      : -1;
    return roomNumberIndex >= 0 ? roomNumberIndex : 0;
  };
  const occupancyMonths = getMonthlyOccupancy(requestBookings, roomRowCount, language, statsYear);
  const averageOccupancy = getAverageOccupancy(occupancyMonths);
  const bookingOverlaps = (a: Pick<BookingRequest, 'startDate' | 'endDate'>, b: Pick<BookingRequest, 'startDate' | 'endDate'>) =>
    a.startDate < b.endDate && a.endDate > b.startDate;
  const getBookingsForRoom = (roomIndex: number, exceptBookingId = '') => (
    calendarBookings.filter(booking =>
      booking.id !== exceptBookingId
      && getBookingRoomIndex(booking) === roomIndex
    )
  );
  const isRoomFreeForBooking = (booking: BookingRequest, roomIndex: number) => (
    !getBookingsForRoom(roomIndex, booking.id).some(existingBooking => bookingOverlaps(booking, existingBooking))
  );
  const chooseSmartRotationRoomIndex = (booking: BookingRequest) => {
    const candidates = Array.from({ length: roomRowCount }, (_, roomIndex) => {
      if (!isRoomFreeForBooking(booking, roomIndex)) return null;

      const lastUsed = getBookingsForRoom(roomIndex, booking.id)
        .filter(existingBooking => existingBooking.endDate <= booking.startDate)
        .reduce((latest, existingBooking) => existingBooking.endDate > latest ? existingBooking.endDate : latest, '');

      return { roomIndex, lastUsed };
    }).filter((candidate): candidate is { roomIndex: number; lastUsed: string } => Boolean(candidate));

    if (!candidates.length) return 0;
    return candidates.sort((a, b) => a.lastUsed.localeCompare(b.lastUsed) || a.roomIndex - b.roomIndex)[0].roomIndex;
  };
  const withAssignedRoom = (booking: BookingRequest, roomIndex: number): BookingRequest => ({
    ...booking,
    roomIndex,
    roomNumber: getRoomDisplayName(roomIndex)
  });

  useEffect(() => {
    requestBookings.forEach(booking => {
      if (booking.status === 'declined') return;
      if (Number.isInteger(booking.roomIndex) && booking.roomNumber) return;

      const assignedRoomIndex = chooseSmartRotationRoomIndex(booking);
      const assignedBooking = withAssignedRoom(booking, assignedRoomIndex);
      if (assignedBooking.roomIndex !== booking.roomIndex || assignedBooking.roomNumber !== booking.roomNumber) {
        updateBooking(assignedBooking);
      }
    });
  }, [requestBookings, roomRowCount, roomRows.join('|')]);

  const canUseDateAsRangeStart = (date: string, roomIndex = 0) => (
    !getBookingsForRoom(roomIndex).some(booking => date >= booking.startDate && date < booking.endDate)
  );

  const canUseDateAsRangeEnd = (date: string, roomIndex = 0) => (
    !getBookingsForRoom(roomIndex).some(booking => date > booking.startDate && date < booking.endDate)
  );

  const rangeOverlapsBooking = (startDate: string, endDate: string, roomIndex = 0) => (
    getNightDates(startDate, endDate).some(date =>
      getBookingsForRoom(roomIndex).some(booking => date >= booking.startDate && date < booking.endDate)
    )
  );

  const buildReserveDraft = (firstDate: string, secondDate: string, roomIndex = 0) => {
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
      !canUseDateAsRangeStart(startDate, roomIndex)
      || !canUseDateAsRangeEnd(endDate, roomIndex)
      || rangeOverlapsBooking(startDate, endDate, roomIndex)
    ) return null;

    return {
      startDate,
      endDate,
      totalDays: selectedDates.length,
      totalPrice: selectedDates.length * activeDailyPrice,
      roomIndex,
      roomNumber: getRoomDisplayName(roomIndex)
    };
  };

  const applyDateRange = (firstDate: string, secondDate: string, roomIndex = 0) => {
    const nextDraft = buildReserveDraft(firstDate, secondDate, roomIndex);
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
    const now = new Date().toISOString();
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
      roomIndex: reserveDraft.roomIndex,
      roomNumber: reserveDraft.roomNumber,
      statusChangedAt: now,
      createdAt: now
    };
    setLocalAcceptedBookings(current => [acceptedBooking, ...current]);
    onAddBooking(acceptedBooking);
    clearReserveDraft();
  };

  const handleDateClick = (date: string, roomIndex = 0, canStartDate = true, canEndDate = true) => {
    if (!rangeStart || reserveDraft) {
      if (!canStartDate) return;
      setReserveDraft(null);
      setRangeStart(date);
      setRangeStartRoomIndex(roomIndex);
      setHoverDate(date);
      return;
    }
    if (roomIndex !== rangeStartRoomIndex) return;
    if (!canEndDate) return;
    applyDateRange(rangeStart, date, roomIndex);
  };

  const resetDrag = () => {
    setDragStart(null);
    setDragEnd(null);
    setDragStartRoomIndex(0);
    dragMovedRef.current = false;
    dragPointerStartRef.current = null;
    dragGestureRef.current = 'idle';
  };

  const startDragSelection = (date: string, roomIndex = 0) => {
    dragMovedRef.current = false;
    dragGestureRef.current = 'selecting';
    setDragStart(date);
    setDragEnd(date);
    setDragStartRoomIndex(roomIndex);
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    date: string,
    roomIndex: number,
    canUseDate: boolean
  ) => {
    if (!canUseDate || (event.pointerType === 'mouse' && event.button !== 0)) return;

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      dragPointerStartRef.current = { x: event.clientX, y: event.clientY };
      dragGestureRef.current = 'pending';
      setDragStartRoomIndex(roomIndex);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    startDragSelection(date, roomIndex);
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
      if (absX >= absY) {
        dragGestureRef.current = 'scrolling';
        setDragStart(null);
        setDragEnd(null);
        return;
      }

      const target = event.currentTarget.closest<HTMLElement>('[data-calendar-date]');
      const startDate = target?.dataset.calendarDate;
      if (!startDate) return;
      activeDragStart = startDate;
      startDragSelection(startDate, dragStartRoomIndex);
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
    roomIndex: number,
    canStartDate = true,
    canEndDate = true
  ) => {
    if (dragGestureRef.current === 'scrolling') {
      resetDrag();
      return;
    }

    if (dragGestureRef.current === 'pending') {
      handleDateClick(fallbackDate, roomIndex, canStartDate, canEndDate);
      resetDrag();
      return;
    }

    if (!dragStart) return;
    event.preventDefault();
    const endDate = dragEnd || fallbackDate;
    if (dragMovedRef.current) {
      applyDateRange(dragStart, endDate, dragStartRoomIndex);
    } else {
      handleDateClick(fallbackDate, roomIndex, canStartDate, canEndDate);
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
          declinedAt: status === 'declined' ? new Date().toISOString() : undefined,
          statusChangedAt: new Date().toISOString()
        }
        : item
    )));
    onUpdateStatus(id, status);
  };

  const moveBookingToRoom = (bookingId: string, roomIndex: number) => {
    const booking = requestBookings.find(item => item.id === bookingId);
    if (!booking || booking.status === 'declined') return;
    if (!isRoomFreeForBooking(booking, roomIndex)) return;

    updateBooking(withAssignedRoom(booking, roomIndex));
    setDraggingBookingId(null);
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
    setBaseMonth(current => {
      const next = new Date(current);
      next.setDate(current.getDate() - 5);
      return next;
    });
  };

  const showNextMonths = () => {
    setBaseMonth(current => {
      const next = new Date(current);
      next.setDate(current.getDate() + 5);
      return next;
    });
  };

  const updateRoomNumber = (roomNumber: string, roomIndex = 0) => {
    const nextRoomNumbers = Array.from({ length: roomRowCount }, (_, index) => (
      index === roomIndex
        ? roomNumber
        : roomRows[index] || ''
    ));
    onChange({
      ...listing,
      roomCount: roomRowCount,
      roomNumber: nextRoomNumbers[0]?.trim() || undefined,
      roomNumbers: nextRoomNumbers.some(value => value.trim()) ? nextRoomNumbers : undefined
    } as Listing);
  };

  return (
    <div className="fixed inset-0 z-[510] bg-[#F4F7F6] animate-fade-in" id="promote-calendar-modal">
      <div className="pu h-[100dvh] w-full rounded-none shadow-none animate-scale-up text-gray-950 flex flex-col font-sans">
        <div className="pu-header px-5 py-4 border-b border-[#D1D5DB]/30 relative shrink-0">
          <div className="flex items-center gap-3 pr-10">
            <div className="h-9 w-9 rounded-xl bg-[#FF7A50]/10 text-[#E05A30] flex items-center justify-center ring-1 ring-[#FF7A50]/20">
              <CalendarDays className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-black text-sm text-gray-950">{tr('calendarListing.title')}</h3>
          </div>
          <button onClick={close} className="absolute top-3.5 right-4 p-1 hover:bg-red-50 hover:text-red-500 rounded-full transition active:scale-95 cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="pu-body grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 p-5 overflow-y-auto">
          <div>
            <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-sm font-black leading-none text-gray-950">{listing.title}</p>
                <span className="shrink-0 rounded-full border border-[#FF7A50]/20 bg-[#FF7A50]/10 px-2.5 py-1 text-[10px] font-black uppercase leading-none text-[#E05A30]">
                  {roomTypeLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsStatsOpen(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2F7D69]/20 bg-white text-[#2F7D69] shadow-sm transition hover:-translate-y-0.5 hover:border-[#2F7D69]/40 hover:bg-[#2F7D69]/10 hover:shadow-md active:scale-95"
                title={tr('booking.stats.occupancyTitle')}
                aria-label={tr('booking.stats.occupancyTitle')}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-1 flex items-center justify-between gap-3 pl-[88px]">
              <button
                type="button"
                onClick={showPreviousMonths}
                className="h-8 w-8 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-[#FF7A50]/40 hover:text-[#E05A30] transition active:scale-95 flex items-center justify-center"
                title={tr('calendar.prevFiveDays')}
                aria-label={tr('calendar.prevFiveDays')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="h-px flex-1 bg-gray-200/70" />
              <button
                type="button"
                onClick={showNextMonths}
                className="h-8 w-8 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-[#FF7A50]/40 hover:text-[#E05A30] transition active:scale-95 flex items-center justify-center"
                title={tr('calendar.nextFiveDays')}
                aria-label={tr('calendar.nextFiveDays')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          <div className="mt-1 -mx-5 flex items-start gap-0.5">
            <div className="w-[86px] shrink-0 border-x border-gray-200/70">
              <div className="h-10" />
              <div>
                {roomRows.map((roomNumber, roomIndex) => (
                  <div
                    key={`room-label-${roomIndex}`}
                    className="box-border flex h-10 items-center border-t border-gray-200/70 px-2"
                  >
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(event) => updateRoomNumber(event.target.value, roomIndex)}
                      placeholder={tr('calendarListing.roomNumber')}
                      aria-label={tr('calendarListing.roomNumber')}
                      className="h-6 w-full rounded-lg border border-gray-200 bg-white/85 px-2 py-0 text-center text-xs font-black leading-none text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-[#FF7A50]/60 focus:bg-white focus:ring-2 focus:ring-[#FF7A50]/15"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="min-w-0 flex-1 overflow-x-auto px-5 pb-1">
              <div className="min-w-max text-center text-xs">
                <div className="flex h-10 items-start gap-0.5">
                  {monthGroups.map(({ key, monthDate, dates }) => (
                    <div key={`header-${key}`} className="relative flex h-10 flex-col items-start after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[#FF7A50]/25 last:after:hidden">
                      <h4 className="mb-1 h-4 w-full text-center text-[10px] font-bold leading-none text-gray-950">
                        {monthDate.toLocaleDateString(language.toLowerCase(), { month: 'long', year: 'numeric' })}
                      </h4>
                      <div className="flex items-start gap-0">
                        {dates.map(dateValue => {
                          const date = formatDate(dateValue);
                          const isWeekend = dateValue.getDay() === 0 || dateValue.getDay() === 6;
                          return (
                            <div
                              key={`weekday-${date}`}
                              className={`flex h-[20px] w-8 shrink-0 items-center justify-center text-[9px] font-bold leading-none ${
                                isWeekend ? 'text-[#E05A30]' : 'text-gray-500'
                              }`}
                            >
                              {dateValue.toLocaleDateString(language.toLowerCase(), { weekday: 'short' })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div>
          {roomRows.map((roomNumber, roomIndex) => (
          <div
            key={`room-row-${roomIndex}`}
            onDragOver={(event) => {
              if (draggingBookingId) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              const bookingId = event.dataTransfer.getData('text/plain') || draggingBookingId;
              if (bookingId) moveBookingToRoom(bookingId, roomIndex);
            }}
            className="box-border flex h-10 min-w-max items-center gap-0.5 border-t border-gray-200/70"
          >
            {monthGroups.map(({ key, dates }) => {
            return (
              <div key={key} className="relative flex items-end gap-0.5 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[#FF7A50]/25 last:after:hidden">
                <div className="flex flex-col items-start">
                <div className="flex items-start gap-0">
                  {dates.map((dateValue) => {
                    const day = dateValue.getDate();
                    const date = formatDate(dateValue);
                    const isPastDate = date < todayDate;
                    const isWeekend = dateValue.getDay() === 0 || dateValue.getDay() === 6;
                    const isBlocked = blockedDates.includes(date);
                    const startsRange = ranges.some(range => range.start === date);
                    const endsRange = ranges.some(range => range.end === date);
                    const isRangeMiddle = ranges.some(range => date > range.start && date < range.end);
                    const roomBookings = getBookingsForRoom(roomIndex);
                    const bookingNight = roomBookings.find(request => date >= request.startDate && date < request.endDate);
                    const bookingStart = roomBookings.find(request => request.startDate === date);
                    const bookingCheckout = roomBookings.find(request => request.endDate === date);
                    const booking = bookingNight || bookingStart || bookingCheckout;
                    const isBookingStart = !!bookingStart;
                    const isBookingCheckout = !!bookingCheckout;
                    const isBookingNight = !!bookingNight;
                    const isBookingBridge = isBookingStart && isBookingCheckout;
                    const isReserveLastNight = !!reserveDraft && reserveDraft.roomIndex === roomIndex && date === previousDateString(reserveDraft.endDate);
                    const isDraftStart = !!reserveDraft && reserveDraft.roomIndex === roomIndex && reserveDraft.startDate === date;
                    const isDraftNight = !!reserveDraft && reserveDraft.roomIndex === roomIndex && date >= reserveDraft.startDate && date < reserveDraft.endDate;
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
                    const isDraftCheckout = !!reserveDraft && reserveDraft.roomIndex === roomIndex && reserveDraft.endDate === date;
                    const previewAnchor = dragStart
                      ? (dragStartRoomIndex === roomIndex ? dragStart : null)
                      : (!reserveDraft && rangeStartRoomIndex === roomIndex ? rangeStart : null);
                    const previewTarget = dragStart ? dragEnd : hoverDate;
                    const previewStart = previewAnchor && previewTarget
                      ? (previewAnchor <= previewTarget ? previewAnchor : previewTarget)
                      : null;
                    const previewEnd = previewAnchor && previewTarget
                      ? (previewAnchor <= previewTarget ? previewTarget : previewAnchor)
                      : null;
                    const hasBooking = !!booking;
                    const canStartDate = !isPastDate && canUseDateAsRangeStart(date, roomIndex);
                    const canEndDate = !isPastDate && canUseDateAsRangeEnd(date, roomIndex);
                    const canUseDateForCurrentClick = (!rangeStart || reserveDraft) ? canStartDate : canEndDate;
                    const isPreviewRangeValid = !!previewStart
                      && !!previewEnd
                      && canUseDateAsRangeStart(previewStart, roomIndex)
                      && canUseDateAsRangeEnd(previewEnd, roomIndex)
                      && !rangeOverlapsBooking(previewStart, previewEnd, roomIndex);
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
                    const isSelectionBridge = isBookingCheckout && ((rangeStartRoomIndex === roomIndex && rangeStart === date) || isDraftStart || isPreviewStart);
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
                        className="h-8 w-8 shrink-0 relative flex items-center"
                      >
                        <span className={`pointer-events-none absolute inset-y-0 left-0 right-0 ${isPastDate
                          ? ''
                          : isSelectionBridge
                            ? 'bg-[linear-gradient(to_right,rgb(16_185_129_/_0.18)_0%,rgb(16_185_129_/_0.18)_50%,rgb(255_122_80_/_0.15)_50%,rgb(255_122_80_/_0.15)_100%)]'
                            : isCheckoutToBookingBridge
                              ? 'bg-[linear-gradient(to_right,rgb(255_122_80_/_0.15)_0%,rgb(255_122_80_/_0.15)_50%,rgb(16_185_129_/_0.18)_50%,rgb(16_185_129_/_0.18)_100%)]'
                            : bookingRangeClass || previewRangeClass || draftRangeClass || blockedRangeClass
                        }`} />
                        <button
                          type="button"
                          disabled={isPastDate}
                          onPointerDown={(event) => handlePointerDown(event, date, roomIndex, canUseDateForCurrentClick)}
                          onPointerMove={handlePointerMove}
                          onPointerEnter={() => {
                            const canUseHoveredDate = rangeStart <= date ? canEndDate : canStartDate;
                            if (rangeStartRoomIndex === roomIndex && rangeStart && !reserveDraft && canUseHoveredDate) {
                              setHoverDate(date);
                            }
                          }}
                          onPointerUp={(event) => handlePointerUp(event, date, roomIndex, canStartDate, canEndDate)}
                          onPointerCancel={resetDrag}
                          title={booking ? `${booking.guestName}: ${booking.startDate} - ${booking.endDate}` : undefined}
                          style={{ touchAction: 'pan-x' }}
                          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center transition cursor-pointer select-none font-bold ${
                            isPastDate
                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                              : isCheckoutToBookingBridge
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
                                : rangeStartRoomIndex === roomIndex && rangeStart === date
                              ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,#FF7A50_50%,#FF7A50_100%)] text-[#8A341D] shadow-xs scale-105 ring-2 ring-[#FF7A50]/25'
                              : startsRange || (endsRange && !isReserveLastNight)
                                ? startsRange
                                  ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,#FF7A50_50%,#FF7A50_100%)] text-[#8A341D] shadow-xs scale-105 ring-1 ring-[#FF7A50]/25'
                                  : 'bg-[linear-gradient(to_right,#FF7A50_0%,#FF7A50_50%,transparent_50%,transparent_100%)] text-[#8A341D] shadow-xs scale-105 ring-1 ring-[#FF7A50]/25'
                                : isBlocked
                                  ? 'text-[#E05A30] bg-transparent'
                                  : isWeekend
                                    ? 'text-[#B85A3C] hover:bg-white'
                                    : 'text-gray-700 hover:bg-white'
                          }`}
                        >
                          {day}
                        </button>
                        {booking && isBookingStart && (
                          <button
                            type="button"
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData('text/plain', booking.id);
                              event.dataTransfer.effectAllowed = 'move';
                              setDraggingBookingId(booking.id);
                            }}
                            onDragEnd={() => setDraggingBookingId(null)}
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
              </div>
            );
          })}
          </div>
          ))}
                </div>
              </div>
            </div>
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
                {newRequestBookings.length > 0 && (
                  <BookingDivider label={tr('booking.group.new')} />
                )}
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
                {currentRequestBookings.length > 0 && (
                  <BookingDivider label={tr('booking.group.current')} />
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
                  <BookingDivider label={tr('booking.group.completed')} />
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
                  <BookingDivider label={tr('booking.group.declined')} />
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

        {isStatsOpen && (
          <div className="fixed inset-0 z-[520] flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 text-gray-950 shadow-2xl animate-scale-up">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-black uppercase text-gray-950">{tr('booking.stats.occupancyTitle')}</h4>
                  <p className="mt-1 truncate text-xs font-bold text-gray-500">{listing.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStatsOpen(false)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500 active:scale-95"
                  title={tr('common.close')}
                  aria-label={tr('common.close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h5 className="text-[10px] font-black uppercase text-gray-500">{tr('booking.stats.monthlyOccupancy')}</h5>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#2F7D69] shadow-sm">
                    {tr('booking.stats.roomsCount', { count: roomRowCount })}
                  </span>
                </div>
                <div className="mb-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatsYear(current => current - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-gray-500 transition hover:border-[#2F7D69]/30 hover:text-[#2F7D69] active:scale-95"
                    title={tr('booking.stats.prevYear')}
                    aria-label={tr('booking.stats.prevYear')}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-20 rounded-full bg-white px-3 py-1 text-center font-mono text-sm font-black text-gray-950 shadow-sm">
                    {statsYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatsYear(current => current + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-gray-500 transition hover:border-[#2F7D69]/30 hover:text-[#2F7D69] active:scale-95"
                    title={tr('booking.stats.nextYear')}
                    aria-label={tr('booking.stats.nextYear')}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex h-44 items-end gap-2 border-b border-slate-200 px-1 pb-2">
                  {occupancyMonths.map(month => (
                    <div key={month.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                      <span className="font-mono text-[10px] font-black text-gray-700">{month.percent}%</span>
                      <div className="flex h-32 w-full max-w-8 items-end rounded-full bg-white shadow-inner">
                        <div
                          className="w-full rounded-full bg-[#2F7D69] shadow-[0_4px_10px_rgba(47,125,105,0.24)] transition-all"
                          style={{ height: `${Math.max(4, month.percent)}%` }}
                          title={`${month.label}: ${month.percent}%`}
                        />
                      </div>
                      <span className="w-full truncate text-center text-[9px] font-black uppercase text-gray-400">{month.shortLabel}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                  <span className="block text-[9px] font-black uppercase text-gray-400">{tr('booking.stats.yearAverage')}</span>
                  <span className="font-mono text-xl font-black text-[#2F7D69]">{averageOccupancy}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

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

function getMonthlyOccupancy(bookings: BookingRequest[], roomCount: number, language: string, year: number) {
  const safeRoomCount = Math.max(1, roomCount);
  const acceptedBookings = bookings.filter(booking => booking.status === 'accepted');

  return Array.from({ length: 12 }, (_, index) => {
    const monthStart = new Date(year, index, 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const daysInMonth = Math.round((monthEnd.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000));
    const capacityNights = daysInMonth * safeRoomCount;
    const bookedNights = acceptedBookings.reduce((total, booking) => (
      total + getOverlapNightCount(booking.startDate, booking.endDate, monthStart, monthEnd)
    ), 0);
    const percent = capacityNights > 0
      ? Math.min(100, Math.round((bookedNights / capacityNights) * 100))
      : 0;

    return {
      key: `${monthStart.getFullYear()}-${monthStart.getMonth()}`,
      label: monthStart.toLocaleDateString(language.toLowerCase(), { month: 'long', year: 'numeric' }),
      shortLabel: monthStart.toLocaleDateString(language.toLowerCase(), { month: 'short' }),
      bookedNights,
      percent
    };
  });
}

function getAverageOccupancy(months: Array<{ percent: number }>) {
  if (!months.length) return 0;
  return Math.round(months.reduce((sum, month) => sum + month.percent, 0) / months.length);
}

function getOverlapNightCount(startDate: string, endDate: string, rangeStart: Date, rangeEnd: Date) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const overlapStart = start > rangeStart ? start : rangeStart;
  const overlapEnd = end < rangeEnd ? end : rangeEnd;
  if (overlapEnd <= overlapStart) return 0;
  return Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (24 * 60 * 60 * 1000));
}
