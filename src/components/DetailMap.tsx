import React, { useState, useEffect } from 'react';
import { Listing } from '../types';
import { Maximize, Minimize, Plus, Minus, MapPin } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { getListingCoords } from '../utils/geoUtils';

interface DetailMapProps {
  listing: Listing;
  currencySymbol: string;
  currencyRate: number;
}

const DISTRICT_TRANSLATIONS: Record<string, string> = {
  'Seminyak': 'Семиньяк',
  'Canggu': 'Чангу',
  'Ubud': 'Убуд',
  'Uluwatu': 'Улувату',
  'Sanur': 'Санур',
  'Nusa Dua': 'Нуса Дуа',
  'Kuta': 'Кута',
  'Jimbaran': 'Джимбаран',
  'Amed': 'Амед',
  'Lovina': 'Ловина'
};

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function DetailMap({ listing, currencySymbol, currencyRate }: DetailMapProps) {
  const [mapMode, setMapMode] = useState<'iframe' | 'api'>(hasValidKey ? 'api' : 'iframe');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeZoom, setIframeZoom] = useState(14);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const coords = getListingCoords(listing);

  // Sync body class to disable modal transforms during fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('map-fullscreen');
    } else {
      document.body.classList.remove('map-fullscreen');
    }
    return () => {
      document.body.classList.remove('map-fullscreen');
    };
  }, [isFullscreen]);

  // Trigger resize and re-center map once the transition finishes
  useEffect(() => {
    if (mapInstance) {
      const timer = setTimeout(() => {
        if (window.google && window.google.maps) {
          window.google.maps.event.trigger(mapInstance, 'resize');
        }
        mapInstance.panTo(coords);
      }, 320); // 320ms to ensure container transitions and resizes are fully finished
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, mapInstance, coords]);

  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.setZoom((mapInstance.getZoom() ?? 14) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.setZoom((mapInstance.getZoom() ?? 14) - 1);
    }
  };

  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(`${coords.lat},${coords.lng}`)}&t=&z=${iframeZoom}&ie=UTF8&iwloc=&output=embed`;

  return (
    <div
      className={`transition-all duration-300 relative ${
        isFullscreen
          ? 'bg-black'
          : 'w-full h-[280px] sm:h-[350px] rounded-2xl border [border-width:0.5px] border-[#94A3B8]/30 overflow-hidden'
      }`}
      style={
        isFullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999
            }
          : undefined
      }
    >
      {/* Inject style override to bypass modal transforms, position relative and overflow hidden when fullscreen is active */}
      {isFullscreen && (
        <style>{`
          body.map-fullscreen #details-modal {
            z-index: 99999 !important;
          }
          body.map-fullscreen #details-modal > div {
            transform: none !important;
            animation: none !important;
            position: static !important;
            overflow: visible !important;
          }
          body.map-fullscreen #details-scroll-container {
            position: static !important;
            overflow: visible !important;
          }
        `}</style>
      )}

      {mapMode === 'iframe' ? (
        <div className="w-full h-full relative overflow-hidden bg-[#F4F7F6]">
          {/* Crop Google embed headers and footer logo/controls by shifting map bounds */}
          <div className="absolute -top-[45px] left-0 right-0 -bottom-[45px] overflow-hidden">
            <iframe
              title="Google Maps detailed"
              src={embedUrl}
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Central location pin matching main map aesthetics */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
            <div className="bg-[#FF7A50] text-white p-2.5 rounded-full shadow-lg border border-white/40 animate-pulse">
              <MapPin className="w-5 h-5 fill-current" />
            </div>
            <div className="bg-white/95 backdrop-blur-xs text-[#1E293B] px-2.5 py-1 rounded-lg shadow-md border border-[#94A3B8]/20 mt-1 text-[11px] font-extrabold whitespace-nowrap">
              {listing.title || 'Локация'}
            </div>
          </div>

          {/* District Name Badge in the bottom left */}
          <div className="absolute left-4 bottom-4 z-20 bg-white/95 backdrop-blur-xs text-[#1E293B] px-3.5 py-2 rounded-2xl shadow-md border border-[#94A3B8]/20 text-xs font-extrabold flex items-center gap-1.5 pointer-events-none select-none font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A50] animate-pulse" />
            <span>{DISTRICT_TRANSLATIONS[listing.district] || listing.district}</span>
          </div>

          {/* Styled Floating Controls overlaying the cropped map */}
          <div className="absolute right-4 bottom-4 z-20 flex flex-col gap-2 pointer-events-auto select-none">
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              type="button"
              title={isFullscreen ? "Свернуть" : "Во весь экран"}
              className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 transition-transform group-hover:scale-110" />
              ) : (
                <Maximize className="w-5 h-5 transition-transform group-hover:scale-110" />
              )}
            </button>

            {/* Zoom In Button */}
            <button
              onClick={() => setIframeZoom(prev => Math.min(prev + 1, 21))}
              type="button"
              title="Приблизить"
              className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>

            {/* Zoom Out Button */}
            <button
              onClick={() => setIframeZoom(prev => Math.max(prev - 1, 1))}
              type="button"
              title="Отдалить"
              className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
            >
              <Minus className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full relative bg-[#F4F7F6]">
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={coords}
              defaultZoom={14}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              disableDefaultUI={true}
              onTilesloaded={(e) => {
                const target = e.target as any;
                if (target) {
                  setMapInstance(target);
                }
              }}
            >
              <AdvancedMarker position={coords}>
                <div className="flex flex-col items-center">
                  <div className="bg-[#FF7A50] text-white p-2.5 rounded-full shadow-lg border border-white/40 animate-pulse">
                    <MapPin className="w-5 h-5 fill-current" />
                  </div>
                  <div className="bg-white/95 backdrop-blur-xs text-[#1E293B] px-2.5 py-1 rounded-lg shadow-md border border-[#94A3B8]/20 mt-1 text-[11px] font-extrabold whitespace-nowrap">
                    {listing.title || 'Локация'}
                  </div>
                </div>
              </AdvancedMarker>
            </Map>
          </APIProvider>

          {/* District Name Badge in the bottom left */}
          <div className="absolute left-4 bottom-4 z-20 bg-white/95 backdrop-blur-xs text-[#1E293B] px-3.5 py-2 rounded-2xl shadow-md border border-[#94A3B8]/20 text-xs font-extrabold flex items-center gap-1.5 pointer-events-none select-none font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A50] animate-pulse" />
            <span>{DISTRICT_TRANSLATIONS[listing.district] || listing.district}</span>
          </div>

          {/* Styled Floating Controls overlaying the API map */}
          <div className="absolute right-4 bottom-4 z-20 flex flex-col gap-2 pointer-events-auto select-none">
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              type="button"
              title={isFullscreen ? "Свернуть" : "Во весь экран"}
              className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 transition-transform group-hover:scale-110" />
              ) : (
                <Maximize className="w-5 h-5 transition-transform group-hover:scale-110" />
              )}
            </button>

            {/* Zoom In Button */}
            <button
              onClick={handleZoomIn}
              type="button"
              title="Приблизить"
              className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>

            {/* Zoom Out Button */}
            <button
              onClick={handleZoomOut}
              type="button"
              title="Отдалить"
              className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
            >
              <Minus className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
