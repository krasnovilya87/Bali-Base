import React from 'react';
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
  vehicleColor?: string;
  setVehicleColor?: React.Dispatch<React.SetStateAction<string>>;
  // optional location helpers (passed from WizardStepContent)
  mapSuggestions?: any[];
  showSuggestionsDropdown?: boolean;
  setShowSuggestionsDropdown?: (v: boolean) => void;
  handleAddressChange?: (val: string) => void;
  triggerDirectSearch?: (q: string) => void;
  handleSelectSuggestion?: (sug: any) => void;
  setAddress?: (a: string) => void;
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
  vehicleColor = '',
  setVehicleColor,
  mapSuggestions,
  showSuggestionsDropdown,
  setShowSuggestionsDropdown,
  handleAddressChange,
  triggerDirectSearch,
  handleSelectSuggestion,
  setAddress,
  setPickedCoords,
  isSearchingMap
}) => {
  const { tr } = useI18n();
  const showsUnitTypeAndCount = category === 'housing' && ['private_suite', 'entire_place'].includes(subCategory);
  const isScooterWizard = category === 'transport' && subCategory === 'scooters';
  const [roomCountInput, setRoomCountInput] = React.useState(roomCount === undefined ? '' : String(roomCount));

  React.useEffect(() => {
    setRoomCountInput(roomCount === undefined ? '' : String(roomCount));
  }, [roomCount]);

  React.useEffect(() => {
    if (category === 'housing' && subCategory === 'private_room' && roomCount === undefined) {
      setRoomCount(1);
    }
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
    {isScooterWizard && setVehicleModel && setVehicleColor && setVehicleModelQuantity ? (
      <FeatureScooterDetails
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        isGeneratedScooterDescription={isGeneratedScooterDescription || (() => false)}
        vehicleModel={vehicleModel}
        setVehicleModel={setVehicleModel}
        vehicleModelQuantity={vehicleModelQuantity}
        setVehicleModelQuantity={setVehicleModelQuantity}
        vehicleColor={vehicleColor}
        setVehicleColor={setVehicleColor}
      />
    ) : (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold block text-[#1E293B]">
            {tr('wizard.objectName')}
          </label>
          <span className={`font-mono font-bold ${getSeoLengthVerdict(title.length).color}`}>
            {title.length} / 60
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={title}
            onPaste={async (e) => {
              const paste = (e.clipboardData || (window as any).clipboardData).getData('text');
              if (category === 'housing' && isGoogleMapsLink(paste)) {
                e.preventDefault();
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
              const v = event.target.value.replace(/(^|[\s-])(\p{L})/gu, (_, separator, letter) => separator + letter.toLocaleUpperCase());
              setTitle(v);
              if (category === 'housing' && handleAddressChange) {
                handleAddressChange(v);
              }
            }}
            maxLength={60}
            className="w-full bg-white border-0 rounded-2xl px-4 py-3 text-xs focus:ring-0 focus:outline-none transition-colors duration-150 font-sans"
          />

          {showSuggestionsDropdown && mapSuggestions && mapSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-56 overflow-auto">
              {mapSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    handleSelectSuggestion?.(sug);
                    const placeName = sug.name || sug.structured_formatting?.main_text || sug.display_name || '';
                    setTitle(placeName);
                    setShowSuggestionsDropdown?.(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs"
                >
                  <div className="truncate">{sug.name || sug.structured_formatting?.main_text || sug.display_name}</div>
                </button>
              ))}
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
                className={`pl pl-interactive min-w-[112px] px-3 py-3 rounded-xl border-0 text-xs font-bold transition active:scale-95 sm:min-w-0 ${
                  isSelected
                    ? 'selected text-[#1E293B] ring-0'
                    : 'text-gray-600'
                }`}
              >
                {tr(`wizard.unitType.${value}`)}
              </button>
            );
          })}
        </div>
        <div className="space-y-1.5">
          <label className="font-semibold block text-xs text-[#1E293B]">
            {unitType
              ? tr('wizard.unitCountByType', { unitType: tr(`wizard.unitType.${unitType}`) })
              : tr('wizard.unitCount')}
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
                className={`pl pl-interactive px-3 py-3 rounded-xl border-0 text-xs font-bold transition active:scale-95 ${
                  isSelected
                    ? 'selected text-[#1E293B] ring-0'
                    : 'text-gray-600'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="space-y-1.5">
          <label className="font-semibold block text-xs text-[#1E293B]">
            {tr('wizard.roomCountByType', { roomType: ROOM_TYPE_LABELS[roomType] })}
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
        <p className="text-[10.5px] leading-relaxed text-gray-400 px-1 py-1">
          {tr('wizard.roomTypeNotice')}
        </p>
      </div>
    )}

    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <label className="font-semibold block text-[#1E293B]">{tr('wizard.description')}</label>
        <span className={`font-mono font-bold ${description.length > 240 ? 'text-rose-500' : 'text-gray-400'}`}>
          {description.length} / 250
        </span>
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
