import React from 'react';
import { ClipboardList, X } from 'lucide-react';
import { BookingRequest, Listing } from '../../types';
import BookingRequestControls from './BookingRequestControls';
import { useI18n } from '../../i18nContext';

interface BookingsModalProps {
  listing: Listing;
  bookings: BookingRequest[];
  currencySymbol: string;
  currencyRate: number;
  onUpdateStatus: (id: string, status: 'accepted' | 'declined') => void;
  onUpdateBooking: (booking: BookingRequest) => void;
  onClose: () => void;
}

export default function BookingsModal({
  listing,
  bookings,
  currencySymbol,
  currencyRate,
  onUpdateStatus,
  onUpdateBooking,
  onClose
}: BookingsModalProps) {
  const { tr } = useI18n();
  const filtered = bookings
    .filter(booking => booking.listingId === listing.id && isBookingVisible(booking))
    .sort(sortBookingRequests);
  const newBookings = filtered.filter(booking => booking.status === 'pending');
  const currentBookings = filtered.filter(booking => booking.status === 'accepted' && !isBookingCompleted(booking));
  const completedBookings = filtered.filter(booking => booking.status === 'accepted' && isBookingCompleted(booking));
  const declinedBookings = filtered.filter(booking => booking.status === 'declined');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[510] p-4 animate-fade-in" id="bookings-solicitudes-modal">
      <div className="pu max-w-2xl w-full rounded-2xl p-5 border border-sky-50 shadow-2xl flex flex-col max-h-[85vh] text-[#1E293B]">
        <div className="pu-header -mx-5 -mt-5 px-5 py-4 flex justify-between items-center border-b border-[#D1D5DB]/30 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-black text-sm uppercase">{tr('booking.title', { title: listing.title })}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pu-body flex-1 overflow-y-auto py-3.5 space-y-3 pr-1">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-gray-450 py-10 leading-relaxed font-medium">
              {tr('booking.empty')}
            </p>
          ) : (
            <>
              {newBookings.map(request => (
                <div key={request.id}>
                  <BookingRequestControls
                    request={request}
                    listing={listing}
                    currencySymbol={currencySymbol}
                    currencyRate={currencyRate}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateBooking={onUpdateBooking}
                  />
                </div>
              ))}
              {currentBookings.length > 0 && newBookings.length > 0 && (
                <BookingDivider label={tr('booking.status.current')} />
              )}
              {currentBookings.map(request => (
                <div key={request.id}>
                  <BookingRequestControls
                    request={request}
                    listing={listing}
                    currencySymbol={currencySymbol}
                    currencyRate={currencyRate}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateBooking={onUpdateBooking}
                  />
                </div>
              ))}
              {completedBookings.length > 0 && (
                <BookingDivider label={tr('booking.status.completed')} />
              )}
              {completedBookings.map(request => (
                <div key={request.id}>
                  <BookingRequestControls
                    request={request}
                    listing={listing}
                    currencySymbol={currencySymbol}
                    currencyRate={currencyRate}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateBooking={onUpdateBooking}
                  />
                </div>
              ))}
              {declinedBookings.length > 0 && (
                <BookingDivider label={tr('booking.status.declined')} />
              )}
              {declinedBookings.map(request => (
                <div key={request.id}>
                  <BookingRequestControls
                    request={request}
                    listing={listing}
                    currencySymbol={currencySymbol}
                    currencyRate={currencyRate}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateBooking={onUpdateBooking}
                  />
                </div>
              ))}
            </>
          )}
        </div>

        <div className="pu-footer -mx-5 -mb-5 px-5 py-4 border-t border-[#D1D5DB]/30 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer">
            {tr('booking.close')}
          </button>
        </div>
      </div>
    </div>
  );
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
