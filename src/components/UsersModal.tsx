import React, { useEffect, useMemo, useState } from 'react';
import { BookingRequest, Listing } from '../types';
import ContactHistoryTab, { ContactHistoryItem } from './ContactHistoryTab';
import FavoritesTab from './FavoritesTab';
import { useFavoriteListings } from '../hooks/useFavoriteListings';

interface UsersModalProps {
  bookings: BookingRequest[];
  listings: Listing[];
  onClose: () => void;
  onViewListing: (listing: Listing) => void;
  currencySymbol: string;
  currencyRate: number;
  initialTab?: TabType;
}

type TabType = 'favorites' | 'whatsapp';

const CONTACT_HISTORY_STORAGE_KEY = 'bali_base_whatsapp_history';

const getHistoryTimestamp = (value?: string) => {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortContactHistory = (items: ContactHistoryItem[]) => [...items].sort((a, b) => {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return getHistoryTimestamp(b.pinnedAt || b.clickedAt) - getHistoryTimestamp(a.pinnedAt || a.clickedAt);
});

export default function UsersModal({
  bookings,
  listings,
  onClose,
  onViewListing,
  currencySymbol,
  currencyRate,
  initialTab,
}: UsersModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'favorites');
  const [contactHistory, setContactHistory] = useState<ContactHistoryItem[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { favoriteIds } = useFavoriteListings();

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const loadData = () => {
    try {
      const history = JSON.parse(
        localStorage.getItem(CONTACT_HISTORY_STORAGE_KEY) || '[]'
      ) as ContactHistoryItem[];

      setContactHistory(sortContactHistory(history.map((historyItem) => {
        const listing = listings.find((item) => item.id === historyItem.id);
        if (!listing) return historyItem;

        return {
          ...historyItem,
          category: listing.category,
          title: listing.title,
          pricePerDay: listing.hasDropPrice && listing.dropPricePerDay
            ? listing.dropPricePerDay
            : listing.pricePerDay,
          image: listing.images[0] || historyItem.image,
          district: listing.district,
        };
      })));
    } catch {
      setContactHistory([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [listings]);

  const favorites = useMemo(
    () => listings.filter((item) => favoriteIds.has(item.id)),
    [favoriteIds, listings]
  );

  const handleClearContactHistory = () => {
    localStorage.removeItem(CONTACT_HISTORY_STORAGE_KEY);
    setContactHistory([]);
  };

  const handleDeleteContactHistoryItem = (listingId: string) => {
    const nextHistory = contactHistory.filter((item) => item.id !== listingId);
    localStorage.setItem(CONTACT_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    setContactHistory(nextHistory);
  };

  const handlePinContactHistoryItem = (listingId: string) => {
    const now = new Date().toISOString();
    const nextHistory = sortContactHistory(contactHistory.map((item) => (
      item.id === listingId
        ? {
          ...item,
          pinned: !item.pinned,
          pinnedAt: item.pinned ? undefined : item.pinnedAt || now
        }
        : item
    )));
    localStorage.setItem(CONTACT_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    setContactHistory(nextHistory);
  };

  const handleLogout = () => {
    setSuccessMsg('Сессия успешно завершена. Очистка данных пользователя...');
    setTimeout(() => {
      localStorage.removeItem('bali_base_favorites');
      localStorage.removeItem(CONTACT_HISTORY_STORAGE_KEY);
      onClose();
      window.location.reload();
    }, 1500);
  };

  const openListing = (listing: Listing) => {
    onViewListing(listing);
    onClose();
  };

  if (activeTab === 'favorites') {
    return (
      <FavoritesTab
        favorites={favorites}
        currencySymbol={currencySymbol}
        currencyRate={currencyRate}
        onViewListing={openListing}
        onClose={onClose}
        onLogout={handleLogout}
        successMsg={successMsg}
      />
    );
  }

  return (
    <ContactHistoryTab
      bookings={bookings}
      history={contactHistory}
      listings={listings}
      currencySymbol={currencySymbol}
      currencyRate={currencyRate}
      onViewListing={openListing}
      onDeleteItem={handleDeleteContactHistoryItem}
      onPinItem={handlePinContactHistoryItem}
      onClear={handleClearContactHistory}
      onClose={onClose}
      onLogout={handleLogout}
      successMsg={successMsg}
    />
  );
}
