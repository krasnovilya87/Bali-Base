import React from 'react';
import { Crown, X } from 'lucide-react';
import { Listing } from '../../types';

interface PromoteListingModalProps {
  listing: Listing;
  onChange: (listing: Listing) => void;
  onClose: () => void;
}

export default function PromoteListingModal({
  listing,
  onChange,
  onClose
}: PromoteListingModalProps) {
  const togglePackage = (packageType: 'top' | 'premium' | 'turbo') => {
    const updated = packageType === 'top'
      ? { ...listing, isPromoTop: !listing.isPromoTop }
      : packageType === 'premium'
        ? { ...listing, isPromoPremium: !listing.isPromoPremium }
        : { ...listing, isPromoTurbo: !listing.isPromoTurbo };

    onChange(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[510] p-4 animate-fade-in" id="promote-promo-modal">
      <div className="pu max-w-lg w-full rounded-3xl p-5 border border-sky-100 shadow-2xl space-y-4 animate-scale-up text-[#1E293B]">
        <div className="pu-header -mx-5 -mt-5 px-5 py-4 flex justify-between items-center border-b border-[#D1D5DB]/30">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-black text-base uppercase">Продвижение объявления</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="pu-body text-xs text-gray-550 leading-relaxed">
          Максимально увеличьте количество обращений по объекту <strong>{listing.title}</strong> с помощью премиум тарифов Bali Base.
        </p>

        <div className="pu-body space-y-3">
          <PromoOption
            active={!!listing.isPromoTop}
            activeClass="border-amber-400 bg-amber-50/40"
            icon="✨"
            iconClass="bg-amber-100 text-amber-700"
            title="Пакет «Топ» (Выделение цветом)"
            titleClass="text-amber-900"
            description="Объявление подсвечивается привлекательным фоном в общей поисковой ленте."
            buttonClass="bg-amber-500"
            onClick={() => togglePackage('top')}
          />
          <PromoOption
            active={!!listing.isPromoPremium}
            activeClass="border-orange-400 bg-orange-50/40"
            icon="👑"
            iconClass="bg-orange-100 text-orange-700"
            title="Пакет «Премиум» (Стильный бейдж)"
            titleClass="text-orange-900"
            description="На карточку крепится красивый VIP бейдж, моментально притягивающий взгляд."
            buttonClass="bg-orange-500"
            onClick={() => togglePackage('premium')}
          />
          <PromoOption
            active={!!listing.isPromoTurbo}
            activeClass="border-rose-400 bg-rose-50/40"
            icon="⚡"
            iconClass="bg-rose-100 text-rose-700"
            title="Пакет «Турбо» (Первая строчка в поиске)"
            titleClass="text-rose-900"
            description="Объявление раз в день автоматически поднимается в самый верх поискового каталога."
            buttonClass="bg-rose-500"
            onClick={() => togglePackage('turbo')}
          />
        </div>

        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-[11px] leading-relaxed text-amber-800">
          🔥 <strong>Хотите еще больше эффекта?</strong> Не забудьте также установить скидку через функцию <strong>Drop Price</strong>.
        </div>

        <div className="pu-footer -mx-5 -mb-5 px-5 py-4 flex justify-between items-center border-t border-[#D1D5DB]/30">
          <span className="text-[10px] text-gray-400 font-mono">Баланс: лимиты промо бесплатно</span>
          <button onClick={onClose} className="px-4 py-2 bg-[#2F7D69] text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95">
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}

interface PromoOptionProps {
  active: boolean;
  activeClass: string;
  icon: string;
  iconClass: string;
  title: string;
  titleClass: string;
  description: string;
  buttonClass: string;
  onClick: () => void;
}

function PromoOption({
  active,
  activeClass,
  icon,
  iconClass,
  title,
  titleClass,
  description,
  buttonClass,
  onClick
}: PromoOptionProps) {
  return (
    <div className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
      active ? activeClass : 'border-gray-150 hover:bg-gray-50/50'
    }`}>
      <div className="flex items-start gap-2.5">
        <span className={`p-2 ml-0.5 rounded-xl font-bold shrink-0 ${iconClass}`}>{icon}</span>
        <div>
          <span className={`text-xs font-black block leading-tight ${titleClass}`}>{title}</span>
          <span className="text-[10.5px] text-gray-500 font-medium leading-relaxed block mt-1">{description}</span>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition shrink-0 cursor-pointer ${
          active ? `${buttonClass} text-white shadow-xs` : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        {active ? 'Активен' : 'Подключить'}
      </button>
    </div>
  );
}
