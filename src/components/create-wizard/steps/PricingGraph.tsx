import React, { useRef } from 'react';
import { calculateGraphDailyPrice, calculateGraphTotalPrice } from '../../../utils/pricing';
import { useI18n } from '../../../i18nContext';

type PricingGraphProps = {
  pricePerDay: number;
  pricePerMonth: number;
  selectedDiscountPercent: number;
  interactiveDays: number;
  setInteractiveDays: React.Dispatch<React.SetStateAction<number>>;
};

const formatValue = (value: number) => value.toLocaleString('ru-RU');

const PricingGraph: React.FC<PricingGraphProps> = ({
  pricePerDay,
  pricePerMonth,
  selectedDiscountPercent,
  interactiveDays,
  setInteractiveDays
}) => {
  const { tr } = useI18n();
  const priceChartSvgRef = useRef<SVGSVGElement | null>(null);

  const getPriceForDayNum = (day: number, percent = 0) => {
    const basePriceDay = pricePerDay * (1 - percent / 100);
    const basePriceMonth = pricePerMonth
      ? pricePerMonth * (1 - percent / 100)
      : pricePerDay * 0.55 * 30 * (1 - percent / 100);

    return calculateGraphDailyPrice({
      days: day,
      pricePerDay: basePriceDay,
      pricePerMonth: basePriceMonth
    });
  };

  const totalRepresentedDays = 34;
  const basePoints = Array.from({ length: totalRepresentedDays }, (_, index) => ({
    day: index + 1,
    price: getPriceForDayNum(index + 1, 0)
  }));
  const discountedPoints = Array.from({ length: totalRepresentedDays }, (_, index) => ({
    day: index + 1,
    price: getPriceForDayNum(index + 1, selectedDiscountPercent)
  }));

  const maxPrice = Math.max(...basePoints.map(point => point.price), 1);
  const minPrice = Math.min(...discountedPoints.map(point => point.price), 1);
  const priceDiff = maxPrice - minPrice || 1;

  const svgWidth = 460;
  const svgHeight = 160;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 25;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;
  const zeroY = paddingTop + plotHeight;

  const getXCoords = (day: number) =>
    paddingLeft + ((day - 1) / (totalRepresentedDays - 1)) * plotWidth;

  const getYCoords = (price: number) => {
    const margin = priceDiff * 0.1;
    const yMin = Math.max(10000, minPrice - margin);
    const yMax = maxPrice + margin;
    return paddingTop + plotHeight - ((price - yMin) / (yMax - yMin)) * plotHeight;
  };

  const getPathString = (pointsList: { day: number; price: number }[], start: number, end: number) => {
    let pathStr = '';
    pointsList
      .filter(point => point.day >= start && point.day <= end)
      .forEach((point, index) => {
        const x = getXCoords(point.day);
        const y = getYCoords(point.price);
        pathStr += `${index === 0 ? 'M' : ' L'} ${x} ${y}`;
      });
    return pathStr;
  };

  const pathSlate = getPathString(discountedPoints, 1, 7);
  const pathOrange = getPathString(discountedPoints, 7, 30);
  const pathGreen = getPathString(discountedPoints, 30, totalRepresentedDays);
  const fillSlateString = `${pathSlate} L ${getXCoords(7)} ${zeroY} L ${getXCoords(1)} ${zeroY} Z`;
  const fillOrangeString = `${pathOrange} L ${getXCoords(30)} ${zeroY} L ${getXCoords(7)} ${zeroY} Z`;
  const fillGreenString = `${pathGreen} L ${getXCoords(totalRepresentedDays)} ${zeroY} L ${getXCoords(30)} ${zeroY} Z`;

  const activeBasePriceDay = pricePerDay * (1 - selectedDiscountPercent / 100);
  const activeBasePriceMonth = pricePerMonth
    ? pricePerMonth * (1 - selectedDiscountPercent / 100)
    : pricePerDay * 0.55 * 30 * (1 - selectedDiscountPercent / 100);
  const activeDailyPrice = getPriceForDayNum(interactiveDays, selectedDiscountPercent);
  const activeTotalPrice = calculateGraphTotalPrice({
    days: interactiveDays,
    pricePerDay: activeBasePriceDay,
    pricePerMonth: activeBasePriceMonth
  });
  const activeBaseTotalPrice = activeBasePriceDay * interactiveDays;
  const graphDiscountPercent = activeBaseTotalPrice > activeTotalPrice
    ? Math.round((1 - activeTotalPrice / activeBaseTotalPrice) * 100)
    : 0;
  const tooltipDaysLabel = interactiveDays === 1
    ? tr('wizard.pricingGraph.dayOne', { count: interactiveDays })
    : tr('wizard.pricingGraph.days', { count: interactiveDays });

  const priceTickStep = 100000;
  const startTick = Math.ceil(minPrice / priceTickStep) * priceTickStep;
  const endTick = Math.floor(maxPrice / priceTickStep) * priceTickStep;
  const yTicks: number[] = [];
  for (let tick = startTick; tick <= endTick; tick += priceTickStep) {
    if (tick >= minPrice - priceTickStep * 0.1 && tick <= maxPrice + priceTickStep * 0.1) {
      yTicks.push(tick);
    }
  }
  if (yTicks.length === 0) yTicks.push(minPrice, maxPrice);

  const handleSvgInteraction = (clientX: number) => {
    if (!priceChartSvgRef.current) return;
    const rect = priceChartSvgRef.current.getBoundingClientRect();
    const plotStartX = (paddingLeft / svgWidth) * rect.width;
    const plotEndX = ((svgWidth - paddingRight) / svgWidth) * rect.width;
    const relativeX = clientX - (rect.left + plotStartX);
    const relativeWidth = plotEndX - plotStartX;
    const pct = Math.max(0, Math.min(1, relativeX / relativeWidth));
    const calculatedDay = Math.round(1 + pct * (totalRepresentedDays - 1));

    setInteractiveDays(Math.max(1, Math.min(31, calculatedDay)));
  };

  const activeColor = interactiveDays < 8 ? '#94A3B8' : interactiveDays >= 30 ? '#2F7D69' : '#FF7A50';

  return (
    <div className="bg-white p-5 rounded-3xl w-full font-sans select-none text-left relative space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-1 border-b border-gray-100/60 pb-3">
        <div>
          <h4 className="text-xs font-bold font-sans text-[#1E293B] tracking-wider">
            {tr('wizard.pricingGraph.title')}
          </h4>
        </div>
        {selectedDiscountPercent > 0 && (
          <span className="text-[9px] font-black bg-[#FF7A50]/10 text-[#FF7A50] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-1 sm:mt-0">
            {tr('wizard.pricingGraph.discount', { count: selectedDiscountPercent })}
          </span>
        )}
      </div>

      <div className="relative pt-2">
        <div
          className="absolute bg-white px-2.5 py-2 rounded-2xl shadow-xl border border-[#E5E7EB] text-left pointer-events-none z-20 flex flex-col space-y-1 w-[170px]"
          style={{
            left: `${(getXCoords(interactiveDays) / svgWidth) * 100}%`,
            top: `${(getYCoords(activeDailyPrice) / svgHeight) * 100}%`,
            transform: 'translate(-50%, -100%) translateY(-10px)',
            transition: 'left 400ms cubic-bezier(0.25, 0.8, 0.25, 1.15), top 400ms cubic-bezier(0.25, 0.8, 0.25, 1.15)'
          }}
        >
          <div className="text-[10px] font-bold text-[#1E293B] flex items-center justify-between gap-1">
            <span>{tooltipDaysLabel}</span>
          </div>

          <div className="flex items-center justify-between text-[9px] font-normal text-[#1E293B]/70">
            <span>{tr('wizard.pricingGraph.pricePerDay')}</span>
            <span className="font-mono text-[9px] font-bold text-[#1E293B]">
              {formatValue(activeDailyPrice)}
            </span>
          </div>

          {graphDiscountPercent > 0 && (
            <div className="flex items-center justify-between text-[9px] font-normal text-[#1E293B]/70">
              <span>{tr('wizard.pricingGraph.tooltipDiscount')}</span>
              <span className="font-mono text-[9px] font-bold text-[#2F7D69]">-{graphDiscountPercent}%</span>
            </div>
          )}

          <div className="border-t border-gray-100 my-0.5" />

          <div className="flex items-center justify-between text-[10px] font-bold text-[#1E293B]">
            <span className="text-[#FF7A50]">{tr('wizard.pricingGraph.total')}</span>
            <span className="font-mono text-[#FF7A50]">
              {formatValue(activeTotalPrice)}
            </span>
          </div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[4px] w-2 h-2 bg-white border-r border-b border-[#E5E7EB] rotate-45" />
        </div>

        <svg
          ref={priceChartSvgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none cursor-pointer"
          onMouseMove={event => handleSvgInteraction(event.clientX)}
          onTouchMove={event => {
            if (event.touches?.[0]) handleSvgInteraction(event.touches[0].clientX);
          }}
        >
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={zeroY} stroke="#E2E8F0" strokeWidth="1" opacity="0.6" />
          <line x1={paddingLeft} y1={zeroY} x2={svgWidth - paddingRight} y2={zeroY} stroke="#E2E8F0" strokeWidth="1" opacity="0.6" />

          <line x1={getXCoords(7)} y1={paddingTop} x2={getXCoords(7)} y2={zeroY} stroke="#CBD5E1" strokeDasharray="3,3" strokeWidth="0.6" />
          <line x1={getXCoords(30)} y1={paddingTop} x2={getXCoords(30)} y2={zeroY} stroke="#2F7D69" strokeDasharray="3,3" strokeWidth="0.6" opacity="0.5" />

          {yTicks.map((value, index) => {
            const y = getYCoords(value);
            return (
              <g key={`grid-${index}`}>
                <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="#E2E8F0" strokeDasharray="3,3" strokeWidth="0.5" opacity="0.4" />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="fill-[#1E293B]/60 font-sans text-[8px] font-normal">
                  {Math.round(value / 1000).toLocaleString('ru-RU')}k
                </text>
              </g>
            );
          })}

          <path d={fillSlateString} fill="url(#slate-area)" />
          <path d={fillOrangeString} fill="url(#orange-area)" />
          <path d={fillGreenString} fill="url(#green-area)" />

          {selectedDiscountPercent > 0 && (
            <>
              <path d={getPathString(basePoints, 1, 7)} fill="none" stroke="#CBD5E1" strokeWidth="0.75" strokeDasharray="2,2" />
              <path d={getPathString(basePoints, 7, 30)} fill="none" stroke="#CBD5E1" strokeWidth="0.75" strokeDasharray="2,2" />
              <path d={getPathString(basePoints, 30, totalRepresentedDays)} fill="none" stroke="#CBD5E1" strokeWidth="0.75" strokeDasharray="2,2" />
            </>
          )}

          <path d={pathSlate} fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
          <path d={pathOrange} fill="none" stroke="#FF7A50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="miter" />
          <path d={pathGreen} fill="none" stroke="#2F7D69" strokeWidth="1.5" strokeLinecap="round" />

          <text x={getXCoords(4)} y={getYCoords(getPriceForDayNum(4, selectedDiscountPercent)) - 14} textAnchor="middle" className="fill-[#1E293B]/70 font-sans text-[8.5px] font-medium">
            {tr('wizard.pricingGraph.dailyRate')}
          </text>
          <text x={getXCoords(19)} y={getYCoords(getPriceForDayNum(19, selectedDiscountPercent)) - 14} textAnchor="middle" className="fill-[#1E293B]/70 font-sans text-[8.5px] font-medium">
            {tr('wizard.pricingGraph.weeklyRate')}
          </text>
          <text x={getXCoords(32)} y={getYCoords(getPriceForDayNum(32, selectedDiscountPercent)) - 14} textAnchor="middle" className="fill-[#1E293B]/70 font-sans text-[8.5px] font-medium">
            {tr('wizard.pricingGraph.monthlyRate')}
          </text>

          <line x1={getXCoords(interactiveDays)} y1={zeroY} x2={getXCoords(interactiveDays)} y2={getYCoords(activeDailyPrice)} stroke={activeColor} strokeWidth="0.5" />
          <circle cx={getXCoords(interactiveDays)} cy={getYCoords(activeDailyPrice)} r="3" fill="#FFFFFF" stroke={activeColor} strokeWidth="1.5" />

          {[1, 5, 10, 15, 20, 25, 30].map(day => (
            <text
              key={`tick-${day}`}
              x={getXCoords(day)}
              y={zeroY + 14}
              textAnchor="middle"
              className="fill-[#1E293B]/60 font-sans text-[8px] font-normal tracking-wide"
            >
              {day === 30 ? '30+' : tr('wizard.pricingGraph.dayTick', { count: day })}
            </text>
          ))}

          <defs>
            <linearGradient id="slate-area" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="orange-area" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF7A50" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="green-area" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2F7D69" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default PricingGraph;
