import React, { useState, useEffect, useRef } from 'react';
import { Listing } from '../types';
import { Info, Plus, Minus, Locate, MapPin, Navigation, Compass, X, CircleDot, Pentagon } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

interface MapBoxProps {
  listings: Listing[];
  selectedListing: Listing | null;
  onListingHover: (listing: Listing | null) => void;
  onListingSelect: (listing: Listing) => void;
  currencySymbol: string;
  currencyRate: number;
  isFullscreen?: boolean;
  isSelectionActive?: boolean;
  onSelectionStart?: () => void;
  onSelectionClose?: () => void;
  onSelectionReset?: () => void;
  onSelectionApply?: (point: { x: number; y: number } | { x: number; y: number }[], radius: number) => void;
  initialPoint?: { x: number; y: number } | null;
  initialRadius?: number;
  initialPolygon?: { x: number; y: number }[] | null;
}

// Actual coordinates for Bali districts
const DISTRICT_COORDS: { [key: string]: { lat: number; lng: number } } = {
  'canggu': { lat: -8.6481, lng: 115.1385 },
  'ubud': { lat: -8.5069, lng: 115.2625 },
  'seminyak': { lat: -8.6913, lng: 115.1582 },
  'uluwatu': { lat: -8.8290, lng: 115.0860 },
  'sanur': { lat: -8.6806, lng: 115.2635 },
  'nusa dua': { lat: -8.8028, lng: 115.2155 },
  'kuta': { lat: -8.7228, lng: 115.1772 },
  'jimbaran': { lat: -8.7758, lng: 115.1764 },
  'amed': { lat: -8.3375, lng: 115.6534 },
  'lovina': { lat: -8.1574, lng: 115.0258 }
};

