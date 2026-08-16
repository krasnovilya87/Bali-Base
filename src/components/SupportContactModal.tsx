import { FormEvent, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18nContext';
import { readSupportTickets, resolveCurrentSupportUserPhone, writeSupportTickets } from '../utils/supportTickets';
import type { SupportTicket } from './admin-dashboard/types';

type SupportContactModalProps = {
  onClose: () => void;
};

export default function SupportContactModal({ onClose }: SupportContactModalProps) {
  const { user } = useAuth();
  const { tr } = useI18n();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    const createdAt = new Date().toISOString();
    const ticket: SupportTicket = {
      id: `ticket-contact-${Date.now()}`,
      userId: user?.uid || 'guest-contact',
      userName: user?.displayName || user?.email || tr('contactUs.guestName'),
      userPhone: resolveCurrentSupportUserPhone(user),
      userAvatar: user?.photoURL || '',
      subject: subject.trim(),
      status: 'open',
      createdAt,
      messages: [
        {
          id: `msg-contact-${Date.now()}`,
          sender: 'user',
          text: message.trim(),
          timestamp: createdAt
        }
      ]
    };

    writeSupportTickets([ticket, ...readSupportTickets()]);
    setSent(true);
    window.setTimeout(onClose, 1400);
  };

  return (
    <div className="fixed inset-0 z-[620] flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs animate-fade-in">
      <div className="pu flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-2xl">
        <div className="pu-header pu-window-header">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-5 w-5 text-[#2F7D69]" />
            <h3>{tr('contactUs.title')}</h3>
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

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <div className="pu-body space-y-4 p-5">
            {sent ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-8 text-center text-sm font-bold text-emerald-700">
                {tr('contactUs.sent')}
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[#5F6978]">
                    {tr('contactUs.subjectLabel')}
                  </label>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1E293B] outline-none transition focus:border-[#2F7D69] focus:ring-4 focus:ring-[#2F7D69]/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[#5F6978]">
                    {tr('contactUs.messageLabel')}
                  </label>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={5}
                    className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-[#1E293B] outline-none transition focus:border-[#2F7D69] focus:ring-4 focus:ring-[#2F7D69]/10"
                  />
                </div>
              </>
            )}
          </div>
          {!sent && (
            <div className="pu-footer justify-end">
              <button
                type="button"
                onClick={onClose}
                className="pu-button-secondary"
              >
                {tr('contactUs.cancel')}
              </button>
              <button
                type="submit"
                disabled={!subject.trim() || !message.trim()}
                className="pu-button-primary"
              >
                <Send className="h-3.5 w-3.5" />
                {tr('contactUs.submit')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
