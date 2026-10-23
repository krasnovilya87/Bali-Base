import { useEffect, useRef, useState } from 'react';
import { CURRENCIES, CurrencyKey } from '../currency';
import { storeLanguage } from '../language';
import { LANGUAGES, LanguageCode } from '../../i18n';

interface CurrencyLanguageControlsProps {
  activeCurrency: CurrencyKey;
  activeLanguage: LanguageCode;
  tr: (key: string) => string;
  setActiveCurrency: (currency: CurrencyKey) => void;
  setActiveLanguage: (language: LanguageCode) => void;
}

const buttonClass = 'flex h-9 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-2 text-[12px] font-bold uppercase leading-none text-[#1E293B] transition hover:bg-gray-100';

// Desktop header shortcuts for the currency and language pickers from the profile.
export default function CurrencyLanguageControls({
  activeCurrency,
  activeLanguage,
  tr,
  setActiveCurrency,
  setActiveLanguage
}: CurrencyLanguageControlsProps) {
  const [openMenu, setOpenMenu] = useState<'currency' | 'language' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [openMenu]);

  return (
    <div ref={rootRef} className="header-popover-root relative hidden shrink-0 items-center gap-1.5 md:flex">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu(menu => menu === 'currency' ? null : 'currency')}
          className={buttonClass}
          title={tr('nav.currency.title')}
          aria-label={tr('nav.currency.title')}
          aria-expanded={openMenu === 'currency'}
        >
          {activeCurrency}
        </button>
        {openMenu === 'currency' && (
          <div className="pu absolute right-0 top-11 z-50 w-28 overflow-hidden rounded-2xl border border-white/50 py-1.5 text-center text-xs shadow-xl animate-fade-in">
            {Object.keys(CURRENCIES).map(currency => (
              <button
                key={currency}
                type="button"
                onClick={() => {
                  setActiveCurrency(currency as CurrencyKey);
                  setOpenMenu(null);
                }}
                className={`block w-full py-2 font-bold text-[#1E293B] transition hover:bg-white/70 ${activeCurrency === currency ? 'bg-white/70 text-[#FF7A50]' : ''}`}
              >
                {CURRENCIES[currency as CurrencyKey].symbol} {currency}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu(menu => menu === 'language' ? null : 'language')}
          className={buttonClass}
          title={tr('nav.language.title')}
          aria-label={tr('nav.language.title')}
          aria-expanded={openMenu === 'language'}
        >
          {activeLanguage}
        </button>
        {openMenu === 'language' && (
          <div className="pu absolute right-0 top-11 z-50 w-32 overflow-hidden rounded-2xl border border-white/50 py-1.5 text-xs shadow-xl animate-fade-in">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  storeLanguage(lang.code);
                  setActiveLanguage(lang.code);
                  setOpenMenu(null);
                }}
                className={`block w-full px-3.5 py-2 text-left font-semibold text-[#1E293B] transition hover:bg-white/70 ${activeLanguage === lang.code ? 'bg-white/70 text-[#FF7A50]' : ''}`}
              >
                {lang.nativeName} ({lang.code})
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
