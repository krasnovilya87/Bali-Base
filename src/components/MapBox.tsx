import React, { useState, useEffect, useRef } from 'react';
import { Listing } from '../types';
import { getDistrictCoordsSync, getListingCoords as utilGetListingCoords } from '../utils/geoUtils';
import { Info, Plus, Minus, Locate, CircleDot, Pentagon, Star, Heart, Flame } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useI18n } from '../i18nContext';
import { THEME } from '../theme';
import { buildListingSubtitle, stripListingRoomTypeFromTitle } from '../utils/listingSubtitle';
import { isListingFresh } from '../utils/listingFreshness';

interface MapBoxProps {
  listings: Listing[];
  selectedListing: Listing | null;
  hoveredListing?: Listing | null;
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

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';
const FAVORITES_STORAGE_KEY = 'bali_base_favorites';
const FAVORITES_CHANGED_EVENT = 'bali_base_favorites_changed';

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
  const { tr } = useI18n();
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
          setGeoError(tr('wizard.geoPermission'));
          setTimeout(() => setGeoError(null), 4000);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setGeoError(tr('wizard.geoUnsupported'));
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
              title={tr('map.radiusMode')}
              className={`w-10 h-10 rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group ${isSelectionActive && selectionMode === 'radius'
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
              title={tr('map.areaMode')}
              className={`w-10 h-10 rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group ${isSelectionActive && selectionMode === 'area'
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
          title={tr('map.myLocation')}
          className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
        >
          <Locate className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Plus Zoom Button */}
        <button
          onClick={handleZoomIn}
          type="button"
          title={tr('map.zoomIn')}
          className="w-10 h-10 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] rounded-full border-[0.5px] border-[#94A3B8]/30 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 group"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Minus Zoom Button */}
        <button
          onClick={handleZoomOut}
          type="button"
          title={tr('map.zoomOut')}
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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

interface MapListingPopupProps {
  item: Listing;
  currencySymbol: string;
  currencyRate: number;
  tr: (key: string, params?: Record<string, string | number>) => string;
  onSelect: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (event: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function MapListingPopup({
  item,
  currencySymbol,
  currencyRate,
  tr,
  onSelect,
  isFavorite = false,
  onFavoriteToggle,
  onMouseEnter,
  onMouseLeave
}: MapListingPopupProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const activePrice = item.hasDropPrice && item.dropPricePerDay ? item.dropPricePerDay : item.pricePerDay;
  const convertedPrice = Math.round(activePrice * currencyRate).toLocaleString();
  const originalPrice = Math.round(item.pricePerDay * currencyRate).toLocaleString();
  const displayTitle = stripListingRoomTypeFromTitle(item.title);
  const photos = item.images && item.images.length > 0 ? item.images : [''];
  const hasMultiplePhotos = photos.length > 1;

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [item.id]);

  const showPrevPhoto = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    if (!hasMultiplePhotos) return;
    setActivePhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const showNextPhoto = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    if (!hasMultiplePhotos) return;
    setActivePhotoIndex(prev => (prev + 1) % photos.length);
  };

