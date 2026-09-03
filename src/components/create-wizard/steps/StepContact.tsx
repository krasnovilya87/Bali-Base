import React, { useEffect, useRef, useState } from 'react';
import PhoneInput from '../../PhoneInput';
import { useI18n } from '../../../i18nContext';
import { Check, MapPin, RefreshCw, Search, User, Building2 } from 'lucide-react';
import { ensureGoogleMapsLibraries } from '../../../utils/googleMapsLoader';
import { getGoogleMapsSearchText, isGoogleMapsLink, resolveGoogleMapsLink } from './useLocationStep';

type StepContactProps = {
  category: string;
  subCategory: string;
  apiKey: string;
  hasValidKey: boolean;
  sellerType: string;
  setSellerType: React.Dispatch<React.SetStateAction<string>>;
  ownerName: string;
  setOwnerName: React.Dispatch<React.SetStateAction<string>>;
  sellerCompanyName: string;
  setSellerCompanyName: React.Dispatch<React.SetStateAction<string>>;
  sellerGoogleMapsUrl: string;
  setSellerGoogleMapsUrl: React.Dispatch<React.SetStateAction<string>>;
  sellerGooglePlaceId: string;
  setSellerGooglePlaceId: React.Dispatch<React.SetStateAction<string>>;
  whatsappInput: string;
  handlePhoneChange: (value: string, whatsappFormatted?: string) => void;
};

