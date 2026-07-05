import React, { useEffect, useRef, useState } from 'react';

type FeatureSectionProps = Record<string, any>;

const FeatureYearBuilt: React.FC<FeatureSectionProps> = (props) => {
  const { yearBuilt, recentYears, setYearBuilt } = props;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectValue = yearBuilt === 'other' || (!recentYears.map(String).includes(yearBuilt) && yearBuilt !== '') ? 'other' : yearBuilt;
  const yearOptions = [
    { value: '', label: 'Выберите год' },
    ...recentYears.map((year: number) => ({ value: String(year), label: String(year) })),
    { value: 'other', label: 'Другой' }
  ];
  const selectedLabel = yearOptions.find(option => option.value === selectValue)?.label || 'Выберите год';

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  return (
    <div className="pl p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs relative z-[2000]">
      <div className="flex items-center gap-2">
        <span className="text-xl">📅</span>
        <span className="text-xs font-semibold font-sans text-[#1E293B] block font-bold">Год постройки / реновации *</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div ref={dropdownRef} className="relative min-w-[150px]">
          <button
            type="button"
            onClick={() => setIsOpen(open => !open)}
            className="w-full bg-[#F4F7F6] px-4 py-2.5 rounded-2xl text-xs font-bold text-[#1E293B] border-[0.5px] border-[#94A3B8]/40 focus:border-[#94A3B8]/40 focus:ring-0 focus:outline-none transition-colors cursor-pointer flex items-center justify-between gap-3"
          >
            <span>{selectedLabel}</span>
            <span className={`text-[10px] text-[#64748B] transition-transform ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full z-[9999] mt-2 w-full overflow-hidden rounded-2xl bg-[#F4F7F6] shadow-xl border border-[#94A3B8]/20 animate-scale-up">
              {yearOptions.map(option => {
                const isActive = option.value === selectValue;

                return (
                  <button
                    key={option.value || 'empty'}
                    type="button"
                    onClick={() => {
                      setYearBuilt(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#FF7A50]/10 text-[#FF7A50] font-bold'
                        : 'text-[#1E293B] hover:bg-white/70 font-semibold'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureYearBuilt;
