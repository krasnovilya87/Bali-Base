import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Listing } from '../../../types';
import { findClosestDistrict } from '../geo';

type UseLocationStepParams = {
  initialListing?: Listing | null;
  step: number;
  title: string;
};

export const useLocationStep = ({
  initialListing,
  step,
  title
}: UseLocationStepParams) => {
  const [district, setDistrict] = useState<string>(initialListing?.district || 'Canggu');
  const [address, setAddress] = useState<string>(initialListing?.address || '');
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>({ lat: -8.6481, lng: 115.1385 });
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [iframeZoom, setIframeZoom] = useState<number>(14);
  const [mapSuggestions, setMapSuggestions] = useState<any[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState<boolean>(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState<boolean>(false);
  const debounceTimer = useRef<any>(null);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.trim().length < 3) {
      setMapSuggestions([]);
      setShowSuggestionsDropdown(false);
      return;
    }

    setIsSearchingMap(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=114.4,-8.0,115.8,-9.0&bounded=0&addressdetails=1&limit=6&accept-language=ru,en`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMapSuggestions(data);
        setShowSuggestionsDropdown(data.length > 0);
      }
    } catch (err) {
      console.error('Suggestions fetch error:', err);
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);

    const normalized = val.toLowerCase();
    if (normalized.includes('ubud')) setDistrict('Ubud');
    else if (normalized.includes('seminyak')) setDistrict('Seminyak');
    else if (normalized.includes('uluwatu')) setDistrict('Uluwatu');
    else if (normalized.includes('sanur')) setDistrict('Sanur');
    else if (normalized.includes('nusa dua')) setDistrict('Nusa Dua');
    else if (normalized.includes('kuta')) setDistrict('Kuta');
    else if (normalized.includes('jimbaran')) setDistrict('Jimbaran');
    else if (normalized.includes('amed')) setDistrict('Amed');
    else if (normalized.includes('lovina')) setDistrict('Lovina');
    else setDistrict('Canggu');

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 400);
  };

  const handleSelectSuggestion = (sug: any) => {
    const lat = parseFloat(sug.lat);
    const lng = parseFloat(sug.lon);

    const addressObj = sug.address || {};
    const placeName = sug.name || addressObj.amenity || addressObj.shop || addressObj.tourism || addressObj.historic || addressObj.building;
    let formattedAddress = '';

    if (placeName && !placeName.includes('GPS') && isNaN(Number(placeName))) {
      const streetInfo = addressObj.road ? `, ${addressObj.road}` : '';
      const suburbInfo = addressObj.suburb || addressObj.village || addressObj.neighborhood || '';
      const locDetails = suburbInfo ? ` (${suburbInfo})` : '';
      formattedAddress = `${placeName}${streetInfo}${locDetails}`;
    } else {
      const parts = sug.display_name.split(',');
      formattedAddress = parts.slice(0, 3).map((part: string) => part.trim()).join(', ');
    }

    setAddress(formattedAddress);
    setPickedCoords({ lat, lng });

    let detectedDistrict = '';
    const possibleDistricts = ['Canggu', 'Ubud', 'Seminyak', 'Uluwatu', 'Sanur', 'Jimbaran'];
    const lowerText = JSON.stringify(addressObj).toLowerCase() + ' ' + sug.display_name.toLowerCase();
    for (const dist of possibleDistricts) {
      if (lowerText.includes(dist.toLowerCase())) {
        detectedDistrict = dist;
        break;
      }
    }
    if (!detectedDistrict) {
      detectedDistrict = findClosestDistrict(lat, lng);
    }

    setDistrict(detectedDistrict);
    setShowSuggestionsDropdown(false);
  };

  const triggerDirectSearch = async (query: string) => {
    setIsSearchingMap(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=114.4,-8.0,115.8,-9.0&bounded=0&addressdetails=1&limit=1&accept-language=ru,en`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          handleSelectSuggestion(data[0]);
        }
      }
    } catch (err) {
      console.error('Direct search error:', err);
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (mapSuggestions && mapSuggestions.length > 0) {
        handleSelectSuggestion(mapSuggestions[0]);
      } else if (address && address.trim().length >= 3) {
        triggerDirectSearch(address);
      }
    }
  };

  useEffect(() => {
    if (step === 4 && !address.trim() && title.trim()) {
      handleAddressChange(title);
      triggerDirectSearch(title);
    }
  }, [step, title, address]);

  return {
    district,
    setDistrict,
    address,
    setAddress,
    pickedCoords,
    setPickedCoords,
    isMapExpanded,
    setIsMapExpanded,
    iframeZoom,
    setIframeZoom,
    mapSuggestions,
    isSearchingMap,
    showSuggestionsDropdown,
    setShowSuggestionsDropdown,
    handleAddressChange,
    handleInputKeyDown,
    triggerDirectSearch,
    handleSelectSuggestion
  };
};
