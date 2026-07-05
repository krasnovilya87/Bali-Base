import React, { useState, useEffect, useRef } from 'react';
import { snapRangeValue, snapRangeValueToNearest } from '../utils/range';

interface PolzunokProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function Polzunok({
  min,
  max,
  step,
  value,
  onChange,
  className,
  style
}: PolzunokProps) {
  const [dragValue, setDragValue] = useState<number>(value);
  const isDragging = useRef<boolean>(false);
  const dragStartValue = useRef<number>(value);
  const latestDragValue = useRef<number>(value);
  const pointerStartX = useRef<number>(0);
  const hasPointerMoved = useRef<boolean>(false);

  // Keep local state in sync when external value changes
  useEffect(() => {
    if (!isDragging.current) {
      setDragValue(value);
      latestDragValue.current = value;
    }
  }, [value]);

  const handleStart = (event: React.PointerEvent<HTMLInputElement>) => {
    isDragging.current = true;
    pointerStartX.current = event.clientX;
    hasPointerMoved.current = false;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
    const pointerValue = min + Math.max(0, Math.min(1, ratio)) * (max - min);
    const snappedValue = snapRangeValueToNearest(pointerValue, min, max, step);

    dragStartValue.current = snappedValue;
    latestDragValue.current = snappedValue;
    setDragValue(snappedValue);
    onChange(snappedValue);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLInputElement>) => {
    if (!isDragging.current) return;
    if (Math.abs(event.clientX - pointerStartX.current) > 3) {
      hasPointerMoved.current = true;
    }
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const finalValue = hasPointerMoved.current
      ? snapRangeValue(latestDragValue.current, dragStartValue.current, min, max, step)
      : snapRangeValueToNearest(latestDragValue.current, min, max, step);

    setDragValue(finalValue);
    latestDragValue.current = finalValue;
    onChange(finalValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const nextValue = hasPointerMoved.current
      ? val
      : snapRangeValueToNearest(val, min, max, step);
    setDragValue(nextValue);
    latestDragValue.current = nextValue;
    if (!hasPointerMoved.current) {
      onChange(nextValue);
    }
  };

  useEffect(() => {
    const handlePointerEnd = () => handleEnd();

    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    return () => {
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  });

  const pct = ((dragValue - min) / (max - min)) * 100;
  const backgroundStyle = {
    background: `linear-gradient(to right, #FF7A50 0%, #FF7A50 ${pct}%, #E5E7EB ${pct}%, #E5E7EB 100%)`
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step="any"
      value={dragValue}
      onPointerDown={handleStart}
      onPointerMove={handlePointerMove}
      onChange={handleChange}
      className={`polzunok ${className || ''}`}
      style={{ ...backgroundStyle, ...style }}
    />
  );
}
