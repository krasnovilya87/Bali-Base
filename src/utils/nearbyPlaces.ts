import { LatLng, ListingNearbyRoute, ListingNearbySpot } from '../types';
import { getHaversineDistance } from './geo';
import { ensureGoogleMapsLibraries } from './googleMapsLoader';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const SUPERMARKET_NAMES = [
  'pepito',
  'frestive',
  'festive',
  'delta dewata',
  'bintang',
  'coco supermarket',
  'papaya',
  'bali jaya',
  'tiara dewata',
  "hardy's",
  'hardys',
  'popular deli',
  'foodmart',
  'grand lucky'
];

const SPORT_STORE_KEYWORDS = [
  'shop',
  'store',
  'outlet',
  'equipment',
  'gear',
  'rental',
  'retail',
  'apparel',
  'clothing',
  'sportswear',
  'surf shop',
  'bike shop',
  'bicycle shop',
  'магазин'
];

const SPORT_STORE_TYPES = ['store', 'shopping_mall', 'shoe_store', 'clothing_store', 'bicycle_store'];

type NearbyPlace = {
  id?: string;
  displayName?: string | null;
  location?: google.maps.LatLng | null;
  rating?: number | null;
  types?: string[];
};

const normalizePlaceName = (value: string) =>
  value.toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();

const isSportVenue = (place: NearbyPlace) => {
  const name = normalizePlaceName(place.displayName || '');
  const types = place.types || [];
  const hasStoreType = types.some(type => SPORT_STORE_TYPES.includes(type));
  const hasStoreName = SPORT_STORE_KEYWORDS.some(keyword => name.includes(normalizePlaceName(keyword)));
  return !hasStoreType && !hasStoreName;
};

const isAllowedSupermarket = (place: NearbyPlace) => {
  const name = normalizePlaceName(place.displayName || '');
  return SUPERMARKET_NAMES.some(allowed => name.includes(normalizePlaceName(allowed)));
};

const isDistrict = (district: string | undefined, names: string[]) => {
  const normalized = normalizePlaceName(district || '');
  return names.some(name => normalized.includes(normalizePlaceName(name)));
};

const searchNearbyPlaces = async (
  placesLibrary: any,
  origin: LatLng,
  request: {
    keyword: string;
    radius: number;
    type?: string;
    filter?: (place: NearbyPlace) => boolean;
  }
): Promise<NearbyPlace[]> => {
  if (!placesLibrary?.Place?.searchNearby) return [];

  const fallbackTypeByKeyword: Record<string, string> = {
    gym: 'gym',
    beach: 'beach',
    yoga: 'yoga_studio'
  };
  const includedType = request.type || fallbackTypeByKeyword[request.keyword];
  const { places = [] } = await placesLibrary.Place.searchNearby({
    fields: ['id', 'displayName', 'location', 'rating', 'types'],
    locationRestriction: {
      center: origin,
      radius: request.radius
    },
    ...(includedType ? { includedTypes: [includedType] } : {}),
    maxResultCount: 20,
    rankPreference: placesLibrary.SearchNearbyRankPreference?.DISTANCE || 'DISTANCE',
    region: 'id'
  });

  return places
    .filter((place: NearbyPlace) => Boolean(place.displayName && place.location))
    .filter((place: NearbyPlace) => request.filter ? request.filter(place) : true)
    .slice(0, 5);
};

const getPlacePosition = (place: NearbyPlace): LatLng | null => {
  const location = place.location;
  if (!location) return null;
  return { lat: location.lat(), lng: location.lng() };
};

const getPlaceDedupeKey = (place: NearbyPlace) => {
  if (place.id) return place.id;

  const position = getPlacePosition(place);
  return [
    normalizePlaceName(place.displayName || ''),
    position?.lat.toFixed(5) || '',
    position?.lng.toFixed(5) || ''
  ].join('|');
};

const dedupePlaces = (places: NearbyPlace[]) => {
  const byKey = new Map<string, NearbyPlace>();
  places.forEach(place => byKey.set(getPlaceDedupeKey(place), place));
  return Array.from(byKey.values());
};

const sortPlacesByStraightDistance = (
  origin: LatLng,
  places: NearbyPlace[]
) => places
  .slice()
  .sort((a, b) => {
    const aPosition = getPlacePosition(a);
    const bPosition = getPlacePosition(b);
    if (!aPosition && !bPosition) return 0;
    if (!aPosition) return 1;
    if (!bPosition) return -1;
    return getHaversineDistance(origin, aPosition) - getHaversineDistance(origin, bPosition);
  });

