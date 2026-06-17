import React from 'react';
import {
  Search, AlertCircle, TrendingUp, Check, Play, Square, Mail, Eye, Trash2, Edit3, MessageCircle,
  RefreshCw, Sparkles, CheckCircle2, XCircle, PlusCircle, UserCheck, UserX, Ban, HelpCircle,
  ArrowRight, DollarSign, Briefcase, Send, Volume2, ShieldCheck, Heart, MapPin, Percent, Star,
  List, Image as ImageIcon, MessageSquare, Database, Settings, X
} from 'lucide-react';

type AdminTabProps = Record<string, any>;
export function ListingsTab(props: AdminTabProps) {
  const {
    totalListings, activeListings, moderationListings, totalClicksCol, totalViews, districtViewsStats, totalDistrictViews,
    filteredUsersList, userSearch, setUserSearch, userRoleFilter, setUserRoleFilter, userStatusFilter, setUserStatusFilter, setShowAddUserModal, handleChangeRole, handleToggleUserBan, handleDeleteUser, listings,
    filteredListingsList, listingSearch, setListingSearch, listingCategoryFilter, setListingCategoryFilter, listingStatusFilter, setListingStatusFilter, onUpdateListing, showToast, onToggleStatus, onDeleteListing, handleActivateAllListings,
    moderationItems, handleApprove, handleOpenReject,
    tickets, selectedTicket, setSelectedTicket, replyText, setReplyText, handleSendReply,
    autoApprove, setAutoApprove, maintenanceMode, setMaintenanceMode, commissionRate, setCommissionRate, siteName, setSiteName, telegramSupportLink, setTelegramSupportLink,
    wizardLevel, setWizardLevel, l1SelectedId, setL1SelectedId, l1Label, setL1Label, l1Desc, setL1Desc, l1Image, setL1Image,
    l2ParentId, setL2ParentId, l2SelectedId, setL2SelectedId, l2Label, setL2Label, l2Icon, setL2Icon, l2CustomImage, setL2CustomImage, l2IconType, setL2IconType,
    uploadMethod, setUploadMethod, isMenuSaving, dragActive, setDragActive, handleUploadFile, handleSaveL1, handleSaveL2
  } = props;
  return (
              <div className="space-y-4 animate-fade-in">
                
                {/* Search and filters row */}
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Поиск по названию, хосту или району..."
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
                      <span>Активировать все</span>
                    </button>

                    {/* Category Filter dropdown */}
                    <select
                      value={listingCategoryFilter}
                      onChange={(e) => setListingCategoryFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none"
                    >
                      <option value="all">Все категории L1</option>
                      <option value="housing">Жильё (Housing)</option>
                      <option value="transport">Транспорт (Transport)</option>
                      <option value="services">Услуги (Services)</option>
                      <option value="ads">Объявления (Ads)</option>
                      <option value="afisha">Афиша (Afisha)</option>
                    </select>

                    {/* Status Filter dropdown */}
                    <select
                      value={listingStatusFilter}
                      onChange={(e) => setListingStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none"
                    >
                      <option value="all">Все статусы</option>
                      <option value="active">Активные (Active)</option>
                      <option value="paused">Пауза (Paused)</option>
                      <option value="moderation">В модерации (Moderation)</option>
                      <option value="draft">Черновики (Draft)</option>
                    </select>
                  </div>
                </div>

                {/* Listings Grid */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50/70 text-gray-500 font-bold border-b border-gray-100">
                          <th className="p-4 pl-6">Объявление</th>
                          <th className="p-4">Район / Категория L1</th>
                          <th className="p-4">Стоимость IDR</th>
                          <th className="p-4">Просмотры/Клики</th>
                          <th className="p-4">Одобрен Base?</th>
                          <th className="p-4">Статус</th>
                          <th className="p-4 pr-6 text-right">Управление</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                        {filteredListingsList.map(l => (
                          <tr key={l.id} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6 flex items-center gap-3">
                              <img 
                                src={l.images[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'} 
                                alt={l.title}
                                className="w-12 h-10 rounded-lg object-cover border border-slate-100"
                              />
                              <div className="max-w-[200px] truncate">
                                <h4 className="font-bold text-[#1E293B] truncate">{l.title}</h4>
                                <span className="text-[10px] text-[#FF7A50] block font-mono">Хозяин: {l.ownerName}</span>
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
                              <span className="text-gray-700 font-bold block">{l.viewsCount || 0} views</span>
                              <span className="text-emerald-600 block text-[10px] font-bold">{l.clicksCount || 0} WA clicks</span>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => {
                                  const updated = { ...l, isApproved: !l.isApproved };
                                  onUpdateListing(updated);
                                  showToast(l.isApproved ? '❌ Снято подтверждение инспекции Approved' : '🎉 Объявление успешно одобрено Approved!');
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition ${
                                  l.isApproved 
                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                                    : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500'
                                }`}
                              >
                                <Star className={`w-3.5 h-3.5 ${l.isApproved ? 'fill-rose-500' : ''}`} />
                                <span>{l.isApproved ? 'Approved' : 'Unapproved'}</span>
                              </button>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase ${
                                l.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                l.status === 'paused' ? 'bg-orange-50 text-orange-655' :
                                l.status === 'moderation' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {l.status}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => onToggleStatus(l.id)}
                                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10.5px] cursor-pointer"
                                title="Изменить статус (Активно / Пауза)"
                              >
                                {l.status === 'active' ? 'Приостановить' : 'Активировать'}
                              </button>
                              <button
                                onClick={() => onDeleteListing(l.id)}
                                className="p-1.5 bg-red-50 text-red-655 hover:bg-red-100 rounded-xl text-xs cursor-pointer"
                                title="Удалить объявление"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

  );
}
