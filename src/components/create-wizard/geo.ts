import { findDistrictByCoords, getDefaultDistrictNameSync, getDistrictNamesFromGeoJSONSync } from '../../utils/geo';

const detectDistrictFromText = (text: string) => {
  const lowerText = text.toLowerCase();
  return getDistrictNamesFromGeoJSONSync().find(district => lowerText.includes(district.toLowerCase())) || '';
};

export const fetchAddressFromCoords = async (lat: number, lng: number): Promise<{ address: string; district: string }> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ru,en`
    );
    if (response.ok) {
      const data = await response.json();
      if (data) {
        const addressObj = data.address || {};
        const placeName = data.name || addressObj.amenity || addressObj.shop || addressObj.tourism || addressObj.historic || addressObj.building;

        let formattedAddress = '';
        if (placeName && !placeName.includes('GPS') && isNaN(Number(placeName))) {
          const streetInfo = addressObj.road ? `, ${addressObj.road}` : '';
          const suburbInfo = addressObj.suburb || addressObj.village || addressObj.neighborhood || '';
          const locDetails = suburbInfo ? ` (${suburbInfo})` : '';
          formattedAddress = `${placeName}${streetInfo}${locDetails}`;
        } else {
          const parts = data.display_name.split(',');
          formattedAddress = parts.slice(0, 3).map((p: string) => p.trim()).join(', ');
        }

        const geoDistrict = await findDistrictByCoords(lat, lng);
        const textDistrict = detectDistrictFromText(
          `${JSON.stringify(addressObj)} ${data.display_name} ${placeName || ''}`
        );

        return {
          address: formattedAddress || `Координаты: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          district: geoDistrict || textDistrict || getDefaultDistrictNameSync()
        };
      }
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }
  const geoDistrict = await findDistrictByCoords(lat, lng);
  return {
    address: `Координаты GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    district: geoDistrict || getDefaultDistrictNameSync()
  };
};
