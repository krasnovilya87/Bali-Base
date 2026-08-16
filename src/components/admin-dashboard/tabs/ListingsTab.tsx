import React from 'react';
import {
  Search, AlertCircle, TrendingUp, Check, Play, Square, Mail, Eye, Trash2, Edit3, MessageCircle,
  RefreshCw, Sparkles, CheckCircle2, XCircle, PlusCircle, UserCheck, UserX, Ban, HelpCircle,
  ArrowRight, DollarSign, Briefcase, Send, Volume2, ShieldCheck, Heart, MapPin, Percent, Star,
  List, Image as ImageIcon, MessageSquare, Database, Settings, X
} from 'lucide-react';
import { useI18n } from '../../../i18nContext';
import { isListingVerified } from '../../../utils/listingVerification';

type AdminTabProps = Record<string, any>;
export function ListingsTab(props: AdminTabProps) {
  const { tr } = useI18n();
  const {
    totalListings, activeListings, moderationListings, totalClicksCol, totalViews, districtViewsStats, totalDistrictViews,
    filteredUsersList, userSearch, setUserSearch, userRoleFilter, setUserRoleFilter, userStatusFilter, setUserStatusFilter, setShowAddUserModal, handleChangeRole, handleToggleUserBan, handleDeleteUser, listings,
    filteredListingsList, listingSearch, setListingSearch, listingCategoryFilter, setListingCategoryFilter, listingStatusFilter, setListingStatusFilter, onUpdateListing, showToast, onToggleStatus, onDeleteListing, handleActivateAllListings,
    moderationItems, handleApprove, handleOpenReject,
    tickets, selectedTicket, setSelectedTicket, replyText, setReplyText, handleSendReply,
    autoApprove, setAutoApprove, maintenanceMode, setMaintenanceMode, commissionRate, setCommissionRate, siteName, setSiteName, telegramSupportLink, setTelegramSupportLink,
    wizardLevel, setWizardLevel, l1SelectedId, setL1SelectedId, l1Label, setL1Label, l1Desc, setL1Desc, l1Image, setL1Image,
    l2ParentId, setL2ParentId, l2SelectedId, setL2SelectedId, l2Label, setL2Label, l2Icon, setL2Icon, l2CustomImage, setL2CustomImage, l2IconType, setL2IconType,
    uploadMethod, setUploadMethod, isMenuSaving, dragActive, setDragActive, handleUploadFile, handleSaveL1, handleSaveL2,
    openUserInfo
  } = props;
  return (
              <div className="space-y-4 animate-fade-in">
                
                {/* Search and filters row */}
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder={tr('admin.listings.search')}
                      value={listingSearch}
                      onChange={(e) => setListingSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#FF7A50] font-sans font-medium text-[#1E293B]"
                    />
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={handleActivateAllListings}
                      className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{tr('admin.listings.activateAll')}</span>
                    </button>

                    {/* Category Filter dropdown */}
                    <select
                      value={listingCategoryFilter}
                      onChange={(e) => setListingCategoryFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none"
                    >
                      <option value="all">{tr('admin.listings.allCategories')}</option>
                      <option value="housing">{tr('admin.listings.category.housing')}</option>
                      <option value="transport">{tr('admin.listings.category.transport')}</option>
                      <option value="services">{tr('admin.listings.category.services')}</option>
                      <option value="ads">{tr('admin.listings.category.ads')}</option>
                      <option value="afisha">{tr('admin.listings.category.afisha')}</option>
                    </select>

                    {/* Status Filter dropdown */}
                    <select
                      value={listingStatusFilter}
                      onChange={(e) => setListingStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none"
                    >
                      <option value="all">{tr('admin.listings.allStatuses')}</option>
                      <option value="active">{tr('admin.listings.status.active')}</option>
                      <option value="paused">{tr('admin.listings.status.paused')}</option>
                      <option value="moderation">{tr('admin.listings.status.moderation')}</option>
                      <option value="rejected">{tr('admin.listings.status.rejected')}</option>
                      <option value="draft">{tr('admin.listings.status.draft')}</option>
                    </select>
                  </div>
                </div>

                {/* Listings Grid */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50/70 text-gray-500 font-bold border-b border-gray-100">
                          <th className="p-4 pl-6">{tr('admin.listings.listing')}</th>
                          <th className="p-4">{tr('admin.listings.districtCategory')}</th>
                          <th className="p-4">{tr('admin.listings.priceIdr')}</th>
                          <th className="p-4">{tr('admin.listings.viewsClicks')}</th>
                          <th className="p-4">{tr('admin.listings.approvedBase')}</th>
                          <th className="p-4">{tr('admin.listings.status')}</th>
                          <th className="p-4 pr-6 text-right">{tr('admin.listings.actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                        {filteredListingsList.map(l => {
                          const isVerified = isListingVerified(l);
                          return (
                          <tr key={l.id} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6 flex items-center gap-3">
                              <img 
                                src={l.images[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'} 
                                alt={l.title}
                                className="w-12 h-10 rounded-lg object-cover border border-slate-100"
                              />
                              <div className="max-w-[200px] truncate">
                                <h4 className="font-bold text-[#1E293B] truncate">{l.title}</h4>
                                <button
                                  type="button"
                                  onClick={() => openUserInfo({
                                    id: l.ownerId,
                                    ownerName: l.ownerName,
                                    whatsappNumber: l.whatsappNumber,
                                    ownerAvatar: l.ownerAvatar,
                                    listingsCount: listings.filter(item => item.ownerId === l.ownerId || item.ownerName === l.ownerName).length
                                  })}
                                  className="block max-w-full truncate text-left text-[10px] text-[#FF7A50] font-mono transition hover:text-[#E05A30] hover:underline"
                                  title={tr('admin.userInfo.title')}
                                >
                                  {tr('admin.listings.owner', { name: l.ownerName })}
                                </button>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-gray-800 block text-xs">{l.district}</span>
                              <span className="text-[9.5px] uppercase font-bold text-gray-400 font-sans tracking-wide leading-none">{l.category}</span>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-805">
                              {l.pricePerDay ? `${l.pricePerDay.toLocaleString()} Rp` : '—'}
                            </td>
                            <td className="p-4 font-mono text-gray-500">
                              <span className="text-gray-700 font-bold block">{tr('admin.dashboard.views', { count: l.viewsCount || 0 })}</span>
                              <span className="text-emerald-600 block text-[10px] font-bold">{tr('admin.listings.waClicks', { count: l.clicksCount || 0 })}</span>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => {
                                  const updated = { ...l, isVerified: !isVerified };
                                  onUpdateListing(updated);
                                  showToast(isVerified ? tr('admin.listings.approvedRemoved') : tr('admin.listings.approvedAdded'));
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition ${
                                  isVerified 
                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                                    : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500'
                                }`}
                              >
                                <Star className={`w-3.5 h-3.5 ${isVerified ? 'fill-rose-500' : ''}`} />
                                <span>{isVerified ? tr('admin.listings.approved') : tr('admin.listings.unapproved')}</span>
                              </button>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase ${
                                l.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                l.status === 'paused' ? 'bg-orange-50 text-orange-655' :
                                l.status === 'moderation' ? 'bg-amber-50 text-amber-600' :
                                l.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {tr(`admin.listings.status.${l.status}`)}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => onToggleStatus(l.id)}
                                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10.5px] cursor-pointer"
                                title={tr('admin.listings.toggleStatus')}
                              >
                                {l.status === 'active' ? tr('admin.listings.pause') : tr('admin.listings.activate')}
                              </button>
                              <button
                                onClick={() => onDeleteListing(l.id)}
                                className="p-1.5 bg-red-50 text-red-655 hover:bg-red-100 rounded-xl text-xs cursor-pointer"
                                title={tr('admin.listings.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

  );
}
