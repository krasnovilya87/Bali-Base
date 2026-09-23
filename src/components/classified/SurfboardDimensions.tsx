import React, { useEffect } from 'react';
import { useI18n } from '../../i18nContext';
import { FilterState } from '../../types';
import type { ClassifiedSpecialOption, ClassifiedSpecialValue } from '../../config/classifiedSpecial';
import {
  calculateSurfboardThicknessRange,
  calculateSurfboardVolumeRange,
  calculateSurfboardWeightRange,
  clampSurfboardValue,
  formatSurfboardLength,
  getDefaultSurfboardFinConfiguration,
  getSurfboardPreset,
  getSurfboardWeightLimits,
  surfboardLengthCmToInches,
  surfboardLengthInchesToCm
} from '../../utils/surfboardDimensions';

type Measurements = { length: number; width: number; thickness: number; volume: number; weight: number };
type FinPlacement = { x: number; y: number; scale: number; rotation: number };

const finOutlinePath = 'M452 328C432 286 408 242 381 203C345 151 301 109 252 81C206 54 151 39 90 38C61 37 37 42 25 56C15 68 18 82 27 92C35 101 47 108 61 118C96 143 126 174 145 207C164 240 169 275 165 307L161 330L452 328Z';
const fcsOneRearMountPath = 'M445 326L312 328L317 357C318 363 321 366 327 366L381 365C387 365 390 362 391 357L395 340L445 339Z';
const fcsOneFrontMountPath = 'M295 328L212 329L217 359C218 365 221 367 227 367L282 366C288 366 291 363 291 357Z';
const fcsTwoRearMountPath = 'M452 326L312 328L317 357C318 363 321 366 327 366L439 365C447 365 451 362 452 357Z';

const getFinLayout = (configuration: string): FinPlacement[] => {
  const center: FinPlacement = { x: 78, y: 60, scale: 1.05, rotation: 0 };
  const sidePair: FinPlacement[] = [
    { x: 132, y: 42, scale: 0.78, rotation: 0 },
    { x: 132, y: 78, scale: 0.78, rotation: 0 }
  ];
  const forwardPair: FinPlacement[] = [
    { x: 176, y: 45, scale: 0.68, rotation: 0 },
    { x: 176, y: 75, scale: 0.68, rotation: 0 }
  ];
  if (configuration === 'single') return [{ ...center, scale: 1.3 }];
  if (configuration === 'twin') return sidePair.map(fin => ({ ...fin, scale: 0.94 }));
  if (configuration === 'thruster') return [center, ...sidePair];
  if (configuration === 'quad') return [...sidePair, ...forwardPair];
  if (configuration === 'two_plus_one') return [{ ...center, scale: 1.22 }, ...forwardPair];
  if (configuration === 'five_fin') return [center, ...sidePair, ...forwardPair];
  return [];
};

const getBoardPath = (boardType: string) => {
  if (boardType === 'gun') {
    return 'M 24 60 C 95 34, 300 20, 500 60 C 300 100, 95 86, 24 60 Z';
  }
  if (boardType === 'longboard') {
    return 'M 26 60 C 30 28, 104 9, 290 10 C 424 11, 494 32, 500 60 C 494 88, 424 109, 290 110 C 104 111, 30 92, 26 60 Z';
  }
  if (boardType === 'mini_mal') {
    return 'M 22 60 C 48 24, 134 10, 302 14 C 424 17, 486 36, 492 60 C 486 84, 424 103, 302 106 C 134 110, 48 96, 22 60 Z';
  }
  if (boardType === 'egg') {
    return 'M 24 60 C 54 18, 174 8, 318 13 C 434 17, 492 36, 498 60 C 492 84, 434 103, 318 107 C 174 112, 54 102, 24 60 Z';
  }
  if (boardType === 'funboard') {
    return 'M 20 60 C 56 24, 162 12, 322 17 C 432 20, 486 38, 498 60 C 486 82, 432 100, 322 103 C 162 108, 56 96, 20 60 Z';
  }
  if (boardType === 'mid_length') {
    return 'M 24 60 C 42 25, 132 11, 308 13 C 430 15, 490 34, 497 60 C 490 86, 430 105, 308 107 C 132 109, 42 95, 24 60 Z';
  }
  if (boardType === 'hybrid') {
    return 'M 18 60 C 70 24, 214 12, 338 20 C 420 25, 474 42, 500 60 C 474 78, 420 95, 338 100 C 214 108, 70 96, 18 60 Z';
  }
  if (boardType === 'fish') {
    return 'M 34 60 L 7 42 C 104 20, 250 16, 365 25 C 438 31, 482 46, 498 60 C 482 74, 438 89, 365 95 C 250 104, 104 100, 7 78 L 34 60 Z';
  }
  if (boardType === 'sup') {
    return 'M 24 60 C 34 20, 116 5, 304 8 C 430 10, 492 31, 500 60 C 492 89, 430 110, 304 112 C 116 115, 34 100, 24 60 Z';
  }
  if (boardType === 'other') {
    return 'M 22 60 C 64 21, 176 10, 326 16 C 432 20, 484 39, 496 60 C 484 81, 432 100, 326 104 C 176 110, 64 99, 22 60 Z';
  }
  return 'M 18 60 C 82 29, 238 17, 354 24 C 432 29, 478 44, 500 60 C 478 76, 432 91, 354 96 C 238 103, 82 91, 18 60 Z';
};

