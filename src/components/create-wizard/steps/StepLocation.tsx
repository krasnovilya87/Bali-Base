import React, { useEffect, useState } from 'react';
import { APIProvider, Map as GMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Check, Locate, MapPin, Maximize, Minimize, Minus, Plus, RefreshCw, Search } from 'lucide-react';
import { fetchAddressFromCoords } from '../geo';
import { DEFAULT_BALI_CENTER, getDefaultDistrictNameSync, getDistrictCoords } from '../../../utils/geo';
import { LeafletFallbackMap, MapViewControllerHelper } from '../WizardMapHelpers';
import { useI18n } from '../../../i18nContext';

type LatLng = { lat: number; lng: number };

type StepLocationProps = {
  apiKey: string;
  hasValidKey: boolean;
  isMapExpanded: boolean;
  setIsMapExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  pickedCoords: LatLng | null;
  setPickedCoords: React.Dispatch<React.SetStateAction<LatLng | null>>;
  address: string;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
  district: string;
  setDistrict: React.Dispatch<React.SetStateAction<string>>;
  iframeZoom: number;
  setIframeZoom: React.Dispatch<React.SetStateAction<number>>;
  handleAddressChange: (value: string) => void;
  handleInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  triggerDirectSearch: (query: string) => Promise<void>;
  mapSuggestions: any[];
  showSuggestionsDropdown: boolean;
  setShowSuggestionsDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  isSearchingMap: boolean;
  handleSelectSuggestion: (suggestion: any) => void;
};

