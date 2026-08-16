import { DEFAULT_TICKETS } from '../components/admin-dashboard/mockData';
import type { AdminUser, SupportTicket } from '../components/admin-dashboard/types';

export const SUPPORT_TICKETS_STORAGE_KEY = 'bali_base_admin_tickets';
export const SUPPORT_TICKETS_UPDATED_EVENT = 'bali-base-support-tickets-updated';
const ADMIN_USERS_STORAGE_KEY = 'bali_base_admin_users';
const CURRENT_USER_PROFILE_KEY = 'bali_base_current_user_profile';

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const cleanComparable = (value?: string | null) => String(value || '').trim().toLowerCase();

const normalizePhone = (value?: string | null) => String(value || '').trim();

const readStoredAdminUsers = (): AdminUser[] => {
  if (!isBrowser()) return [];

  try {
    const stored = window.localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? (parsed as AdminUser[]) : [];
  } catch {
    return [];
  }
};

const findAdminUserPhone = (
  users: AdminUser[],
  params: { userId?: string | null; userName?: string | null; email?: string | null; displayName?: string | null }
) => {
  const userId = cleanComparable(params.userId);
  const userName = cleanComparable(params.userName);
  const email = cleanComparable(params.email);
  const displayName = cleanComparable(params.displayName);

  const matched = users.find(user => {
    const adminId = cleanComparable(user.id);
    const adminEmail = cleanComparable(user.email);
    const adminName = cleanComparable(user.name);
    return Boolean(
      (userId && adminId === userId) ||
      (email && adminEmail === email) ||
      (userName && (adminEmail === userName || adminName === userName)) ||
      (displayName && adminName === displayName)
    );
  });

  return normalizePhone(matched?.phone);
};

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

export const resolveSupportTicketPhone = (ticket: Partial<SupportTicket>, adminUsers = readStoredAdminUsers()) =>
  normalizePhone(ticket.userPhone) ||
  findAdminUserPhone(adminUsers, {
    userId: ticket.userId,
    userName: ticket.userName
  });

export const resolveCurrentSupportUserPhone = (user?: {
  uid?: string | null;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}) => {
  const directPhone = normalizePhone(user?.phoneNumber);
  if (directPhone) return directPhone;

  let storedProfilePhone = '';
  if (isBrowser()) {
    try {
      const storedProfile = window.localStorage.getItem(CURRENT_USER_PROFILE_KEY);
      const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null;
      const sameUser = !parsedProfile ||
        !user?.uid ||
        parsedProfile.uid === user.uid ||
        cleanComparable(parsedProfile.email) === cleanComparable(user.email);

      if (sameUser) {
        storedProfilePhone = normalizePhone(
          parsedProfile?.phoneNumber ||
          parsedProfile?.contactPhone ||
          parsedProfile?.whatsappNumber ||
          parsedProfile?.phone
        );
      }
    } catch {
      storedProfilePhone = '';
    }
  }
  if (storedProfilePhone) return storedProfilePhone;

  return findAdminUserPhone(readStoredAdminUsers(), {
    userId: user?.uid,
    email: user?.email,
    displayName: user?.displayName
  });
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
