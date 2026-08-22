import { List, LogOut, MessageSquare, ShieldAlert, User, UserRoundCog } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { useAuth } from '../../auth/AuthContext';
import { auth } from '../../firebase';
import { BookingRequest, Listing } from '../../types';

interface UsersDropdownProps {
  bookings: BookingRequest[];
  id: string;
  listings: Listing[];
  showUsersDropdown: boolean;
  tr: (key: string) => string;
  currentUser: FirebaseUser | null;
  onRequireAuth: (reasonKey?: string, afterAuth?: () => void) => boolean;
  setShowUsersDropdown: (show: boolean) => void;
  setShowAdminDashboard: (show: boolean) => void;
  setShowCreateWizard: (show: boolean) => void;
  setShowMyAddsListing: (show: boolean) => void;
  setShowProfileModal: (show: boolean) => void;
  setShowUsersModal: (show: boolean) => void;
  setUsersModalTab: (tab: 'favorites' | 'whatsapp') => void;
}

const isOwnListing = (item: Listing) =>
  item.ownerId === 'owner-personal' || item.ownerId === 'owner-1' || item.ownerId === 'owner-direct';

export default function UsersDropdown({
  bookings,
  id,
  listings,
  showUsersDropdown,
  tr,
  currentUser,
  onRequireAuth,
  setShowUsersDropdown,
  setShowAdminDashboard,
  setShowCreateWizard,
  setShowMyAddsListing,
  setShowProfileModal,
  setShowUsersModal,
  setUsersModalTab
}: UsersDropdownProps) {
  const { signOut } = useAuth();
  const getOwnListings = () => {
    const activeUserId = auth.currentUser?.uid || currentUser?.uid;
    return listings.filter(item => item.ownerId === activeUserId || isOwnListing(item));
  };
  const ownListings = getOwnListings();
  const userPhotoURL = currentUser?.photoURL || '';
  const totalContactHistoryCount = getContactHistoryCount();
  const acceptedBookingCount = getAcceptedContactHistoryBookingCount(bookings);
  const ownListingIds = new Set(ownListings.map(item => item.id));
  const newBookingRequestCount = bookings.filter(booking =>
    booking.status === 'pending' && ownListingIds.has(booking.listingId)
  ).length;
  const openMessages = () => {
    setUsersModalTab('whatsapp');
    setShowUsersModal(true);
    setShowUsersDropdown(false);
  };
  const openProfile = () => {
    setShowProfileModal(true);
    setShowUsersDropdown(false);
  };
  const openMyListings = () => {
    if (getOwnListings().length === 0) {
      setShowCreateWizard(true);
    } else {
      setShowMyAddsListing(true);
    }
    setShowUsersDropdown(false);
  };

  return (
    <div className={`header-popover-root relative ${showUsersDropdown ? 'z-[520]' : 'z-0'}`}>
      <button
        onClick={() => setShowUsersDropdown(!showUsersDropdown)}
        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent p-0 text-[#1E293B] transition hover:scale-105 active:scale-95"
        id={id}
        title="Users Menu"
      >
        {userPhotoURL ? (
          <img
            src={userPhotoURL}
            alt=""
            className="h-11 w-11 rounded-full object-cover shadow-sm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <User className="h-7 w-7 text-[#FF7A50]" />
        )}
      </button>

      {showUsersDropdown && (
        <div className="pu absolute right-0 mt-2 w-60 rounded-2xl shadow-xl border border-white/50 py-2.5 z-[520] animate-fade-in text-xs font-sans text-left overflow-hidden">
          <button
            onClick={() => {
              setShowAdminDashboard(true);
              setShowUsersDropdown(false);
            }}
            className="w-full text-left px-4 py-2.5 hover:bg-white/70 text-[#1E293B] font-extrabold flex items-center gap-2 cursor-pointer transition border-b border-[#E5E7EB]"
          >
            <ShieldAlert className="w-4 h-4 text-[#FF7A50]" />
            <span>{tr('nav.admin')}</span>
          </button>

          <button
            onClick={() => {
              if (!onRequireAuth('auth.defaultReason', openProfile)) {
                setShowUsersDropdown(false);
                return;
              }
              openProfile();
            }}
            className="w-full text-left px-4 py-2 hover:bg-white/70 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition mt-1"
          >
            <UserRoundCog className="w-4 h-4 text-[#FF7A50]" />
            <span className="min-w-0 flex-1 truncate">{tr('nav.profile')}</span>
          </button>

          <button
            onClick={() => {
              if (!onRequireAuth('auth.reason.messages', openMessages)) {
                setShowUsersDropdown(false);
                return;
              }
              openMessages();
            }}
            className="w-full text-left px-4 py-2 hover:bg-white/70 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition mt-1"
          >
            <MessageSquare className="w-4 h-4 text-[#FF7A50]" />
            <span className="min-w-0 flex-1 truncate">{tr('nav.clickHistory')}</span>
            <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black leading-none">
              <span className="text-emerald-700">{formatCount(totalContactHistoryCount)}</span>
              <span className="px-0.5 text-slate-400">/</span>
              <span className="text-red-600">{formatCount(acceptedBookingCount)}</span>
            </span>
          </button>

          <button
            onClick={() => {
              if (!onRequireAuth('auth.reason.myListings', openMyListings)) {
                setShowUsersDropdown(false);
                return;
              }
              openMyListings();
            }}
            className="w-full text-left px-4 py-2 hover:bg-white/70 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition"
          >
            <List className="w-4 h-4 text-[#FF7A50]" />
            <span className="min-w-0 flex-1 truncate">
              {tr('nav.myListings')}
              {ownListings.length === 0 ? ` (${tr('nav.create')})` : ''}
            </span>
            <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-[#2F7D69]/10 px-1.5 py-0.5 text-[10px] font-black leading-none">
              <span className="text-[#2F7D69]">{formatCount(ownListings.length)}</span>
              <span className="px-0.5 text-slate-400">/</span>
              <span className="text-red-600">{formatCount(newBookingRequestCount)}</span>
            </span>
          </button>

          <div className="border-t border-[#E5E7EB] my-1.5" />

          <button
            onClick={async () => {
              setShowUsersDropdown(false);
              if (!currentUser) {
                onRequireAuth('auth.defaultReason');
                return;
              }
              await signOut();
            }}
            className="w-full text-left px-4 py-2 hover:bg-white/70 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition"
          >
            <LogOut className="w-4 h-4 text-[#FF7A50]" />
            <span>{currentUser ? tr('nav.logout') : tr('auth.signIn')}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function formatCount(count: number) {
  return count > 99 ? '99+' : String(count);
}

function getContactHistoryCount() {
  if (typeof window === 'undefined') return 0;
  try {
    const history = JSON.parse(localStorage.getItem('bali_base_whatsapp_history') || '[]') as Array<{ id?: string }>;
    return new Set(history.map((item) => item.id).filter(Boolean)).size;
  } catch {
    return 0;
  }
}

function getAcceptedContactHistoryBookingCount(bookings: BookingRequest[]) {
  if (typeof window === 'undefined') return 0;
  try {
    const history = JSON.parse(localStorage.getItem('bali_base_whatsapp_history') || '[]') as Array<{ id?: string }>;
    const historyListingIds = new Set(history.map((item) => item.id).filter(Boolean));
    if (historyListingIds.size === 0) return 0;

    return Array.from(historyListingIds).filter((listingId) => {
      const latestBooking = bookings
        .filter((booking) => booking.listingId === listingId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      return latestBooking?.status === 'accepted';
    }).length;
  } catch {
    return 0;
  }
}