const getDistrictCoords = (districtName: string): { lat: number; lng: number } => {
  if (!districtName) return { lat: -8.4095, lng: 115.1889 };
  const normalized = districtName.trim().toLowerCase();
  for (const [key, coords] of Object.entries(DISTRICT_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }
  return { lat: -8.4095, lng: 115.1889 }; // default center of Bali
};

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Custom controller component inside APIProvider that has access to map API
interface MapViewControllerProps {
  centerCoords: { lat: number; lng: number };
  selectedListing: Listing | null;
  geoError: string | null;
  setGeoError: (err: string | null) => void;
  isSelectionActive: boolean;
  onSelectionStart?: () => void;
  selectionMode?: 'radius' | 'area';
  setSelectionMode?: (m: 'radius' | 'area') => void;
  setSelectionState?: (s: 'idle' | 'drawing' | 'fixed') => void;
  setTempPoint?: (p: { lat: number; lng: number } | null) => void;
  setRadiusMarkerPoint?: (p: { lat: number; lng: number } | null) => void;
  setPolygonPoints?: (pts: { lat: number; lng: number }[]) => void;
  setActiveMousePoint?: (p: { lat: number; lng: number } | null) => void;
}

function MapViewController({ 
  centerCoords, 
  selectedListing, 
  geoError,
  setGeoError,
  isSelectionActive,
  onSelectionStart,
  selectionMode = 'radius',
  setSelectionMode,
  setSelectionState,
  setTempPoint,
  setRadiusMarkerPoint,
  setPolygonPoints,
  setActiveMousePoint
}: MapViewControllerProps) {
  const map = useMap();
  const lastSelectedListingId = useRef<string | null>(null);
  const lastCenterCoords = useRef<{ lat: number; lng: number } | null>(null);

  // Pan map when centerCoords or selectedListing changes
  useEffect(() => {
    if (!map) return;
    if (isSelectionActive) return;

    const selectedId = selectedListing ? selectedListing.id : null;
    const centerChanged = !lastCenterCoords.current || 
      lastCenterCoords.current.lat !== centerCoords.lat || 
      lastCenterCoords.current.lng !== centerCoords.lng;
    const selectedChanged = lastSelectedListingId.current !== selectedId;

    if (selectedChanged || centerChanged) {
      map.panTo(centerCoords);
      if (selectedListing) {
        map.setZoom(14);
      }
      lastSelectedListingId.current = selectedId;
      lastCenterCoords.current = centerCoords;
    }
  }, [map, centerCoords, selectedListing, isSelectionActive]);

  const handleZoomIn = () => {
    if (!map) return;
    map.setZoom((map.getZoom() ?? 11) + 1);
  };

  const handleZoomOut = () => {
    if (!map) return;
    map.setZoom((map.getZoom() ?? 11) - 1);
  };

  const handleMyLocation = () => {
    if (!map) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          map.panTo(pos);
          map.setZoom(15);
          setGeoError(null);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setGeoError("Пожалуйста, разрешите доступ к местоположению в браузере.");
          setTimeout(() => setGeoError(null), 4000);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setGeoError("Ваш браузер не поддерживает определение местоположения.");
      setTimeout(() => setGeoError(null), 4000);
    }
  };

  return (
    <>
      {/* Beautiful styled floating map controls on the right (Google Maps design styling) */}
      <div className="absolute right-4 bottom-24 z-20 flex flex-col gap-2.5 pointer-events-auto select-none">
        {/* Selection Mode Toggles */}
        {setSelectionMode && setSelectionState && setTempPoint && setPolygonPoints && setActiveMousePoint && setRadiusMarkerPoint && (
          <>
            <button
              onClick={() => {
                onSelectionStart?.();
                setSelectionMode('radius');
                setSelectionState('idle');
                setTempPoint(null);
                setRadiusMarkerPoint(null);
                setPolygonPoints([]);
                setActiveMousePoint(null);
              }}
              type="button"
              title="Выбрать радиус"
              className={`w-10 h-10 rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group ${
                isSelectionActive && selectionMode === 'radius'
                  ? 'bg-[#FF7A50] text-white hover:bg-[#E05A30]'
                  : 'bg-[#F4F7F6] text-[#1E293B] hover:bg-white hover:text-[#FF7A50]'
              }`}
            >
              <CircleDot className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
            <button
              onClick={() => {
                onSelectionStart?.();
                setSelectionMode('area');
                setSelectionState('idle');
                setTempPoint(null);
                setRadiusMarkerPoint(null);
                setPolygonPoints([]);
                setActiveMousePoint(null);
              }}
              type="button"
              title="Выбрать область"
              className={`w-10 h-10 rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group ${
                isSelectionActive && selectionMode === 'area'
                  ? 'bg-[#FF7A50] text-white hover:bg-[#E05A30]'
                  : 'bg-[#F4F7F6] text-[#1E293B] hover:bg-white hover:text-[#FF7A50]'
              }`}
            >
              <Pentagon className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
            {/* Divider line */}
            <div className="h-[1px] bg-gray-200/50 my-1 mx-2" />
          </>
        )}

        {/* Geolocation Button */}
        <button
          onClick={handleMyLocation}
          type="button"
          title="Моя локация"
          className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
        >
          <Locate className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Plus Zoom Button */}
        <button
          onClick={handleZoomIn}
          type="button"
          title="Приблизить"
          className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Minus Zoom Button */}
        <button
          onClick={handleZoomOut}
          type="button"
          title="Отдалить"
          className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
        >
          <Minus className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>
      </div>
    </>
  );
}

// Helper to calculate distance in km between two lat/lng points
const getDistance = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
  const R = 6371; // Earth's radius in km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Coordinate mapping between Google Maps Lat/Lng and the SVG filter system
const latLngToSvg = (lat: number, lng: number): { x: number; y: number } => {
  const x = 446.688 * lng - 51241.25;
  const y = -515.132 * lat - 4214.91;
  return { x: Math.round(x), y: Math.round(y) };
};

const svgToLatLng = (x: number, y: number): { lat: number; lng: number } => {
  const lng = (x + 51241.25) / 446.688;
  const lat = (y + 4214.91) / -515.132;
  return { lat, lng };
};

const KM_TO_SVG_RADIUS = 4.3;

// Native Google Maps Circle component
function MapCircle({ center, radius }: { center: { lat: number; lng: number }, radius: number }) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    circleRef.current = new google.maps.Circle({
      map,
      fillColor: '#FF7A50',
      fillOpacity: 0.18,
      strokeColor: '#FF7A50',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      clickable: false,
    });

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setCenter(center);
    circleRef.current.setRadius(Math.max(0.1, radius) * 1000);
  }, [center.lat, center.lng, radius]);

  return null;
}