const StepLocation: React.FC<StepLocationProps> = ({
  apiKey,
  hasValidKey,
  isMapExpanded,
  setIsMapExpanded,
  pickedCoords,
  setPickedCoords,
  address,
  setAddress,
  district,
  setDistrict,
  iframeZoom,
  setIframeZoom,
  handleAddressChange,
  handleInputKeyDown,
  triggerDirectSearch,
  mapSuggestions,
  showSuggestionsDropdown,
  setShowSuggestionsDropdown,
  isSearchingMap,
  handleSelectSuggestion
}) => {
  const { tr } = useI18n();
  const [districtCenter, setDistrictCenter] = useState<LatLng>(DEFAULT_BALI_CENTER);
  const [isPointSelectionActive, setIsPointSelectionActive] = useState(!pickedCoords);

  useEffect(() => {
    let cancelled = false;

    if (pickedCoords) {
      setDistrictCenter(pickedCoords);
      return () => {
        cancelled = true;
      };
    }

    getDistrictCoords(district || getDefaultDistrictNameSync()).then(coords => {
      if (!cancelled) {
        setDistrictCenter(coords);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [district, pickedCoords]);

  const handlePickedCoordsChange = async (latLng: LatLng) => {
    setPickedCoords(latLng);
    setAddress(tr('wizard.detectingAddress'));
    const result = await fetchAddressFromCoords(latLng.lat, latLng.lng);
    setAddress(result.address);
    setDistrict(result.district);
  };

  return (
    <div
      className={`transition-all duration-350 animate-fade-in ${isMapExpanded
        ? 'fixed inset-0 z-[1020] bg-white flex flex-col'
        : 'w-full h-full relative overflow-hidden flex flex-col min-h-[380px]'
        }`}
    >
      <div className="w-full h-full relative bg-[#E5E7EB] overflow-hidden flex-grow animate-fade-in">
        {hasValidKey ? (
          <APIProvider apiKey={apiKey} libraries={['places']}>
            <GMap
              defaultZoom={13}
              defaultCenter={pickedCoords || districtCenter}
              mapId="DEMO_MAP_ID"
              disableDefaultUI={true}
              gestureHandling="greedy"
              options={{
                clickableIcons: false
              }}
              onClick={async (event) => {
                if (!isPointSelectionActive || !event.detail?.latLng) return;

                await handlePickedCoordsChange({
                  lat: event.detail.latLng.lat,
                  lng: event.detail.latLng.lng
                });
              }}
              className="w-full h-full animate-fade-in"
            >
              {pickedCoords && (
                <AdvancedMarker position={pickedCoords} title={tr('wizard.objectLocation')} />
              )}

              <MapViewControllerHelper
                pickedCoords={pickedCoords}
                iframeZoom={iframeZoom}
              />
            </GMap>
          </APIProvider>
        ) : (
          <div className="w-full h-full relative animate-fade-in">
            <LeafletFallbackMap
              pickedCoords={pickedCoords}
              setPickedCoords={setPickedCoords}
              setAddress={setAddress}
              zoom={iframeZoom}
              setZoom={setIframeZoom}
              district={district}
              setDistrict={setDistrict}
              isPointSelectionActive={isPointSelectionActive}
            />
          </div>
        )}

        <div className="absolute top-4 left-4 right-16 sm:right-auto sm:w-[325px] z-[150]">
          <div className="relative">
            <input
              type="text"
              placeholder={tr('wizard.locationSearch')}
              value={address}
              onChange={event => handleAddressChange(event.target.value)}
              onKeyDown={handleInputKeyDown}
              onFocus={() => {
                if (mapSuggestions.length > 0) setShowSuggestionsDropdown(true);
              }}
              className="w-full bg-[#F4F7F6]/95 backdrop-blur-sm border-[0.5px] border-[#94A3B8]/40 focus:border-[#FF7A50] rounded-2xl pl-10 pr-10 py-3 text-xs focus:ring-0 focus:outline-none transition-colors duration-150 shadow-md font-sans text-[#1E293B]"
            />
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF7A50]" />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {isSearchingMap ? (
                <RefreshCw className="w-4 h-4 text-[#FF7A50] animate-spin" />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (address && address.trim().length >= 3) {
                      triggerDirectSearch(address);
                    }
                  }}
                  className="text-[#5F6978] hover:text-[#FF7A50] transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {showSuggestionsDropdown && mapSuggestions.length > 0 && (
              <div className="absolute top-[48px] left-0 right-0 bg-white border-[0.5px] border-[#94A3B8]/40 rounded-2xl shadow-xl overflow-hidden z-[200] max-h-[220px] overflow-y-auto animate-fade-in scrollbar-thin">
                <div className="py-1">
                  {mapSuggestions.map((suggestion, index) => {
                    const addressObj = suggestion.address || {};
                    const placeName = suggestion.name || addressObj.amenity || addressObj.shop || addressObj.tourism || addressObj.historic || addressObj.building || tr('wizard.locationFallback');
                    const secondLine = suggestion.display_name.split(',').slice(1, 4).map((part: string) => part.trim()).join(', ');
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#FF7A50]/5 border-b-[0.5px] border-slate-100 last:border-b-0 transition-colors flex flex-col gap-0.5 cursor-pointer"
                      >
                        <span className="font-sans font-bold text-[#1E293B] text-[11px] truncate flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-[#FF7A50] shrink-0" />
                          {placeName}
                        </span>
                        {secondLine && (
                          <span className="font-sans text-[10px] text-[#5F6978] truncate pl-4.5 block">
                            {secondLine}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-[100] select-none">
          <div className="bg-white text-[#FF7A50] px-3.5 py-1.5 font-sans font-extrabold text-[11px] rounded-full border-[0.5px] border-[#94A3B8]/40 shadow-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A50] animate-pulse" />
            <span>{district || getDefaultDistrictNameSync()}</span>
          </div>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setIsPointSelectionActive(prev => !prev)}
            className={`w-10 h-10 rounded-full border-[0.5px] border-[#94A3B8]/30 select-none shadow-md flex items-center justify-center transition cursor-pointer active:scale-95 group ${isPointSelectionActive
              ? 'bg-[#FF7A50] text-white hover:bg-[#E05A30]'
              : 'bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50]'
              }`}
            title={tr('location.selectOnMap')}
            aria-label={tr('location.selectOnMap')}
          >
            <MapPin className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          <div className="h-[1px] bg-white/70 mx-2" />

          <button
            type="button"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  async (position) => {
                    const pos = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    };
                    await handlePickedCoordsChange(pos);
                  },
                  () => {
                    alert(tr('wizard.geoPermission'));
                  }
                );
              } else {
                alert(tr('wizard.geoUnsupported'));
              }
            }}
            className="w-10 h-10 rounded-full border-[0.5px] border-[#94A3B8]/30 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] select-none shadow-md flex items-center justify-center transition cursor-pointer active:scale-95 group"
            title={tr('wizard.myLocation')}
          >
            <Locate className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          <button
            type="button"
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            className="w-10 h-10 rounded-full border-[0.5px] border-[#94A3B8]/30 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] select-none shadow-md flex items-center justify-center transition cursor-pointer active:scale-95 group"
            title={isMapExpanded ? tr('wizard.collapseMap') : tr('wizard.expandMap')}
          >
            {isMapExpanded ? (
              <Minimize className="w-5 h-5 transition-transform group-hover:scale-110" />
            ) : (
              <Maximize className="w-5 h-5 transition-transform group-hover:scale-110" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIframeZoom(prev => Math.min(20, prev + 1))}
            className="w-10 h-10 rounded-full border-[0.5px] border-[#94A3B8]/30 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] select-none shadow-md flex items-center justify-center transition cursor-pointer active:scale-95 group"
            title={tr('wizard.zoomIn')}
          >
            <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          <button
            type="button"
            onClick={() => setIframeZoom(prev => Math.max(8, prev - 1))}
            className="w-10 h-10 rounded-full border-[0.5px] border-[#94A3B8]/30 bg-[#F4F7F6] hover:bg-white text-[#1E293B] hover:text-[#FF7A50] select-none shadow-md flex items-center justify-center transition cursor-pointer active:scale-95 group"
            title={tr('wizard.zoomOut')}
          >
            <Minus className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>
        </div>

        {isMapExpanded && (
          <button
            type="button"
            onClick={() => setIsMapExpanded(false)}
            className="absolute bottom-4 right-4 z-[105] px-5 py-2.5 bg-[#FF7A50] hover:bg-[#FF7A50]/95 text-[#F4F7F6] font-sans font-black text-xs rounded-xl shadow-lg transition-transform duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 select-none animate-scale-up"
          >
            <Check className="w-4 h-4" />
            {tr('wizard.saveAndCollapse')}
          </button>
        )}
      </div>
    </div>
  );
};

export default StepLocation;
