import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { BookingRequest, Listing } from '../../types';
import BookingRequestControls from './BookingRequestControls';

interface CalendarListingModalProps {
  listing: Listing;
  bookings: BookingRequest[];
  currencySymbol: string;
  currencyRate: number;
  onChange: (listing: Listing) => void;
  onUpdateStatus: (id: string, status: 'accepted' | 'declined') => void;
  onUpdateBooking: (booking: BookingRequest) => void;
  onClose: () => void;
}

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export default function CalendarListingModal({
  listing,
  bookings,
  currencySymbol,
  currencyRate,
  onChange,
  onUpdateStatus,
  onUpdateBooking,
  onClose
}: CalendarListingModalProps) {
  const [blockedDates, setBlockedDates] = useState<string[]>(listing.blockedDates || []);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const dragMovedRef = useRef(false);
  const months = Array.from({ length: 4 }, (_, index) => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + index, 1);
  });
  const ranges = getRanges(blockedDates);
  const listingBookings = bookings
    .filter(booking => booking.listingId === listing.id && booking.status !== 'declined')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const applyDateRange = (firstDate: string, secondDate: string) => {
    const first = new Date(firstDate);
    const second = new Date(secondDate);
    const start = first <= second ? first : second;
    const end = first <= second ? second : first;
    const selectedDates: string[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      selectedDates.push(formatDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const overlapsBooking = selectedDates.some(date =>
      listingBookings.some(booking => date >= booking.startDate && date < booking.endDate)
    );
    if (overlapsBooking) return;

    const shouldUnblock = selectedDates.every(selectedDate => blockedDates.includes(selectedDate));
    const updatedDates = shouldUnblock
      ? blockedDates.filter(blockedDate => !selectedDates.includes(blockedDate))
      : Array.from(new Set([...blockedDates, ...selectedDates])).sort();

    setBlockedDates(updatedDates);
    setRangeStart(null);
    onChange({ ...listing, blockedDates: updatedDates } as Listing);
  };

  const handleDateClick = (date: string) => {
    if (!rangeStart) {
      setRangeStart(date);
      return;
    }
    applyDateRange(rangeStart, date);
  };

  const resetDrag = () => {
    setDragStart(null);
    setDragEnd(null);
    dragMovedRef.current = false;
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    date: string,
    hasBooking: boolean
  ) => {
    if (hasBooking || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragMovedRef.current = false;
    setDragStart(date);
    setDragEnd(date);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStart) return;
    event.preventDefault();
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-calendar-date]');
    const hoveredDate = target?.dataset.calendarDate;
    if (!hoveredDate || target?.dataset.hasBooking === 'true') return;
    if (hoveredDate !== dragStart) dragMovedRef.current = true;
    setDragEnd(hoveredDate);
  };

  const handlePointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
    fallbackDate: string
  ) => {
    if (!dragStart) return;
    event.preventDefault();
    const endDate = dragEnd || fallbackDate;
    if (dragMovedRef.current) {
      applyDateRange(dragStart, endDate);
    } else {
      handleDateClick(fallbackDate);
    }
    resetDrag();
  };

  const close = () => {
    setRangeStart(null);
    resetDrag();
    onClose();
  };

  const focusBooking = (bookingId: string) => {
    setHighlightedBookingId(bookingId);
    document.getElementById(`calendar-booking-${bookingId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    window.setTimeout(() => setHighlightedBookingId(null), 1600);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[510] p-3 sm:p-4 animate-fade-in" id="promote-calendar-modal">
      <div className="pu max-w-[1080px] w-full max-h-[90vh] rounded-[24px] sm:rounded-3xl shadow-2xl animate-scale-up text-gray-950 flex flex-col font-sans">
        <div className="pu-header px-5 py-4 border-b border-[#D1D5DB]/30 relative shrink-0">
          <div className="text-center">
            <h3 className="font-bold text-sm">Занятость на 4 месяца</h3>
          </div>
          <button onClick={close} className="absolute top-3.5 right-4 p-1 hover:bg-red-50 hover:text-red-500 rounded-full transition active:scale-95 cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="pu-body grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 p-5 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-7">
            {months.map(monthDate => {
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

            return (
              <div key={`${year}-${month}`} className="min-w-[240px]">
                <h4 className="text-center font-bold text-gray-950 text-sm mb-3">{monthNames[month]} {year}</h4>
                <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] sm:text-xs font-semibold text-gray-400 mb-2">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
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
                    const booking = listingBookings.find(request => date >= request.startDate && date < request.endDate);
                    const isBookingStart = booking?.startDate === date;
                    const bookingEndDate = booking
                      ? formatDate(new Date(new Date(`${booking.endDate}T00:00:00`).getTime() - 24 * 60 * 60 * 1000))
                      : '';
                    const isBookingEnd = bookingEndDate === date;
                    const bookingRangeClass = booking
                      ? booking.status === 'accepted'
                        ? isBookingStart && !isBookingEnd
                          ? 'bg-emerald-500/20 rounded-l-full'
                          : isBookingEnd && !isBookingStart
                            ? 'bg-emerald-500/20 rounded-r-full'
                            : isBookingStart && isBookingEnd
                              ? ''
                              : 'bg-emerald-500/20'
                        : isBookingStart && !isBookingEnd
                          ? 'bg-[#FF7A50]/20 rounded-l-full'
                          : isBookingEnd && !isBookingStart
                            ? 'bg-[#FF7A50]/20 rounded-r-full'
                            : isBookingStart && isBookingEnd
                              ? ''
                              : 'bg-[#FF7A50]/20'
                      : '';
                    const previewStart = dragStart && dragEnd
                      ? (dragStart <= dragEnd ? dragStart : dragEnd)
                      : null;
                    const previewEnd = dragStart && dragEnd
                      ? (dragStart <= dragEnd ? dragEnd : dragStart)
                      : null;
                    const isPreview = !!previewStart && !!previewEnd && date >= previewStart && date <= previewEnd && !booking;
                    const isPreviewStart = isPreview && date === previewStart;
                    const isPreviewEnd = isPreview && date === previewEnd;
                    const previewRangeClass = isPreview
                      ? isPreviewStart && !isPreviewEnd
                        ? 'bg-[#FF7A50]/20 rounded-l-full'
                        : isPreviewEnd && !isPreviewStart
                          ? 'bg-[#FF7A50]/20 rounded-r-full'
                          : isPreviewStart && isPreviewEnd
                            ? ''
                            : 'bg-[#FF7A50]/20'
                      : '';

                    return (
                      <div
                        key={date}
                        data-calendar-date={date}
                        data-has-booking={booking ? 'true' : 'false'}
                        className={`py-0.5 relative ${bookingRangeClass || previewRangeClass || (
                          isRangeMiddle
                            ? 'bg-[#FF7A50]/15'
                            : startsRange && !endsRange
                              ? 'bg-[linear-gradient(to_right,transparent_0%,transparent_50%,rgb(255_122_80_/_0.15)_50%,rgb(255_122_80_/_0.15)_100%)]'
                              : endsRange && !startsRange
                                ? 'bg-[linear-gradient(to_right,rgb(255_122_80_/_0.15)_0%,rgb(255_122_80_/_0.15)_50%,transparent_50%,transparent_100%)]'
                                : ''
                        )}`}
                      >
                        <button
                          type="button"
                          onPointerDown={(event) => handlePointerDown(event, date, !!booking)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={(event) => handlePointerUp(event, date)}
                          onPointerCancel={resetDrag}
                          title={booking ? `${booking.guestName}: ${booking.startDate} - ${booking.endDate}` : undefined}
                          style={{ touchAction: 'none' }}
                          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center transition cursor-pointer select-none font-bold ${
                            booking && (isBookingStart || isBookingEnd)
                              ? booking.status === 'accepted'
                                ? 'bg-emerald-500 text-white shadow-xs relative z-10'
                                : 'bg-[#FF7A50] text-white shadow-xs relative z-10'
                              : booking
                                ? booking.status === 'accepted'
                                  ? 'w-full rounded-none bg-transparent text-emerald-700'
                                  : 'w-full rounded-none bg-transparent text-[#E05A30]'
                                : isPreviewStart || isPreviewEnd
                                  ? 'bg-[#FF7A50] text-white shadow-xs relative z-10 scale-105'
                                  : isPreview
                                    ? 'w-full rounded-none bg-transparent text-[#E05A30]'
                                : rangeStart === date
                              ? 'bg-[#FF7A50] text-white shadow-xs scale-105 ring-2 ring-[#FF7A50]/25'
                              : startsRange || endsRange
                                ? 'bg-[#FF7A50] text-white shadow-xs scale-105'
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
                            className={`absolute z-20 left-1 top-full mt-0.5 px-2 py-1 rounded-lg text-[9px] font-bold text-white shadow-md whitespace-nowrap hover:scale-105 transition ${
                              booking.status === 'accepted' ? 'bg-emerald-600' : 'bg-[#FF7A50]'
                            }`}
                            title={`Открыть заявку: ${booking.guestName}`}
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

          <aside className="lg:border-l lg:border-gray-200/70 lg:pl-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-black uppercase text-gray-700">Заявки гостей</h4>
              <span className="text-[10px] font-bold text-[#FF7A50]">{listingBookings.length}</span>
            </div>

            {listingBookings.length === 0 ? (
              <p className="text-[10.5px] text-gray-400 py-4">Нет заявок на выбранные даты</p>
            ) : listingBookings.map(request => (
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
                  currencySymbol={currencySymbol}
                  currencyRate={currencyRate}
                  onUpdateStatus={onUpdateStatus}
                  onUpdateBooking={onUpdateBooking}
                  compact
                />
              </div>
            ))}
          </aside>
        </div>

        <div className="pu-footer p-5 border-t border-[#D1D5DB]/30 mt-auto shrink-0 flex items-center justify-between gap-4">
          <p className="text-[9.5px] text-gray-400 leading-normal">Изменение дат синхронизируется с iCal для Bali Base</p>
          <button onClick={close} className="px-4 py-1.5 bg-[#FF7A50] hover:bg-[#E05A30] text-white text-xs font-bold rounded-lg transition cursor-pointer active:scale-95 shadow-sm shrink-0">
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
