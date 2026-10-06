import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Listing } from '../../../types';
import { findDistrictByCoords, getDefaultDistrictNameSync, getDistrictNamesFromGeoJSONSync } from '../../../utils/geo';
import { ensureGoogleMapsLibraries } from '../../../utils/googleMapsLoader';
import { auth } from '../../../firebase';
import { getFirebaseRequestHeaders } from '../../../utils/firebaseRequestHeaders';

type UseLocationStepParams = {
  initialListing?: Listing | null;
  category: string;
  step: number;
  title: string;
  apiKey: string;
  hasValidKey: boolean;
};

const extractGooglePlaceIdFromText = (value: string) => {
  const match = value.match(/[?&](?:query_place_id|place_id)=([^&#]+)/i);
  return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '';
};

export const isGoogleMapsLink = (value: string) =>
  /(?:google\.[^/\s]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(value);

export const getGoogleMapsSearchText = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    const queryValue = url.searchParams.get('query') || url.searchParams.get('q');
    if (queryValue && !/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(queryValue.trim())) {
      return queryValue.trim();
    }

    const placeMatch = url.pathname.match(/\/place\/([^/]+)/i);
    if (placeMatch) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
    }
  } catch {
    // Plain text object names are handled below.
  }

  return trimmed;
};

const getGooglePlacesMapsLinkResolveApiUrl = () => {
  const apiBaseUrl =
    (import.meta as any).env?.VITE_API_BASE_URL ||
    (globalThis as any).BALI_BASE_API_URL ||
    '';

  return `${String(apiBaseUrl).replace(/\/$/, '')}/api/google-places/maps-link/resolve`;
};

export const resolveGoogleMapsLink = async (value: string) => {
  if (!isGoogleMapsLink(value)) {
    return {
      placeId: extractGooglePlaceIdFromText(value),
      searchText: getGoogleMapsSearchText(value)
    };
  }

  const localResult = {
    placeId: extractGooglePlaceIdFromText(value),
    searchText: getGoogleMapsSearchText(value)
  };

  if (localResult.placeId || localResult.searchText !== value.trim()) {
    return localResult;
  }

  try {
    if (!auth.currentUser) return localResult;
    const response = await fetch(getGooglePlacesMapsLinkResolveApiUrl(), {
      method: 'POST',
      headers: await getFirebaseRequestHeaders({ contentType: 'application/json' }),
      body: JSON.stringify({ url: value.trim() })
    });
    if (!response.ok) return localResult;

    const result = await response.json() as { placeId?: string; searchText?: string };
    return {
      placeId: result.placeId || localResult.placeId,
      searchText: result.searchText || localResult.searchText
    };
  } catch (error) {
    console.warn('Google Maps link resolution failed:', error);
    return localResult;
  }
};

export const useLocationStep = ({
  initialListing,
  category,
  step,
  title,
  apiKey,
  hasValidKey
}: UseLocationStepParams) => {
  const defaultDistrict = getDefaultDistrictNameSync();
  const districtOptions = getDistrictNamesFromGeoJSONSync();
  const findDistrictInText = (text: string) =>
    districtOptions.find(dist => text.includes(dist.toLowerCase())) || '';
  const [district, setDistrict] = useState<string>(initialListing?.district || defaultDistrict);
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
    if (!hasValidKey || category === 'life' || step < 3) return;

    ensureGoogleMapsLibraries(apiKey, ['places']).catch(error => {
      console.warn('Google Maps preload failed, falling back to Nominatim:', error);
    });
  }, [apiKey, category, hasValidKey, step]);

  const getGooglePlacesLibrary = async () => {
    if (!hasValidKey || category === 'life' || !(globalThis as any).google?.maps) return null;

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
    if (!places?.Place?.searchByText) return [];

    const searchText = getGoogleMapsSearchText(query);
    const baliBounds = getBaliBounds();
    const { places: results = [] } = await places.Place.searchByText({
      textQuery: searchText,
      fields: ['id', 'displayName', 'formattedAddress', 'types'],
      ...(baliBounds ? { locationRestriction: baliBounds } : {}),
      maxResultCount: 5,
      region: 'id'
    });

    return results.map((place: any) => ({
      source: 'google',
      place_id: place.id,
      name: place.displayName || place.formattedAddress,
      display_name: place.formattedAddress || place.displayName,
      description: place.formattedAddress || place.displayName,
      formatted_address: place.formattedAddress,
      type: place.types?.[0] || 'Google Places'
    }));
  };

  const getGooglePlaceDetails = async (placeId: string) => {
    const places = await getGooglePlacesLibrary();
    if (!places?.Place) return null;

    const place = new places.Place({ id: placeId });
    await place.fetchFields({
      fields: ['displayName', 'formattedAddress', 'location', 'addressComponents', 'types']
    });

    return {
      name: place.displayName,
      formatted_address: place.formattedAddress,
      geometry: { location: place.location },
      address_components: (place.addressComponents || []).map((component: any) => ({
        long_name: component.longText,
        short_name: component.shortText,
        types: component.types
      })),
      types: place.types
    };
  };

  const detectDistrictFromGooglePlace = async (place: any, lat: number, lng: number) => {
    const components = place?.address_components || [];
    const text = [
      place?.name,
      place?.formatted_address,
      ...components.map((component: any) => component.long_name)
    ].join(' ').toLowerCase();

    const geoDistrict = await findDistrictByCoords(lat, lng);
    return findDistrictInText(text) || geoDistrict || defaultDistrict;
  };

  const fetchSuggestions = async (query: string) => {
    const searchText = category === 'life'
      ? getGoogleMapsSearchText(query)
      : (await resolveGoogleMapsLink(query)).searchText;
    if (!searchText || searchText.trim().length < 3) {
      setMapSuggestions([]);
      setShowSuggestionsDropdown(false);
      return;
    }

    setIsSearchingMap(true);
    try {
      const googleSuggestions = await fetchGoogleSuggestions(searchText);
      if (googleSuggestions.length > 0) {
        setMapSuggestions(googleSuggestions);
        setShowSuggestionsDropdown(true);
        return;
      }

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&viewbox=114.4,-8.0,115.8,-9.0&bounded=0&addressdetails=1&limit=6&accept-language=ru,en`;
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
    setDistrict(findDistrictInText(normalized) || defaultDistrict);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 400);
  };

  const handleSelectSuggestion = async (sug: any): Promise<{ lat: number; lng: number } | null> => {
    if (category !== 'life' && sug.source === 'google' && sug.place_id) {
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
        setDistrict(await detectDistrictFromGooglePlace(place, lat, lng));
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
    const lowerText = JSON.stringify(addressObj).toLowerCase() + ' ' + sug.display_name.toLowerCase();
    for (const dist of districtOptions) {
      if (lowerText.includes(dist.toLowerCase())) {
        detectedDistrict = dist;
        break;
      }
    }
    if (!detectedDistrict) {
      detectedDistrict = (await findDistrictByCoords(lat, lng)) || defaultDistrict;
    }

    setDistrict(detectedDistrict);
    setShowSuggestionsDropdown(false);
    return { lat, lng };
  };

  const resolveGooglePlaceIdForListing = async (query: string) => {
    if (selectedGooglePlaceId) return selectedGooglePlaceId;
    const resolvedLink = await resolveGoogleMapsLink(query);
    if (resolvedLink.placeId) {
      setSelectedGooglePlaceId(resolvedLink.placeId);
      return resolvedLink.placeId;
    }

    const searchText = resolvedLink.searchText;
    if (!searchText.trim()) return '';

    try {
      const googleSuggestions = await fetchGoogleSuggestions(searchText);
      const placeId = googleSuggestions[0]?.place_id || '';
      if (placeId) {
        setSelectedGooglePlaceId(placeId);
      }
      return placeId;
    } catch (error) {
      console.warn('Google place_id lookup failed:', error);
      return '';
    }
  };

  const triggerDirectSearch = async (query: string) => {
    const { placeId, searchText } = category === 'life'
      ? { placeId: '', searchText: getGoogleMapsSearchText(query) }
      : await resolveGoogleMapsLink(query);
    if (placeId) {
      const coords = await handleSelectSuggestion({ source: 'google', place_id: placeId });
      if (coords) return coords;
    }

    setIsSearchingMap(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&viewbox=114.4,-8.0,115.8,-9.0&bounded=0&addressdetails=1&limit=1&accept-language=ru,en`;
      const googleSuggestions = await fetchGoogleSuggestions(searchText);
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
    if (category === 'housing' && step === 4 && !address.trim() && title.trim()) {
      handleAddressChange(title);
      triggerDirectSearch(title);
    }
  }, [category, step, title, address]);

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
    resolveGooglePlaceIdForListing,
    handleAddressChange,
    handleInputKeyDown,
    triggerDirectSearch,
    handleSelectSuggestion
  };
};