  return (
    <div
      className="group pl-card bg-white rounded-2xl overflow-hidden shadow-xl border border-[#E5E7EB] w-[300px] max-w-[82vw] cursor-pointer select-none text-left"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div
        className="relative aspect-video w-full overflow-hidden bg-gray-50"
        onTouchStart={(event) => {
          event.stopPropagation();
          touchStartXRef.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          event.stopPropagation();
          const startX = touchStartXRef.current;
          touchStartXRef.current = null;
          if (startX === null || !hasMultiplePhotos) return;
          const deltaX = event.changedTouches[0].clientX - startX;
          if (Math.abs(deltaX) < 36) return;
          if (deltaX > 0) {
            showPrevPhoto(event);
          } else {
            showNextPhoto(event);
          }
        }}
      >
        <img
          src={photos[activePhotoIndex]}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          referrerPolicy="no-referrer"
        />

        {hasMultiplePhotos && (
          <>
            <button
              type="button"
              onClick={showPrevPhoto}
              className="absolute inset-y-0 left-0 z-20 w-[1cm] bg-black/20 opacity-0 transition-opacity duration-200 hover:bg-black/35 group-hover:opacity-100 active:bg-black/45"
              title={tr('listing.prevImage')}
              aria-label={tr('listing.prevImage')}
            />
            <button
              type="button"
              onClick={showNextPhoto}
              className="absolute inset-y-0 right-0 z-20 w-[1cm] bg-black/20 opacity-0 transition-opacity duration-200 hover:bg-black/35 group-hover:opacity-100 active:bg-black/45"
              title={tr('listing.nextImage')}
              aria-label={tr('listing.nextImage')}
            />
          </>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start z-10">
          {item.isPromoPremium && (
            <div className={`bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500 text-white ${THEME.fonts.heading} text-[10px] font-black px-2 py-0.5 rounded shadow-md flex items-center gap-1.5 tracking-wider`}>
              <Flame className="w-3.5 h-3.5 fill-white text-white animate-bounce" />
              <span>{tr('listing.vipPremium')}</span>
            </div>
          )}
          {item.isApproved && (
            <div className={`bg-[#FFCD29] text-gray-950 ${THEME.fonts.heading} text-[10px] font-extrabold px-2 py-0.5 rounded shadow-md flex items-center gap-1.5 tracking-wide`}>
              <span>{tr('listing.approvedBadge')}</span>
            </div>
          )}
          {isListingFresh(item) && (
            <div className={`bg-brand-orange text-white ${THEME.fonts.heading} text-[9px] font-extrabold px-2 py-0.5 rounded shadow-md`}>
              {tr('listing.newBadge')}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onFavoriteToggle}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white text-gray-400 hover:text-rose-500 hover:scale-105 active:scale-95 transition shadow-md z-10 min-w-[28px] min-h-[28px] flex items-center justify-center"
          title={tr('listing.toggleFavorite')}
        >
          <Heart
            className="w-4 h-4 color-rose-500"
            style={{ fill: isFavorite ? '#F43F5E' : 'none', color: isFavorite ? '#F43F5E' : 'currentColor' }}
          />
        </button>

        <div className={`absolute right-2 bottom-2 z-10 flex items-center gap-1.5 rounded-full bg-transparent px-2.5 py-1 text-sm font-bold text-white drop-shadow-md ${THEME.fonts.mono}`}>
          <Star className="w-[15px] h-[15px] fill-current text-amber-500" />
          <span>{(item.rating || 5).toFixed(2).replace('.', ',')}</span>
          <span className="text-white/85 font-light">({item.reviewsCount || 0})</span>
        </div>
      </div>

      <div className={`p-4 flex flex-col gap-3 ${THEME.fonts.main}`}>
        <div>
          <h3 className={`${THEME.fonts.heading} font-bold text-lg text-text-dark line-clamp-2 leading-tight`}>
            {displayTitle}
          </h3>
          <p className="line-clamp-2 leading-relaxed mt-1 text-gray-500 font-light text-[13px]">
            {item.category === 'housing' ? buildListingSubtitle(item, 4, tr) : item.description}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          {item.hasDropPrice && item.dropPricePerDay && (
            <span className={`text-xs font-light text-gray-400 line-through leading-none ${THEME.fonts.mono}`}>
              {originalPrice} {currencySymbol}
            </span>
          )}
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold text-text-dark ${THEME.fonts.mono}`}>
              {convertedPrice} {currencySymbol}
            </span>
            {item.hasDropPrice ? (
              <span className={`bg-[#FF3B30] text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded tracking-wider leading-none shadow-xs ${THEME.fonts.heading}`}>
                {tr('listing.dropPrice')}
              </span>
            ) : (
              <span className={`text-[10px] text-[#2F7D69] font-bold tracking-wider leading-none ${THEME.fonts.heading}`}>
                {tr('listing.directPrice')}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

interface MapListingPopupMarkerProps extends MapListingPopupProps {
  coords: { lat: number; lng: number };
}

function MapListingPopupMarker({
  coords,
  ...popupProps
}: MapListingPopupMarkerProps) {
  const map = useMap();
  const [placement, setPlacement] = useState<{
    anchorLeft: string;
    anchorTop: string;
  }>({
    anchorLeft: '12px',
    anchorTop: '-50%'
  });

  useEffect(() => {
    if (!map) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const lngSpan = ne.lng() - sw.lng();
    const latSpan = ne.lat() - sw.lat();
    const lngRatio = lngSpan > 0 ? (coords.lng - sw.lng()) / lngSpan : 0.5;
    const latRatio = latSpan > 0 ? (ne.lat() - coords.lat) / latSpan : 0.5;

    setPlacement({
      anchorLeft: lngRatio > 0.5 ? 'calc(-100% - 12px)' : '12px',
      anchorTop: latRatio < 0.3 ? '0px' : latRatio > 0.7 ? '-100%' : '-50%'
    });
  }, [map, coords.lat, coords.lng]);

  return (
    <AdvancedMarker
      position={coords}
      zIndex={1000}
      anchorLeft={placement.anchorLeft}
      anchorTop={placement.anchorTop}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <MapListingPopup {...popupProps} />
      </div>
    </AdvancedMarker>
  );
}

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
  const { tr } = useI18n();
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
                  className={`rounded-full border border-white shadow-md transition-all ${isFirst
                    ? 'w-3 h-3 bg-[#FF7A50] cursor-pointer hover:scale-125 z-50'
                    : 'w-2 h-2 bg-[#FF7A50] z-40'
                    }`}
                  title={isFirst && polygonPoints.length >= 3 ? tr('map.finishArea') : undefined}
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
  hoveredListing = null,
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
  const { tr } = useI18n();
  const [infoWindowListingId, setInfoWindowListingId] = useState<string | null>(null);
  const [popupMode, setPopupMode] = useState<'click' | 'hover' | null>(null);
  const [isMobileMap, setIsMobileMap] = useState(false);
  const [favoriteListingIds, setFavoriteListingIds] = useState<Set<string>>(() => new Set());
  const hoverOpenTimerRef = useRef<number | null>(null);
  const hoverCloseTimerRef = useRef<number | null>(null);
  const isPopupHoveredRef = useRef<boolean>(false);
  const lastMarkerInteractionRef = useRef<number>(0);

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

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(hover: none), (pointer: coarse), (max-width: 767px)');
    const updateIsMobileMap = () => setIsMobileMap(mediaQuery.matches);

    updateIsMobileMap();
    mediaQuery.addEventListener('change', updateIsMobileMap);
    return () => {
      mediaQuery.removeEventListener('change', updateIsMobileMap);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readFavorites = () => {
      try {
        const parsed = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]') as string[];
        setFavoriteListingIds(new Set(parsed));
      } catch {
        setFavoriteListingIds(new Set());
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY) readFavorites();
    };

    readFavorites();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(FAVORITES_CHANGED_EVENT, readFavorites);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, readFavorites);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hoverOpenTimerRef.current !== null) {
        window.clearTimeout(hoverOpenTimerRef.current);
      }
      if (hoverCloseTimerRef.current !== null) {
        window.clearTimeout(hoverCloseTimerRef.current);
      }
    };
  }, []);

