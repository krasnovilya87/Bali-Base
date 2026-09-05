import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect } from 'react';
import { useI18n } from '../i18nContext';

interface TwoMonthCalendarProps {
  checkInDate: string;
  checkOutDate: string;
  onChange: (checkIn: string, checkOut: string) => void;
  onClose: () => void;
  singleDateMode?: boolean;
  modalPlacement?: boolean;
  bookingModalPlacement?: boolean;
  appOverlayPlacement?: boolean;
}

export default function TwoMonthCalendar({
  checkInDate,
  checkOutDate,
  onChange,
  onClose,
  singleDateMode = false,
  modalPlacement = false,
  bookingModalPlacement = false,
  appOverlayPlacement = false
}: TwoMonthCalendarProps) {
  const { language, tr } = useI18n();
  // Anchored dynamically to current local system date
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const initialBaseDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const [baseMonth, setBaseMonth] = useState<Date>(initialBaseDate);

  const [localCheckIn, setLocalCheckIn] = useState<string>(checkInDate);
  const [localCheckOut, setLocalCheckOut] = useState<string>(checkOutDate);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [isTouchCalendar, setIsTouchCalendar] = useState(false);
  const dragMovedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const query = window.matchMedia('(pointer: coarse), (hover: none)');
    const updateTouchCalendar = () => setIsTouchCalendar(query.matches);
    updateTouchCalendar();

    query.addEventListener?.('change', updateTouchCalendar);
    return () => query.removeEventListener?.('change', updateTouchCalendar);
  }, []);

  const toStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => {
    if (!checkInDate || !checkOutDate) return [];
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const months = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current < end) {
      months.push(toStr(current));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  });

  const getMonthlyDates = () => {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return {
      checkIn: toStr(tomorrow),
      checkOut: toStr(addOneCalendarMonth(tomorrow))
    };
  };

  const addOneCalendarMonth = (date: Date) => {
    const targetYear = date.getMonth() === 11 ? date.getFullYear() + 1 : date.getFullYear();
    const targetMonth = (date.getMonth() + 1) % 12;
    const targetMonthDays = new Date(targetYear, targetMonth + 1, 0).getDate();
    return new Date(targetYear, targetMonth, Math.min(date.getDate(), targetMonthDays));
  };

  const defaultMonthly = getMonthlyDates();
  const isInitialMonthly = (checkInDate === defaultMonthly.checkIn && checkOutDate === defaultMonthly.checkOut);
  const [bookingMode, setBookingMode] = useState<'daily' | 'monthly'>(isInitialMonthly ? 'monthly' : 'daily');

  const getFourMonths = () => {
    const months = [];
    for (let i = 0; i < 4; i++) {
      months.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
    }
    return months;
  };

  const getMonthEmoji = (monthIndex: number) => {
    const emojis = [
      '❄️', '🏔️', '🌱', '🌸', '☀️', '🏖️', '🌊', '🍌', '🍂', '🎃', '🌧️', '🎄'
    ];
    return emojis[monthIndex] || '📅';
  };

  const getMonthIcon = (monthIndex: number) => {
    const emoji = getMonthEmoji(monthIndex);
    return <span className="text-2xl sm:text-3xl mb-2.5 filter drop-shadow-xs select-none">{emoji}</span>;
  };

  const isMonthSelected = (mDate: Date) => {
    const mStr = toStr(mDate);
    return selectedMonths.includes(mStr);
  };

  const handleMonthClick = (e: React.MouseEvent, mDate: Date) => {
    e.stopPropagation();
    const mStr = toStr(mDate);

    let nextSelected: string[];
    if (selectedMonths.includes(mStr)) {
      nextSelected = selectedMonths.filter(m => m !== mStr);
    } else {
      nextSelected = [...selectedMonths, mStr];
    }
    setSelectedMonths(nextSelected);

    if (nextSelected.length === 0) {
      setLocalCheckIn('');
      setLocalCheckOut('');
    } else {
      const sorted = [...nextSelected].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      setLocalCheckIn(sorted[0]);
      const lastMonthDate = new Date(sorted[sorted.length - 1]);
      const nextMonthDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 1);
      setLocalCheckOut(toStr(nextMonthDate));
    }
  };

  const localeByLanguage = {
    EN: 'en-US',
    ID: 'id-ID',
    RU: 'ru-RU',
    FR: 'fr-FR',
    DE: 'de-DE'
  } as const;

  const WEEKDAYS = [
    tr('calendar.monday'),
    tr('calendar.tuesday'),
    tr('calendar.wednesday'),
    tr('calendar.thursday'),
    tr('calendar.friday'),
    tr('calendar.saturday'),
    tr('calendar.sunday')
  ];

  // Months to display (Base Month and Next Month)
  const month1 = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1);
  const month2 = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1);
  const touchMonths = Array.from({ length: 12 }, (_, index) => (
    new Date(today.getFullYear(), today.getMonth() + index, 1)
  ));

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1));
  };

  // Generate calendar grid for a specific month
  const generateMonthDays = (targetDate: Date) => {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    // First day of target month
    const firstDay = new Date(year, month, 1);
    // Day of the week (0 = Sunday, 1 = Monday ...)
    let startDayOfWeek = firstDay.getDay();
    // Offset to start from Monday (0: Пн, 1: Вт ... 6: Вс)
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Fill preceding empty slots
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Fill actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        dateStr,
        fullDate: new Date(year, month, day)
      });
    }

    return days;
  };

  const handleDayClick = (e: React.MouseEvent, dateStr: string, fullDate: Date) => {
    e.stopPropagation();
    
    // Disable past dates
    if (fullDate < todayStart) return;

    if (singleDateMode) {
      setLocalCheckIn(dateStr);
      setLocalCheckOut('');
      return;
    }

    if (bookingMode === 'monthly') {
      setLocalCheckIn(dateStr);
      setLocalCheckOut(toStr(addOneCalendarMonth(fullDate)));
      return;
    }

    if (!localCheckIn) {
      setLocalCheckIn(dateStr);
      setLocalCheckOut('');
      setBookingMode('daily');
      return;
    }

    if (!localCheckOut) {
      if (new Date(dateStr) < new Date(localCheckIn)) {
        setLocalCheckIn(dateStr);
      } else {
        setLocalCheckOut(dateStr);
      }
      setBookingMode('daily');
      return;
    }

    const startTime = new Date(localCheckIn).getTime();
    const endTime = new Date(localCheckOut).getTime();
    const nextTime = new Date(dateStr).getTime();
    const isCloserToStart = Math.abs(nextTime - startTime) <= Math.abs(nextTime - endTime);

    if (isCloserToStart) {
      if (nextTime <= endTime) {
        setLocalCheckIn(dateStr);
      } else {
        setLocalCheckOut(dateStr);
      }
    } else if (nextTime >= startTime) {
      setLocalCheckOut(dateStr);
    } else {
      setLocalCheckIn(dateStr);
    }

    setBookingMode('daily');
  };

  const resetDrag = () => {
    setDragStart(null);
    setDragEnd(null);
    dragMovedRef.current = false;
  };

  const handleDayPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    dateStr: string,
    fullDate: Date
  ) => {
    if (event.pointerType !== 'mouse') return;
    if (singleDateMode || bookingMode === 'monthly' || fullDate < todayStart || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragMovedRef.current = false;
    setDragStart(dateStr);
    setDragEnd(dateStr);
  };

  const handleDayPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse') return;
    if (!dragStart || singleDateMode) return;
    event.preventDefault();
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-calendar-date]');
    const hoveredDate = target?.dataset.calendarDate;
    if (!hoveredDate || target?.dataset.disabled === 'true') return;
    if (hoveredDate !== dragStart) dragMovedRef.current = true;
    setDragEnd(hoveredDate);
  };

  const handleDayPointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
    dateStr: string,
    fullDate: Date
  ) => {
    if (event.pointerType !== 'mouse') return;
    if (!dragStart || singleDateMode) return;
    event.preventDefault();

    if (dragMovedRef.current) {
      const endDate = dragEnd || dateStr;
      const start = dragStart <= endDate ? dragStart : endDate;
      const end = dragStart <= endDate ? endDate : dragStart;
      setLocalCheckIn(start);
      setLocalCheckOut(end);
      setBookingMode('daily');
    } else {
      handleDayClick(event, dateStr, fullDate);
    }
    resetDrag();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalCheckIn('');
    setLocalCheckOut('');
    setSelectedMonths([]);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(localCheckIn, singleDateMode ? localCheckIn : localCheckOut);
    onClose();
  };

  const isBetween = (dateStr: string) => {
    if (!localCheckIn || !localCheckOut) return false;
    const d = new Date(dateStr);
    const start = new Date(localCheckIn);
    const end = new Date(localCheckOut);
    return d > start && d < end;
  };

  const isSelected = (dateStr: string) => {
    return dateStr === localCheckIn || dateStr === localCheckOut;
  };

  const rangeStartBackground = "[background:linear-gradient(to_right,transparent_0_50%,rgb(255_122_80_/_0.15)_50%_100%)]";
  const rangeEndBackground = "[background:linear-gradient(to_right,rgb(255_122_80_/_0.15)_0_50%,transparent_50%_100%)]";

  const renderMonthGrid = (targetMonth: Date) => {
    const days = generateMonthDays(targetMonth);
    const title = targetMonth.toLocaleDateString(localeByLanguage[language], {
      month: 'long',
      year: 'numeric'
    });

    return (
      <div className="flex-1 min-w-[240px]">
        <h4 className="text-center font-bold text-gray-950 text-sm mb-3">
          {title}
        </h4>
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] sm:text-xs font-semibold text-gray-400 mb-2">
          {WEEKDAYS.map((wd, i) => (
            <div key={wd} className={i === 5 || i === 6 ? 'text-rose-400' : ''}>
              {wd}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {days.map((dayData, idx) => {
            if (!dayData) {
              return <div key={`empty-${idx}`} className="h-8 w-8" />;
            }

            const { day, dateStr, fullDate } = dayData;
            const isPast = fullDate < todayStart;
            const selected = isSelected(dateStr);
            const between = isBetween(dateStr);
            const isStart = dateStr === localCheckIn;
            const isEnd = dateStr === localCheckOut;
            const previewStart = !isTouchCalendar && dragStart && dragEnd ? (dragStart <= dragEnd ? dragStart : dragEnd) : null;
            const previewEnd = !isTouchCalendar && dragStart && dragEnd ? (dragStart <= dragEnd ? dragEnd : dragStart) : null;
            const previewSelected = !!previewStart && !!previewEnd && dateStr >= previewStart && dateStr <= previewEnd;
            const previewEdge = previewSelected && (dateStr === previewStart || dateStr === previewEnd);
            const previewBetween = previewSelected && !previewEdge;

            let cellClass = "h-8 flex items-center justify-center transition cursor-pointer select-none font-bold ";
            let wrapperClass = "py-0.5 relative ";

            if (isPast) {
              cellClass += "w-8 h-8 mx-auto rounded-full text-gray-200 cursor-not-allowed font-medium";
            } else if (previewEdge) {
              cellClass += "w-8 h-8 mx-auto rounded-full bg-[#FF7A50] text-white shadow-xs scale-105 relative z-10";
            } else if (previewBetween) {
              cellClass += "w-full rounded-none bg-transparent text-[#FF7A50]";
            } else if (selected) {
              cellClass += "w-8 h-8 mx-auto rounded-full bg-[#FF7A50] text-white shadow-xs scale-105 relative z-10";
            } else if (between) {
              cellClass += "w-full rounded-none bg-transparent text-[#FF7A50]";
            } else {
              cellClass += "w-8 h-8 mx-auto rounded-full text-gray-700 hover:bg-[#F4F7F6]";
            }

            // Adjust borders for range connection
            if (previewBetween) {
              wrapperClass += "bg-[#FF7A50]/15";
            } else if (dateStr === previewStart && previewEnd && previewStart !== previewEnd) {
              wrapperClass += rangeStartBackground;
            } else if (dateStr === previewEnd && previewStart && previewStart !== previewEnd) {
              wrapperClass += rangeEndBackground;
            } else if (between) {
              wrapperClass += "bg-[#FF7A50]/15";
            } else if (isStart && localCheckOut) {
              wrapperClass += rangeStartBackground;
            } else if (isEnd && localCheckIn) {
              wrapperClass += rangeEndBackground;
            }

            return (
              <div
                key={dateStr}
                data-calendar-date={dateStr}
                data-disabled={isPast ? 'true' : 'false'}
                className={wrapperClass}
              >
                <button
                  type="button"
                  disabled={isPast}
                  onClick={(isTouchCalendar || singleDateMode || bookingMode === 'monthly') ? (e) => handleDayClick(e, dateStr, fullDate) : undefined}
                  onPointerDown={(event) => handleDayPointerDown(event, dateStr, fullDate)}
                  onPointerMove={handleDayPointerMove}
                  onPointerUp={(event) => handleDayPointerUp(event, dateStr, fullDate)}
                  onPointerCancel={resetDrag}
                  style={{ touchAction: isTouchCalendar ? 'pan-y' : (singleDateMode || bookingMode === 'monthly') ? 'auto' : 'none' }}
                  className={cellClass}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`${appOverlayPlacement
        ? isTouchCalendar
          ? 'fixed inset-x-2 top-[calc(env(safe-area-inset-top)+12px)] bottom-[calc(env(safe-area-inset-bottom)+92px)] z-[520] mx-auto w-auto max-w-[580px]'
          : 'fixed left-1/2 top-1/2 z-[520] w-[580px] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2'
        : bookingModalPlacement
        ? 'fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+22px)] z-[520] mx-auto w-auto max-w-[580px] max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-64px)] sm:inset-auto sm:left-1/2 sm:top-[48%] sm:w-[580px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-none'
        : modalPlacement
        ? 'fixed inset-x-0 bottom-0 z-[520] w-full max-h-[85vh] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[580px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-none'
        : 'absolute top-full left-1/2 mt-2 w-[calc(100vw-1rem)] max-w-[580px] -translate-x-1/2 sm:w-[580px] sm:-mt-1 md:-translate-x-1/3'
      } bg-[#F4F7F6] text-gray-950 rounded-[24px] sm:rounded-3xl shadow-[0_12px_30px_rgba(0,0,0,0.15)] sm:shadow-2xl ${appOverlayPlacement || modalPlacement ? '' : 'z-50'} font-sans overflow-hidden transition-all duration-300 flex flex-col`}
    >
      {/* Top Header Section */}
      <div className="bg-[#EAEAEC] p-3 pb-3 sm:p-5 sm:pb-4 border-b border-[#D1D5DB]/30 relative shrink-0">
        {/* Mobile close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 p-1 hover:bg-red-50 hover:text-red-500 rounded-full transition active:scale-95 sm:hidden z-30"
          title={tr('calendar.close')}
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {modalPlacement && (
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden shrink-0" />
        )}

        {/* Dynamic selection mode selector */}
        {!singleDateMode && (
        <div className="flex gap-2 bg-transparent p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setBookingMode('daily');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all outline-none focus:outline-none border-0 ${
              bookingMode === 'daily'
                ? 'bg-white text-gray-950 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tr('calendar.daily')}
          </button>
          <button
            type="button"
            onClick={() => {
              setBookingMode('monthly');
              setBaseMonth(initialBaseDate); // ensure visible month is showing the selected dates
              setLocalCheckIn('');
              setLocalCheckOut('');
              setSelectedMonths([]);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all outline-none focus:outline-none border-0 ${
              bookingMode === 'monthly'
                ? 'bg-white text-[#2F7D69] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tr('calendar.monthly')}
          </button>
        </div>
        )}
        {singleDateMode && (
          <>
            <h3 className="text-center text-sm font-bold text-gray-950">{tr('calendar.discountUntil')}</h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 p-1 hover:bg-red-50 hover:text-red-500 rounded-full transition active:scale-95 z-30"
              title={tr('calendar.close')}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </>
        )}
      </div>

      {/* Middle Body Section */}
      <div className={`bg-[#F4F7F6] p-3 sm:p-5 flex-1 min-h-0 ${isTouchCalendar ? 'overflow-y-auto overscroll-contain' : 'overflow-y-auto sm:overflow-visible'}`}>
        {!singleDateMode && bookingMode === 'monthly' && !localCheckIn && (
          <div className="mb-3 text-center text-xs font-bold text-[#2F7D69] bg-[#2F7D69]/10 rounded-xl px-3 py-2">
            {tr('calendar.selectCheckIn')}
          </div>
        )}
          <div className={`flex relative ${isTouchCalendar ? 'flex-col gap-4' : 'flex-col sm:flex-row gap-4 sm:gap-6'}`}>
            {/* Navigation arrows aligned inline with month titles */}
            {!isTouchCalendar && (
              <>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="absolute left-1 top-[-2px] p-1.5 hover:bg-gray-200/50 rounded-full transition active:scale-90 z-20"
                  title={tr('calendar.prevMonth')}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="absolute right-1 top-[-2px] p-1.5 hover:bg-gray-200/50 rounded-full transition active:scale-90 z-20"
                  title={tr('calendar.nextMonth')}
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}

            {(isTouchCalendar ? touchMonths : [month1, month2]).map((month, index) => (
              <React.Fragment key={toStr(month)}>
                {renderMonthGrid(month)}
                {!isTouchCalendar && index === 0 && <div className="hidden sm:block w-[1px] bg-gray-200/50 self-stretch" />}
              </React.Fragment>
            ))}
          </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="bg-[#EAEAEC] p-3 sm:p-5 border-t border-[#D1D5DB]/30 mt-auto shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs">
              {singleDateMode ? (
                localCheckIn
                  ? (
                    <span className="font-extrabold text-gray-950">
                      {tr('calendar.discountFor', { days: Math.max(1, Math.ceil(
                        (new Date(`${localCheckIn}T23:59:59`).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                      )) })}
                    </span>
                  )
                  : <span className="text-gray-400 font-bold">{tr('calendar.noDateSelected')}</span>
              ) : bookingMode === 'monthly' && !localCheckIn ? (
                <span className="text-gray-400 font-bold">{tr('calendar.selectCheckIn')}</span>
              ) : localCheckIn && localCheckOut ? (
                (() => {
                  const start = new Date(localCheckIn);
                  const end = new Date(localCheckOut);
                  const diffTime = Math.abs(end.getTime() - start.getTime());
                  const count = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  const pluralizeNights = (n: number) => {
                    if (language !== 'RU') return n === 1 ? tr('listing.night') : tr('listing.nights');
                    const mod10 = n % 10;
                    const mod100 = n % 100;
                    if (mod100 >= 11 && mod100 <= 19) return 'ночей';
                    if (mod10 === 1) return 'ночь';
                    if (mod10 >= 2 && mod10 <= 4) return 'ночи';
                    return 'ночей';
                  };
                  
                  return (
                    <span className="font-extrabold text-gray-950">
                      {tr('calendar.total', { count, days: pluralizeNights(count) })}
                    </span>
                  );
                })()
              ) : localCheckIn ? (
                <span className="text-gray-400 font-bold">{tr('calendar.selectCheckOut')}</span>
              ) : (
                <span className="text-gray-400 font-bold">{tr('calendar.selectDates')}</span>
              )}
            </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-rose-600 font-bold rounded-lg transition"
            >
              {tr('common.reset')}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!localCheckIn || (!singleDateMode && !localCheckOut)}
              className="px-4 py-1.5 bg-[#FF7A50] hover:bg-[#E05A30] text-white text-xs font-bold rounded-lg transition active:scale-95 shadow-sm"
            >
              {tr('common.apply')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
