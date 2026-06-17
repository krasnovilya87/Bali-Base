import React from 'react';
import { formatPriceWithSpaces } from '../constants';
import PricingGraph from './PricingGraph';

type StepPricingProps = {
  pricePerDay: number;
  setPricePerDay: React.Dispatch<React.SetStateAction<number>>;
  pricePerMonth: number;
  setPricePerMonth: React.Dispatch<React.SetStateAction<number>>;
  competitorPlatform: string;
  setCompetitorPlatform: React.Dispatch<React.SetStateAction<string>>;
  competitorPrice: number;
  setCompetitorPrice: React.Dispatch<React.SetStateAction<number>>;
  competitorUrl: string;
  setCompetitorUrl: React.Dispatch<React.SetStateAction<string>>;
  airbnbWeeklyDiscount: number;
  setAirbnbWeeklyDiscount: React.Dispatch<React.SetStateAction<number>>;
  airbnbMonthlyDiscount: number;
  setAirbnbMonthlyDiscount: React.Dispatch<React.SetStateAction<number>>;
  selectedDiscountPercent: number;
  setSelectedDiscountPercent: React.Dispatch<React.SetStateAction<number>>;
  interactiveDays: number;
  setInteractiveDays: React.Dispatch<React.SetStateAction<number>>;
};

const StepPricing: React.FC<StepPricingProps> = ({
  pricePerDay,
  setPricePerDay,
  pricePerMonth,
  setPricePerMonth,
  competitorPlatform,
  setCompetitorPlatform,
  competitorPrice,
  setCompetitorPrice,
  competitorUrl,
  setCompetitorUrl,
  airbnbWeeklyDiscount,
  setAirbnbWeeklyDiscount,
  airbnbMonthlyDiscount,
  setAirbnbMonthlyDiscount,
  selectedDiscountPercent,
  setSelectedDiscountPercent,
  interactiveDays,
  setInteractiveDays
}) => (
  <div className="space-y-4 animate-fade-in">
    <div className="grid grid-cols-2 gap-4 pt-2">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold font-sans text-[#1E293B] tracking-wider block mb-1">
          Ваша цена за сутки (IDR)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={formatPriceWithSpaces(pricePerDay)}
          onChange={event => {
            const digits = event.target.value.replace(/\D/g, '');
            setPricePerDay(digits ? parseInt(digits, 10) : 0);
          }}
          className="w-full bg-white border-0 p-2.5 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-0"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold font-sans text-[#1E293B] tracking-wider block mb-1">
          Ваша цена за месяц (IDR)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={formatPriceWithSpaces(pricePerMonth)}
          onChange={event => {
            const digits = event.target.value.replace(/\D/g, '');
            setPricePerMonth(digits ? parseInt(digits, 10) : 0);
          }}
          className="w-full bg-white border-0 p-2.5 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:ring-0"
        />
      </div>
    </div>

    <div className="pl p-5 rounded-3xl space-y-4">
      <div className="flex flex-col sm:flex-row gap-5 items-stretch">
        <div className="flex-1 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1E293B] block tracking-wider font-sans">
              На каком ресурсе размещено сейчас ваше объявление?
            </label>
            <select
              value={competitorPlatform}
              onChange={event => setCompetitorPlatform(event.target.value)}
              className="w-full bg-[#F4F7F6] p-3 rounded-xl text-xs font-semibold border border-[#94A3B8]/20 focus:border-[#FF7A50] focus:outline-none transition-colors"
            >
              <option value="Only Facebook">Only Facebook</option>
              <option value="Booking">Booking.com</option>
              <option value="Airbnb">Airbnb</option>
              <option value="Agoda">Agoda</option>
              <option value="Traveloka">Traveloka</option>
              <option value="Trip.com">Trip.com</option>
            </select>
          </div>
        </div>

        {competitorPlatform !== 'Only Facebook' && (
          <div className="flex-1 space-y-3 p-4 bg-[#F4F7F6]/40 rounded-2xl border-0">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#1E293B] block tracking-wider">
                Введите сумму на {competitorPlatform === 'Booking' ? 'Booking.com' : competitorPlatform} (IDR/сутки)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatPriceWithSpaces(competitorPrice)}
                onChange={event => {
                  const digits = event.target.value.replace(/\D/g, '');
                  setCompetitorPrice(digits ? parseInt(digits, 10) : 0);
                }}
                className="w-full bg-white p-2.5 rounded-xl text-xs font-mono font-bold border border-transparent focus:border-[#E5E7EB] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-[#1E293B] block tracking-wider">
                Ссылка на объявление
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={competitorUrl}
                onChange={event => setCompetitorUrl(event.target.value)}
                className="w-full bg-white px-2.5 py-2.5 rounded-xl text-xs font-sans border border-transparent focus:border-[#E5E7EB] focus:outline-none transition-colors"
              />
            </div>

            {competitorPlatform === 'Airbnb' && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5E7EB]/40 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#5F6978] block">
                    Скидка за неделю
                  </label>
                  <select
                    value={airbnbWeeklyDiscount}
                    onChange={event => setAirbnbWeeklyDiscount(Number(event.target.value))}
                    className="w-full bg-white p-2 rounded-xl text-[10px] font-semibold focus:outline-none border border-transparent focus:border-[#E5E7EB]"
                  >
                    <option value={0}>0%</option>
                    <option value={10}>10%</option>
                    <option value={15}>15%</option>
                    <option value={20}>20%</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#5F6978] block">
                    Скидка за месяц
                  </label>
                  <select
                    value={airbnbMonthlyDiscount}
                    onChange={event => setAirbnbMonthlyDiscount(Number(event.target.value))}
                    className="w-full bg-white p-2 rounded-xl text-[10px] font-semibold focus:outline-none border border-transparent focus:border-[#E5E7EB]"
                  >
                    <option value={0}>0%</option>
                    <option value={10}>10%</option>
                    <option value={15}>15%</option>
                    <option value={20}>20%</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    <PricingGraph
      pricePerDay={pricePerDay}
      pricePerMonth={pricePerMonth}
      selectedDiscountPercent={selectedDiscountPercent}
      interactiveDays={interactiveDays}
      setInteractiveDays={setInteractiveDays}
    />
  </div>
);

export default StepPricing;