const searchSupermarketPlaces = async (
  placesLibrary: any,
  origin: LatLng
) => {
  const commonRequest = searchNearbyPlaces(placesLibrary, origin, {
    keyword: 'supermarket',
    type: 'supermarket',
    radius: 5000,
    filter: isAllowedSupermarket
  });

  const results = await commonRequest;
  return sortPlacesByStraightDistance(origin, dedupePlaces(results));
};

const makeSyntheticPlace = (
  name: string,
  position: LatLng
): NearbyPlace => ({
  displayName: name,
  location: new google.maps.LatLng(position.lat, position.lng)
});

const findFastestByBike = (
  origin: LatLng,
  places: NearbyPlace[]
) => new Promise<{ place: NearbyPlace; durationText: string; durationValue: number } | null>((resolve) => {
  const destinations = places
    .slice(0, 5)
    .map(place => place.id ? { placeId: place.id } : place.location)
    .filter(Boolean) as Array<google.maps.Place | google.maps.LatLng>;

  if (destinations.length === 0) {
    resolve(null);
    return;
  }

  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [origin],
      destinations,
      travelMode: google.maps.TravelMode.DRIVING
    },
    (response, status) => {
      if (status !== 'OK') {
        resolve(findClosestByStraightDistance(origin, places));
        return;
      }

      let best: { place: NearbyPlace; durationText: string; durationValue: number } | null = null;
      response?.rows?.[0]?.elements?.forEach((element, index) => {
        if (element.status !== 'OK' || !element.duration?.value) return;
        const candidate = {
          place: places[index],
          durationText: element.duration.text || '',
          durationValue: element.duration.value
        };
        if (!best || candidate.durationValue < best.durationValue) {
          best = candidate;
        }
      });

      resolve(best || findClosestByStraightDistance(origin, places));
    }
  );
});

const findClosestByStraightDistance = (
  origin: LatLng,
  places: NearbyPlace[]
): { place: NearbyPlace; durationText: string; durationValue: number } | null => {
  let best: { place: NearbyPlace; durationText: string; durationValue: number } | null = null;

  places.forEach(place => {
    const location = place.location;
    if (!location) return;
    const destination = { lat: location.lat(), lng: location.lng() };
    const km = getHaversineDistance(origin, destination);
    const minutes = Math.max(1, Math.round((km / 25) * 60));
    const candidate = {
      place,
      durationText: `${minutes} мин`,
      durationValue: minutes * 60
    };

    if (!best || candidate.durationValue < best.durationValue) {
      best = candidate;
    }
  });

  return best;
};

const toNearbySpot = (
  emoji: string,
  title: string,
  fastest: { place: NearbyPlace; durationText: string } | null
): ListingNearbySpot | null => {
  const location = fastest?.place.location;
  if (!fastest?.place.displayName || !location) return null;

  return {
    emoji,
    title,
    desc: fastest.place.displayName,
    time: fastest.durationText ? `${fastest.durationText} \u043d\u0430 \u0431\u0430\u0439\u043a\u0435` : '',
    position: {
      lat: location.lat(),
      lng: location.lng()
    },
    placeId: fastest.place.id,
    rating: fastest.place.rating ?? undefined
  };
};

const calculateRouteToSpot = (
  origin: LatLng,
  destination: LatLng
): Promise<ListingNearbyRoute> => new Promise((resolve, reject) => {
  if (!window.google?.maps?.DirectionsService) {
    reject(new Error('Google Directions API is not available'));
    return;
  }

  const service = new window.google.maps.DirectionsService();
  service.route(
    {
      origin,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING
    },
    (result, status) => {
      if (status !== 'OK' || !result?.routes?.[0]) {
        reject(new Error(`Google Directions failed: ${status}`));
        return;
      }

      const route = result.routes[0];
      const leg = route.legs?.[0];
      const overviewPath = (route.overview_path || []).map(point => ({
        lat: point.lat(),
        lng: point.lng()
      }));

      if (overviewPath.length === 0) {
        reject(new Error('Google Directions returned an empty route'));
        return;
      }

      resolve({
        overviewPath,
        distanceText: leg?.distance?.text,
        durationText: leg?.duration?.text,
        travelMode: 'DRIVING',
        updatedAt: new Date().toISOString()
      });
    }
  );
});

const attachRoutesToNearbySpots = async (
  origin: LatLng,
  spots: ListingNearbySpot[]
): Promise<ListingNearbySpot[]> => Promise.all(
  spots.map(async spot => {
    if (!spot.position) return spot;

    try {
      const route = await calculateRouteToSpot(origin, spot.position);
      return {
        ...spot,
        route,
        time: route.durationText ? `${route.durationText} \u043d\u0430 \u0431\u0430\u0439\u043a\u0435` : spot.time
      };
    } catch (error) {
      console.warn('Nearby route calculation failed during publish:', error);
      return spot;
    }
  })
);

