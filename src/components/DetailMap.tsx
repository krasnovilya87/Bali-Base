import React, { useState, useEffect, useMemo } from 'react';
import { Listing, ListingNearbyRoute } from '../types';
import { Maximize, Minimize, Plus, Minus, MapPin } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, AdvancedMarkerAnchorPoint, useMap } from '@vis.gl/react-google-maps';
import { getListingCoords } from '../utils/geo';

export type DetailMapPlace = {
  id: string;
  name: string;
  position: google.maps.LatLngLiteral;
  rating?: number;
  title?: string;
  time?: string;
  emoji?: string;
};

interface DetailMapProps {
  listing: Listing;
  currencySymbol: string;
  currencyRate: number;
  mapPlaces?: DetailMapPlace[];
  activeRoute?: ListingNearbyRoute | null;
  selectedPlaceIndex?: number | null;
}



const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

type MarkerLabelPlacement = {
  side: 'right' | 'left';
  verticalClass: string;
};

const getLabelPlacementClass = (placement: MarkerLabelPlacement) => {
  const sideClass = placement.side === 'left'
    ? 'right-full mr-2 text-right'
    : 'left-full ml-2 text-left';
  return `${sideClass} ${placement.verticalClass}`;
};

const getReadableLabelSide = (
  position: google.maps.LatLngLiteral,
  origin: google.maps.LatLngLiteral,
  visibleLngRange?: { west: number; east: number } | null
): 'right' | 'left' => {
  const west = visibleLngRange?.west;
  const east = visibleLngRange?.east;
  const mapWidth = west !== undefined && east !== undefined ? Math.max(east - west, 0.00001) : 0;
  const leftSpace = west !== undefined ? (position.lng - west) / mapWidth : 0.5;
  const rightSpace = east !== undefined ? (east - position.lng) / mapWidth : 0.5;
  let side: 'right' | 'left' = position.lng >= origin.lng ? 'right' : 'left';

  if (leftSpace < 0.24) {
    side = 'right';
  } else if (rightSpace < 0.24) {
    side = 'left';
  }

  return side;
};

const getLabelPlacement = (
  position: google.maps.LatLngLiteral,
  index: number,
  origin: google.maps.LatLngLiteral,
  places: DetailMapPlace[],
  visibleLngRange?: { west: number; east: number } | null
): MarkerLabelPlacement => {
  let side = getReadableLabelSide(position, origin, visibleLngRange);
  const oppositeSide: 'right' | 'left' = side === 'right' ? 'left' : 'right';
  const west = visibleLngRange?.west;
  const east = visibleLngRange?.east;
  const mapWidth = west !== undefined && east !== undefined ? Math.max(east - west, 0.00001) : 0;
  const leftSpace = west !== undefined ? (position.lng - west) / mapWidth : 0.5;
  const rightSpace = east !== undefined ? (east - position.lng) / mapWidth : 0.5;
  const oppositeHasRoom = oppositeSide === 'left' ? leftSpace > 0.24 : rightSpace > 0.24;

  const previousNearbySameSide = places
    .filter((place, placeIndex) => placeIndex < index)
    .some(place => {
      const placeSide = getReadableLabelSide(place.position, origin, visibleLngRange);
      const sameHorizontalSide = placeSide === side;
      const closeLat = Math.abs(place.position.lat - position.lat) < 0.0012;
      return sameHorizontalSide && closeLat;
    });

  if (previousNearbySameSide && oppositeHasRoom) {
    side = oppositeSide;
  }

  const verticalClass = previousNearbySameSide
    ? (index % 2 === 0 ? 'top-[28%] -translate-y-1/2' : 'top-[72%] -translate-y-1/2')
    : 'top-1/2 -translate-y-1/2';

  return { side, verticalClass };
};

function RoutePolyline({
  route,
  origin
}: {
  route?: ListingNearbyRoute | null;
  origin: google.maps.LatLngLiteral;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google?.maps || !route?.overviewPath?.length) return;

    const routeLine = new window.google.maps.Polyline({
      path: route.overviewPath,
      geodesic: false,
      strokeColor: '#2F7D69',
      strokeOpacity: 1,
      strokeWeight: 7,
      zIndex: 9999,
      clickable: false
    });

    routeLine.setMap(map);

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(origin);
    route.overviewPath.forEach(point => bounds.extend(point));
    map.fitBounds(bounds, 72);

    return () => {
      routeLine.setMap(null);
    };
  }, [map, origin, route]);

  return null;
}