// Native Google Maps Polyline component
function MapPolyline({ path }: { path: { lat: number; lng: number }[] }) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || path.length === 0) return;
    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        map,
        strokeColor: '#FF7A50',
        strokeOpacity: 0.8,
        strokeWeight: 2.5,
        clickable: false,
      });
    }
    polylineRef.current.setPath(path);

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, path]);

  return null;
}

// Native Google Maps Polygon component
function MapPolygon({ path }: { path: { lat: number; lng: number }[] }) {
  const map = useMap();
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  useEffect(() => {
    if (!map || path.length === 0) return;
    if (!polygonRef.current) {
      polygonRef.current = new google.maps.Polygon({
        map,
        fillColor: '#FF7A50',
        fillOpacity: 0.18,
        strokeColor: '#FF7A50',
        strokeOpacity: 0.8,
        strokeWeight: 2.5,
        clickable: false,
      });
    }
    polygonRef.current.setPath(path);

    return () => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }
    };
  }, [map, path]);

  return null;
}

interface MapDrawingControllerProps {
  selectionMode: 'radius' | 'area';
  selectionState: 'idle' | 'drawing' | 'fixed';
  setSelectionState: (s: 'idle' | 'drawing' | 'fixed') => void;
  tempPoint: { lat: number; lng: number } | null;
  setTempPoint: (p: { lat: number; lng: number } | null) => void;
  tempRadius: number;
  setTempRadius: (r: number) => void;
  radiusMarkerPoint: { lat: number; lng: number } | null;
  setRadiusMarkerPoint: (p: { lat: number; lng: number } | null) => void;
  polygonPoints: { lat: number; lng: number }[];
  setPolygonPoints: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }[]>>;
  activeMousePoint: { lat: number; lng: number } | null;
  setActiveMousePoint: (p: { lat: number; lng: number } | null) => void;
}

