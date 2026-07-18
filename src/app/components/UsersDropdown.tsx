import { ChevronDown, Heart, List, LogOut, MessageSquare, ShieldAlert, User } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { useAuth } from '../../auth/AuthContext';
import { Listing } from '../../types';

interface UsersDropdownProps {
  id: string;
  listings: Listing[];
  showUsersDropdown: boolean;
  tr: (key: string) => string;
  label?: string;
  chevronClassName?: string;
  currentUser: FirebaseUser | null;
  onRequireAuth: (reasonKey?: string) => boolean;
  setShowUsersDropdown: (show: boolean) => void;
  setShowAdminDashboard: (show: boolean) => void;
  setShowCreateWizard: (show: boolean) => void;
  setShowMyAddsListing: (show: boolean) => void;
  setShowUsersModal: (show: boolean) => void;
  setUsersModalTab: (tab: 'favorites' | 'whatsapp') => void;
}

const isOwnListing = (item: Listing) =>
  item.ownerId === 'owner-personal' || item.ownerId === 'owner-1' || item.ownerId === 'owner-direct';

export default function UsersDropdown({
  id,
  listings,
  showUsersDropdown,
  tr,
  label = '',
  chevronClassName = 'w-3.5 h-3.5 text-gray-400',
  currentUser,
  onRequireAuth,
  setShowUsersDropdown,
  setShowAdminDashboard,
  setShowCreateWizard,
  setShowMyAddsListing,
  setShowUsersModal,
  setUsersModalTab
}: UsersDropdownProps) {
  const { signOut } = useAuth();
  const ownListings = listings.filter(item => item.ownerId === currentUser?.uid || isOwnListing(item));
  const displayLabel = currentUser?.displayName || currentUser?.email || label;

  return (
    <div className="header-popover-root relative">
      <button
        onClick={() => setShowUsersDropdown(!showUsersDropdown)}
        className="p-2 sm:px-3 sm:py-2 bg-[#F4F7F6] border border-[#E5E7EB] hover:bg-gray-200 text-[#1E293B] rounded-xl font-bold font-sans transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 text-[12.5px] sm:text-xs text-text-dark"
        id={id}
        title="Users Menu"
      >
        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF7A50]" />
        <span className="hidden sm:inline">{displayLabel}</span>
        <ChevronDown className={chevronClassName} />
      </button>

      {showUsersDropdown && (
        <div className="pu absolute right-0 mt-2 w-52 rounded-2xl shadow-xl border border-white/50 py-2.5 z-40 animate-fade-in text-xs font-sans text-left overflow-hidden">
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
              if (!onRequireAuth('auth.reason.favorites')) return;
              setUsersModalTab('favorites');
              setShowUsersModal(true);
              setShowUsersDropdown(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-white/70 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition mt-1"
          >
            <Heart className="w-4 h-4 text-[#FF7A50]" />
            <span>{tr('nav.favorites')}</span>
          </button>

          <button
            onClick={() => {
              if (!onRequireAuth('auth.reason.messages')) return;
              setUsersModalTab('whatsapp');
              setShowUsersModal(true);
              setShowUsersDropdown(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-white/70 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition"
          >
            <MessageSquare className="w-4 h-4 text-[#FF7A50]" />
            <span>{tr('nav.clickHistory')}</span>
          </button>

          <button
            onClick={() => {
              if (!onRequireAuth('auth.reason.myListings')) return;
              if (ownListings.length === 0) {
                setShowCreateWizard(true);
              } else {
                setShowMyAddsListing(true);
              }
              setShowUsersDropdown(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-white/70 text-[#1E293B] font-bold flex items-center gap-2 cursor-pointer transition"
          >
            <List className="w-4 h-4 text-[#FF7A50]" />
            <span>
              {tr('nav.myListings')}
              {ownListings.length === 0 ? ` (${tr('nav.create')})` : ''}
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
