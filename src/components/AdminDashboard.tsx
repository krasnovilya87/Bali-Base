import React from 'react';
import { AdminDashboardProps } from './admin-dashboard/types';
import AdminSidebar from './admin-dashboard/AdminSidebar';
import AdminHeader from './admin-dashboard/AdminHeader';
import AddUserModal from './admin-dashboard/AddUserModal';
import RejectListingModal from './admin-dashboard/RejectListingModal';
import { useAdminDashboardController } from './admin-dashboard/useAdminDashboardController';
import {
  DashboardTab,
  ListingsTab,
  MessagesTab,
  ModerationTab,
  SettingsTab,
  UsersTab
} from './admin-dashboard/AdminTabs';

export default function AdminDashboard({
  listings,
  bookings,
  onToggleStatus,
  onUpdateBookingStatus,
  onUpdateListing,
  onDeleteListing,
  onClose,
  currencySymbol,
  currencyRate,
  menuOverrides = { l1: {}, l2: {} },
  onUpdateMenuOverrides,
}: AdminDashboardProps) {
  const {
    activeTab,
    setActiveTab,
    adminUsers,
    moderationListings,
    toastMessage,
    showToast,
    tabProps,
    showAddUserModal,
    setShowAddUserModal,
    newUserName,
    newUserEmail,
    newUserPhone,
    newUserRole,
    setNewUserName,
    setNewUserEmail,
    setNewUserPhone,
    setNewUserRole,
    handleCreateUser,
    rejectListingId,
    rejectionReason,
    setRejectionReason,
    setRejectListingId,
    handleRejectConfirm
  } = useAdminDashboardController({
    listings,
    onToggleStatus,
    onUpdateListing,
    onDeleteListing,
    menuOverrides,
    onUpdateMenuOverrides,
  });
  return (
    <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-sm z-[500] flex items-center justify-center p-2 sm:p-4 select-none font-sans animate-fade-in">
      
      {/* Toast Alert Indicator Panel */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white py-3 px-6 rounded-2xl shadow-2xl border border-gray-800 z-[520] text-xs sm:text-sm font-semibold flex items-center gap-2 animate-bounce">
          {toastMessage}
        </div>
      )}

      <div className="bg-white w-full max-w-7xl h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col sm:flex-row relative border border-[#E2E8F0]">
        
        <AdminSidebar
          activeTab={activeTab}
          adminUsersCount={adminUsers.length}
          listingsCount={listings.length}
          moderationListings={moderationListings}
          onClose={onClose}
          onTabChange={setActiveTab}
        />

        {/* MAIN BODY AREA PANEL */}
        <main className="flex-1 bg-[#F8FAFC] flex flex-col overflow-hidden h-full">
          
          <AdminHeader
            activeTab={activeTab}
            onClose={onClose}
            onClearCache={() => {
              localStorage.removeItem('bali_base_admin_users');
              localStorage.removeItem('bali_base_admin_tickets');
              showToast('��� �������������� ������');
              setTimeout(() => window.location.reload(), 1500);
            }}
          />

          {/* MAIN CONTAINER SWAP CONTENT */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

            {/* TAB 1: DASHBOARD ANALYTICS */}
            {activeTab === 'dashboard' && <DashboardTab {...tabProps} />}
            {activeTab === 'users' && <UsersTab {...tabProps} />}
            {activeTab === 'listings' && <ListingsTab {...tabProps} />}
            {activeTab === 'moderation' && <ModerationTab {...tabProps} />}
            {activeTab === 'messages' && <MessagesTab {...tabProps} />}
            {activeTab === 'settings' && <SettingsTab {...tabProps} />}


          </div>

        </main>
      </div>

      {showAddUserModal && (
        <AddUserModal
          name={newUserName}
          email={newUserEmail}
          phone={newUserPhone}
          role={newUserRole}
          onNameChange={setNewUserName}
          onEmailChange={setNewUserEmail}
          onPhoneChange={setNewUserPhone}
          onRoleChange={setNewUserRole}
          onClose={() => setShowAddUserModal(false)}
          onSubmit={handleCreateUser}
        />
      )}
      {rejectListingId && (
        <RejectListingModal
          reason={rejectionReason}
          onReasonChange={setRejectionReason}
          onClose={() => setRejectListingId(null)}
          onConfirm={handleRejectConfirm}
        />
      )}

    </div>
  );
}
