import React, { useEffect, useState } from 'react';
import { BookingRequest } from '../../types';

interface BookingRequestControlsProps {
  request: BookingRequest;
  currencySymbol: string;
  currencyRate: number;
  onUpdateStatus: (id: string, status: 'accepted' | 'declined') => void;
  onUpdateBooking: (booking: BookingRequest) => void;
  compact?: boolean;
}

export default function BookingRequestControls({
  request,
  currencySymbol,
  currencyRate,
  onUpdateStatus,
  onUpdateBooking,
  compact = false
}: BookingRequestControlsProps) {
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid' | 'deposit'>(
    request.paymentStatus || 'unpaid'
  );
  const [depositAmount, setDepositAmount] = useState(request.depositAmount || 0);
  const convertPrice = (amount: number) => Math.round(amount * currencyRate).toLocaleString();

  useEffect(() => {
    setPaymentStatus(request.paymentStatus || 'unpaid');
    setDepositAmount(request.depositAmount || 0);
  }, [request.paymentStatus, request.depositAmount]);

  return (
    <div className={`rounded-2xl border bg-white/70 ${compact ? 'p-2.5 space-y-2' : 'p-3 space-y-2.5'} ${
      request.status === 'accepted'
        ? 'border-emerald-200'
        : request.status === 'declined'
          ? 'border-rose-200 opacity-65'
          : 'border-amber-200'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-[#1E293B] truncate">{request.guestName}</p>
          <p className="text-[9.5px] text-gray-400 font-mono">
            {formatShortDate(request.startDate)} - {formatShortDate(request.endDate)} · {request.totalDays} ночей
          </p>
        </div>
        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
          request.status === 'accepted'
            ? 'bg-emerald-100 text-emerald-800'
            : request.status === 'declined'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-amber-100 text-amber-800'
        }`}>
          {request.status === 'accepted' ? 'Принято' : request.status === 'declined' ? 'Отклонено' : 'Новая'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="text-gray-500">Сумма</span>
        <span className="font-mono font-bold text-gray-800">
          {convertPrice(request.totalPrice)} {currencySymbol}
        </span>
      </div>

      {request.status !== 'declined' && (
        <div className="pt-2 border-t border-gray-200/70 space-y-2">
          <div className="grid grid-cols-3 gap-1">
            {([
              ['unpaid', 'Не оплачено'],
              ['paid', 'Оплачено'],
              ['deposit', 'Депозит']
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
                        : 'bg-gray-200 text-gray-700 ring-1 ring-gray-300'
                    : 'bg-gray-50 text-gray-400 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {paymentStatus === 'deposit' && (
            <label className="flex items-center gap-2">
              <span className="text-[9.5px] text-gray-500 shrink-0">Сумма депозита:</span>
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
                paymentStatus,
                depositAmount: paymentStatus === 'deposit' ? depositAmount : undefined
              })}
              className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition"
            >
              Подтвердить
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(request.id, 'declined')}
              className="py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] transition"
            >
              Отклонить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit'
  });
}