// Google Maps Drawing Controller
function MapDrawingController({
  selectionMode,
  selectionState,
  setSelectionState,
  tempPoint,
  setTempPoint,
  tempRadius,
  setTempRadius,
  radiusMarkerPoint,
  setRadiusMarkerPoint,
  polygonPoints,
  setPolygonPoints,
  activeMousePoint,
  setActiveMousePoint
}: MapDrawingControllerProps) {
  const map = useMap();
  
  // Localized states for mouse movement to prevent parent re-renders while keeping rendering robust
  const [activeRadius, setActiveRadius] = useState<number>(0);

  useEffect(() => {
    if (!map) return;

    map.setOptions({ clickableIcons: false });

    const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      const iconEvent = e as google.maps.IconMouseEvent;
      if (iconEvent.placeId) {
        iconEvent.stop();
      }

      const latLng = e.latLng;
      if (!latLng) return;
      const coords = { lat: latLng.lat(), lng: latLng.lng() };

      if (selectionMode === 'radius') {
        if (selectionState === 'idle' || selectionState === 'fixed') {
          setTempPoint(coords);
          setTempRadius(0.1);
          setActiveRadius(0.1);
          setRadiusMarkerPoint(null);
          setSelectionState('drawing');
        } else if (selectionState === 'drawing') {
          if (tempPoint) {
            const dist = getDistance(tempPoint, coords);
            setTempRadius(Math.max(0.1, Math.min(100, dist)));
            setRadiusMarkerPoint(coords);
          }
          setSelectionState('fixed');
        }
      } else if (selectionMode === 'area') {
        if (selectionState === 'idle' || selectionState === 'fixed') {
          setPolygonPoints([coords]);
          setTempPoint(null);
          setSelectionState('drawing');
        } else if (selectionState === 'drawing') {
          const distToStart = getDistance(polygonPoints[0], coords);
          if (polygonPoints.length >= 3 && distToStart < 0.25) {
            setSelectionState('fixed');
            setActiveMousePoint(null);
          } else {
            setPolygonPoints(prev => [...prev, coords]);
          }
        }
      }
    });

    const moveListener = map.addListener('mousemove', (e: google.maps.MapMouseEvent) => {
      const latLng = e.latLng;
      if (!latLng) return;
      const coords = { lat: latLng.lat(), lng: latLng.lng() };

      if (selectionState === 'drawing') {
        if (selectionMode === 'radius' && tempPoint) {
          const dist = getDistance(tempPoint, coords);
          setActiveRadius(Math.max(0.1, Math.min(100, dist)));
        } else if (selectionMode === 'area') {
          setActiveMousePoint(coords);
        }
      }
    });

    return () => {
      google.maps.event.removeListener(clickListener);
      google.maps.event.removeListener(moveListener);
      map.setOptions({ clickableIcons: true });
    };
  }, [map, selectionMode, selectionState, tempPoint, tempRadius, polygonPoints, setTempPoint, setTempRadius, setSelectionState, setRadiusMarkerPoint, setPolygonPoints, setActiveMousePoint]);

  return (
    <>
      {selectionMode === 'radius' && tempPoint && (
        selectionState === 'drawing' ? (
          <MapCircle center={tempPoint} radius={activeRadius} />
        ) : (
          <MapCircle center={tempPoint} radius={tempRadius} />
        )
      )}

      {selectionMode === 'area' && polygonPoints.length > 0 && (
        <>
          {/* Active drawing mask (filled polygon) when we have >= 2 points */}
          {selectionState === 'drawing' && polygonPoints.length >= 2 && (
            <MapPolygon path={activeMousePoint ? [...polygonPoints, activeMousePoint] : polygonPoints} />
          )}
          
          {/* Outline path while drawing */}
          {selectionState === 'drawing' && (
            <MapPolyline path={activeMousePoint ? [...polygonPoints, activeMousePoint] : polygonPoints} />
          )}
          
          {/* Completed Polygon */}
          {selectionState === 'fixed' && (
            <MapPolygon path={polygonPoints} />
          )}

          {polygonPoints.map((pt, idx) => {
            const isFirst = idx === 0;
            return (
              <AdvancedMarker
                key={`poly-vertex-${idx}`}
                position={pt}
                onClick={isFirst && polygonPoints.length >= 3 ? () => {
                  setSelectionState('fixed');
                  setActiveMousePoint(null);
                } : undefined}
              >
                <div 
                  className={`rounded-full border border-white shadow-md transition-all ${
                    isFirst 
                      ? 'w-3 h-3 bg-[#FF7A50] cursor-pointer hover:scale-125 z-50' 
                      : 'w-2 h-2 bg-[#FF7A50] z-40'
                  }`}
                  title={isFirst && polygonPoints.length >= 3 ? "Завершить область" : undefined}
                />
              </AdvancedMarker>
            );
          })}
        </>
      )}
    </>
  );
}

