import React, { useEffect, useState } from 'react';
import { Listing } from '../types';
import ContactHistoryTab, { ContactHistoryItem } from './ContactHistoryTab';
import FavoritesTab from './FavoritesTab';

interface UsersModalProps {
  listings: Listing[];
  onClose: () => void;
  onViewListing: (listing: Listing) => void;
  currencySymbol: string;
  currencyRate: number;
  initialTab?: TabType;
}

type TabType = 'favorites' | 'whatsapp';

export default function UsersModal({
  listings,
  onClose,
  onViewListing,
  currencySymbol,
  currencyRate,
  initialTab,
}: UsersModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'favorites');
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [contactHistory, setContactHistory] = useState<ContactHistoryItem[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const loadData = () => {
    try {
      const favoriteIds = JSON.parse(localStorage.getItem('bali_base_favorites') || '[]') as string[];
      setFavorites(listings.filter((item) => favoriteIds.includes(item.id)));
    } catch {
      setFavorites([]);
    }

    try {
      const history = JSON.parse(
        localStorage.getItem('bali_base_whatsapp_history') || '[]'
      ) as ContactHistoryItem[];

      setContactHistory(history.map((historyItem) => {
        const listing = listings.find((item) => item.id === historyItem.id);
        if (!listing) return historyItem;

        return {
          ...historyItem,
          title: listing.title,
          pricePerDay: listing.hasDropPrice && listing.dropPricePerDay
            ? listing.dropPricePerDay
            : listing.pricePerDay,
          image: listing.images[0] || historyItem.image,
          district: listing.district,
        };
      }));
    } catch {
      setContactHistory([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [listings]);

  const handleRemoveFavorite = (id: string) => {
    setFavorites((current) => current.filter((item) => item.id !== id));
  };

  const handleClearContactHistory = () => {
    localStorage.removeItem('bali_base_whatsapp_history');
    setContactHistory([]);
  };

  const handleLogout = () => {
    setSuccessMsg('Сессия успешно завершена. Очистка данных пользователя...');
    setTimeout(() => {
      localStorage.removeItem('bali_base_favorites');
      localStorage.removeItem('bali_base_whatsapp_history');
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
        onRemoveFavorite={handleRemoveFavorite}
        onClose={onClose}
        onLogout={handleLogout}
        successMsg={successMsg}
      />
    );
  }

  return (
    <ContactHistoryTab
      history={contactHistory}
      listings={listings}
      currencySymbol={currencySymbol}
      currencyRate={currencyRate}
      onViewListing={openListing}
      onClear={handleClearContactHistory}
      onClose={onClose}
      onLogout={handleLogout}
      successMsg={successMsg}
    />
  );
}