const getStandardSpots = async (
  placesLibrary: any,
  origin: LatLng
) => {
  const restaurantPlaces = await searchNearbyPlaces(placesLibrary, origin, {
    keyword: 'restaurant',
    type: 'restaurant',
    radius: 500
  });
  const supermarketPlaces = await searchSupermarketPlaces(placesLibrary, origin);
  const gymPlaces = await searchNearbyPlaces(placesLibrary, origin, {
    keyword: 'gym',
    radius: 2000,
    filter: isSportVenue
  });
  const beachPlaces = await searchNearbyPlaces(placesLibrary, origin, {
    keyword: 'beach',
    radius: 5000
  });

  const [restaurant, supermarket, gym, beach] = await Promise.all([
    findFastestByBike(origin, restaurantPlaces),
    findFastestByBike(origin, supermarketPlaces),
    findFastestByBike(origin, gymPlaces),
    findFastestByBike(origin, beachPlaces)
  ]);

  return [
    toNearbySpot('🍽️', 'Ресторан', restaurant),
    toNearbySpot('🛒', 'Супермаркет', supermarket),
    toNearbySpot('🏋️', 'Gym', gym),
    toNearbySpot('🏖️', 'Пляж', beach)
  ].filter(Boolean) as ListingNearbySpot[];
};

const getUbudSpots = async (
  placesLibrary: any,
  origin: LatLng
) => {
  const restaurantPlaces = await searchNearbyPlaces(placesLibrary, origin, {
    keyword: 'restaurant',
    type: 'restaurant',
    radius: 500
  });
  const supermarketPlaces = await searchSupermarketPlaces(placesLibrary, origin);
  const yogaPlaces = await searchNearbyPlaces(placesLibrary, origin, {
    keyword: 'yoga',
    radius: 2000,
    filter: isSportVenue
  });
  const monkeyForest = makeSyntheticPlace('Monkey Forest', { lat: -8.5193, lng: 115.2606 });

  const [restaurant, supermarket, yoga, monkeyForestTime] = await Promise.all([
    findFastestByBike(origin, restaurantPlaces),
    findFastestByBike(origin, supermarketPlaces),
    findFastestByBike(origin, yogaPlaces),
    findFastestByBike(origin, [monkeyForest])
  ]);

  return [
    toNearbySpot('🍽️', 'Ресторан', restaurant),
    toNearbySpot('🛒', 'Супермаркет', supermarket),
    toNearbySpot('🧘', 'Yoga', yoga),
    toNearbySpot('🌿', 'Monkey Forest', monkeyForestTime)
  ].filter(Boolean) as ListingNearbySpot[];
};

const getKintamaniSpots = async (
  placesLibrary: any,
  origin: LatLng
) => {
  const restaurantPlaces = await searchNearbyPlaces(placesLibrary, origin, {
    keyword: 'restaurant',
    type: 'restaurant',
    radius: 500
  });
  const supermarketPlaces = await searchSupermarketPlaces(placesLibrary, origin);
  const hotSprings = makeSyntheticPlace('Batur Natural Hot Spring', { lat: -8.2412, lng: 115.4067 });
  const mountBatur = makeSyntheticPlace('Mount Batur', { lat: -8.2423, lng: 115.3754 });

  const [restaurant, supermarket, hotSpringsTime, mountBaturTime] = await Promise.all([
    findFastestByBike(origin, restaurantPlaces),
    findFastestByBike(origin, supermarketPlaces),
    findFastestByBike(origin, [hotSprings]),
    findFastestByBike(origin, [mountBatur])
  ]);

  return [
    toNearbySpot('🍽️', 'Ресторан', restaurant),
    toNearbySpot('🛒', 'Супермаркет', supermarket),
    toNearbySpot('♨️', 'Горячие источники', hotSpringsTime),
    toNearbySpot('🌋', 'Вулкан Батур', mountBaturTime)
  ].filter(Boolean) as ListingNearbySpot[];
};

export const calculateNearbySpotsOnce = async (
  origin?: LatLng | null,
  district?: string
): Promise<ListingNearbySpot[]> => {
  if (!origin) return [];

  const maps = await ensureGoogleMapsLibraries(GOOGLE_MAPS_API_KEY, ['places']);
  const placesLibrary = maps.places;

  const spots = isDistrict(district, ['ubud'])
    ? await getUbudSpots(placesLibrary, origin)
    : isDistrict(district, ['kintamani', 'kintomani'])
      ? await getKintamaniSpots(placesLibrary, origin)
      : await getStandardSpots(placesLibrary, origin);

  return attachRoutesToNearbySpots(origin, spots);
};