const SurfboardPreview: React.FC<{
  boardType: string;
  finConfiguration?: string;
  values: Measurements;
  secondary?: Measurements;
}> = ({ boardType, finConfiguration, values, secondary }) => {
  const { tr } = useI18n();
  const preset = getSurfboardPreset(boardType);
  const fins = getFinLayout(finConfiguration || getDefaultSurfboardFinConfiguration(boardType));
  const lengthScale = 0.72 + (values.length - preset.length[0]) / Math.max(1, preset.length[2] - preset.length[0]) * 0.28;
  const widthScale = 0.66 + (values.width - preset.width[0]) / Math.max(1, preset.width[2] - preset.width[0]) * 0.34;
  const volumeRatio = Math.max(0, Math.min(1, (values.volume - preset.volume[0]) / Math.max(1, preset.volume[2] - preset.volume[0])));
  const thicknessOffset = 7
    + (values.thickness - preset.thickness[0]) / Math.max(0.1, preset.thickness[2] - preset.thickness[0]) * 11
    + volumeRatio * 3;
  const deckBulgeWidth = 112 + volumeRatio * 52;
  const deckBulgeHeight = 13 + volumeRatio * 10;
  const path = getBoardPath(boardType);
  const transform = `translate(${20 + (1 - lengthScale) * 240} ${38 + (1 - widthScale) * 60}) scale(${lengthScale} ${widthScale}) rotate(-7 250 60)`;
  const secondaryLengthScale = secondary
    ? 0.72 + (secondary.length - preset.length[0]) / Math.max(1, preset.length[2] - preset.length[0]) * 0.28
    : 1;
  const secondaryWidthScale = secondary
    ? 0.66 + (secondary.width - preset.width[0]) / Math.max(1, preset.width[2] - preset.width[0]) * 0.34
    : 1;

  return (
    <svg viewBox="0 0 540 210" className="h-auto w-full" role="img" aria-label={tr('filters.classified.special.boardPreview')}>
      <defs>
        <linearGradient id="surfboard-top" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFDF8" />
          <stop offset="0.52" stopColor="#F8D9C9" />
          <stop offset="1" stopColor="#F3A47E" />
        </linearGradient>
        <linearGradient id="surfboard-edge" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#D86B49" />
          <stop offset="1" stopColor="#9A432C" />
        </linearGradient>
        <linearGradient id="surfboard-fin" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#315F59" />
          <stop offset="1" stopColor="#173E3A" />
        </linearGradient>
        <filter id="surfboard-shadow" x="-20%" y="-40%" width="150%" height="220%">
          <feDropShadow dx="8" dy="16" stdDeviation="12" floodColor="#17231F" floodOpacity="0.2" />
        </filter>
      </defs>

      {secondary && (
        <path
          d={path}
          transform={`translate(${18 + (1 - secondaryLengthScale) * 240} ${35 + (1 - secondaryWidthScale) * 60}) scale(${secondaryLengthScale} ${secondaryWidthScale}) rotate(-7 250 60)`}
          fill="none"
          stroke="#FF7A50"
          strokeWidth="4"
          strokeDasharray="9 8"
          opacity="0.32"
        />
      )}

      <g filter="url(#surfboard-shadow)">
        <path d={path} transform={`${transform} translate(0 ${thicknessOffset})`} fill="url(#surfboard-edge)" opacity="0.9" />
        <path d={path} transform={transform} fill="url(#surfboard-top)" stroke="#B85B3D" strokeWidth="2.5" />
        <ellipse cx="282" cy="57" rx={deckBulgeWidth} ry={deckBulgeHeight} transform={transform} fill="#FFFFFF" opacity={0.08 + volumeRatio * 0.14} />
        <path d="M 62 60 C 190 57, 350 57, 474 60" transform={transform} fill="none" stroke="#C96B4C" strokeWidth="1.5" opacity="0.72" />
        <ellipse cx="345" cy="60" rx="13" ry="7" transform={transform} fill="#FF7A50" opacity="0.82" />
        <g transform={transform}>
          {fins.map((fin, index) => (
            <g key={`${fin.x}-${fin.y}-${index}`} transform={`translate(${fin.x} ${fin.y}) rotate(${fin.rotation}) scale(${fin.scale})`}>
              <path
                d={finOutlinePath}
                transform="translate(0 3) scale(0.09 0.165) translate(-306.5 -330)"
                fill="url(#surfboard-fin)"
                stroke="#0F302D"
                strokeWidth="12"
              />
              <path d="M -20 3 H 20" fill="none" stroke="#0F302D" strokeWidth="2.2" />
            </g>
          ))}
        </g>
      </g>

      <line x1="48" y1="172" x2="490" y2="172" stroke="#64748B" strokeWidth="1.5" />
      <path d="M48 172 l10 -5 v10 z M490 172 l-10 -5 v10 z" fill="#64748B" />
      <text x="269" y="194" textAnchor="middle" fill="#475569" fontSize="15" fontWeight="800">{formatSurfboardLength(values.length)}</text>
      <line x1="503" y1="58" x2="503" y2="126" stroke="#64748B" strokeWidth="1.5" />
      <path d="M503 58 l-5 10 h10 z M503 126 l-5 -10 h10 z" fill="#64748B" />
      <text x="516" y="96" fill="#475569" fontSize="13" fontWeight="800">{values.width.toFixed(1)}″</text>
    </svg>
  );
};

