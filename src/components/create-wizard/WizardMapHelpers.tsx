import React, { useEffect, useRef, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { RefreshCw } from 'lucide-react';
import { fetchAddressFromCoords } from './geo';
import { getDefaultDistrictNameSync, getDistrictCoords } from '../../utils/geo';

export function MapViewControllerHelper({
  pickedCoords,
  iframeZoom
}: {
  pickedCoords: { lat: number; lng: number } | null;
  iframeZoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (map && pickedCoords) {
      map.panTo(pickedCoords);
    }
  }, [map, pickedCoords]);

  useEffect(() => {
    if (map) {
      map.setZoom(iframeZoom);
    }
  }, [map, iframeZoom]);

  return null;
}

export function LeafletFallbackMap({
  pickedCoords,
  setPickedCoords,
  setAddress,
  zoom,
  setZoom,
  district,
  setDistrict
}: {
  pickedCoords: { lat: number; lng: number } | null;
  setPickedCoords: (coords: { lat: number; lng: number }) => void;
  setAddress: (addr: string) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  district: string;
  setDistrict: (dist: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [initialCoords, setInitialCoords] = useState<{ lat: number; lng: number } | null>(pickedCoords);

  useEffect(() => {
    if ((window as any).L) {
      setIsLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.id = 'leaflet-css';
    if (!document.getElementById('leaflet-css')) {
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.id = 'leaflet-js';
    script.onload = () => {
      setIsLoaded(true);
    };

    if (!document.getElementById('leaflet-js')) {
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (pickedCoords) {
      setInitialCoords(pickedCoords);
      return () => {
        cancelled = true;
      };
    }

    getDistrictCoords(district || getDefaultDistrictNameSync()).then(coords => {
      if (!cancelled) {
        setInitialCoords(coords);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [district, pickedCoords]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !(window as any).L || !initialCoords) return;

    const L = (window as any).L;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([initialCoords.lat, initialCoords.lng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([initialCoords.lat, initialCoords.lng], {
        draggable: true
      }).addTo(map);

      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        const coords = { lat: position.lat, lng: position.lng };
        setPickedCoords(coords);
        setAddress('Определение адреса...');
        const result = await fetchAddressFromCoords(coords.lat, coords.lng);
        setAddress(result.address);
        setDistrict(result.district);
      });

      map.on('click', async (e: any) => {
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
        marker.setLatLng(e.latlng);
        setPickedCoords(coords);
        setAddress('Определение адреса...');
        const result = await fetchAddressFromCoords(coords.lat, coords.lng);
        setAddress(result.address);
        setDistrict(result.district);
      });

      mapRef.current = map;
      markerRef.current = marker;
    } else {
      const currentLoc = mapRef.current.getCenter();
      const targetLoc = [initialCoords.lat, initialCoords.lng];
      if (Math.abs(currentLoc.lat - initialCoords.lat) > 0.0001 || Math.abs(currentLoc.lng - initialCoords.lng) > 0.0001) {
        mapRef.current.panTo(targetLoc);
        markerRef.current.setLatLng(targetLoc);
      }
      if (mapRef.current.getZoom() !== zoom) {
        mapRef.current.setZoom(zoom);
      }
    }
  }, [initialCoords, isLoaded, zoom, setAddress, setDistrict, setPickedCoords]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 250);
    }
  }, [zoom]);

  return (
    <div className="w-full h-full relative bg-[#F4F7F6]">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-sans font-bold text-[#5F6978] bg-[#F4F7F6] gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#FF7A50]" />
          Загрузка карты...
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" style={{ zIndex: 10 }} />
    </div>
  );
}
