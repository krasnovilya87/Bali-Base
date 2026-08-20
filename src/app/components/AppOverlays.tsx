import { Dispatch, SetStateAction, useState } from 'react';
import { AlertTriangle, X, XCircle } from 'lucide-react';
import { BookingRequest, FilterState, Listing } from '../../types';
import AdminDashboard from '../../components/AdminDashboard';
import CreateWizard from '../../components/CreateWizard';
import HousingFilters from '../../components/HousingFilters';
import ListingDetails from '../../components/ListingDetails';
import MapSelectModal from '../../components/MapSelectModal';
import MyAddsListing from '../../components/MyAddsListing';
import ProfileModal from '../../components/ProfileModal';
import UsersModal from '../../components/UsersModal';
import { LanguageCode } from '../../i18n';
import { useI18n } from '../../i18nContext';
import { L1_CATEGORIES, SUBCATEGORIES_MAP } from '../menu';
import { AI_MODERATION_RULES } from '../../utils/aiModerationRules';
import { auth } from '../../firebase';

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
  handleUpdateListing: (listing: Listing) => void | Promise<void>;
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
  setShowProfileModal: Dispatch<SetStateAction<boolean>>;
  setShowUsersModal: Dispatch<SetStateAction<boolean>>;
  setSortBy: Dispatch<SetStateAction<string>>;
  showAdminDashboard: boolean;
  showCreateWizard: boolean;
  showFiltersModal: boolean;
  showMapSelectModal: boolean;
  showMyAddsListing: boolean;
  showProfileModal: boolean;
  showUsersModal: boolean;
  initialCheckInDate: string;
  initialCheckOutDate: string;
  initialBookingsListingId: string | null;
  checkInDate: string;
  checkOutDate: string;
  onInitialBookingsOpened: () => void;
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
  setShowProfileModal,
  setShowUsersModal,
  setSortBy,
  showAdminDashboard,
  showCreateWizard,
  showFiltersModal,
  showMapSelectModal,
  showMyAddsListing,
  showProfileModal,
  showUsersModal,
  initialCheckInDate,
  initialCheckOutDate,
  initialBookingsListingId,
  checkInDate,
  checkOutDate,
  onInitialBookingsOpened,
  usersModalTab
}: AppOverlaysProps) {
  const { tr } = useI18n();
  const [canEditSelectedListing, setCanEditSelectedListing] = useState(false);
  const [rejectionPopupListing, setRejectionPopupListing] = useState<Listing | null>(null);
  const [returnToMyAddsOnListingClose, setReturnToMyAddsOnListingClose] = useState(false);
  const activeUserId = auth.currentUser?.uid;
  const ownListingsCount = listings.filter(item =>
    item.ownerId === activeUserId ||
    item.ownerId === 'owner-1' ||
    item.ownerId === 'owner-personal' ||
    item.ownerId === 'owner-direct'
  ).length;
  const selectedListingFresh = selectedListing
    ? listings.find(listing => listing.id === selectedListing.id) || selectedListing
    : null;
  const rejectionPopupListingFresh = rejectionPopupListing
    ? listings.find(listing => listing.id === rejectionPopupListing.id) || rejectionPopupListing
    : null;
  const rejectionDetail = rejectionPopupListingFresh?.rejectionReason
    ? (() => {
        const matchedRule = AI_MODERATION_RULES.find(rule =>
          tr(rule.rejectionReasonKey) === rejectionPopupListingFresh.rejectionReason
        );
        const matchedCheck = matchedRule
          ? rejectionPopupListingFresh.aiModeration?.checks?.find(check => check.id === matchedRule.id && !check.passed)
          : rejectionPopupListingFresh.aiModeration?.checks?.find(check => !check.passed);
        return matchedCheck?.reason || '';
      })()
    : '';

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

      {selectedListingFresh && (
        <ListingDetails
          listing={selectedListingFresh}
          onClose={() => {
            setCanEditSelectedListing(false);
            setRejectionPopupListing(null);
            if (returnToMyAddsOnListingClose) {
              setShowMyAddsListing(true);
            }
            setReturnToMyAddsOnListingClose(false);
            onSelectedListingClose();
          }}
          currencySymbol={currencySymbol}
          currencyRate={currencyRate}
          onAddBooking={handleAddBooking}
          bookings={bookings}
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

      {selectedListingFresh && rejectionPopupListingFresh?.id === selectedListingFresh.id && rejectionPopupListingFresh.status === 'rejected' && (
        <div className="fixed inset-0 z-[620] flex items-center justify-center bg-[#0F172A]/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-rose-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {tr('myListings.status.rejected')}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-slate-500">
                    {rejectionPopupListingFresh.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectionPopupListing(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title={tr('common.close')}
                aria-label={tr('common.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[68vh] space-y-3 overflow-y-auto px-5 py-4">
              {rejectionPopupListingFresh.rejectionReason && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wide text-rose-700">
                        {tr('myListings.rejectionReason')}
                      </div>
                      <p className="mt-1 text-sm font-bold leading-relaxed text-rose-900">
                        {rejectionPopupListingFresh.rejectionReason}
                      </p>
                      {rejectionDetail && (
                        <p className="mt-1.5 text-xs font-semibold leading-relaxed text-rose-700">
                          {rejectionDetail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
          existingListings={listings}
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
          initialBookingsListingId={initialBookingsListingId}
          onInitialBookingsOpened={onInitialBookingsOpened}
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
            setReturnToMyAddsOnListingClose(true);
            setSelectedListing(listing);
            setRejectionPopupListing(listing.status === 'rejected' ? listing : null);
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
            setReturnToMyAddsOnListingClose(false);
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
          bookings={bookings}
          listings={listings}
          onClose={() => setShowUsersModal(false)}
          onViewListing={(listing) => {
            setCanEditSelectedListing(false);
            setReturnToMyAddsOnListingClose(false);
            setSelectedListing(listing);
          }}
          currencySymbol={currencySymbol}
          currencyRate={currencyRate}
          initialTab={usersModalTab}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          listingsCount={ownListingsCount}
          onClose={() => setShowProfileModal(false)}
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
