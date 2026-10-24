import { useEffect, useState } from 'react';
import { Globe, MapPin, MessageCircle, Phone, X } from 'lucide-react';
import { useI18n } from '../../i18nContext';
import type { Company } from '../../config/companies';

type Props = {
  company: Company;
  onClose: () => void;
};

const getFaviconUrl = (website?: string) => {
  if (!website) return '';
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(website).hostname}&sz=128`;
  } catch {
    return '';
  }
};

const linkClass = 'flex w-full items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-bold text-[#1E293B] transition hover:border-[#FF7A50] hover:text-[#FF7A50]';

export default function CompanyContactModal({ company, onClose }: Props) {
  const { tr } = useI18n();
  const [logoFailed, setLogoFailed] = useState(false);
  const logoSrc = company.logoUrl || getFaviconUrl(company.website);
  const whatsappDigits = company.whatsapp?.replace(/[^0-9]/g, '');
  const hasContacts = Boolean(company.whatsapp || company.phone || company.website);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center bg-[#0B1714]/55 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={company.name}
    >
      <div className="relative w-full max-w-sm space-y-4 rounded-3xl bg-white p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          title={tr('common.close')}
          aria-label={tr('common.close')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          {logoSrc && !logoFailed ? (
            <img
              src={logoSrc}
              alt={company.name}
              onError={() => setLogoFailed(true)}
              className="h-14 w-14 shrink-0 rounded-2xl border border-[#E5E7EB] bg-white object-contain p-1.5"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2F7D69] text-xl font-black text-white">
              {company.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-black leading-tight text-[#1E293B]">{company.name}</h3>
            <p className="mt-0.5 text-xs font-semibold text-gray-500">{tr(`investments.option.${company.type}`)}</p>
          </div>
        </div>

        <div className="space-y-2">
          {whatsappDigits && (
            <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <MessageCircle className="h-4 w-4 shrink-0 text-[#25D366]" />
              <span className="min-w-0 flex-1">{tr('company.whatsapp')}</span>
              <span className="text-xs font-semibold text-gray-500">{company.whatsapp}</span>
            </a>
          )}
          {company.phone && (
            <a href={`tel:${company.phone.replace(/[^+0-9]/g, '')}`} className={linkClass}>
              <Phone className="h-4 w-4 shrink-0 text-[#2F7D69]" />
              <span className="min-w-0 flex-1">{tr('company.phone')}</span>
              <span className="text-xs font-semibold text-gray-500">{company.phone}</span>
            </a>
          )}
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <Globe className="h-4 w-4 shrink-0 text-[#003B95]" />
              <span className="min-w-0 flex-1">{tr('company.website')}</span>
              <span className="truncate text-xs font-semibold text-gray-500">{company.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
            </a>
          )}
          {company.googleMapsUrl && (
            <a href={company.googleMapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <MapPin className="h-4 w-4 shrink-0 text-[#FF7A50]" />
              <span className="min-w-0 flex-1">{tr('company.googleMaps')}</span>
            </a>
          )}
          {!hasContacts && (
            <p className="rounded-2xl bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-500">{tr('company.noContacts')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
