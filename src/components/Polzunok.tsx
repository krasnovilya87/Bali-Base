import React, { useState, useEffect, useRef } from 'react';
import { snapRangeValue } from '../utils/range';

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

  // Keep local state in sync when external value changes
  useEffect(() => {
    if (!isDragging.current) {
      setDragValue(value);
      latestDragValue.current = value;
    }
  }, [value]);

  const handleStart = () => {
    isDragging.current = true;
    dragStartValue.current = value;
    latestDragValue.current = value;
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const finalValue = snapRangeValue(
      latestDragValue.current,
      dragStartValue.current,
      min,
      max,
      step
    );

    setDragValue(finalValue);
    latestDragValue.current = finalValue;
    onChange(finalValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setDragValue(val);
    latestDragValue.current = val;
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
      onChange={handleChange}
      className={`polzunok ${className || ''}`}
      style={{ ...backgroundStyle, ...style }}
    />
  );
}
