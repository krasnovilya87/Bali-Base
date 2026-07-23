import { Dispatch, SetStateAction, useState } from 'react';
import { BookingRequest, FilterState, Listing } from '../../types';
import AdminDashboard from '../../components/AdminDashboard';
import CreateWizard from '../../components/CreateWizard';
import HousingFilters from '../../components/HousingFilters';
import ListingDetails from '../../components/ListingDetails';
import MapSelectModal from '../../components/MapSelectModal';
import MyAddsListing from '../../components/MyAddsListing';
import UsersModal from '../../components/UsersModal';
import { LanguageCode } from '../../i18n';
import { L1_CATEGORIES, SUBCATEGORIES_MAP } from '../menu';

type AppOverlaysProps = {
  activeLanguage: LanguageCode;
  bookings: BookingRequest[];
  currencyRate: number;
  currencySymbol: string;
  currentL2: string[];
  customPoint: { x: number; y: number } | null;
  customRadius: number;
  editingListing: Listing | null;
  filters: FilterState;
  handleAddBooking: (booking: BookingRequest) => void;
  handleDeleteListing: (listingId: string) => void;
  handlePublishListing: (newListing: Listing) => Promise<void>;
  handleToggleListingStatus: (id: string) => void;
  handleUpdateBooking: (booking: BookingRequest) => void;
  handleUpdateBookingStatus: (id: string, status: 'accepted' | 'declined') => void;
  handleUpdateListing: (listing: Listing) => void;
  handleUpdateMenuOverrides: (newOverrides: any) => Promise<void>;
  listings: Listing[];
  menuOverrides: any;
  onRequireAuth: (reasonKey?: string, afterAuth?: () => void) => boolean;
  onSelectedListingClose: () => void;
  primaryL2: string;
  selectedListing: Listing | null;
  setCheckInDate: Dispatch<SetStateAction<string>>;
  setCheckOutDate: Dispatch<SetStateAction<string>>;
  setCustomPoint: Dispatch<SetStateAction<{ x: number; y: number } | null>>;
  setCustomRadius: Dispatch<SetStateAction<number>>;
  setDistrictSearch: Dispatch<SetStateAction<string[]>>;
  setEditingListing: Dispatch<SetStateAction<Listing | null>>;
  setFilters: (filters: FilterState) => void;
  setSelectedListing: Dispatch<SetStateAction<Listing | null>>;
  setPrimaryL2: (subCategoryId: string) => void;
  setShowAdminDashboard: Dispatch<SetStateAction<boolean>>;
  setShowCreateWizard: Dispatch<SetStateAction<boolean>>;
  setShowFiltersModal: Dispatch<SetStateAction<boolean>>;
  setShowMapSelectModal: Dispatch<SetStateAction<boolean>>;
  setShowMyAddsListing: Dispatch<SetStateAction<boolean>>;
  setShowUsersModal: Dispatch<SetStateAction<boolean>>;
  setSortBy: Dispatch<SetStateAction<string>>;
  showAdminDashboard: boolean;
  showCreateWizard: boolean;
  showFiltersModal: boolean;
  showMapSelectModal: boolean;
  showMyAddsListing: boolean;
  showUsersModal: boolean;
  initialCheckInDate: string;
  initialCheckOutDate: string;
  checkInDate: string;
  checkOutDate: string;
  usersModalTab: 'favorites' | 'whatsapp';
};

