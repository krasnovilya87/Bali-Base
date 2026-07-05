import { ChevronDown } from 'lucide-react';
import { LANGUAGES, LanguageCode } from '../../i18n';
import { CURRENCIES, CurrencyKey } from '../currency';

interface CurrencyLanguageControlsProps {
  activeCurrency: CurrencyKey;
  activeLanguage: LanguageCode;
  showCurrencyDrop: boolean;
  showLanguageDrop: boolean;
  tr: (key: string) => string;
  setActiveCurrency: (currency: CurrencyKey) => void;
  setActiveLanguage: (language: LanguageCode) => void;
  setShowCurrencyDrop: (show: boolean) => void;
  setShowLanguageDrop: (show: boolean) => void;
}

export default function CurrencyLanguageControls({
  activeCurrency,
  activeLanguage,
  showCurrencyDrop,
  showLanguageDrop,
  tr,
  setActiveCurrency,
  setActiveLanguage,
  setShowCurrencyDrop,
  setShowLanguageDrop
}: CurrencyLanguageControlsProps) {
  return (
    <>
      <div className="header-popover-root relative">
        <button
          onClick={() => {
            setShowCurrencyDrop(!showCurrencyDrop);
            setShowLanguageDrop(false);
          }}
          className="px-2.5 py-1.5 sm:px-2.5 sm:py-1.5 bg-white border border-[#E5E7EB] rounded-xl hover:bg-gray-100 cursor-pointer flex items-center gap-0.5 sm:gap-1 text-[#1E293B] font-mono font-semibold text-[11.5px] sm:text-xs"
          title={tr('nav.currency.title')}
        >
          <span className="font-sans text-[10px] sm:text-xs uppercase">{activeCurrency}</span>
          <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        {showCurrencyDrop && (
          <div className="pu absolute top-10 right-0 border border-white/50 rounded-2xl shadow-xl py-1.5 z-50 text-xs w-28 text-center font-mono overflow-hidden animate-fade-in">
            {Object.keys(CURRENCIES).map(curr => (
              <button
                key={curr}
                onClick={() => {
                  setActiveCurrency(curr as CurrencyKey);
                  setShowCurrencyDrop(false);
                }}
                className={`w-full py-2 hover:bg-white/70 transition block font-bold text-[#1E293B] ${activeCurrency === curr ? 'bg-white/70 text-[#FF7A50]' : ''
                  }`}
              >
                {CURRENCIES[curr as CurrencyKey].symbol} {curr}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="header-popover-root relative">
        <button
          onClick={() => {
            setShowLanguageDrop(!showLanguageDrop);
            setShowCurrencyDrop(false);
          }}
          className="px-2.5 py-1.5 sm:px-2.5 sm:py-1.5 bg-white border border-[#E5E7EB] rounded-xl hover:bg-gray-100 cursor-pointer flex items-center gap-0.5 font-bold text-[#1E293B] text-[11.5px] sm:text-xs"
          title={tr('nav.language.title')}
        >
          <span>{activeLanguage}</span>
          <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60" />
        </button>

        {showLanguageDrop && (
          <div className="pu absolute top-10 right-0 border border-white/50 rounded-2xl shadow-xl py-1.5 z-50 text-xs w-32 overflow-hidden animate-fade-in">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  setActiveLanguage(lang.code);
                  setShowLanguageDrop(false);
                }}
                className={`w-full text-left py-2 px-3.5 hover:bg-white/70 block text-[#1E293B] font-semibold transition ${activeLanguage === lang.code ? 'bg-white/70 text-[#FF7A50]' : ''
                  }`}
              >
                {lang.nativeName} ({lang.code})
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
