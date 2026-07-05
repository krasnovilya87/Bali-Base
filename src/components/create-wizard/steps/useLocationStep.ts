import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Listing } from '../../../types';
import { findClosestDistrict } from '../geo';
import { ensureGoogleMapsLibraries } from '../../../utils/googleMapsLoader';

type UseLocationStepParams = {
  initialListing?: Listing | null;
  step: number;
  title: string;
  apiKey: string;
  hasValidKey: boolean;
};

export const useLocationStep = ({
  initialListing,
  step,
  title,
  apiKey,
  hasValidKey
}: UseLocationStepParams) => {
  const [district, setDistrict] = useState<string>(initialListing?.district || 'Canggu');
  const [address, setAddress] = useState<string>(initialListing?.address || '');
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(
    initialListing?.locationCoords || null
  );
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [iframeZoom, setIframeZoom] = useState<number>(14);
  const [mapSuggestions, setMapSuggestions] = useState<any[]>([]);
  const [selectedGooglePlaceId, setSelectedGooglePlaceId] = useState<string>(initialListing?.googlePlaceId || initialListing?.placeId || '');
  const [isSearchingMap, setIsSearchingMap] = useState<boolean>(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState<boolean>(false);
  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    if (!hasValidKey) return;

    ensureGoogleMapsLibraries(apiKey, ['places']).catch(error => {
      console.warn('Google Maps preload failed, falling back to Nominatim:', error);
    });
  }, [apiKey, hasValidKey]);

  const getGooglePlacesLibrary = async () => {
    if (!hasValidKey || !(globalThis as any).google?.maps) return null;

    const maps = (globalThis as any).google.maps;
    if (!maps.places && maps.importLibrary) {
      await maps.importLibrary('places');
    }

    return maps.places || null;
  };

  const getBaliBounds = () => {
    const maps = (globalThis as any).google?.maps;
    if (!maps?.LatLngBounds) return undefined;

    return new maps.LatLngBounds(
      { lat: -9.05, lng: 114.35 },
      { lat: -8.0, lng: 115.85 }
    );
  };

  const fetchGoogleSuggestions = async (query: string) => {
    const places = await getGooglePlacesLibrary();
    if (!places?.AutocompleteService) return [];

    const service = new places.AutocompleteService();
    const input = /\bbali\b/i.test(query) ? query : `${query} Bali`;

    return new Promise<any[]>((resolve) => {
      service.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'id' },
          bounds: getBaliBounds(),
          strictBounds: false
        },
        (predictions: any[] | null, status: string) => {
          const okStatus = (globalThis as any).google?.maps?.places?.PlacesServiceStatus?.OK || 'OK';
          if (status !== okStatus || !predictions) {
            resolve([]);
            return;
          }

          resolve(predictions.map(prediction => ({
            source: 'google',
            place_id: prediction.place_id,
            name: prediction.structured_formatting?.main_text || prediction.description,
            display_name: prediction.description,
            description: prediction.description,
            structured_formatting: prediction.structured_formatting,
            type: prediction.types?.[0] || 'Google Places'
          })));
        }
      );
    });
  };

  const getGooglePlaceDetails = async (placeId: string) => {
    const places = await getGooglePlacesLibrary();
    if (!places?.PlacesService) return null;

    const service = new places.PlacesService(document.createElement('div'));

    return new Promise<any | null>((resolve) => {
      service.getDetails(
        {
          placeId,
          fields: ['name', 'formatted_address', 'geometry', 'address_components', 'types']
        },
        (place: any | null, status: string) => {
          const okStatus = (globalThis as any).google?.maps?.places?.PlacesServiceStatus?.OK || 'OK';
          resolve(status === okStatus ? place : null);
        }
      );
    });
  };

  const detectDistrictFromGooglePlace = (place: any, lat: number, lng: number) => {
    const components = place?.address_components || [];
    const text = [
      place?.name,
      place?.formatted_address,
      ...components.map((component: any) => component.long_name)
    ].join(' ').toLowerCase();

    const possibleDistricts = ['Canggu', 'Ubud', 'Seminyak', 'Uluwatu', 'Sanur', 'Nusa Dua', 'Kuta', 'Jimbaran', 'Amed', 'Lovina'];
    return possibleDistricts.find(dist => text.includes(dist.toLowerCase())) || findClosestDistrict(lat, lng);
  };

  const fetchSuggestions = async (query: string) => {
    if (!query || query.trim().length < 3) {
      setMapSuggestions([]);
      setShowSuggestionsDropdown(false);
      return;
    }

    setIsSearchingMap(true);
    try {
      const googleSuggestions = await fetchGoogleSuggestions(query);
      if (googleSuggestions.length > 0) {
        setMapSuggestions(googleSuggestions);
        setShowSuggestionsDropdown(true);
        return;
      }

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
    setPickedCoords(null);
    setSelectedGooglePlaceId('');

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

  const handleSelectSuggestion = async (sug: any): Promise<{ lat: number; lng: number } | null> => {
    if (sug.source === 'google' && sug.place_id) {
      const place = await getGooglePlaceDetails(sug.place_id);
      const location = place?.geometry?.location;
      const lat = typeof location?.lat === 'function' ? location.lat() : location?.lat;
      const lng = typeof location?.lng === 'function' ? location.lng() : location?.lng;

      if (typeof lat === 'number' && typeof lng === 'number') {
        const placeName = place?.name || sug.name || sug.display_name;
        const formattedAddress = place?.formatted_address || sug.display_name || '';
        const cleanAddress = formattedAddress && placeName && !formattedAddress.startsWith(placeName)
          ? `${placeName}, ${formattedAddress}`
          : (formattedAddress || placeName);

        setAddress(cleanAddress);
        setPickedCoords({ lat, lng });
        setSelectedGooglePlaceId(sug.place_id);
        setDistrict(detectDistrictFromGooglePlace(place, lat, lng));
        setShowSuggestionsDropdown(false);
        return { lat, lng };
      }
    }

    const lat = parseFloat(sug.lat);
    const lng = parseFloat(sug.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

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
    setSelectedGooglePlaceId('');

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
    return { lat, lng };
  };

  const triggerDirectSearch = async (query: string) => {
    setIsSearchingMap(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=114.4,-8.0,115.8,-9.0&bounded=0&addressdetails=1&limit=1&accept-language=ru,en`;
      const googleSuggestions = await fetchGoogleSuggestions(query);
      if (googleSuggestions.length > 0) {
        return await handleSelectSuggestion(googleSuggestions[0]);
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return await handleSelectSuggestion(data[0]);
        }
      }
    } catch (err) {
      console.error('Direct search error:', err);
    } finally {
      setIsSearchingMap(false);
    }
    return null;
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
    selectedGooglePlaceId,
    handleAddressChange,
    handleInputKeyDown,
    triggerDirectSearch,
    handleSelectSuggestion
  };
};