const getTailFinLayout = (configuration: string): FinPlacement[] => {
  const center: FinPlacement = { x: 145, y: 115, scale: 1.28, rotation: 0 };
  const sidePair: FinPlacement[] = [
    { x: 218, y: 76, scale: 0.92, rotation: 0 },
    { x: 218, y: 154, scale: 0.92, rotation: 0 }
  ];
  const forwardPair: FinPlacement[] = [
    { x: 305, y: 84, scale: 0.8, rotation: 0 },
    { x: 305, y: 146, scale: 0.8, rotation: 0 }
  ];
  if (configuration === 'single') return [{ ...center, scale: 1.52 }];
  if (configuration === 'twin') return sidePair.map(fin => ({ ...fin, scale: 1.08 }));
  if (configuration === 'thruster') return [center, ...sidePair];
  if (configuration === 'quad') return [...sidePair, ...forwardPair];
  if (configuration === 'two_plus_one') return [{ ...center, scale: 1.45 }, ...forwardPair];
  if (configuration === 'five_fin') return [center, ...sidePair, ...forwardPair];
  return [];
};

const FinConfigurationDiagram: React.FC<{ configuration: string; label: string }> = ({ configuration, label }) => (
  <svg viewBox="0 0 520 230" className="h-auto w-full" role="img" aria-label={label}>
    <defs>
      <linearGradient id="fin-tail-board" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#FFFDF8" />
        <stop offset="0.58" stopColor="#F8D9C9" />
        <stop offset="1" stopColor="#F3A47E" />
      </linearGradient>
      <linearGradient id="fin-tail-blade" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#315F59" />
        <stop offset="1" stopColor="#132F2D" />
      </linearGradient>
      <filter id="fin-tail-shadow" x="-20%" y="-30%" width="150%" height="190%">
        <feDropShadow dx="6" dy="9" stdDeviation="8" floodColor="#173E3A" floodOpacity="0.2" />
      </filter>
    </defs>

    <g filter="url(#fin-tail-shadow)">
      <path d="M 50 115 C 96 47, 252 24, 500 32 L 500 198 C 252 206, 96 183, 50 115 Z" fill="#C96B4C" opacity="0.9" transform="translate(0 10)" />
      <path d="M 50 115 C 96 47, 252 24, 500 32 L 500 198 C 252 206, 96 183, 50 115 Z" fill="url(#fin-tail-board)" stroke="#B85B3D" strokeWidth="2.5" />
      <path d="M 82 115 C 178 105, 320 105, 480 115" fill="none" stroke="#C96B4C" strokeWidth="1.5" opacity="0.68" />
      {getTailFinLayout(configuration).map((fin, index) => (
        <g key={`${fin.x}-${fin.y}-${index}`} transform={`translate(${fin.x} ${fin.y}) rotate(${fin.rotation}) scale(${fin.scale})`}>
          <path
            d={finOutlinePath}
            transform="translate(0 3) scale(0.12 0.18) translate(-306.5 -330)"
            fill="url(#fin-tail-blade)"
            stroke="#0F302D"
            strokeWidth="10"
          />
          <path d="M -27 3 H 27" stroke="#0F302D" strokeWidth="2.4" />
        </g>
      ))}
    </g>
  </svg>
);