  const isFullscreen = isFullscreenProp ?? false;

  const [geoError, setGeoError] = useState<string | null>(null);

  // Compute map center
  const centerCoords = selectedListing
    ? getDistrictCoordsSync(selectedListing.district)
    : listings.length > 0
      ? getDistrictCoordsSync(listings[0].district)
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

  const isDesktopHoverDevice = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  };

  const clearHoverOpenTimer = () => {
    if (hoverOpenTimerRef.current !== null) {
      window.clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = null;
    }
  };

  const clearHoverCloseTimer = () => {
    if (hoverCloseTimerRef.current !== null) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };

  const openListingPopup = (item: Listing, mode: 'click' | 'hover') => {
    clearHoverOpenTimer();
    clearHoverCloseTimer();
    isPopupHoveredRef.current = false;
    setInfoWindowListingId(item.id);
    setPopupMode(mode);
    if (mode === 'hover') {
      onListingHover(item);
    }
  };

  const scheduleHoverPopup = (item: Listing) => {
    if (!isDesktopHoverDevice() || isSelectionActive || popupMode === 'click') return;
    clearHoverOpenTimer();
    hoverOpenTimerRef.current = window.setTimeout(() => {
      openListingPopup(item, 'hover');
    }, 1000);
    onListingHover(item);
  };

