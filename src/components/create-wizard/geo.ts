const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Canggu: { lat: -8.6481, lng: 115.1385 },
  Ubud: { lat: -8.5069, lng: 115.2625 },
  Seminyak: { lat: -8.6821, lng: 115.1513 },
  Uluwatu: { lat: -8.8290, lng: 115.0860 },
  Sanur: { lat: -8.6805, lng: 115.2638 },
  Jimbaran: { lat: -8.7779, lng: 115.1685 }
};

export const findClosestDistrict = (lat: number, lng: number): string => {
  let closest = 'Canggu';
  let minDist = Infinity;

  for (const [name, coords] of Object.entries(DISTRICT_COORDINATES)) {
    const dist = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2));
    if (dist < minDist) {
      minDist = dist;
      closest = name;
    }
  }
  return closest;
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

        let detectedDistrict = '';
        const possibleDistricts = ['Canggu', 'Ubud', 'Seminyak', 'Uluwatu', 'Sanur', 'Jimbaran'];
        const addressTextLower = JSON.stringify(addressObj).toLowerCase() + ' ' + data.display_name.toLowerCase();

        for (const dist of possibleDistricts) {
          if (addressTextLower.includes(dist.toLowerCase())) {
            detectedDistrict = dist;
            break;
          }
        }

        if (!detectedDistrict) {
          detectedDistrict = findClosestDistrict(lat, lng);
        }

        return {
          address: formattedAddress || `Координаты: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          district: detectedDistrict
        };
      }
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }
  return {
    address: `Координаты GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    district: findClosestDistrict(lat, lng)
  };
};
