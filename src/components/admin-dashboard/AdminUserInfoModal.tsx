import { Mail, MessageCircle, ShieldCheck, UserRound, X } from 'lucide-react';
import { useI18n } from '../../i18nContext';
import type { AdminUser } from './types';

type AdminUserInfoModalProps = {
  user: AdminUser;
  listingsCount: number;
  onClose: () => void;
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export default function AdminUserInfoModal({ user, listingsCount, onClose }: AdminUserInfoModalProps) {
  const { tr } = useI18n();
  const registeredAt = formatDate(user.registeredAt);

  return (
    <div className="fixed inset-0 z-[730] flex items-center justify-center bg-black/55 p-3 sm:p-5 backdrop-blur-xs animate-fade-in">
      <div className="pu flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-2xl">
        <div className="pu-header pu-window-header">
          <div className="flex items-center gap-2.5">
            <UserRound className="h-5 w-5 text-[#FF7A50]" />
            <h3>{tr('admin.userInfo.title')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pu-close"
            title={tr('common.close')}
            aria-label={tr('common.close')}
          >
            <X />
          </button>
        </div>

        <div className="pu-body p-5">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-16 w-16 rounded-2xl border border-slate-100 object-cover"
            />
            <div className="min-w-0">
              <h4 className="truncate text-base font-black text-[#1E293B]">{user.name}</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#FF7A50]/10 px-2.5 py-1 text-[9px] font-black uppercase text-[#FF7A50]">
                  {tr(`admin.users.role.${user.role}`)}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${
                  user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {tr(`admin.users.status.${user.status}`)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-2.5 text-xs font-semibold text-[#1E293B]">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="min-w-0 truncate">{user.email || tr('admin.userInfo.empty')}</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              <span className="min-w-0 truncate">{user.phone || tr('admin.userInfo.empty')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <span className="block text-[9px] font-black uppercase text-slate-400">{tr('admin.userInfo.listings')}</span>
                <strong className="mt-1 block font-mono text-sm text-[#FF7A50]">{listingsCount}</strong>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <span className="block text-[9px] font-black uppercase text-slate-400">{tr('admin.userInfo.registeredAt')}</span>
                <strong className="mt-1 block truncate text-xs text-[#1E293B]">{registeredAt || tr('admin.userInfo.empty')}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <span className="min-w-0 truncate">{tr('admin.userInfo.id', { id: user.id })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