  const scheduleHoverClose = () => {
    clearHoverOpenTimer();
    if (popupMode !== 'hover') {
      onListingHover(null);
      return;
    }
    clearHoverCloseTimer();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      if (!isPopupHoveredRef.current) {
        setInfoWindowListingId(null);
        setPopupMode(null);
        onListingHover(null);
      }
    }, 180);
  };

  const closeListingPopup = () => {
    clearHoverOpenTimer();
    clearHoverCloseTimer();
    isPopupHoveredRef.current = false;
    setInfoWindowListingId(null);
    setPopupMode(null);
    onListingHover(null);
  };

  const toggleFavorite = (event: React.MouseEvent, listingId: string) => {
    event.stopPropagation();

    setFavoriteListingIds(prev => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }

      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(next)));
      window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
      return next;
    });
  };

  const handleMapClick = () => {
    if (Date.now() - lastMarkerInteractionRef.current < 350) return;
    closeListingPopup();
  };

  const listingsWithCoords = listings.map(item => ({
    item,
    coords: utilGetListingCoords(item),
    price: item.hasDropPrice && item.dropPricePerDay ? item.dropPricePerDay : item.pricePerDay
  }));
  const clickedPopupEntry = popupMode === 'click'
    ? listingsWithCoords.find(({ item }) => item.id === infoWindowListingId)
    : undefined;
  const clickedPopupPositionClass = isFullscreen && !isMobileMap
    ? 'left-1/2 top-4 -translate-x-1/2'
    : 'left-3 top-3';
  const mapElement = (
    <div className={`relative transition-all duration-300 flex flex-col ${isFullscreen
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
              {tr('map.cancel')}
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
              {tr('map.apply')}
            </button>
          </div>
        )}

      {/* GEOLOCATION ERROR WARNING BANNER */}
      {geoError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-[#FF7A50] text-[#F4F7F6] px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg animate-fade-in text-center max-w-xs border border-white/20 select-none">
          {geoError}
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
                <h3 className="font-sans text-sm font-extrabold text-[#1E293B]">{tr('map.apiKeyTitle')}</h3>
                <p className="text-xs text-[#5F6978] leading-relaxed">
                  {tr('map.apiKeyBody')}
                </p>
                <div className="text-left text-[11px] text-gray-500 bg-gray-50 border border-gray-150 p-2.5 rounded-xl space-y-1">
                  <div className="font-bold text-[#1E293B] mb-1">{tr('map.apiKeyInstructions')}</div>
                  <div>{tr('map.apiKeyStep1')}</div>
                  <div>{tr('map.apiKeyStep2')}</div>
                  <div>{tr('map.apiKeyStep3')}</div>
                  <div>{tr('map.apiKeyStep4')}</div>
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
                gestureHandling="greedy"
                onClick={isSelectionActive ? undefined : handleMapClick}
                options={{
                  clickableIcons: false
                }}
              >
                {listingsWithCoords.map(({ item, coords, price }) => {
                  const isInfoWindowOpen = infoWindowListingId === item.id;
                  const isSelected = selectedListing?.id === item.id || hoveredListing?.id === item.id || isInfoWindowOpen;
                  const isFavorite = favoriteListingIds.has(item.id);

                  return (
                    <React.Fragment key={item.id}>
                      <AdvancedMarker
                        position={coords}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSelectionActive) {
                              lastMarkerInteractionRef.current = Date.now();
                              openListingPopup(item, 'click');
                            }
                          }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            lastMarkerInteractionRef.current = Date.now();
                          }}
                          onMouseEnter={isSelectionActive ? undefined : () => scheduleHoverPopup(item)}
                          onMouseMove={isSelectionActive ? undefined : () => scheduleHoverPopup(item)}
                          onMouseLeave={isSelectionActive ? undefined : scheduleHoverClose}
                          type="button"
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold shadow-md transition-all ${isSelectionActive
                            ? 'pointer-events-none opacity-80'
                            : 'cursor-pointer hover:bg-[#FF7A50] hover:text-white hover:scale-105'
                            } ${isSelected
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
                          {isFavorite && (
                            <Heart className="w-3 h-3 fill-current text-rose-500 shrink-0" />
                          )}
                        </button>
                      </AdvancedMarker>

                      {isInfoWindowOpen && !isMobileMap && popupMode === 'hover' && (
                        <MapListingPopupMarker
                          coords={coords}
                          item={item}
                          currencySymbol={currencySymbol}
                          currencyRate={currencyRate}
                          tr={tr}
                          isFavorite={isFavorite}
                          onFavoriteToggle={(event) => toggleFavorite(event, item.id)}
                          onSelect={() => {
                            closeListingPopup();
                            onListingSelect(item);
                          }}
                          onMouseEnter={() => {
                            isPopupHoveredRef.current = true;
                            clearHoverCloseTimer();
                          }}
                          onMouseLeave={() => {
                            isPopupHoveredRef.current = false;
                            if (popupMode === 'hover') {
                              scheduleHoverClose();
                            }
                          }}
                        />
                      )}
                    </React.Fragment>
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
              {clickedPopupEntry && (
                <div
                  className={`absolute ${clickedPopupPositionClass} z-30 pointer-events-auto`}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MapListingPopup
                    item={clickedPopupEntry.item}
                    currencySymbol={currencySymbol}
                    currencyRate={currencyRate}
                    tr={tr}
                    isFavorite={favoriteListingIds.has(clickedPopupEntry.item.id)}
                    onFavoriteToggle={(event) => toggleFavorite(event, clickedPopupEntry.item.id)}
                    onSelect={() => {
                      closeListingPopup();
                      onListingSelect(clickedPopupEntry.item);
                    }}
                  />
                </div>
              )}
            </APIProvider>
          )}


        </div>
      )}
    </div>
  );

  return mapElement;
}

