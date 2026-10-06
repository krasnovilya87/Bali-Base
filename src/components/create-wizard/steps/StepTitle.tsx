import React from 'react';
import { MapPin } from 'lucide-react';
import { ROOM_TYPE_LABELS, UNIT_TYPE_OPTIONS } from '../constants';
import { useI18n } from '../../../i18nContext';
import { getGoogleMapsSearchText, isGoogleMapsLink } from './useLocationStep';
import FeatureScooterDetails from './features/FeatureScooterDetails';

type RoomType = keyof typeof ROOM_TYPE_LABELS;
type UnitType = typeof UNIT_TYPE_OPTIONS[number];

type StepTitleProps = {
  category: string;
  subCategory: string;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  isGeneratedScooterDescription?: (value: string) => boolean;
  getSeoLengthVerdict: (length: number) => { color: string };
  roomType: RoomType;
  setRoomType: React.Dispatch<React.SetStateAction<RoomType>>;
  unitType: UnitType | '';
  setUnitType: React.Dispatch<React.SetStateAction<UnitType | ''>>;
  roomCount: number | undefined;
  setRoomCount: React.Dispatch<React.SetStateAction<number | undefined>>;
  vehicleModel?: string;
  setVehicleModel?: React.Dispatch<React.SetStateAction<string>>;
  vehicleModelQuantity?: number;
  setVehicleModelQuantity?: React.Dispatch<React.SetStateAction<number | undefined>>;
  vehicleEngineDisplacementCc?: number;
  setVehicleEngineDisplacementCc?: React.Dispatch<React.SetStateAction<number | undefined>>;
  vehicleColor?: string;
  setVehicleColor?: React.Dispatch<React.SetStateAction<string>>;
  mapSuggestions?: any[];
  showSuggestionsDropdown?: boolean;
  setShowSuggestionsDropdown?: (v: boolean) => void;
  handleAddressChange?: (val: string) => void;
  triggerDirectSearch?: (q: string) => void;
  handleSelectSuggestion?: (sug: any) => void;
  setPickedCoords?: (c: { lat: number; lng: number } | null) => void;
  isSearchingMap?: boolean;
};

