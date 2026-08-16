import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { BookingRequest, Listing } from '../../types';
import { useI18n } from '../../i18nContext';

interface BookingRequestControlsProps {
  request: BookingRequest;
  listing: Listing;
  currencySymbol: string;
  currencyRate: number;
  onUpdateStatus: (id: string, status: 'accepted' | 'declined') => void;
  onUpdateBooking: (booking: BookingRequest) => void;
  compact?: boolean;
}

export default function BookingRequestControls({
  request,
  listing,
  currencySymbol,
  currencyRate,
  onUpdateStatus,
  onUpdateBooking,
  compact = false
}: BookingRequestControlsProps) {
  const { tr } = useI18n();
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid' | 'deposit'>(
    request.paymentStatus || 'unpaid'
  );
  const [depositAmount, setDepositAmount] = useState(request.depositAmount || 0);
  const [isNotesOpen, setIsNotesOpen] = useState(Boolean(request.comment));
  const [notes, setNotes] = useState(request.comment || '');
  const [isDeclineConfirmOpen, setIsDeclineConfirmOpen] = useState(false);
  const convertPrice = (amount: number) => Math.round(amount * currencyRate).toLocaleString();
  const contactPhone = request.guestPhone.replace(/\D/g, '');
  const contactUrl = contactPhone ? `https://wa.me/${contactPhone}` : '';
  const isCompleted = request.status === 'accepted' && isBookingCompleted(request);

  useEffect(() => {
    setPaymentStatus(request.paymentStatus || 'unpaid');
    setDepositAmount(request.depositAmount || 0);
    setNotes(request.comment || '');
    setIsNotesOpen(Boolean(request.comment));
  }, [request.paymentStatus, request.depositAmount, request.comment]);

  const saveNotes = (value = notes) => {
    onUpdateBooking({
      ...request,
      comment: value.trim() || undefined
    });
    setIsNotesOpen(Boolean(value.trim()));
  };

  const declineRequest = () => {
    setIsDeclineConfirmOpen(true);
  };

  const confirmDeclineRequest = () => {
    onUpdateStatus(request.id, 'declined');
    setIsDeclineConfirmOpen(false);
  };

  return (
    <>
    <div className={`rounded-2xl border ${compact ? 'p-2.5 space-y-2' : 'p-3 space-y-2.5'} ${
      isCompleted
        ? 'bg-gray-100/85 border-gray-200 opacity-80'
        : request.status === 'accepted'
          ? 'bg-white/70 border-emerald-200'
        : request.status === 'declined'
          ? 'bg-gray-100/80 border-gray-200 opacity-75 grayscale'
          : 'bg-white/70 border-amber-200'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-[#1E293B] truncate">{request.guestName}</p>
          <p className="text-[9.5px] text-gray-400 font-mono">
            {formatShortDate(request.startDate)} - {formatShortDate(request.endDate)} · {tr('booking.nights', { count: request.totalDays })}
          </p>
        </div>
        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
          request.status === 'accepted'
            ? 'bg-emerald-100 text-emerald-800'
            : request.status === 'declined'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-amber-100 text-amber-800'
        }`}>
          {request.status === 'accepted' ? tr('booking.status.accepted') : request.status === 'declined' ? tr('booking.status.declined') : tr('booking.status.new')}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="text-gray-500">{tr('booking.total')}</span>
        <span className="font-mono font-bold text-gray-800">
          {convertPrice(request.totalPrice)} {currencySymbol}
        </span>
      </div>

      {request.roomNumber && (
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="text-gray-500">{tr('calendarListing.roomNumber')}</span>
          <span className="font-mono font-bold text-gray-800">{request.roomNumber}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => setIsNotesOpen(current => request.comment ? true : !current)}
          className="px-2 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-[9px] font-black uppercase tracking-wide text-gray-500 transition"
        >
          {tr('booking.notes')}
        </button>

        {(isNotesOpen || request.comment) && (
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={(event) => saveNotes(event.target.value)}
            placeholder={tr('booking.notesPlaceholder')}
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[10.5px] text-gray-700 outline-none transition focus:border-[#FF7A50]/60 focus:ring-2 focus:ring-[#FF7A50]/15"
          />
        )}
      </div>

      <div className="pt-2 border-t border-gray-200/70 space-y-2">
        {request.status !== 'declined' && (
          <>
          <div className="grid grid-cols-3 gap-1">
            {([
              ['unpaid', tr('booking.payment.unpaid')],
              ['paid', tr('booking.payment.paid')],
              ['deposit', tr('booking.payment.deposit')]
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setPaymentStatus(value);
                  if (value !== 'deposit') setDepositAmount(0);
                }}
                className={`px-1.5 py-1.5 rounded-lg text-[9px] font-bold transition ${
                  paymentStatus === value
                    ? value === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                      : value === 'deposit'
                        ? 'bg-[#FF7A50]/10 text-[#E05A30] ring-1 ring-[#FF7A50]/40'
                        : 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
                    : 'bg-gray-50 text-gray-400 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {paymentStatus === 'deposit' && (
            <label className="flex items-center gap-2">
              <span className="text-[9.5px] text-gray-500 shrink-0">{tr('booking.depositAmount')}</span>
              <input
                type="text"
                inputMode="numeric"
                value={depositAmount ? depositAmount.toLocaleString('ru-RU') : ''}
                placeholder="0"
                onChange={(event) => {
                  const numericValue = event.target.value.replace(/\D/g, '');
                  setDepositAmount(numericValue ? Number(numericValue) : 0);
                }}
                className="min-w-0 w-full bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-[10px] font-mono focus:outline-none focus:border-[#FF7A50]"
              />
              <span className="text-[9px] text-gray-400 shrink-0">{currencySymbol}</span>
            </label>
          )}

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onUpdateBooking({
                ...request,
                status: 'accepted',
                declinedAt: undefined,
                paymentStatus,
                depositAmount: paymentStatus === 'deposit' ? depositAmount : undefined
              })}
              className={`py-1.5 font-bold rounded-lg text-[10px] transition ${
                request.status === 'accepted'
                  ? 'bg-gray-200 text-gray-500 ring-1 ring-gray-300 hover:bg-gray-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {tr('booking.accept')}
            </button>
            <button
              type="button"
              onClick={declineRequest}
              className="py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] transition"
            >
              {tr('booking.decline')}
            </button>
          </div>
          </>
        )}

        <a
          href={contactUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!contactUrl}
          className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-bold transition ${
            contactUrl
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95'
              : 'pointer-events-none bg-gray-100 text-gray-400'
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {tr('booking.contact')}
        </a>
      </div>
    </div>
    {isDeclineConfirmOpen && (
      <div className="fixed inset-0 z-[720] flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
        <div className="pu w-full max-w-[320px] rounded-2xl border border-white/70 shadow-2xl p-4 animate-scale-up">
          <div className="space-y-1.5">
            <p className="text-xs font-black uppercase tracking-wide text-gray-950">
              {tr('booking.decline')}
            </p>
            <p className="text-[11px] leading-relaxed text-gray-500">
              {tr('booking.declineConfirm')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsDeclineConfirmOpen(false)}
              className="py-2 rounded-xl bg-white/75 hover:bg-white text-gray-600 text-[10px] font-bold transition active:scale-95"
            >
              {tr('booking.declineCancel')}
            </button>
            <button
              type="button"
              onClick={confirmDeclineRequest}
              className="py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold transition active:scale-95"
            >
              {tr('booking.decline')}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit'
  });
}

function isBookingCompleted(booking: BookingRequest) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${booking.endDate}T00:00:00`).getTime() < today.getTime();
}