export default function AppOverlays({
  activeLanguage,
  bookings,
  currencyRate,
  currencySymbol,
  currentL2,
  customPoint,
  customRadius,
  editingListing,
  filters,
  handleAddBooking,
  handleDeleteListing,
  handlePublishListing,
  handleToggleListingStatus,
  handleUpdateBooking,
  handleUpdateBookingStatus,
  handleUpdateListing,
  handleUpdateMenuOverrides,
  listings,
  menuOverrides,
  onRequireAuth,
  onSelectedListingClose,
  primaryL2,
  selectedListing,
  setCheckInDate,
  setCheckOutDate,
  setCustomPoint,
  setCustomRadius,
  setDistrictSearch,
  setEditingListing,
  setFilters,
  setSelectedListing,
  setPrimaryL2,
  setShowAdminDashboard,
  setShowCreateWizard,
  setShowFiltersModal,
  setShowMapSelectModal,
  setShowMyAddsListing,
  setShowUsersModal,
  setSortBy,
  showAdminDashboard,
  showCreateWizard,
  showFiltersModal,
  showMapSelectModal,
  showMyAddsListing,
  showUsersModal,
  initialCheckInDate,
  initialCheckOutDate,
  checkInDate,
  checkOutDate,
  usersModalTab
}: AppOverlaysProps) {
  const [canEditSelectedListing, setCanEditSelectedListing] = useState(false);

  const openEditWizard = (listing: Listing) => {
    const startEditing = () => {
      setShowMyAddsListing(false);
      setSelectedListing(null);
      setEditingListing(listing);
      setShowCreateWizard(true);
    };
    if (!onRequireAuth('auth.reason.myListings', startEditing)) return;
    startEditing();
  };

  return (
    <>
      {showFiltersModal && (
        <HousingFilters
          listings={listings}
          subCategory={primaryL2}
          selectedSubCategories={currentL2}
          onSubCategoryChange={setPrimaryL2}
          filters={filters}
          onApplyFilters={(newF) => setFilters(newF)}
          onClose={() => setShowFiltersModal(false)}
          currencySymbol={currencySymbol}
          currencyRate={currencyRate}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
        />
      )}

      {selectedListing && (
        <ListingDetails
          listing={selectedListing}
          onClose={() => {
            setCanEditSelectedListing(false);
            onSelectedListingClose();
          }}
          currencySymbol={currencySymbol}
          currencyRate={currencyRate}
          onAddBooking={handleAddBooking}
          initialCheckInDate={initialCheckInDate}
          initialCheckOutDate={initialCheckOutDate}
          onDatesChange={(checkIn, checkOut) => {
            setCheckInDate(checkIn);
            setCheckOutDate(checkOut);
          }}
          activeLanguage={activeLanguage}
          onRequireAuth={onRequireAuth}
          onListingChange={(updatedListing) => {
            setSelectedListing(updatedListing);
            handleUpdateListing(updatedListing);
          }}
          onEditClick={canEditSelectedListing ? openEditWizard : undefined}
        />
      )}

      {showCreateWizard && (
        <CreateWizard
          onClose={() => {
            setShowCreateWizard(false);
            if (editingListing) {
              setShowMyAddsListing(true);
            }
            setEditingListing(null);
          }}
          onPublish={handlePublishListing}
          initialListing={editingListing}
          currencySymbol={currencySymbol}
          currencyRate={currencyRate}
          propCategoriesList={L1_CATEGORIES}
          propSubcategoriesMap={SUBCATEGORIES_MAP}
          menuOverrides={menuOverrides}
        />
      )}

      {showMyAddsListing && (
        <MyAddsListing
          listings={listings}
          bookings={bookings}
          onToggleStatus={handleToggleListingStatus}
          onUpdateBookingStatus={handleUpdateBookingStatus}
          onUpdateBooking={handleUpdateBooking}
          onAddBooking={handleAddBooking}
          onUpdateListing={handleUpdateListing}
          onDeleteListing={handleDeleteListing}
          onClose={() => setShowMyAddsListing(false)}
          currencySymbol={currencySymbol}
          currencyRate={currencyRate}
          onCreateClick={() => {
            const openCreateWizard = () => {
              setShowMyAddsListing(false);
              setEditingListing(null);
              setShowCreateWizard(true);
            };
            if (!onRequireAuth('auth.reason.createListing', openCreateWizard)) return;
            openCreateWizard();
          }}
          onEditClick={(listing) => {
            openEditWizard(listing);
          }}
          onViewClick={(listing) => {
            setShowMyAddsListing(false);
            setCanEditSelectedListing(true);
            setSelectedListing(listing);
          }}
        />
      )}

      {showAdminDashboard && (
        <AdminDashboard
          listings={listings}
          bookings={bookings}
          onToggleStatus={handleToggleListingStatus}
          onUpdateBookingStatus={handleUpdateBookingStatus}
          onUpdateListing={handleUpdateListing}
          onDeleteListing={handleDeleteListing}
          onSelectListing={(listing) => {
            setCanEditSelectedListing(false);
            setSelectedListing(listing);
            setShowAdminDashboard(false);
          }}
          onClose={() => setShowAdminDashboard(false)}
          currencySymbol={currencySymbol}
          currencyRate={currencyRate}
          menuOverrides={menuOverrides}
          onUpdateMenuOverrides={handleUpdateMenuOverrides}
        />
      )}

      {showUsersModal && (
        <UsersModal
          listings={listings}
          onClose={() => setShowUsersModal(false)}
          onViewListing={(listing) => {
            setCanEditSelectedListing(false);
            setSelectedListing(listing);
          }}
          currencySymbol={currencySymbol}
          currencyRate={currencyRate}
          initialTab={usersModalTab}
        />
      )}

      {showMapSelectModal && (
        <MapSelectModal
          initialPoint={customPoint}
          initialRadius={customRadius}
          onClose={() => setShowMapSelectModal(false)}
          onApply={(point, radius) => {
            setCustomPoint(point);
            setCustomRadius(radius);
            setDistrictSearch([]);
            setSortBy('distance_point');
            setShowMapSelectModal(false);
          }}
          onReset={() => {
            setCustomPoint(null);
            setDistrictSearch([]);
            setSortBy('popular');
            setShowMapSelectModal(false);
          }}
        />
      )}
    </>
  );
}