export const SurfboardFinConfigurationSelector: React.FC<{
  labelKey: string;
  options: ClassifiedSpecialOption[];
  value?: string;
  allowClear?: boolean;
  onChange: (value: string) => void;
}> = ({ labelKey, options, value = '', allowClear = false, onChange }) => {
  const { tr } = useI18n();
  const activeOption = options.find(option => option.value === value);
  return (
    <div className="space-y-3">
      <span className="ml-1 block text-xs font-semibold tracking-wider text-gray-400">{tr(labelKey)}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(active && allowClear ? '' : option.value)}
              aria-pressed={active}
              className={`pl pl-interactive transport-pill inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-xs font-extrabold transition ${active ? 'selected border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]' : 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]'}`}
            >
              {tr(option.labelKey)}
            </button>
          );
        })}
      </div>
      {activeOption && (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F4F7F6] px-3 py-2">
          <FinConfigurationDiagram configuration={activeOption.value} label={tr(activeOption.labelKey)} />
        </div>
      )}
    </div>
  );
};

const FinSystemDiagram: React.FC<{ system: string; label: string }> = ({ system, label }) => {
  const isFcsOne = system === 'fcs_1';
  const isFcsTwo = system === 'fcs_2';
  const isFutures = system === 'futures';
  const isUsBox = system === 'us_box';
  const isGlassOn = system === 'glass_on';

  return (
    <svg viewBox="0 0 520 250" className="h-auto w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id="fin-system-blade" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#315F59" />
          <stop offset="1" stopColor="#132F2D" />
        </linearGradient>
        <filter id="fin-system-shadow" x="-20%" y="-20%" width="150%" height="170%">
          <feDropShadow dx="4" dy="7" stdDeviation="6" floodColor="#173E3A" floodOpacity="0.2" />
        </filter>
      </defs>

      <g filter="url(#fin-system-shadow)">
        <g transform="translate(90 -8) scale(0.65 0.39)">
          <path d={finOutlinePath} fill="url(#fin-system-blade)" stroke="#0F302D" strokeWidth="5" />
          {isFcsOne && (
            <>
              <path d={fcsOneRearMountPath} fill="#173E3A" />
              <path d={fcsOneFrontMountPath} fill="#173E3A" />
            </>
          )}
          {isFcsTwo && (
            <>
              <path d={fcsTwoRearMountPath} fill="#173E3A" />
              <path d={fcsOneFrontMountPath} fill="#173E3A" />
            </>
          )}
        </g>
        {isFcsOne && (
          <path d="M 255 139 V 168 M 336 139 V 168" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="5 5" />
        )}
        {isFcsTwo && (
          <path d="M 255 139 V 168 M 338 139 V 168" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="5 5" />
        )}
        {isFutures && <path d="M 192 112 H 386 V 135 H 192 Z" fill="#173E3A" />}
        {isUsBox && (
          <>
            <path d="M 192 112 H 386 V 129 H 192 Z" fill="#173E3A" />
            <circle cx="208" cy="120.5" r="4" fill="#F4F7F6" stroke="#0F302D" strokeWidth="2" />
          </>
        )}
        {isGlassOn && (
          <>
            <rect x="72" y="113" width="376" height="31" rx="2" fill="#F8D9C9" stroke="#B85B3D" strokeWidth="2" />
            <rect x="192" y="111" width="194" height="8" rx="2" fill="#D86B49" />
          </>
        )}
        {!isFcsOne && !isFcsTwo && !isFutures && !isUsBox && !isGlassOn && (
          <path d="M 192 112 H 386 V 132 H 192 Z" fill="#173E3A" />
        )}
      </g>

      {!isGlassOn && (
        <g>
          {!isFcsOne && !isFcsTwo && <path d="M 214 145 V 168 M 362 145 V 168" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="5 5" />}
          {isFcsOne && (
            <>
              <rect x="208" y="177" width="190" height="36" rx="18" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
              <rect x="228" y="187" width="54" height="16" rx="8" fill="#315F59" />
              <rect x="293" y="187" width="86" height="16" rx="8" fill="#315F59" />
            </>
          )}
          {isFcsTwo && (
            <g>
              <rect x="208" y="177" width="194" height="36" rx="18" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
              <rect x="228" y="187" width="54" height="16" rx="8" fill="#315F59" />
              <rect x="293" y="187" width="91" height="16" rx="8" fill="#315F59" />
            </g>
          )}
          {isFutures && (
            <g>
              <rect x="72" y="178" width="376" height="35" rx="17.5" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
              <rect x="96" y="188" width="328" height="15" rx="7.5" fill="#315F59" />
              <circle cx="411" cy="195.5" r="4" fill="#F4F7F6" />
            </g>
          )}
          {isUsBox && (
            <g>
              <rect x="82" y="178" width="356" height="35" rx="17.5" fill="#253B38" stroke="#0F302D" strokeWidth="2" />
              <rect x="104" y="189" width="312" height="13" rx="6.5" fill="#0F2422" />
              <rect x="132" y="185" width="28" height="21" rx="5" fill="#C8D1CF" />
              <circle cx="146" cy="195.5" r="4" fill="#64748B" />
            </g>
          )}
          {!isFcsOne && !isFcsTwo && !isFutures && !isUsBox && (
            <rect x="130" y="180" width="260" height="32" rx="14" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
          )}
        </g>
      )}

    </svg>
  );
};

