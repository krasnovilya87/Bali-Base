import React, { useEffect, useState } from 'react';
import { UserCheck, X } from 'lucide-react';
import { AdminUser } from './types';
import PhoneInput from '../PhoneInput';
import { useI18n } from '../../i18nContext';

interface AddUserModalProps {
  name: string;
  email: string;
  phone: string;
  role: AdminUser['role'];
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onRoleChange: (value: AdminUser['role']) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export default function AddUserModal({
  name,
  email,
  phone,
  role,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onRoleChange,
  onClose,
  onSubmit
}: AddUserModalProps) {
  const { tr } = useI18n();
  const [phoneDisplayValue, setPhoneDisplayValue] = useState(phone);

  useEffect(() => {
    if (!phone) {
      setPhoneDisplayValue('');
    }
  }, [phone]);

  return (
    <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-[510] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#E2E8F0] shadow-2xl relative text-left select-none animate-fade-in space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base flex items-center gap-1.5">
            <UserCheck className="w-5 h-5 text-[#FF7A50]" />
            <span>{tr('admin.addUser.title')}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl bg-gray-50 hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-505" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 block">{tr('admin.addUser.fullName')}</label>
            <input
              type="text"
              required
              placeholder={tr('admin.addUser.fullNamePlaceholder')}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none text-xs sm:text-sm font-semibold focus:border-[#FF7A50]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 block">{tr('admin.addUser.email')}</label>
            <input
              type="email"
              required
              placeholder="ivan@example.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none text-xs sm:text-sm font-semibold focus:border-[#FF7A50]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 block">{tr('admin.addUser.whatsapp')}</label>
            <PhoneInput
              required
              placeholder="+62 821-4433-2211"
              value={phoneDisplayValue}
              onChange={(displayValue, whatsappNumber) => {
                setPhoneDisplayValue(displayValue);
                onPhoneChange(whatsappNumber);
              }}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none text-xs sm:text-sm font-semibold focus:border-[#FF7A50] font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 block">{tr('admin.addUser.role')}</label>
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value as AdminUser['role'])}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-xs sm:text-sm"
            >
              <option value="guest">{tr('admin.addUser.guest')}</option>
              <option value="host">{tr('admin.addUser.host')}</option>
              <option value="moderator">{tr('admin.addUser.moderator')}</option>
              <option value="admin">{tr('admin.addUser.admin')}</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-[#FF7A50] hover:bg-[#E05A30] text-white py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer"
          >
            {tr('admin.addUser.create')}
          </button>
        </form>
      </div>
    </div>
  );
}
