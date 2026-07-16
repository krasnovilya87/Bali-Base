import React, { useState, useRef, useEffect } from 'react';
import { X, Compass, MapPin, Navigation } from 'lucide-react';
import { THEME } from '../theme';
import { getDistrictCoordMap } from '../utils/geo';

interface Point {
  x: number;
  y: number;
}

interface MapSelectModalProps {
  initialPoint: Point | null;
  initialRadius: number;
  onClose: () => void;
  onApply: (point: Point, radius: number) => void;
  onReset: () => void;
}

export default function MapSelectModal({
  initialPoint,
  initialRadius,
  onClose,
  onApply,
  onReset
}: MapSelectModalProps) {
  const [tempPoint, setTempPoint] = useState<Point | null>(initialPoint);
  const [tempRadius, setTempRadius] = useState<number>(initialRadius || 80);
  const [selectionState, setSelectionState] = useState<'idle' | 'fixed'>(initialPoint ? 'fixed' : 'idle');
  const [districtCoords, setDistrictCoords] = useState<Record<string, Point>>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    getDistrictCoordMap().then(coords => {
      if (!cancelled) {
        setDistrictCoords(coords);
        if (!initialPoint) {
          const fallback = Object.values(coords)[0] || null;
          if (fallback) {
            setTempPoint(fallback);
          }
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialPoint]);

  const getSVGCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 550;
    const y = ((e.clientY - rect.top) / rect.height) * 450;
    return { x: Math.round(x), y: Math.round(y) };
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getSVGCoords(e);
    setTempPoint(coords);
    setSelectionState('fixed');
  };

  // Safe checks if a district is within radius of tempPoint
  const isDistrictInRadius = (coords: { x: number, y: number }) => {
    if (!tempPoint) return false;
    const distance = Math.sqrt(Math.pow(coords.x - tempPoint.x, 2) + Math.pow(coords.y - tempPoint.y, 2));
    return distance <= tempRadius;
  };

  return (
    <div className={`fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 select-none ${THEME.fonts.main}`}>
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-100 animate-scale-up max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
        id="map-select-modal-container"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-orange/10 rounded-xl text-brand-orange">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className={`${THEME.fonts.heading} font-extrabold text-text-dark text-base sm:text-lg`}>
                Поиск по карте и радиусу
              </h3>
              <p className="text-xs text-gray-400 tracking-tight">
                Укажите точку кликом на карте острова и настройте радиус фильтра
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-950 rounded-full transition active:scale-95 cursor-pointer"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form area & Interactive Vector Map */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 items-stretch min-h-[300px]" ref={mapContainerRef}>
          


          <div className="relative w-full aspect-[550/450] bg-[#2F7D69]/5 rounded-2xl border border-gray-200 overflow-hidden flex items-center justify-center select-none">
            
            {/* Map Canvas */}
            <div className="absolute inset-0 w-full h-full">
              <svg
                viewBox="0 0 550 450"
                className="w-full h-full object-contain cursor-crosshair"
                onClick={handleMapClick}
                id="svg-map-selector"
              >
                {/* Bali Island shape path */}
                <path
                  d="M 120,400 C 100,320 120,290 140,260 C 160,220 140,160 170,110 C 190,80 230,40 280,50 C 330,60 380,50 440,70 C 490,90 530,120 510,160 C 490,190 460,190 430,220 C 400,250 380,280 340,300 C 310,320 290,360 270,390 C 230,420 180,430 150,420 Z"
                  fill="rgba(45, 212, 191, 0.08)"
                  stroke="rgba(45, 212, 191, 0.4)"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />

                {/* Draw connecting roads */}
                <path
                  d="M 190,240 Q 220,200 260,160 Q 275,225 290,290"
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.07)"
                  strokeWidth="1.5"
                  strokeDasharray="6,4"
                />
                
                {/* Radius Overlay Circle */}
                {tempPoint && (
                  <circle
                    cx={tempPoint.x}
                    cy={tempPoint.y}
                    r={tempRadius}
                    fill="rgba(255, 122, 80, 0.18)"
                    stroke={THEME.colors.brandOrange}
                    strokeWidth="2.5"
                    strokeDasharray="5,3"
                    className="animate-pulse-slowpointer-events-none"
                  />
                )}

                {/* District Points indicators */}
                {(Object.entries(districtCoords) as Array<[string, Point]>).map(([name, coords]) => {
                  const active = tempPoint && isDistrictInRadius(coords);
                  return (
                    <g key={`select-pt-${name}`} className="pointer-events-none">
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={active ? 5 : 3.5}
                        fill={active ? THEME.colors.brandOrange : THEME.colors.directGreen}
                        className="transition-all duration-300"
                        opacity={active ? 1 : 0.6}
                      />
                      <text
                        x={coords.x}
                        y={coords.y - 8}
                        textAnchor="middle"
                        className={`${THEME.fonts.main} font-bold uppercase transition-all duration-300`}
                        style={{
                          fontSize: '8px', 
                          letterSpacing: '0.05em',
                          fill: active ? THEME.colors.brandOrangeHover : '#475569',
                          fontWeight: active ? 'bold' : 'normal'
                        }}
                      >
                        {name}
                      </text>
                    </g>
                  );
                })}

                {/* Selected Point Marker Pin */}
                {tempPoint && (
                  <g pointerEvents="none" className="animate-bounce">
                    <circle cx={tempPoint.x} cy={tempPoint.y} r="7" fill={THEME.colors.brandOrange} stroke="white" strokeWidth="2" />
                    <circle cx={tempPoint.x} cy={tempPoint.y} r="2" fill="white" />
                  </g>
                )}
              </svg>
            </div>

            {/* Instruction tooltip */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-100 text-[10px] sm:text-xs font-semibold text-gray-700 pointer-events-none flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-orange" />
              {!tempPoint ? 'Кликните на карту, чтобы установить точку' : 'Клик изменением переместит точку'}
            </div>
          </div>

          {/* Slider controls */}
          <div className={`space-y-3 bg-bg-light p-4 rounded-2xl border border-gray-100 ${THEME.fonts.main}`}>
            <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-brand-orange rotate-45" />
                Радиус зоны охвата:
              </span>
              <span className={`text-brand-orange text-sm ${THEME.fonts.mono}`}>
                ~ {Math.round(tempRadius)} км (px)
              </span>
            </div>
            
            <input
              type="range"
              min={30}
              max={250}
              step={5}
              value={tempRadius}
              onChange={(e) => setTempRadius(parseInt(e.target.value))}
              disabled={!tempPoint}
              className="w-full accent-brand-orange cursor-pointer"
            />
            
            <div className={`flex justify-between text-[10px] text-gray-400 ${THEME.fonts.mono}`}>
              <span>Локальный (30 км)</span>
              <span>Средний (120 км)</span>
              <span>Весь остров (250 км)</span>
            </div>
          </div>

        </div>

        {/* Footer controls */}
        <div className={`px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-3 items-center justify-between shrink-0 text-xs ${THEME.fonts.main}`}>
          <button
            onClick={() => {
              setTempPoint(null);
              onReset();
            }}
            className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 rounded-xl font-bold cursor-pointer transition active:scale-95 animate-fade-in"
          >
            Сбросить фильтр
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer transition active:scale-95"
            >
              Отмена
            </button>
            <button
              onClick={() => {
                if (tempPoint) {
                  onApply(tempPoint, tempRadius);
                } else {
                  onClose();
                }
              }}
              disabled={!tempPoint}
              className="px-5 py-2 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-extrabold rounded-xl cursor-pointer transition active:scale-95 shadow-md shadow-brand-orange/20"
            >
              Применить локацию
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
