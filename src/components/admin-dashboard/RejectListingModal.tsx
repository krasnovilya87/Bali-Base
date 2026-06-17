import React from 'react';
import { X, XCircle } from 'lucide-react';

interface RejectListingModalProps {
  reason: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RejectListingModal({
  reason,
  onReasonChange,
  onClose,
  onConfirm
}: RejectListingModalProps) {
  return (
    <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-[510] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#E2E8F0] shadow-2xl relative text-left select-none animate-fade-in space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base flex items-center gap-1.5">
            <XCircle className="w-5 h-5 text-rose-500" />
            <span>Причина отклонения модерации</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl bg-gray-50 hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-505" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 block">Укажите причину для хоста:</label>
            <textarea
              rows={4}
              required
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-gray-200 rounded-2xl focus:outline-none text-xs sm:text-sm font-semibold focus:border-[#FF7A50] leading-relaxed"
              placeholder="Опишите, что нужно исправить..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer"
            >
              Отклонить объявление
            </button>
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 rounded-xl text-xs font-bold transition cursor-pointer font-sans"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
