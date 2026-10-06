import React, { useEffect, useRef, useState } from 'react';

type DualRangeSliderProps = {
  min: number;
  max: number;
  step: number;
  minValue: number;
  maxValue: number;
  onChange: (minValue: number, maxValue: number) => void;
  minAriaLabel: string;
  maxAriaLabel: string;
};

type ActiveHandle = 'min' | 'max' | null;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const snap = (value: number, min: number, max: number, step: number) => {
  const snapped = min + Math.round((value - min) / step) * step;
  return clamp(snapped, min, max);
};

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  min,
  max,
  step,
  minValue,
  maxValue,
  onChange,
  minAriaLabel,
  maxAriaLabel
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = useState<ActiveHandle>(null);

  const valueFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return min;
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return snap(min + ratio * (max - min), min, max, step);
  };

  const updateHandle = (handle: Exclude<ActiveHandle, null>, value: number) => {
    if (handle === 'min') {
      onChange(Math.min(value, maxValue), maxValue);
      return;
    }
    onChange(minValue, Math.max(value, minValue));
  };

  const startHandle = (handle: Exclude<ActiveHandle, null>, clientX: number) => {
    setActiveHandle(handle);
    updateHandle(handle, valueFromClientX(clientX));
  };

  useEffect(() => {
    if (!activeHandle) return;

    const handlePointerMove = (event: PointerEvent) => {
      updateHandle(activeHandle, valueFromClientX(event.clientX));
    };
    const handlePointerUp = () => setActiveHandle(null);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activeHandle, maxValue, minValue]);

  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;

  const handleKeyDown = (handle: Exclude<ActiveHandle, null>, event: React.KeyboardEvent<HTMLDivElement>) => {
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp'
      ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
        ? -1
        : 0;
    if (!direction) return;
    event.preventDefault();
    updateHandle(handle, (handle === 'min' ? minValue : maxValue) + direction * step);
  };

  return (
    <div
      ref={trackRef}
      className="relative flex h-8 touch-none items-center cursor-pointer"
      onPointerDown={event => {
        const value = valueFromClientX(event.clientX);
        const handle = Math.abs(value - minValue) <= Math.abs(value - maxValue) ? 'min' : 'max';
        startHandle(handle, event.clientX);
      }}
    >
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-[#E5E7EB]" />
      <div
        className="absolute h-1.5 rounded-full bg-[#FF7A50]"
        style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
      />
      {([
        { handle: 'min' as const, value: minValue, percent: minPercent, ariaLabel: minAriaLabel },
        { handle: 'max' as const, value: maxValue, percent: maxPercent, ariaLabel: maxAriaLabel }
      ]).map(item => (
        <div
          key={item.handle}
          role="slider"
          tabIndex={0}
          aria-label={item.ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={item.value}
          onKeyDown={event => handleKeyDown(item.handle, event)}
          onPointerDown={event => {
            event.stopPropagation();
            startHandle(item.handle, event.clientX);
          }}
          className={`absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF7A50] shadow-[0_2px_6px_rgba(255,122,80,0.4)] transition-transform focus:outline-none focus:ring-4 focus:ring-[#FF7A50]/20 ${activeHandle === item.handle ? 'scale-110' : 'hover:scale-110'}`}
          style={{ left: `${item.percent}%` }}
        />
      ))}
    </div>
  );
};

export default DualRangeSlider;