const StepTitle: React.FC<StepTitleProps> = ({
  category,
  subCategory,
  title,
  setTitle,
  description,
  setDescription,
  isGeneratedScooterDescription,
  getSeoLengthVerdict,
  roomType,
  setRoomType,
  unitType,
  setUnitType,
  roomCount,
  setRoomCount,
  vehicleModel = '',
  setVehicleModel,
  vehicleModelQuantity,
  setVehicleModelQuantity,
  vehicleEngineDisplacementCc,
  setVehicleEngineDisplacementCc,
  vehicleColor = '',
  setVehicleColor,
  mapSuggestions,
  showSuggestionsDropdown,
  setShowSuggestionsDropdown,
  handleAddressChange,
  triggerDirectSearch,
  handleSelectSuggestion,
  setPickedCoords,
  isSearchingMap
}) => {
  const { tr } = useI18n();
  const showsUnitTypeAndCount = category === 'housing' && ['private_suite', 'entire_place'].includes(subCategory);
  const isDetailedTransportWizard = category === 'transport' && ['scooters', 'motorcycles', 'cars'].includes(subCategory);
  const [roomCountInput, setRoomCountInput] = React.useState(roomCount === undefined ? '' : String(roomCount));

  React.useEffect(() => {
    setRoomCountInput(roomCount === undefined ? '' : String(roomCount));
  }, [roomCount]);

  React.useEffect(() => {
    if (category === 'housing' && subCategory === 'private_room' && roomCount === undefined) setRoomCount(1);
  }, [category, roomCount, setRoomCount, subCategory]);

  const handleRoomCountInputChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setRoomCountInput(digitsOnly);
    if (!digitsOnly) {
      setRoomCount(undefined);
      return;
    }
    setRoomCount(Math.max(1, Math.min(50, Number(digitsOnly))));
  };

  const normalizeRoomCountInput = () => {
    setRoomCountInput(roomCount === undefined ? '' : String(Math.max(1, Math.min(50, roomCount))));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {isDetailedTransportWizard && setVehicleModel && setVehicleColor && setVehicleModelQuantity && setVehicleEngineDisplacementCc ? (
        <FeatureScooterDetails
          subCategory={subCategory}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          isGeneratedScooterDescription={isGeneratedScooterDescription || (() => false)}
          vehicleModel={vehicleModel}
          setVehicleModel={setVehicleModel}
          vehicleModelQuantity={vehicleModelQuantity}
          setVehicleModelQuantity={setVehicleModelQuantity}
          vehicleEngineDisplacementCc={vehicleEngineDisplacementCc}
          setVehicleEngineDisplacementCc={setVehicleEngineDisplacementCc}
          vehicleColor={vehicleColor}
          setVehicleColor={setVehicleColor}
        />
      ) : (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold block text-[#1E293B]">
              {tr(category === 'housing' ? 'wizard.housingObjectName' : 'wizard.objectName')}
            </label>
            <span className={`font-mono font-bold ${getSeoLengthVerdict(title.length).color}`}>{title.length} / 60</span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={title}
              placeholder={category === 'housing' ? tr('wizard.housingObjectNamePlaceholder') : undefined}
              onPaste={async event => {
                const paste = (event.clipboardData || (window as any).clipboardData).getData('text');
                if (category === 'housing' && isGoogleMapsLink(paste)) {
                  event.preventDefault();
                  const searchText = getGoogleMapsSearchText(paste);
                  if (searchText && searchText !== paste.trim()) {
                    const titleText = searchText.replace(/(^|[\s-])(\p{L})/gu, (_, separator, letter) => separator + letter.toLocaleUpperCase()).slice(0, 60);
                    setTitle(titleText);
                  }
                  triggerDirectSearch?.(paste);
                  setShowSuggestionsDropdown?.(false);
                  return;
                }
                const atMatch = paste.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                const qMatch = paste.match(/[?&]q=([-+\d\.]+),([-+\d\.]+)/);
                const latLngMatch = atMatch || qMatch;
                if (category === 'housing' && latLngMatch) {
                  const lat = parseFloat(latLngMatch[1]);
                  const lng = parseFloat(latLngMatch[2]);
                  setPickedCoords?.({ lat, lng });
                  triggerDirectSearch?.(`${lat},${lng}`);
                  setShowSuggestionsDropdown?.(false);
                }
              }}
              onChange={event => {
                const value = event.target.value.replace(/(^|[\s-])(\p{L})/gu, (_, separator, letter) => separator + letter.toLocaleUpperCase());
                setTitle(value);
                if (category === 'housing' && handleAddressChange) handleAddressChange(value);
              }}
              maxLength={60}
              className="w-full bg-white border-0 rounded-2xl px-4 py-3 text-xs focus:ring-0 focus:outline-none transition-colors duration-150 font-sans"
            />
            {showSuggestionsDropdown && mapSuggestions && mapSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-56 overflow-auto">
                {mapSuggestions.map((suggestion, index) => {
                  const placeName = suggestion.name || suggestion.structured_formatting?.main_text || suggestion.display_name || '';
                  const secondLine = suggestion.structured_formatting?.secondary_text
                    || suggestion.formatted_address
                    || (suggestion.display_name !== placeName ? suggestion.display_name : '');

                  return (
                    <button
                      key={suggestion.place_id || index}
                      type="button"
                      onClick={() => {
                        handleSelectSuggestion?.(suggestion);
                        setTitle(placeName);
                        setShowSuggestionsDropdown?.(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#FF7A50]/5 border-b-[0.5px] border-slate-100 last:border-b-0 transition-colors flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-sans font-bold text-[#1E293B] text-[11px] truncate flex items-center gap-1.5 w-full">
                        <MapPin className="w-3 h-3 text-[#FF7A50] shrink-0" />
                        <span className="truncate">{placeName}</span>
                      </span>
                      {secondLine && (
                        <span className="font-sans text-[10px] text-[#5F6978] truncate pl-4.5 block w-full">
                          {secondLine}
                        </span>
                      )}
                    </button>
                  );
                })}
                {isSearchingMap && <div className="px-3 py-2 text-xs text-gray-500">{tr('wizard.searching')}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {showsUnitTypeAndCount && (
        <div className="space-y-2">
          <label className="font-semibold block text-xs text-[#1E293B]">{tr('wizard.unitTypeLabel')}</label>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
            {UNIT_TYPE_OPTIONS.map(value => {
              const isSelected = unitType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUnitType(current => current === value ? '' : value)}
                  className={`pl pl-interactive min-w-[112px] px-3 py-3 rounded-xl border-0 text-xs font-bold transition active:scale-95 sm:min-w-0 ${isSelected ? 'selected text-[#1E293B] ring-0' : 'text-gray-600'}`}
                >
                  {tr(`wizard.unitType.${value}`)}
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold block text-xs text-[#1E293B]">
              {unitType ? tr('wizard.unitCountByType', { unitType: tr(`wizard.unitType.${unitType}`) }) : tr('wizard.unitCount')}
            </label>
            <input
              type="number"
              min={1}
              max={50}
              inputMode="numeric"
              value={roomCountInput}
              onChange={event => handleRoomCountInputChange(event.target.value)}
              onBlur={normalizeRoomCountInput}
              className="w-full bg-white border-0 rounded-2xl px-4 py-3 text-xs focus:ring-0 focus:outline-none transition-colors duration-150 font-sans"
            />
          </div>
        </div>
      )}

      {category === 'housing' && subCategory === 'private_room' && (
        <div className="space-y-2">
          <label className="font-semibold block text-xs text-[#1E293B]">{tr('wizard.roomType')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.entries(ROOM_TYPE_LABELS) as Array<[RoomType, string]>).map(([value, label]) => {
              const isSelected = roomType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRoomType(value)}
                  className={`pl pl-interactive px-3 py-3 rounded-xl border-0 text-xs font-bold transition active:scale-95 ${isSelected ? 'selected text-[#1E293B] ring-0' : 'text-gray-600'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold block text-xs text-[#1E293B]">{tr('wizard.roomCountByType', { roomType: ROOM_TYPE_LABELS[roomType] })}</label>
            <input
              type="number"
              min={1}
              max={50}
              inputMode="numeric"
              value={roomCountInput}
              onChange={event => handleRoomCountInputChange(event.target.value)}
              onBlur={normalizeRoomCountInput}
              className="w-full bg-white border-0 rounded-2xl px-4 py-3 text-xs focus:ring-0 focus:outline-none transition-colors duration-150 font-sans"
            />
          </div>
          <p className="text-[10.5px] leading-relaxed text-gray-400 px-1 py-1">{tr('wizard.roomTypeNotice')}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold block text-[#1E293B]">{tr('wizard.description')}</label>
          <span className={`font-mono font-bold ${description.length > 240 ? 'text-rose-500' : 'text-gray-400'}`}>{description.length} / 250</span>
        </div>
        <textarea
          placeholder={tr('wizard.descriptionPlaceholder')}
          value={description}
          onChange={event => setDescription(event.target.value)}
          maxLength={250}
          rows={3}
          className="w-full bg-white border-0 rounded-2xl px-4 py-3 text-xs focus:ring-0 focus:outline-none transition-colors duration-150 font-sans"
        />
      </div>
    </div>
  );
};

export default StepTitle;
