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
export function DashboardTab(props: AdminTabProps) {
  const { tr } = useI18n();
  const {
    setActiveTab, adminUsers, totalListings, activeListings, moderationListings, totalClicksCol, totalViews, districtViewsStats, totalDistrictViews, googlePlacesQuota,
    filteredUsersList, userSearch, setUserSearch, userRoleFilter, setUserRoleFilter, userStatusFilter, setUserStatusFilter, setShowAddUserModal, handleChangeRole, handleToggleUserBan, handleDeleteUser, listings,
    filteredListingsList, listingSearch, setListingSearch, listingCategoryFilter, setListingCategoryFilter, listingStatusFilter, setListingStatusFilter, onUpdateListing, showToast, onToggleStatus, onDeleteListing,
    moderationItems, handleApprove, handleOpenReject,
    tickets, selectedTicket, setSelectedTicket, replyText, setReplyText, handleSendReply,
    autoApprove, setAutoApprove, maintenanceMode, setMaintenanceMode, commissionRate, setCommissionRate, siteName, setSiteName, telegramSupportLink, setTelegramSupportLink,
    wizardLevel, setWizardLevel, l1SelectedId, setL1SelectedId, l1Label, setL1Label, l1Desc, setL1Desc, l1Image, setL1Image,
    l2ParentId, setL2ParentId, l2SelectedId, setL2SelectedId, l2Label, setL2Label, l2Icon, setL2Icon, l2CustomImage, setL2CustomImage, l2IconType, setL2IconType,
    uploadMethod, setUploadMethod, isMenuSaving, dragActive, setDragActive, handleUploadFile, handleSaveL1, handleSaveL2,
    openUserInfo
  } = props;
  return (
              <div className="space-y-6 animate-fade-in">
                
                {/* Visual Widgets Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center bg-[#FF7A50]/10 p-2.5 rounded-2xl self-start">
                      <List className="w-5 h-5 text-[#FF7A50]" />
                    </div>
                    <div className="mt-4">
                      <span className="text-xs text-gray-500 font-semibold block">{tr('admin.dashboard.totalListings')}</span>
                      <strong className="text-xl sm:text-2xl font-black text-[#1E293B] block leading-tight">{totalListings}</strong>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center bg-emerald-500/10 p-2.5 rounded-2xl self-start">
                      <Check className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="mt-4">
                      <span className="text-xs text-gray-500 font-semibold block">{tr('admin.dashboard.activeListings')}</span>
                      <strong className="text-xl sm:text-2xl font-black text-[#1E293B] block leading-tight">{activeListings}</strong>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center bg-amber-500/10 p-2.5 rounded-2xl self-start">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="mt-4">
                      <span className="text-xs text-gray-500 font-semibold block">{tr('admin.dashboard.moderation')}</span>
                      <strong className="text-xl sm:text-2xl font-black text-[#1E293B] block leading-tight">{moderationListings}</strong>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center bg-[#003B95]/10 p-2.5 rounded-2xl self-start">
                      <TrendingUp className="w-5 h-5 text-[#003B95]" />
                    </div>
                    <div className="mt-4">
                      <span className="text-xs text-gray-500 font-semibold block">{tr('admin.dashboard.whatsappClicks')}</span>
                      <strong className="text-xl sm:text-2xl font-black text-[#1E293B] block leading-tight">{totalClicksCol}</strong>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center bg-sky-500/10 p-2.5 rounded-2xl self-start">
                      <Database className="w-5 h-5 text-sky-600" />
                    </div>
                    <div className="mt-4 space-y-1">
                      <span className="text-xs text-gray-500 font-semibold block">{tr('admin.dashboard.googlePlacesQuota')}</span>
                      <strong className="text-xl sm:text-2xl font-black text-[#1E293B] block leading-tight">
                        {googlePlacesQuota?.successfulRequests ?? 0}
                      </strong>
                      <span className="text-[10px] text-gray-400 font-semibold block leading-snug">
                        {tr('admin.dashboard.googlePlacesRemaining', {
                          count: googlePlacesQuota?.remainingEstimatedFreeRequests ?? 10000
                        })}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold block leading-snug">
                        {tr('admin.dashboard.googlePlacesReserve', {
                          count: googlePlacesQuota?.creationReserve ?? 500
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Regional Interest SVG representation */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: views by districts bar chart style */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-[#1E293B]">{tr('admin.dashboard.geoTitle')}</h3>
                        <p className="text-[10px] text-gray-400">{tr('admin.dashboard.geoBody')}</p>
                      </div>
                      <span className="text-xs bg-[#FF7A50]/10 text-[#FF7A50] px-2.5 py-1 rounded-full font-bold">
                        {tr('admin.dashboard.views', { count: totalViews })}
                      </span>
                    </div>

                    <div className="space-y-3.5 pt-1.5">
                      {districtViewsStats.slice(0, 6).map((item, index) => {
                        const pct = Math.round((item.views / totalDistrictViews) * 100) || 5;
                        return (
                          <div key={item.name} className="space-y-1">
                            <div className="flex justify-between items-center text-xs text-[#1E293B] font-semibold">
                              <span className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-slate-100 text-slate-605 text-[9.5px] font-bold rounded-lg flex items-center justify-center">
                                  #{index + 1}
                                </span>
                                {item.name}
                              </span>
                              <span className="text-gray-500 font-bold font-mono">
                                {tr('admin.dashboard.viewsPercent', { count: item.views, percent: pct })}
                              </span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                              <div 
                                className="h-full bg-gradient-to-r from-[#FF7A50] to-[#FF8C66] rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Mini Widgets for stats & Promo distributions */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#1E293B]">{tr('admin.dashboard.promoTitle')}</h3>
                      <p className="text-[10px] text-gray-400">{tr('admin.dashboard.promoBody')}</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl flex items-center gap-3 border border-amber-100">
                        <div className="bg-amber-400/20 p-2 rounded-xl text-amber-600">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-xs font-bold text-gray-800">
                            <span>{tr('admin.dashboard.premiumTop')}</span>
                            <span className="font-mono text-amber-700">
                              {tr('admin.dashboard.countShort', { count: listings.filter(l => l.isPromoTop).length })}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold block">{tr('admin.dashboard.premiumTopBody')}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-emerald-50 to-[#2F7D69]/5 rounded-2xl flex items-center gap-3 border border-emerald-100">
                        <div className="bg-emerald-500/20 p-2 rounded-xl text-[#2F7D69]">
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-xs font-bold text-gray-800">
                            <span>{tr('admin.dashboard.turboReach')}</span>
                            <span className="font-mono text-[#2F7D69]">
                              {tr('admin.dashboard.countShort', { count: listings.filter(l => l.isPromoTurbo).length })}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold block">{tr('admin.dashboard.turboReachBody')}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-rose-50 to-[#FF7A50]/5 rounded-2xl flex items-center gap-3 border border-rose-100">
                        <div className="bg-rose-500/20 p-2 rounded-xl text-rose-600">
                          <Heart className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-xs font-bold text-gray-800">
                            <span>{tr('admin.dashboard.approved')}</span>
                            <span className="font-mono text-rose-700">
                              {tr('admin.dashboard.countShort', { count: listings.filter(isListingVerified).length })}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold block">{tr('admin.dashboard.approvedBody')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent users registered & system health */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#1E293B]">{tr('admin.dashboard.recentUsers')}</h3>
                      <p className="text-[10px] text-gray-400">{tr('admin.dashboard.recentUsersBody')}</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('users')}
                      className="text-xs font-bold text-[#FF7A50] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {tr('admin.dashboard.showAll')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1.5">
                    {adminUsers.slice(0, 3).map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => openUserInfo(u)}
                        className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100 text-left transition hover:border-[#FF7A50]/30 hover:bg-white"
                        title={tr('admin.userInfo.title')}
                      >
                        <img 
                          src={u.avatar} 
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#FF7A50]/20"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-800 truncate">{u.name}</h4>
                          <span className="text-[10px] text-gray-400 block font-mono font-medium">{u.email}</span>
                          <div className="flex gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-[#FF7A50]/15 text-[#FF7A50]">
                              {tr(`admin.users.role.${u.role}`)}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-500/15 text-emerald-600">
                              {tr(`admin.users.status.${u.status}`)}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

  );
}
