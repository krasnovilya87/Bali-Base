import React from 'react';
import {
  Search, AlertCircle, TrendingUp, Check, Play, Square, Mail, Eye, Trash2, Edit3, MessageCircle,
  RefreshCw, Sparkles, CheckCircle2, XCircle, PlusCircle, UserCheck, UserX, Ban, HelpCircle,
  ArrowRight, DollarSign, Briefcase, Send, Volume2, ShieldCheck, Heart, MapPin, Percent, Star,
  List, Image as ImageIcon, MessageSquare, Database, Settings, X
} from 'lucide-react';

type AdminTabProps = Record<string, any>;
export function ModerationTab(props: AdminTabProps) {
  const {
    totalListings, activeListings, moderationListings, totalClicksCol, totalViews, districtViewsStats, totalDistrictViews,
    filteredUsersList, userSearch, setUserSearch, userRoleFilter, setUserRoleFilter, userStatusFilter, setUserStatusFilter, setShowAddUserModal, handleChangeRole, handleToggleUserBan, handleDeleteUser, listings,
    filteredListingsList, listingSearch, setListingSearch, listingCategoryFilter, setListingCategoryFilter, listingStatusFilter, setListingStatusFilter, onUpdateListing, showToast, onToggleStatus, onDeleteListing,
    moderationItems, handleDeleteAllModeration, handleApprove, handleOpenReject,
    tickets, selectedTicket, setSelectedTicket, replyText, setReplyText, handleSendReply,
    autoApprove, setAutoApprove, maintenanceMode, setMaintenanceMode, commissionRate, setCommissionRate, siteName, setSiteName, telegramSupportLink, setTelegramSupportLink,
    wizardLevel, setWizardLevel, l1SelectedId, setL1SelectedId, l1Label, setL1Label, l1Desc, setL1Desc, l1Image, setL1Image,
    l2ParentId, setL2ParentId, l2SelectedId, setL2SelectedId, l2Label, setL2Label, l2Icon, setL2Icon, l2CustomImage, setL2CustomImage, l2IconType, setL2IconType,
    uploadMethod, setUploadMethod, isMenuSaving, dragActive, setDragActive, handleUploadFile, handleSaveL1, handleSaveL2
  } = props;
  return (
              <div className="space-y-6 animate-fade-in">
                {moderationItems.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-150 text-center space-y-4 shadow-sm flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-800 text-base">Очередь модерации пуста</h3>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">Все новые заявки на объявление были успешно одобрены инспектором сайта.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-gray-800 text-sm">Объявления на модерации</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Найдено: {moderationItems.length}</p>
                      </div>
                      <button
                        onClick={handleDeleteAllModeration}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Удалить все на модерации</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {moderationItems.map(item => (
                      <div key={item.id} className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm flex flex-col justify-between">
                        <div>
                          {/* Image and Header details preview overlay */}
                          <div className="relative h-44 bg-slate-100">
                            <img 
                              src={item.images[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'} 
                              alt={item.title} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 left-3 bg-black/60 rounded-md px-2 py-0.5 text-white font-mono text-[9px] font-bold uppercase tracking-wider">
                              {item.category} • {item.subCategory}
                            </div>
                            <div className="absolute bottom-3 left-3 flex gap-2">
                              <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wide">
                                Статус: {item.status}
                              </span>
                            </div>
                          </div>

                          <div className="p-5 space-y-3">
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#FF7A50]" />
                                {item.district}, {item.address}
                              </span>
                              <h3 className="font-extrabold text-base text-[#1E293B] mt-0.5">{item.title}</h3>
                              <p className="text-xs text-gray-500 line-clamp-3 mt-1.5 leading-relaxed">{item.description}</p>
                            </div>

                            {/* Key parameters cards */}
                            <div className="flex gap-4 p-3 bg-slate-50 rounded-2xl text-[10.5px] font-sans font-semibold text-gray-500">
                              <div>
                                <span>Стоимость за сутки:</span>
                                <strong className="text-[#1E293B] block font-mono font-bold mt-0.5">
                                  {item.pricePerDay ? `${item.pricePerDay.toLocaleString()} Rp` : '—'}
                                </strong>
                              </div>
                              <div className="border-l border-gray-200 pl-4">
                                <span>Год постройки:</span>
                                <strong className="text-[#1E293B] block font-mono font-bold mt-0.5">{item.yearBuilt || '—'} год</strong>
                              </div>
                              <div className="border-l border-gray-200 pl-4">
                                <span>Хозяин:</span>
                                <strong className="text-[#FF7A50] block mt-0.5 truncate max-w-[100px]">{item.ownerName}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mod buttons container */}
                        <div className="p-4 bg-slate-50 border-t border-gray-100 flex gap-2.5">
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Одобрить и разместить</span>
                          </button>
                          
                          <button
                            onClick={() => handleOpenReject(item.id)}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Отклонить</span>
                          </button>
                        </div>
                      </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

  );
}