export default function MapBox({
  listings,
  selectedListing,
  onListingHover,
  onListingSelect,
  currencySymbol,
  currencyRate,
  isFullscreen: isFullscreenProp,
  isSelectionActive = false,
  onSelectionStart,
  onSelectionClose,
  onSelectionReset,
  onSelectionApply,
  initialPoint = null,
  initialRadius = 80,
  initialPolygon = null
}: MapBoxProps) {
  const [hoveredItem, setHoveredItem] = useState<Listing | null>(null);

  const [selectionMode, setSelectionMode] = useState<'radius' | 'area'>(() => {
    if (initialPolygon && initialPolygon.length > 0) return 'area';
    return 'radius';
  });

  const [selectionState, setSelectionState] = useState<'idle' | 'drawing' | 'fixed'>(
    initialPolygon && initialPolygon.length > 0 ? 'fixed' : (initialPoint ? 'fixed' : 'idle')
  );
  const [tempPoint, setTempPoint] = useState<{ lat: number; lng: number } | null>(() => {
    if (initialPoint) {
      return svgToLatLng(initialPoint.x, initialPoint.y);
    }
    return null;
  });
  const [tempRadius, setTempRadius] = useState<number>(() => {
    if (initialRadius) {
      return initialRadius / KM_TO_SVG_RADIUS;
    }
    return 15;
  });
  const [radiusMarkerPoint, setRadiusMarkerPoint] = useState<{ lat: number; lng: number } | null>(() => {
    if (initialPoint && initialRadius) {
      const latLngCircumference = svgToLatLng(initialPoint.x + initialRadius, initialPoint.y);
      return latLngCircumference;
    }
    return null;
  });

  const [polygonPoints, setPolygonPoints] = useState<{ lat: number; lng: number }[]>(() => {
    if (initialPolygon && initialPolygon.length > 0) {
      return initialPolygon.map(p => svgToLatLng(p.x, p.y));
    }
    return [];
  });
  const [activeMousePoint, setActiveMousePoint] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (isSelectionActive) {
      if (initialPolygon && initialPolygon.length > 0) {
        setPolygonPoints(initialPolygon.map(p => svgToLatLng(p.x, p.y)));
        setSelectionMode('area');
        setSelectionState('fixed');
        setTempPoint(null);
        setRadiusMarkerPoint(null);
      } else if (initialPoint) {
        const centerLatLng = svgToLatLng(initialPoint.x, initialPoint.y);
        setTempPoint(centerLatLng);
        const radiusVal = initialRadius || 80;
        const edgeLatLng = svgToLatLng(initialPoint.x + radiusVal, initialPoint.y);
        setRadiusMarkerPoint(edgeLatLng);
        setSelectionMode('radius');
        setSelectionState('fixed');
        setPolygonPoints([]);
      } else {
        setTempPoint(null);
        setRadiusMarkerPoint(null);
        setPolygonPoints([]);
        setSelectionState('idle');
      }
      if (initialRadius) {
        setTempRadius(initialRadius / KM_TO_SVG_RADIUS);
      } else {
        setTempRadius(15);
      }
    }
  }, [isSelectionActive, initialPoint, initialRadius, initialPolygon]);

  useEffect(() => {
    if (!isSelectionActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectionState('idle');
        setTempPoint(null);
        setRadiusMarkerPoint(null);
        setPolygonPoints([]);
        setActiveMousePoint(null);
        if (onSelectionReset) {
          onSelectionReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelectionActive, onSelectionReset]);
  
  const isFullscreen = isFullscreenProp ?? false;
  
  const [geoError, setGeoError] = useState<string | null>(null);

  // Compute map center
  const centerCoords = selectedListing
    ? getDistrictCoords(selectedListing.district)
    : listings.length > 0
    ? getDistrictCoords(listings[0].district)
    : { lat: -8.4095, lng: 115.1889 };

  const formatPrice = (priceIdr: number) => {
    const converted = Math.round(priceIdr * currencyRate);
    if (converted >= 1000000) {
      return `${(converted / 1000000).toFixed(1)}M ${currencySymbol}`;
    } else if (converted >= 1000) {
      return `${(converted / 1000).toFixed(0)}k ${currencySymbol}`;
    }
    return `${converted} ${currencySymbol}`;
  };

  const getListingCoords = (item: Listing) => {
    const base = getDistrictCoords(item.district);
    const hash = (str: string) => {
      let value = 0;
      for (let index = 0; index < str.length; index++) {
        value = (value << 5) - value + str.charCodeAt(index);
        value |= 0;
      }
      return Math.abs(value);
    };

    const hashId = hash(item.id);
    return {
      lat: base.lat + ((hashId % 41) / 1100) - 0.018,
      lng: base.lng + (((hashId >> 2) % 41) / 1100) - 0.018
    };
  };

  const listingsWithCoords = listings.map(item => ({
    item,
    coords: getListingCoords(item),
    price: item.hasDropPrice && item.dropPricePerDay ? item.dropPricePerDay : item.pricePerDay
  }));
  const mapElement = (
    <div className={`relative transition-all duration-300 flex flex-col ${
      isFullscreen 
        ? 'fixed inset-0 z-50 bg-white w-full h-full' 
        : 'flex-1 h-full min-h-[400px] md:min-h-0 w-full rounded-3xl overflow-hidden'
    }`}>


      {/* FLOATING APPLY BUTTON FOR SELECTION */}
      {isSelectionActive && (
        (selectionMode === 'radius' && selectionState === 'fixed' && tempPoint) ||
        (selectionMode === 'area' && polygonPoints.length >= 3)
      ) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setSelectionState('idle');
              setTempPoint(null);
              setRadiusMarkerPoint(null);
              setPolygonPoints([]);
              setActiveMousePoint(null);
              onSelectionReset?.();
            }}
            className="px-6 py-3 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] text-xs font-black rounded-xl border-[0.5px] border-[#94A3B8]/30 shadow-xl transition active:scale-95 cursor-pointer outline-none"
          >
            Отменить
          </button>
        <button
          type="button"
          onClick={() => {
            if (onSelectionApply) {
              if (selectionMode === 'area') {
                const svgPts = polygonPoints.map(p => latLngToSvg(p.lat, p.lng));
                onSelectionApply(svgPts, 0);
              } else if (tempPoint) {
                const svgPt = latLngToSvg(tempPoint.lat, tempPoint.lng);
                onSelectionApply(svgPt, Math.round(tempRadius * KM_TO_SVG_RADIUS));
              }
            }
          }}
          className="px-6 py-3 bg-[#FF7A50] hover:bg-[#E05A30] text-white text-xs font-black rounded-xl shadow-2xl transition active:scale-95 cursor-pointer border-0 outline-none"
        >
          Применить
        </button>
        </div>
      )}

      {/* GEOLOCATION ERROR WARNING BANNER */}
      {geoError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-[#FF7A50] text-[#F4F7F6] px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg animate-fade-in text-center max-w-xs border border-white/20 select-none">
          {geoError}
        </div>
      )}

      {/* HOVER PREVIEW CARD POPUP (when mouse over a price) */}
      {hoveredItem && (
        <div className="absolute top-4 left-4 z-30 w-[260px] bg-white/95 backdrop-blur-md rounded-2xl border-[0.5px] border-[#94A3B8]/20 shadow-xl overflow-hidden p-3 animate-fade-in flex flex-col gap-2 pointer-events-none text-left select-none">
          <div className="relative h-28 rounded-xl overflow-hidden">
            <img 
              src={hoveredItem.images[0]} 
              alt={hoveredItem.title} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
            {hoveredItem.hasDropPrice && (
              <span className="absolute top-2 left-2 bg-[#FF7A50] text-[#F4F7F6] text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-sm">
                Drop Price
              </span>
            )}
            {hoveredItem.district && (
              <span className="absolute bottom-2 left-2 bg-black/55 backdrop-blur-xs text-white text-[8px] px-1.5 py-0.5 rounded-md font-medium tracking-wide">
                {hoveredItem.district}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <h4 className="font-sans font-bold text-xs text-[#1E293B] line-clamp-1 leading-tight">
              {hoveredItem.title}
            </h4>
            <div className="flex justify-between items-baseline gap-1">
              <div className="flex flex-col">
                {hoveredItem.hasDropPrice && hoveredItem.dropPricePerDay ? (
                  <div className="flex flex-col">
                    <span className="text-[9px] text-[#5F6978]/60 line-through">
                      {Math.round(hoveredItem.pricePerDay * currencyRate).toLocaleString()} {currencySymbol}/сут
                    </span>
                    <span className="font-mono text-[11px] font-black text-[#FF7A50] flex items-center gap-0.5">
                      {Math.round(hoveredItem.dropPricePerDay * currencyRate).toLocaleString()} {currencySymbol}
                      <span className="text-[8px] text-[#5F6978] font-normal font-sans">/сут</span>
                    </span>
                  </div>
                ) : (
                  <span className="font-mono text-[11px] font-black text-[#FF7A50]">
                    {Math.round(hoveredItem.pricePerDay * currencyRate).toLocaleString()} {currencySymbol}
                    <span className="text-[8px] text-[#5F6978] font-normal font-sans">/сут</span>
                  </span>
                )}
              </div>
              <div className="text-[9px] text-[#5F6978] flex items-center gap-0.5 shrink-0 bg-[#F4F7F6]/80 px-1.5 py-0.5 rounded-lg border border-[#94A3B8]/10 font-bold">
                <span>★</span>
                <span className="text-[#1E293B]">{hoveredItem.rating?.toFixed(1) || "5.0"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE GOOGLE MAPS API MODE */}
      {(
        <div className="w-full h-full flex-grow relative">
          {!hasValidKey ? (
            <div className="absolute inset-0 bg-[#F4F7F6] p-6 flex flex-col justify-center items-center text-center">
              <div className="max-w-md bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-md space-y-4">
                <div className="w-12 h-12 bg-[#FF7A50]/15 flex items-center justify-center rounded-2xl mx-auto">
                  <Info className="w-6 h-6 text-[#FF7A50]" />
                </div>
                <h3 className="font-sans text-sm font-extrabold text-[#1E293B]">Требуется API ключевой баланс</h3>
                <p className="text-xs text-[#5F6978] leading-relaxed">
                  Для отображения маркеров всех доступных объектов на карте подключите ваш API Ключ.
                </p>
                <div className="text-left text-[11px] text-gray-500 bg-gray-50 border border-gray-150 p-2.5 rounded-xl space-y-1">
                  <div className="font-bold text-[#1E293B] mb-1">Инструкция по настройке:</div>
                  <div>1. Нажмите иконку <strong>Настройки (⚙️ в углу)</strong></div>
                  <div>2. Перейдите в <strong>Secrets</strong></div>
                  <div>3. Создайте <code>GOOGLE_MAPS_PLATFORM_KEY</code></div>
                  <div>4. Вставьте ваш ключ и нажмите <strong>Ввод</strong></div>
                </div>
              </div>
            </div>
          ) : (
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={centerCoords}
                defaultZoom={11}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                disableDefaultUI={true}
                gestureHandling={isFullscreen ? 'greedy' : 'cooperative'}
                options={{
                  clickableIcons: !isSelectionActive
                }}
              >
                {listingsWithCoords.map(({ item, coords, price }) => {
                  const isSelected = selectedListing?.id === item.id;
                  return (
                    <AdvancedMarker
                      key={item.id}
                      position={coords}
                      onClick={isSelectionActive ? undefined : () => onListingSelect(item)}
                    >
                      <button
                        onMouseEnter={isSelectionActive ? undefined : () => {
                          setHoveredItem(item);
                          onListingHover(item);
                        }}
                        onMouseLeave={isSelectionActive ? undefined : () => {
                          setHoveredItem(null);
                          onListingHover(null);
                        }}
                        type="button"
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold shadow-md transition-all ${
                          isSelectionActive 
                            ? 'pointer-events-none opacity-80' 
                            : 'cursor-pointer hover:bg-[#FF7A50] hover:text-white hover:scale-105'
                        } ${
                          isSelected
                            ? 'bg-[#FF7A50] text-white scale-110 z-30 ring-4 ring-[#FF7A50]/30 border border-[#FF7A50]'
                            : item.hasDropPrice
                            ? 'bg-amber-500 text-white border border-amber-600 z-20'
                            : 'bg-white text-[#FF7A50] border border-[#FF7A50]/20 z-10'
                        }`}
                        style={{ 
                          whiteSpace: 'nowrap', 
                          width: 'auto',
                          pointerEvents: isSelectionActive ? 'none' : 'auto'
                        }}
                      >
                        <span>{formatPrice(price)}</span>
                        {item.isApproved && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 border border-white" />
                        )}
                      </button>
                    </AdvancedMarker>
                  );
                })}

                {/* ViewController nested component to handle pan and beautiful custom controls */}
                <MapViewController 
                  centerCoords={centerCoords} 
                  selectedListing={selectedListing} 
                  geoError={geoError}
                  setGeoError={setGeoError}
                  isSelectionActive={isSelectionActive}
                  onSelectionStart={onSelectionStart}
                  selectionMode={selectionMode}
                  setSelectionMode={setSelectionMode}
                  setSelectionState={setSelectionState}
                  setTempPoint={setTempPoint}
                  setRadiusMarkerPoint={setRadiusMarkerPoint}
                  setPolygonPoints={setPolygonPoints}
                  setActiveMousePoint={setActiveMousePoint}
                />

                {isSelectionActive && (
                  <MapDrawingController
                    selectionMode={selectionMode}
                    selectionState={selectionState}
                    setSelectionState={setSelectionState}
                    tempPoint={tempPoint}
                    setTempPoint={setTempPoint}
                    tempRadius={tempRadius}
                    setTempRadius={setTempRadius}
                    radiusMarkerPoint={radiusMarkerPoint}
                    setRadiusMarkerPoint={setRadiusMarkerPoint}
                    polygonPoints={polygonPoints}
                    setPolygonPoints={setPolygonPoints}
                    activeMousePoint={activeMousePoint}
                    setActiveMousePoint={setActiveMousePoint}
                  />
                )}
              </Map>
            </APIProvider>
          )}


        </div>
      )}
    </div>
  );

  return mapElement;
}
