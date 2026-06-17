import React from 'react';

type FeatureSectionProps = Record<string, any>;

const FeatureYearBuilt: React.FC<FeatureSectionProps> = (props) => {
  const { yearBuilt, recentYears, setYearBuilt } = props;

  return (
    <div className="pl p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="text-xl">📅</span>
        <span className="text-xs font-semibold font-sans text-[#1E293B] block font-bold">Год постройки / реновации *</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <select
          value={yearBuilt === 'other' || (!recentYears.map(String).includes(yearBuilt) && yearBuilt !== '') ? 'other' : yearBuilt}
          onChange={event => {
            const val = event.target.value;
            setYearBuilt(val);
          }}
          className="bg-[#F4F7F6] px-4 py-2.5 rounded-2xl text-xs font-bold text-[#1E293B] border-[0.5px] border-[#94A3B8]/40 focus:border-[#FF7A50] focus:ring-0 focus:outline-none transition-colors cursor-pointer"
        >
          <option value="">Выберите год</option>
          {recentYears.map((year: number) => (
            <option key={year} value={String(year)}>{year}</option>
          ))}
          <option value="other">Другой</option>
        </select>
      </div>
    </div>
  );
};

export default FeatureYearBuilt;
