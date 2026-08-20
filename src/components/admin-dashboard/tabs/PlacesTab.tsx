import React, { useMemo, useState } from 'react';
import { MapPin, Plus, RefreshCw, Star, Trash2 } from 'lucide-react';
import {
  createManualPlace,
  loadPlaceLibrary,
  PLACE_LIBRARY_CATEGORIES,
  PlaceLibraryCategory,
  PlaceLibraryState,
  savePlaceLibrary
} from '../../../utils/placeLibrary';
import { useI18n } from '../../../i18nContext';
import Del from '../../Del';

type PlacesTabProps = {
  showToast?: (message: string) => void;
};

export function PlacesTab({ showToast }: PlacesTabProps) {
  const { tr } = useI18n();
  const [library, setLibrary] = useState<PlaceLibraryState>(() => loadPlaceLibrary());
  const [activeCategory, setActiveCategory] = useState<PlaceLibraryCategory>('restaurants');
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [rating, setRating] = useState('');
  const [address, setAddress] = useState('');

  const activeItems = useMemo(
    () => library[activeCategory].items,
    [activeCategory, library]
  );

  const persist = (nextLibrary: PlaceLibraryState, message: string) => {
    setLibrary(nextLibrary);
    savePlaceLibrary(nextLibrary);
    showToast?.(message);
  };

  const handleAddPlace = () => {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    const parsedRating = rating ? Number(rating) : undefined;

    if (!name.trim() || !Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      showToast?.(tr('admin.places.validation'));
      return;
    }

    const item = createManualPlace(
      activeCategory,
      name.trim(),
      parsedLat,
      parsedLng,
      Number.isFinite(parsedRating) ? parsedRating : undefined,
      address.trim() || undefined
    );
    const nextLibrary = {
      ...library,
      [activeCategory]: {
        updatedAt: new Date().toISOString(),
        items: [item, ...library[activeCategory].items]
      }
    };

    persist(nextLibrary, tr('admin.places.added'));
    setName('');
    setLat('');
    setLng('');
    setRating('');
    setAddress('');
  };

  const handleDeletePlace = (placeId: string) => {
    const nextLibrary = {
      ...library,
      [activeCategory]: {
        ...library[activeCategory],
        items: library[activeCategory].items.filter(item => item.id !== placeId)
      }
    };

    persist(nextLibrary, tr('admin.places.deleted'));
  };

  const handleRefreshLibrary = () => {
    const fresh = loadPlaceLibrary();
    setLibrary(fresh);
    showToast?.(tr('admin.places.updated'));
  };

  return (
    <div className="space-y-5 animate-fade-in text-left">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#1E293B]">{tr('admin.places.title')}</h3>
            <p className="text-[11px] text-gray-400 font-semibold">
              {tr('admin.places.body')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshLibrary}
            className="h-9 px-3 rounded-full bg-[#F4F7F6] text-[#1E293B] text-[11px] font-extrabold flex items-center gap-1.5 hover:bg-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {tr('admin.places.refresh')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-3 space-y-1 h-fit">
          {PLACE_LIBRARY_CATEGORIES.map(category => {
            const isActive = activeCategory === category.id;
            const count = library[category.id].items.length;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`w-full px-3 py-2.5 rounded-2xl text-left text-xs font-extrabold flex items-center justify-between transition ${
                  isActive ? 'bg-[#FF7A50] text-white' : 'text-[#1E293B] hover:bg-[#F4F7F6]'
                }`}
              >
                <span>{tr(`admin.places.category.${category.id}`)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h4 className="text-sm font-extrabold text-[#1E293B]">{tr('admin.places.addTitle')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <input value={name} onChange={event => setName(event.target.value)} placeholder={tr('admin.places.name')} className="bg-[#F4F7F6] rounded-xl px-3 py-2 text-xs font-semibold outline-none" />
              <input value={lat} onChange={event => setLat(event.target.value)} placeholder="Lat" className="bg-[#F4F7F6] rounded-xl px-3 py-2 text-xs font-semibold outline-none" />
              <input value={lng} onChange={event => setLng(event.target.value)} placeholder="Lng" className="bg-[#F4F7F6] rounded-xl px-3 py-2 text-xs font-semibold outline-none" />
              <input value={rating} onChange={event => setRating(event.target.value)} placeholder={tr('admin.places.rating')} className="bg-[#F4F7F6] rounded-xl px-3 py-2 text-xs font-semibold outline-none" />
              <button type="button" onClick={handleAddPlace} className="bg-[#2F7D69] text-white rounded-xl px-3 py-2 text-xs font-extrabold flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" />
                {tr('admin.places.add')}
              </button>
            </div>
            <input value={address} onChange={event => setAddress(event.target.value)} placeholder={tr('admin.places.address')} className="w-full bg-[#F4F7F6] rounded-xl px-3 py-2 text-xs font-semibold outline-none" />
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[1fr_96px_92px_44px] gap-2 px-4 py-3 bg-[#F8FAFC] text-[10px] font-black uppercase tracking-wide text-gray-400">
              <span>{tr('admin.places.name')}</span>
              <span>{tr('admin.places.coordinates')}</span>
              <span>{tr('admin.places.rating')}</span>
              <span />
            </div>
            <div className="divide-y divide-gray-100">
              {activeItems.length === 0 ? (
                <div className="p-6 text-center text-xs font-semibold text-gray-400">{tr('admin.places.empty')}</div>
              ) : activeItems.map(item => (
                <div key={item.id} className="grid grid-cols-[1fr_96px_92px_44px] gap-2 px-4 py-3 items-center">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#1E293B] truncate">{item.name}</div>
                    <div className="text-[10px] text-gray-400 font-semibold truncate">
                      {item.address || item.source}
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{item.position.lat.toFixed(3)}, {item.position.lng.toFixed(3)}</span>
                  </div>
                  <div className="text-[11px] font-bold text-[#FF7A50] flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {item.rating?.toFixed(1) || '-'}
                  </div>
                  <Del
                    title={tr('admin.places.deleteTitle')}
                    message={tr('admin.places.deleteBody', { name: item.name })}
                    confirmLabel={tr('admin.places.deleteConfirm')}
                    cancelLabel={tr('common.cancel')}
                    onConfirm={() => handleDeletePlace(item.id)}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition"
                    titleAttr={tr('myListings.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Del>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
