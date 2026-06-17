import React from 'react';
import { BarChart2, Database, List, MessageSquare, Settings, Shield, ShieldAlert, User, X } from 'lucide-react';
import { AdminTab } from './types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  adminUsersCount: number;
  listingsCount: number;
  moderationListings: number;
  onClose: () => void;
  onTabChange: (tab: AdminTab) => void;
}

export default function AdminSidebar({
  activeTab,
  adminUsersCount,
  listingsCount,
  moderationListings,
  onClose,
  onTabChange
}: AdminSidebarProps) {
  const itemClass = (tab: AdminTab) =>
    `w-full text-left py-2.5 px-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition cursor-pointer ${
      activeTab === tab ? 'bg-[#FF7A50] text-white' : 'text-slate-300 hover:bg-slate-850'
    }`;

  return (
    <aside className="w-full sm:w-64 bg-[#0F172A] text-white flex flex-col justify-between shrink-0 border-b sm:border-b-0 sm:border-r border-slate-800">
      <div>
        <div className="p-5 border-b border-slate-805 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#FF7A50] p-1.5 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight">Администратор</h1>
              <span className="text-[10px] text-slate-400 font-mono font-medium block">Панель управления</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg sm:hidden hover:bg-slate-800 text-slate-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          <button onClick={() => onTabChange('dashboard')} className={itemClass('dashboard')}>
            <BarChart2 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button onClick={() => onTabChange('users')} className={itemClass('users')}>
            <User className="w-4 h-4" />
            <span>Users</span>
            <span className="ml-auto text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
              {adminUsersCount}
            </span>
          </button>

          <button onClick={() => onTabChange('listings')} className={itemClass('listings')}>
            <List className="w-4 h-4" />
            <span>Listings</span>
            <span className="ml-auto text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
              {listingsCount}
            </span>
          </button>

          <button onClick={() => onTabChange('moderation')} className={itemClass('moderation')}>
            <ShieldAlert className="w-4 h-4 animate-pulse text-amber-400" />
            <span>Moderation</span>
            {moderationListings > 0 && (
              <span className="ml-auto text-[10px] bg-amber-550 text-slate-900 font-bold px-2 py-0.5 rounded-full">
                {moderationListings}
              </span>
            )}
          </button>

          <button onClick={() => onTabChange('messages')} className={itemClass('messages')}>
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
            <span className="ml-auto text-[10.5px] bg-emerald-500 hover:bg-emerald-605 text-white font-black px-1.5 rounded-md leading-none py-1">
              New
            </span>
          </button>

          <button onClick={() => onTabChange('settings')} className={itemClass('settings')}>
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 hidden sm:block bg-slate-950/40">
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Статус сервера:</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              ONLINE
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>База данных:</span>
            <span className="text-sky-400 font-mono font-medium flex items-center gap-1">
              <Database className="w-3 h-3" />
              Firestore
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