export const SurfboardFinSystemSelector: React.FC<{
  labelKey: string;
  options: ClassifiedSpecialOption[];
  value?: string;
  allowClear?: boolean;
  onChange: (value: string) => void;
}> = ({ labelKey, options, value = '', allowClear = false, onChange }) => {
  const { tr } = useI18n();
  const activeOption = options.find(option => option.value === value);
  return (
    <div className="space-y-3">
      <span className="ml-1 block text-xs font-semibold tracking-wider text-gray-400">{tr(labelKey)}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(active && allowClear ? '' : option.value)}
              aria-pressed={active}
              className={`pl pl-interactive transport-pill inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-xs font-extrabold transition ${active ? 'selected border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]' : 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]'}`}
            >
              {tr(option.labelKey)}
            </button>
          );
        })}
      </div>
      {activeOption && (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F4F7F6] px-3 py-2">
          <FinSystemDiagram system={activeOption.value} label={tr(activeOption.labelKey)} />
        </div>
      )}
    </div>
  );
};

const sliderClass = 'h-2 w-full appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#FF7A50] [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(255,122,80,0.42)] [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#FF7A50]';

const SingleSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  recommendation?: [number, number];
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, displayValue, recommendation, onChange }) => {
  const start = recommendation ? Math.max(0, Math.min(100, (recommendation[0] - min) / (max - min) * 100)) : 0;
  const end = recommendation ? Math.max(start, Math.min(100, (recommendation[1] - min) / (max - min) * 100)) : 0;
  const progress = Math.max(0, Math.min(100, (value - min) / (max - min) * 100));
  const background = recommendation
    ? `linear-gradient(to right,#E2E8F0 0%,#E2E8F0 ${start}%,#F9C3AA ${start}%,#F9C3AA ${end}%,#E2E8F0 ${end}%,#E2E8F0 100%)`
    : `linear-gradient(to right,#FF7A50 0%,#FF7A50 ${progress}%,#E2E8F0 ${progress}%,#E2E8F0 100%)`;
  return (
    <label className="block space-y-2.5">
      <span className="flex items-center justify-between gap-3 text-xs font-semibold text-[#64748B]">
        <span>{label}</span>
        <strong className="rounded-lg bg-white px-2.5 py-1 text-[#1E293B] shadow-sm">{displayValue}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className={sliderClass} style={{ background }} />
    </label>
  );
};

