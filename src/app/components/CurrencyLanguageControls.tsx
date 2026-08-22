import { CURRENCIES, CurrencyKey } from '../currency';

interface CurrencyLanguageControlsProps {
  activeCurrency: CurrencyKey;
  showCurrencyDrop: boolean;
  tr: (key: string) => string;
  setActiveCurrency: (currency: CurrencyKey) => void;
  setShowCurrencyDrop: (show: boolean) => void;
}

export default function CurrencyLanguageControls({
  activeCurrency,
  showCurrencyDrop,
  tr,
  setActiveCurrency,
  setShowCurrencyDrop
}: CurrencyLanguageControlsProps) {
  return (
    <div className="header-popover-root relative">
      <button
        onClick={() => {
          setShowCurrencyDrop(!showCurrencyDrop);
        }}
        className="h-8 sm:h-9 px-2 py-0 bg-white border border-[#E5E7EB] rounded-xl hover:bg-gray-100 cursor-pointer flex items-center text-[#1E293B] font-mono font-semibold text-[12px] sm:text-xs leading-none"
        title={tr('nav.currency.title')}
      >
        <span className="font-sans text-[12px] sm:text-xs leading-none uppercase">{activeCurrency}</span>
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
  );
}
