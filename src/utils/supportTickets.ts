import { DEFAULT_TICKETS } from '../components/admin-dashboard/mockData';
import type { SupportTicket } from '../components/admin-dashboard/types';

export const SUPPORT_TICKETS_STORAGE_KEY = 'bali_base_admin_tickets';
export const SUPPORT_TICKETS_UPDATED_EVENT = 'bali-base-support-tickets-updated';

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const readSupportTickets = (): SupportTicket[] => {
  if (!isBrowser()) return DEFAULT_TICKETS;

  const stored = window.localStorage.getItem(SUPPORT_TICKETS_STORAGE_KEY);
  if (!stored) return DEFAULT_TICKETS;

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as SupportTicket[]) : DEFAULT_TICKETS;
  } catch {
    return DEFAULT_TICKETS;
  }
};

export const writeSupportTickets = (tickets: SupportTicket[]) => {
  if (!isBrowser()) return;

  window.localStorage.setItem(SUPPORT_TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  window.dispatchEvent(new CustomEvent(SUPPORT_TICKETS_UPDATED_EVENT, { detail: { tickets } }));
};

export const createSupportTicketFromListing = (params: {
  listingId: string;
  listingTitle: string;
  userId: string;
  userName: string;
  userPhone: string;
  userAvatar: string;
  subject: string;
  message: string;
}): SupportTicket => {
  const createdAt = new Date().toISOString();
  return {
    id: `ticket-${Date.now()}`,
    userId: params.userId,
    userName: params.userName,
    userPhone: params.userPhone,
    userAvatar: params.userAvatar,
    subject: params.subject,
    status: 'open',
    createdAt,
    listingId: params.listingId,
    listingTitle: params.listingTitle,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: params.message,
        timestamp: createdAt
      }
    ]
  } as SupportTicket;
};