export const SurfboardWizardDimensions: React.FC<{
  attributes: Record<string, ClassifiedSpecialValue>;
  setAttributes: React.Dispatch<React.SetStateAction<Record<string, ClassifiedSpecialValue>>>;
}> = ({ attributes, setAttributes }) => {
  const { tr } = useI18n();
  const boardType = String(attributes.surf_board_type || 'shortboard');
  const material = String(attributes.surf_construction || 'unknown');
  const finConfiguration = String(attributes.surf_fin_configuration || getDefaultSurfboardFinConfiguration(boardType));
  const preset = getSurfboardPreset(boardType);
  const weightLimits = getSurfboardWeightLimits(boardType, material);
  const rawLength = Number(attributes.surf_length_feet || Math.floor(preset.length[1] / 12)) * 12 + Number(attributes.surf_length_inches ?? preset.length[1] % 12);
  const values: Measurements = {
    length: clampSurfboardValue(rawLength, preset.length),
    width: clampSurfboardValue(Number(attributes.surf_width_inches || preset.width[1]), preset.width),
    thickness: clampSurfboardValue(Number(attributes.surf_thickness_inches || preset.thickness[1]), preset.thickness),
    volume: clampSurfboardValue(Number(attributes.surf_volume_l || preset.volume[1]), preset.volume),
    weight: clampSurfboardValue(Number(attributes.surf_weight_kg || weightLimits[1]), weightLimits)
  };
  const suggestedVolume = calculateSurfboardVolumeRange(values.length, values.width, values.thickness, boardType);
  const suggestedThickness = calculateSurfboardThicknessRange(values.length, values.width, values.volume, boardType);
  const suggestedWeight = calculateSurfboardWeightRange(values.volume, boardType, material);

  useEffect(() => {
    setAttributes(current => {
      const next = { ...current };
      const feet = Math.floor(values.length / 12);
      const inches = Math.round(values.length % 12);
      next.surf_length_feet = feet;
      next.surf_length_inches = inches;
      next.surf_length_cm = surfboardLengthInchesToCm(values.length);
      next.surf_width_inches = values.width;
      next.surf_thickness_inches = values.thickness;
      next.surf_volume_l = values.volume;
      next.surf_weight_kg = values.weight;
      return next;
    });
  }, [boardType, material]);

  const update = (key: keyof Measurements, value: number) => setAttributes(current => {
    const next = { ...current };
    if (key === 'length') {
      next.surf_length_feet = Math.floor(value / 12);
      next.surf_length_inches = Math.round(value % 12);
      next.surf_length_cm = surfboardLengthInchesToCm(value);
    } else if (key === 'width') next.surf_width_inches = value;
    else if (key === 'thickness') next.surf_thickness_inches = value;
    else if (key === 'volume') next.surf_volume_l = value;
    else next.surf_weight_kg = value;
    return next;
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F4F7F6]">
      <div className="border-b border-white bg-white/75 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-extrabold text-[#1E293B]">{tr('filters.classified.special.boardPreview')}</span>
          <span className="text-[10px] font-bold text-[#94A3B8]">{tr('filters.classified.special.approximate')}</span>
        </div>
      </div>
      <div className="px-3 pt-2"><SurfboardPreview boardType={boardType} finConfiguration={finConfiguration} values={values} /></div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4 text-[10px] font-extrabold text-[#64748B] sm:grid-cols-5">
        <span>{formatSurfboardLength(values.length)}</span><span>{values.width.toFixed(1)}″</span><span>{values.thickness.toFixed(2)}″</span><span>{values.volume.toFixed(1)} l</span><span>{values.weight.toFixed(1)} kg</span>
      </div>
      <div className="space-y-5 border-t border-white bg-white/45 p-4">
        <SingleSlider label={tr('filters.classified.special.field.surf_length_feet')} value={values.length} min={preset.length[0]} max={preset.length[2]} step={1} displayValue={formatSurfboardLength(values.length)} onChange={value => update('length', value)} />
        <SingleSlider label={tr('filters.classified.special.field.surf_width_inches')} value={values.width} min={preset.width[0]} max={preset.width[2]} step={0.1} displayValue={`${values.width.toFixed(1)}″`} onChange={value => update('width', value)} />
        <SingleSlider label={tr('filters.classified.special.field.surf_thickness_inches')} value={values.thickness} min={preset.thickness[0]} max={preset.thickness[2]} step={0.05} displayValue={`${values.thickness.toFixed(2)}″`} recommendation={suggestedThickness} onChange={value => update('thickness', value)} />
        <SingleSlider label={tr('filters.classified.special.field.surf_volume_l')} value={values.volume} min={preset.volume[0]} max={preset.volume[2]} step={0.5} displayValue={`${values.volume.toFixed(1)} l`} recommendation={suggestedVolume} onChange={value => update('volume', value)} />
        <SingleSlider label={tr('filters.classified.special.field.surf_weight_kg')} value={values.weight} min={weightLimits[0]} max={weightLimits[2]} step={0.1} displayValue={`${values.weight.toFixed(1)} kg`} recommendation={suggestedWeight} onChange={value => update('weight', value)} />
        <div className="grid grid-cols-1 gap-2 text-[10px] font-bold text-[#64748B] sm:grid-cols-3">
          <span>{tr('filters.classified.special.suggestedVolume')}: {suggestedVolume[0].toFixed(0)}–{suggestedVolume[1].toFixed(0)} l</span>
          <span>{tr('filters.classified.special.suggestedThickness')}: {suggestedThickness[0].toFixed(2)}–{suggestedThickness[1].toFixed(2)}″</span>
          <span>{tr('filters.classified.special.suggestedWeight')}: {suggestedWeight[0].toFixed(1)}–{suggestedWeight[1].toFixed(1)} kg</span>
        </div>
      </div>
    </div>
  );
};

const DualSlider: React.FC<{
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  format: (value: number) => string;
  recommendation?: [number, number];
  onChange: (value: [number, number]) => void;
}> = ({ label, min, max, step, value, format, recommendation, onChange }) => {
  const left = (value[0] - min) / (max - min) * 100;
  const right = (value[1] - min) / (max - min) * 100;
  const recLeft = recommendation ? (recommendation[0] - min) / (max - min) * 100 : 0;
  const recRight = recommendation ? (recommendation[1] - min) / (max - min) * 100 : 0;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#64748B]">
        <span>{label}</span><strong className="rounded-lg bg-white px-2 py-1 text-[10px] text-[#1E293B] shadow-sm">{format(value[0])} – {format(value[1])}</strong>
      </div>
      <div className="relative h-7">
        <div className="absolute left-0 right-0 top-3 h-2 rounded-full bg-[#E2E8F0]" />
        {recommendation && <div className="absolute top-3 h-2 rounded-full bg-[#F9C3AA]" style={{ left: `${Math.max(0, recLeft)}%`, width: `${Math.max(0, Math.min(100, recRight) - Math.max(0, recLeft))}%` }} />}
        <div className="absolute top-3 h-2 rounded-full bg-[#FF7A50]" style={{ left: `${left}%`, width: `${right - left}%` }} />
        <input type="range" min={min} max={max} step={step} value={value[0]} onChange={event => onChange([Math.min(Number(event.target.value), value[1]), value[1]])} className={`${sliderClass} pointer-events-none absolute inset-x-0 top-3 bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto`} />
        <input type="range" min={min} max={max} step={step} value={value[1]} onChange={event => onChange([value[0], Math.max(Number(event.target.value), value[0])])} className={`${sliderClass} pointer-events-none absolute inset-x-0 top-3 bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto`} />
      </div>
    </div>
  );
};