const StepContact: React.FC<StepContactProps> = ({
  category,
  subCategory,
  apiKey,
  hasValidKey,
  sellerType,
  setSellerType,
  ownerName,
  setOwnerName,
  sellerCompanyName,
  setSellerCompanyName,
  sellerGoogleMapsUrl,
  setSellerGoogleMapsUrl,
  sellerGooglePlaceId,
  setSellerGooglePlaceId,
  whatsappInput,
  handlePhoneChange
}) => {
  const { tr } = useI18n();
  const isScooterWizard = category === 'transport' && subCategory === 'scooters';
  const isCompanySeller = isScooterWizard && sellerType === 'company';
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);
  const companySearchTimer = useRef<any>(null);

  useEffect(() => {
    if (!isScooterWizard || sellerType) return;
    setSellerType('private');
  }, [isScooterWizard, sellerType, setSellerType]);

  useEffect(() => {
    if (!hasValidKey || !isScooterWizard) return;
    ensureGoogleMapsLibraries(apiKey, ['places']).catch(error => {
      console.warn('Google Maps company search preload failed:', error);
    });
  }, [apiKey, hasValidKey, isScooterWizard]);

  const formatOwnerName = (value: string) =>
    value.replace(/(^|[\s-])(\p{L})/gu, (_, separator, letter) =>
      separator + letter.toLocaleUpperCase()
    );

  const getPlacesLibrary = async () => {
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

  const fetchCompanySuggestions = async (query: string) => {
    const searchText = getGoogleMapsSearchText(query);
    if (!searchText || searchText.trim().length < 3) {
      setCompanySuggestions([]);
      setShowCompanySuggestions(false);
      return;
    }

    const places = await getPlacesLibrary();
    if (!places?.AutocompleteService) return;

    setIsSearchingCompany(true);
    const service = new places.AutocompleteService();
    const input = /\bbali\b/i.test(searchText) ? searchText : `${searchText} Bali`;

    service.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'id' },
        bounds: getBaliBounds(),
        strictBounds: false
      },
      (predictions: any[] | null, status: string) => {
        const okStatus = (globalThis as any).google?.maps?.places?.PlacesServiceStatus?.OK || 'OK';
        setIsSearchingCompany(false);
        if (status !== okStatus || !predictions) {
          setCompanySuggestions([]);
          setShowCompanySuggestions(false);
          return;
        }
        setCompanySuggestions(predictions.map(prediction => ({
          placeId: prediction.place_id,
          name: prediction.structured_formatting?.main_text || prediction.description,
          description: prediction.description
        })));
        setShowCompanySuggestions(true);
      }
    );
  };

  const handleCompanyInputChange = (value: string) => {
    setSellerGoogleMapsUrl(value);
    setSellerGooglePlaceId('');
    setSellerCompanyName(formatOwnerName(getGoogleMapsSearchText(value)).slice(0, 60));

    if (companySearchTimer.current) {
      clearTimeout(companySearchTimer.current);
    }

    companySearchTimer.current = setTimeout(() => {
      fetchCompanySuggestions(value);
    }, 400);
  };

  const triggerCompanySearch = async () => {
    const query = sellerGoogleMapsUrl || sellerCompanyName;
    if (!query.trim()) return;
    setIsSearchingCompany(true);
    const resolved = await resolveGoogleMapsLink(query);
    if (resolved.placeId) {
      setSellerGooglePlaceId(resolved.placeId);
    }
    await fetchCompanySuggestions(resolved.searchText || query);
    setIsSearchingCompany(false);
  };

  const selectCompanySuggestion = (suggestion: any) => {
    setSellerCompanyName(formatOwnerName(suggestion.name || ''));
    setSellerGoogleMapsUrl(suggestion.placeId
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suggestion.name || suggestion.description || '')}&query_place_id=${encodeURIComponent(suggestion.placeId)}`
      : ''
    );
    setSellerGooglePlaceId(suggestion.placeId || '');
    setCompanySuggestions([]);
    setShowCompanySuggestions(false);
  };

  const companyInputValue =
    sellerGoogleMapsUrl && !isGoogleMapsLink(sellerGoogleMapsUrl)
      ? sellerGoogleMapsUrl
      : sellerCompanyName || sellerGoogleMapsUrl;

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-sm font-bold font-sans text-[#1E293B] tracking-wider block ml-1">{tr('wizard.contacts')}</h3>

      <div className="flex flex-col gap-4 pt-2">
        {isScooterWizard && (
          <div className="space-y-2">
            <span className="text-xs font-semibold font-sans text-gray-400 tracking-wider block ml-1">{tr('filters.transport.sellerType')}</span>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { value: 'private', Icon: User },
                { value: 'company', Icon: Building2 }
              ].map(({ value, Icon }) => {
                const isActive = sellerType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSellerType(value)}
                    aria-pressed={isActive}
                    className={`pl pl-interactive min-h-11 rounded-2xl border px-3 py-2 text-xs font-extrabold transition cursor-pointer select-none flex items-center justify-center gap-2 ${
                      isActive
                        ? 'selected border-[#FF7A50] bg-[#FF7A50] text-white shadow-[0_10px_18px_rgba(255,122,80,0.18)]'
                        : 'border-[#E5E7EB] bg-white text-[#1E293B] hover:border-[#FF7A50] hover:text-[#FF7A50]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{tr(`filters.transport.sellerType.${value}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isCompanySeller ? (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder={tr('wizard.companyGoogleMapsPlaceholder')}
                aria-label={tr('wizard.companyGoogleMapsPlaceholder')}
                value={companyInputValue}
                onChange={event => {
                  const value = event.target.value;
                  handleCompanyInputChange(value);
                }}
                onFocus={() => {
                  if (companySuggestions.length > 0) setShowCompanySuggestions(true);
                }}
                className="w-full !bg-white !border-0 p-2.5 pl-9 pr-10 rounded-xl text-xs font-mono focus:outline-none focus:ring-0"
              />
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FF7A50]" />
              <button
                type="button"
                onClick={triggerCompanySearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6978] hover:text-[#FF7A50] transition-colors cursor-pointer"
                aria-label={tr('wizard.searching')}
              >
                {isSearchingCompany ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>

              {showCompanySuggestions && companySuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[44px] z-50 max-h-56 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {companySuggestions.map(suggestion => (
                    <button
                      key={suggestion.placeId || suggestion.description}
                      type="button"
                      onClick={() => selectCompanySuggestion(suggestion)}
                      className="w-full border-b border-slate-100 px-3 py-2 text-left text-xs last:border-b-0 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2 font-bold text-[#1E293B]">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF7A50]" />
                        <span className="truncate">{suggestion.name}</span>
                        {sellerGooglePlaceId === suggestion.placeId && <Check className="h-3.5 w-3.5 shrink-0 text-[#FF7A50]" />}
                      </span>
                      <span className="mt-0.5 block truncate pl-5 text-[10px] text-[#5F6978]">{suggestion.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <input
            type="text"
            placeholder={tr('wizard.name')}
            aria-label={tr('wizard.name')}
            value={ownerName}
            onChange={event => setOwnerName(formatOwnerName(event.target.value))}
            className="w-full !bg-white !border-0 p-2.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-0"
          />
        )}

        <PhoneInput
          value={whatsappInput}
          onChange={(displayValue, whatsappNumber) => handlePhoneChange(displayValue, whatsappNumber)}
          placeholder={tr('wizard.whatsapp')}
          ariaLabel={tr('wizard.whatsapp')}
          className="w-full !bg-white !border-0 p-2.5 pr-14 rounded-xl text-xs font-mono focus:outline-none focus:ring-0"
        />
      </div>
    </div>
  );
};

export default StepContact;
