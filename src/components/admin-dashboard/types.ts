import { BookingRequest, Listing } from '../../types';

export type AdminTab = 'dashboard' | 'users' | 'listings' | 'moderation' | 'messages' | 'places' | 'settings';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'moderator' | 'host' | 'guest';
  status: 'active' | 'banned';
  listingsCount: number;
  registeredAt: string;
  avatar: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userAvatar: string;
  subject: string;
  messages: {
    id: string;
    sender: 'user' | 'admin';
    text: string;
    timestamp: string;
  }[];
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface AdminDashboardProps {
  listings: Listing[];
  bookings: BookingRequest[];
  onToggleStatus: (listingId: string) => void;
  onUpdateBookingStatus: (bookingId: string, status: 'accepted' | 'declined') => void;
  onUpdateListing: (listing: Listing) => void;
  onDeleteListing: (listingId: string) => void;
  onClose: () => void;
  currencySymbol: string;
  currencyRate: number;
  menuOverrides?: any;
  onUpdateMenuOverrides?: (newOverrides: any) => Promise<void>;
}