export const SurfboardFilterDimensions: React.FC<{
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}> = ({ filters, setFilters }) => {
  const { tr } = useI18n();
  const selectedBoardTypes = filters.classifiedSpecialOptions.surf_board_type || [];
  const boardType = selectedBoardTypes.length === 1 ? selectedBoardTypes[0] : 'shortboard';
  const selectedFinConfigurations = filters.classifiedSpecialOptions.surf_fin_configuration || [];
  const finConfiguration = selectedFinConfigurations.length === 1
    ? selectedFinConfigurations[0]
    : getDefaultSurfboardFinConfiguration(boardType);
  const selectedMaterials = filters.classifiedSpecialOptions.surf_construction || [];
  const material = selectedMaterials.length === 1 ? selectedMaterials[0] : 'unknown';
  const preset = getSurfboardPreset(boardType);
  const weightLimits = getSurfboardWeightLimits(boardType, material);
  const getRange = (id: string, defaults: [number, number]) => {
    const current = filters.classifiedSpecialNumberRanges[id] || {};
    return [current.min ?? defaults[0], current.max ?? defaults[1]] as [number, number];
  };
  const lengthCm = getRange('surf_length_cm', [surfboardLengthInchesToCm(preset.length[0]), surfboardLengthInchesToCm(preset.length[2])]);
  const width = getRange('surf_width_inches', [preset.width[0], preset.width[2]]);
  const thickness = getRange('surf_thickness_inches', [preset.thickness[0], preset.thickness[2]]);
  const volume = getRange('surf_volume_l', [preset.volume[0], preset.volume[2]]);
  const weight = getRange('surf_weight_kg', [weightLimits[0], weightLimits[2]]);
  const representative: Measurements = {
    length: surfboardLengthCmToInches((lengthCm[0] + lengthCm[1]) / 2),
    width: (width[0] + width[1]) / 2,
    thickness: (thickness[0] + thickness[1]) / 2,
    volume: (volume[0] + volume[1]) / 2,
    weight: (weight[0] + weight[1]) / 2
  };
  const secondary: Measurements = {
    length: surfboardLengthCmToInches(lengthCm[1]), width: width[1], thickness: thickness[1], volume: volume[1], weight: weight[1]
  };
  const suggestedVolume = calculateSurfboardVolumeRange(representative.length, representative.width, representative.thickness, boardType);
  const suggestedThickness = calculateSurfboardThicknessRange(representative.length, representative.width, representative.volume, boardType);
  const suggestedWeight = calculateSurfboardWeightRange(representative.volume, boardType, material);
  const updateRange = (id: string, value: [number, number]) => setFilters(current => ({
    ...current,
    classifiedSpecialNumberRanges: { ...current.classifiedSpecialNumberRanges, [id]: { min: value[0], max: value[1] } }
  }));

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F4F7F6]">
      <div className="px-3 pt-2"><SurfboardPreview boardType={boardType} finConfiguration={finConfiguration} values={representative} secondary={secondary} /></div>
      <div className="space-y-5 border-t border-white bg-white/45 p-4">
        <DualSlider label={tr('filters.classified.special.field.surf_length_feet')} min={surfboardLengthInchesToCm(preset.length[0])} max={surfboardLengthInchesToCm(preset.length[2])} step={2.54} value={lengthCm} format={value => formatSurfboardLength(surfboardLengthCmToInches(value))} onChange={value => updateRange('surf_length_cm', value)} />
        <DualSlider label={tr('filters.classified.special.field.surf_width_inches')} min={preset.width[0]} max={preset.width[2]} step={0.1} value={width} format={value => `${value.toFixed(1)}″`} onChange={value => updateRange('surf_width_inches', value)} />
        <DualSlider label={tr('filters.classified.special.field.surf_thickness_inches')} min={preset.thickness[0]} max={preset.thickness[2]} step={0.05} value={thickness} format={value => `${value.toFixed(2)}″`} recommendation={suggestedThickness} onChange={value => updateRange('surf_thickness_inches', value)} />
        <DualSlider label={tr('filters.classified.special.field.surf_volume_l')} min={preset.volume[0]} max={preset.volume[2]} step={0.5} value={volume} format={value => `${value.toFixed(1)} l`} recommendation={suggestedVolume} onChange={value => updateRange('surf_volume_l', value)} />
        <DualSlider label={tr('filters.classified.special.field.surf_weight_kg')} min={weightLimits[0]} max={weightLimits[2]} step={0.1} value={weight} format={value => `${value.toFixed(1)} kg`} recommendation={suggestedWeight} onChange={value => updateRange('surf_weight_kg', value)} />
      </div>
    </div>
  );
};
