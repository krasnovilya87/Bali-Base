import React from 'react';
import { RefreshCw, ShieldCheck, X } from 'lucide-react';
import { AdminTab } from './types';

interface AdminHeaderProps {
  activeTab: AdminTab;
  onClose: () => void;
  onClearCache: () => void;
}

const TITLES: Record<AdminTab, string> = {
  dashboard: 'Общая статистика & Dashboard',
  users: 'Управление пользователями',
  listings: 'Модерация & Объявления',
  moderation: 'Запросы на одобрение',
  messages: 'Центр поддержки пользователей',
  settings: 'Системные настройки интеграции'
};

export default function AdminHeader({ activeTab, onClose, onClearCache }: AdminHeaderProps) {
  return (
    <header className="h-[60px] border-b border-[#E2E8F0] bg-white flex items-center justify-between px-6 shrink-0 z-10">
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="w-5 h-5 text-[#FF7A50]" />
        <h2 className="font-bold text-gray-800 text-sm sm:text-base">{TITLES[activeTab]}</h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onClearCache}
          className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold rounded-lg text-[10.5px] transition flex items-center gap-1.5 cursor-pointer"
          title="Очистить и восстановить кэш"
        >
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Сбросить кэш</span>
        </button>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer hidden sm:block"
          title="Закрыть панель"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
