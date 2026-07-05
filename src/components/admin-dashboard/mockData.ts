import { AdminUser, SupportTicket } from './types';

export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: 'user-admin-1',
    name: 'Ilya Krasnov',
    email: 'krasnovilya87@gmail.com',
    phone: '+62 812-3456-7890',
    role: 'admin',
    status: 'active',
    listingsCount: 2,
    registeredAt: '2026-01-15T08:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'user-host-2',
    name: 'Keti Melkadze',
    email: 'keti_bali@outlook.com',
    phone: '+62 821-4477-9911',
    role: 'host',
    status: 'active',
    listingsCount: 4,
    registeredAt: '2026-03-04T12:15:00Z',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'user-host-3',
    name: 'Wayong Suartha',
    email: 'wayong_bali88@gmail.com',
    phone: '+62 855-9009-8877',
    role: 'host',
    status: 'active',
    listingsCount: 8,
    registeredAt: '2026-02-28T09:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'user-mod-4',
    name: 'Alex Smirnov',
    email: 'alex_mod@balibase.com',
    phone: '+62 811-9988-7766',
    role: 'moderator',
    status: 'active',
    listingsCount: 0,
    registeredAt: '2026-04-10T14:22:00Z',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'user-guest-5',
    name: 'Maria Petrova',
    email: 'mari_petrova@yandex.ru',
    phone: '+7 903-123-4567',
    role: 'guest',
    status: 'active',
    listingsCount: 0,
    registeredAt: '2026-05-20T17:45:00Z',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'user-guest-6',
    name: 'John Miller',
    email: 'john_mill@gmail.com',
    phone: '+1 415-889-1234',
    role: 'guest',
    status: 'banned',
    listingsCount: 0,
    registeredAt: '2026-05-18T10:11:00Z',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
  }
];

export const DEFAULT_TICKETS: SupportTicket[] = [
  {
    id: 'ticket-1',
    userId: 'user-host-2',
    userName: 'Keti Melkadze',
    userPhone: '+62 821-4477-9911',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    subject: 'iCal calendar integration issue',
    status: 'open',
    createdAt: '2026-06-05T11:40:00Z',
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Hello! I added the iCal link from Airbnb, but the dates in my Bali Base calendar were not blocked. Please check it.',
        timestamp: '2026-06-05T11:40:00Z'
      },
      {
        id: 'm2',
        sender: 'admin',
        text: 'Hello! We are checking your link. Sync can sometimes take up to 15 minutes. Please send your listing ID.',
        timestamp: '2026-06-05T12:05:00Z'
      },
      {
        id: 'm3',
        sender: 'user',
        text: 'Listing: Ubud Jungle View Loft villa (ID: l_ubud_jungle). This is the iCal link I added.',
        timestamp: '2026-06-05T12:12:00Z'
      }
    ]
  },
  {
    id: 'ticket-2',
    userId: 'user-guest-5',
    userName: 'Maria Petrova',
    userPhone: '+7 903-123-4567',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    subject: 'Premium verification confirmation',
    status: 'open',
    createdAt: '2026-06-06T09:15:00Z',
    messages: [
      {
        id: 'm4',
        sender: 'user',
        text: 'Hi! I submitted documents for Approved verification. How long does profile review usually take?',
        timestamp: '2026-06-06T09:15:00Z'
      }
    ]
  },
  {
    id: 'ticket-3',
    userId: 'user-host-3',
    userName: 'Wayong Suartha',
    userPhone: '+62 855-9009-8877',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    subject: 'Question about the Turbo promo tariff',
    status: 'resolved',
    createdAt: '2026-06-04T15:20:00Z',
    messages: [
      {
        id: 'm5',
        sender: 'user',
        text: 'Hello. I want to buy Turbo promo category for my villa. Can I pay with wise or local Indonesian bank transfer?',
        timestamp: '2026-06-04T15:20:00Z'
      },
      {
        id: 'm6',
        sender: 'admin',
        text: 'Sure, Wayong! Yes, we accept both local Indonesian bank transfer (BCA, Mandiri) and Wise direct transfer. Our managers will contact you shortly with the billing details.',
        timestamp: '2026-06-04T15:55:00Z'
      },
      {
        id: 'm7',
        sender: 'user',
        text: 'Thank you very much, I successfully registered it.',
        timestamp: '2026-06-04T16:40:00Z'
      }
    ]
  }
];