export default function DetailMap({ listing, currencySymbol, currencyRate, mapPlaces = [], activeRoute = null, selectedPlaceIndex = null }: DetailMapProps) {
  const [mapMode, setMapMode] = useState<'iframe' | 'api'>(hasValidKey ? 'api' : 'iframe');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeZoom, setIframeZoom] = useState(14);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [visibleLngRange, setVisibleLngRange] = useState<{ west: number; east: number } | null>(null);
  const [showOpenMapsPrompt, setShowOpenMapsPrompt] = useState(false);

  const coords = useMemo(
    () => getListingCoords(listing),
    [listing.id, listing.locationCoords, listing.district]
  );
  const coordsKey = `${coords.lat.toFixed(7)},${coords.lng.toFixed(7)}`;

  const updateVisibleLngRange = (map: google.maps.Map | null) => {
    const bounds = map?.getBounds();
    if (!bounds) return;
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    setVisibleLngRange({ west: southWest.lng(), east: northEast.lng() });
  };

  useEffect(() => {
    if ((mapPlaces.length > 0 || activeRoute?.overviewPath?.length) && hasValidKey) {
      setMapMode('api');
    }
  }, [activeRoute?.overviewPath?.length, mapPlaces.length]);

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

  // Trigger resize and re-center map once the container transition finishes.
  // Keep route selection in control of its own fitBounds behavior.
  useEffect(() => {
    if (mapInstance) {
      const timer = setTimeout(() => {
        if (window.google && window.google.maps) {
          window.google.maps.event.trigger(mapInstance, 'resize');
        }
        if (!activeRoute?.overviewPath?.length) {
          mapInstance.panTo(coords);
        }
      }, 320); // 320ms to ensure container transitions and resizes are fully finished
      return () => clearTimeout(timer);
    }
  }, [activeRoute?.overviewPath?.length, isFullscreen, mapInstance, coordsKey]);

  useEffect(() => {
    if (!mapInstance || !window.google?.maps || mapPlaces.length === 0 || activeRoute?.overviewPath?.length) return;

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(coords);
    mapPlaces.forEach(place => bounds.extend(place.position));
    mapInstance.fitBounds(bounds, 64);
    window.setTimeout(() => updateVisibleLngRange(mapInstance), 120);
  }, [activeRoute?.overviewPath?.length, mapInstance, mapPlaces, coords]);

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
  const googlePlaceId = listing.googlePlaceId || listing.placeId;
  const googleMapsQuery = googlePlaceId && listing.title.trim()
    ? listing.title.trim()
    : `${coords.lat},${coords.lng}`;
  const googleMapsUrl = googlePlaceId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleMapsQuery)}&query_place_id=${encodeURIComponent(googlePlaceId)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleMapsQuery)}`;
  const handleOpenGoogleMaps = () => {
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    setShowOpenMapsPrompt(false);
  };
  const nearbyLeftCount = mapPlaces.filter(place => place.position.lng < coords.lng).length;
  const nearbyRightCount = mapPlaces.filter(place => place.position.lng >= coords.lng).length;
  const mainLabelPlacement: MarkerLabelPlacement = {
    side: nearbyRightCount <= nearbyLeftCount ? 'right' : 'left',
    verticalClass: 'top-1/2 -translate-y-1/2'
  };
  const labelBaseClass = 'absolute w-[max-content] max-w-[min(38vw,168px)] rounded-lg bg-white/75 px-2.5 py-1.5 text-[10px] font-extrabold leading-tight text-[#1E293B] shadow-md backdrop-blur-sm border border-white/50 whitespace-normal break-words';

  return (
    <div
      className={`transition-all duration-300 relative ${isFullscreen
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
              key={coordsKey}
              title="Google Maps detailed"
              src={embedUrl}
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Central location pin matching main map aesthetics */}
          <button
            type="button"
            onClick={() => setShowOpenMapsPrompt(true)}
            className="absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center outline-none"
            title="Open in Google Maps"
          >
            <div className="bg-[#FF7A50] text-white p-2.5 rounded-full shadow-lg border border-white/40 animate-pulse transition-transform active:scale-95">
              <MapPin className="w-5 h-5 fill-current" />
            </div>
            <div className="bg-white/95 backdrop-blur-xs text-[#1E293B] px-2.5 py-1 rounded-lg shadow-md border border-[#94A3B8]/20 mt-1 text-[11px] font-extrabold whitespace-nowrap">
              {listing.title || 'Локация'}
            </div>
          </button>

          {/* District Name Badge in the bottom left */}
          <div className="absolute left-4 bottom-4 z-20 bg-white/95 backdrop-blur-xs text-[#1E293B] px-3.5 py-2 rounded-2xl shadow-md border border-[#94A3B8]/20 text-xs font-extrabold flex items-center gap-1.5 pointer-events-none select-none font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A50] animate-pulse" />
            <span>{listing.district}</span>
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
              key={coordsKey}
              defaultCenter={coords}
              defaultZoom={14}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              disableDefaultUI={true}
              onTilesLoaded={(e) => {
                if (e.map) {
                  setMapInstance(e.map);
                  updateVisibleLngRange(e.map);
                }
              }}
              onIdle={(e) => {
                if (e.map) {
                  updateVisibleLngRange(e.map);
                }
              }}
            >
              <AdvancedMarker position={coords} anchorPoint={AdvancedMarkerAnchorPoint.BOTTOM_CENTER} zIndex={30000}>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowOpenMapsPrompt(true);
                  }}
                  className="relative z-[30000] h-9 w-9 cursor-pointer outline-none"
                  title="Open in Google Maps"
                >
                  <div className="relative flex h-9 w-9 -rotate-45 items-center justify-center rounded-[50%_50%_50%_0] bg-[#FF7A50] text-white shadow-[0_10px_24px_rgba(15,23,42,0.28)] ring-2 ring-white">
                    <div className="absolute inset-[7px] rounded-full bg-white/20" />
                    <MapPin className="w-5 h-5 rotate-45 fill-current" />
                  </div>
                  <div className={`${labelBaseClass} max-w-[min(44vw,210px)] bg-white/80 text-[11px] ${getLabelPlacementClass(mainLabelPlacement)}`}>
                    <span className="block line-clamp-2">{listing.title || 'Локация'}</span>
                  </div>
                </button>
              </AdvancedMarker>
              {mapPlaces.map((place, index) => {
                const isSelectedPlace = selectedPlaceIndex === index;
                const labelPlacement = getLabelPlacement(place.position, index, coords, mapPlaces, visibleLngRange);
                return (
                  <AdvancedMarker
                    key={place.id}
                    position={place.position}
                    anchorPoint={AdvancedMarkerAnchorPoint.BOTTOM_CENTER}
                    zIndex={isSelectedPlace ? 20000 : 100}
                  >
                    <div className={`relative h-7 w-7 ${isSelectedPlace ? 'z-[20000]' : 'z-[100]'}`}>
                      <div className={`relative flex h-7 w-7 -rotate-45 items-center justify-center rounded-[50%_50%_50%_0] bg-[#2F7D69] text-white shadow-[0_8px_18px_rgba(15,23,42,0.22)] ring-2 ring-white ${isSelectedPlace ? 'scale-110 ring-[#F4F7F6]' : ''}`}>
                        <div className="absolute inset-[6px] rounded-full bg-white/20" />
                        <MapPin className="w-3.5 h-3.5 rotate-45 fill-current" />
                      </div>
                      <div className={`${labelBaseClass} ${isSelectedPlace ? 'bg-white/90 border-white/80' : 'bg-white/60'} ${getLabelPlacementClass(labelPlacement)}`}>
                        <span className="block line-clamp-2">{place.name}</span>
                        {place.time && (
                          <span className="block text-[9px] font-semibold text-[#2F7D69] mt-0.5">{place.time}</span>
                        )}
                        {place.rating !== undefined && (
                          <span className="block text-[9px] font-bold text-[#FF7A50] mt-0.5">★ {place.rating.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}
              <RoutePolyline route={activeRoute} origin={coords} />
            </Map>
          </APIProvider>

          {/* District Name Badge in the bottom left */}
          <div className="absolute left-4 bottom-4 z-20 bg-white/95 backdrop-blur-xs text-[#1E293B] px-3.5 py-2 rounded-2xl shadow-md border border-[#94A3B8]/20 text-xs font-extrabold flex items-center gap-1.5 pointer-events-none select-none font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A50] animate-pulse" />
            <span>{listing.district}</span>
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
      {showOpenMapsPrompt && (
        <div
          className="absolute inset-0 z-[40000] flex items-center justify-center bg-black/20 px-4 backdrop-blur-[1px]"
          onClick={() => setShowOpenMapsPrompt(false)}
        >
          <div
            className="w-full max-w-[280px] rounded-2xl border border-white/70 bg-white p-4 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-sm font-extrabold text-[#1E293B]">
              Открыть в Google Maps?
            </div>
            <div className="mt-1 text-xs font-light leading-relaxed text-[#5F6978]">
              Локация откроется в новой вкладке.
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowOpenMapsPrompt(false)}
                className="rounded-xl border border-[#94A3B8]/30 bg-[#F4F7F6] px-4 py-2 text-xs font-bold text-[#1E293B] transition hover:bg-white active:scale-95"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleOpenGoogleMaps}
                className="rounded-xl bg-[#FF7A50] px-4 py-2 text-xs font-extrabold text-white shadow-lg transition hover:bg-[#E05A30] active:scale-95"
              >
                Открыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
