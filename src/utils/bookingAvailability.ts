import { BookingRequest, Listing } from '../types';

export const getStayNightDates = (checkInDate: string, checkOutDate: string) => {
  if (!checkInDate || !checkOutDate || checkInDate >= checkOutDate) return [];

  const dates: string[] = [];
  const cursor = new Date(`${checkInDate}T00:00:00`);
  const checkout = new Date(`${checkOutDate}T00:00:00`);

  while (cursor < checkout) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

export const bookingOverlapsStay = (
  booking: Pick<BookingRequest, 'startDate' | 'endDate'>,
  checkInDate: string,
  checkOutDate: string
) => (
  checkInDate < booking.endDate && checkOutDate > booking.startDate
);

export const isAcceptedBooking = (booking: BookingRequest) => booking.status === 'accepted';

export const getListingBookableUnitCount = (listing: Listing) => (
  Math.max(1, Math.min(50, listing.roomCount || listing.roomNumbers?.length || 1))
);

export const getBookingRoomIndex = (booking: BookingRequest, listing: Listing) => {
  const unitCount = getListingBookableUnitCount(listing);
  if (Number.isInteger(booking.roomIndex)) {
    return Math.max(0, Math.min(unitCount - 1, booking.roomIndex || 0));
  }

  const roomNumberIndex = booking.roomNumber && listing.roomNumbers
    ? listing.roomNumbers.findIndex(roomNumber => roomNumber.trim() === booking.roomNumber?.trim())
    : -1;

  return roomNumberIndex >= 0 ? roomNumberIndex : null;
};

export const isListingUnavailableForDates = (
  listing: Listing,
  bookings: BookingRequest[],
  checkInDate?: string,
  checkOutDate?: string
) => {
  if (listing.category !== 'housing' || !checkInDate || !checkOutDate || checkInDate >= checkOutDate) {
    return false;
  }

  const selectedNights = getStayNightDates(checkInDate, checkOutDate);
  if (selectedNights.length === 0) return false;

  if (selectedNights.some(date => listing.blockedDates?.includes(date))) {
    return true;
  }

  const overlappingAcceptedBookings = bookings.filter(booking =>
    booking.listingId === listing.id &&
    isAcceptedBooking(booking) &&
    bookingOverlapsStay(booking, checkInDate, checkOutDate)
  );

  const unitCount = getListingBookableUnitCount(listing);
  if (unitCount === 1) {
    return overlappingAcceptedBookings.length > 0;
  }

  const occupiedRoomIndexes = new Set<number>();
  let bookingsWithoutRoom = 0;

  overlappingAcceptedBookings.forEach(booking => {
    const roomIndex = getBookingRoomIndex(booking, listing);
    if (roomIndex === null) {
      bookingsWithoutRoom += 1;
      return;
    }
    occupiedRoomIndexes.add(roomIndex);
  });

  return occupiedRoomIndexes.size + bookingsWithoutRoom >= unitCount;
};

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
