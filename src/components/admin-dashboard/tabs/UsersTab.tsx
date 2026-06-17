import React from 'react';
import {
  Search, AlertCircle, TrendingUp, Check, Play, Square, Mail, Eye, Trash2, Edit3, MessageCircle,
  RefreshCw, Sparkles, CheckCircle2, XCircle, PlusCircle, UserCheck, UserX, Ban, HelpCircle,
  ArrowRight, DollarSign, Briefcase, Send, Volume2, ShieldCheck, Heart, MapPin, Percent, Star,
  List, Image as ImageIcon, MessageSquare, Database, Settings, X
} from 'lucide-react';

type AdminTabProps = Record<string, any>;
export function UsersTab(props: AdminTabProps) {
  const {
    setActiveTab, adminUsers, totalListings, activeListings, moderationListings, totalClicksCol, totalViews, districtViewsStats, totalDistrictViews,
    filteredUsersList, userSearch, setUserSearch, userRoleFilter, setUserRoleFilter, userStatusFilter, setUserStatusFilter, setShowAddUserModal, handleChangeRole, handleToggleUserBan, handleDeleteUser, listings,
    filteredListingsList, listingSearch, setListingSearch, listingCategoryFilter, setListingCategoryFilter, listingStatusFilter, setListingStatusFilter, onUpdateListing, showToast, onToggleStatus, onDeleteListing,
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
                      placeholder="Поиск по имени, email или WhatsApp..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#FF7A50] font-sans font-medium text-[#1E293B]"
                    />
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    {/* Role Filter dropdown */}
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none"
                    >
                      <option value="all">Все роли</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="host">Host</option>
                      <option value="guest">Guest</option>
                    </select>

                    {/* Status Filter dropdown */}
                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none"
                    >
                      <option value="all">Все статусы</option>
                      <option value="active">Активные</option>
                      <option value="banned">Забаненные</option>
                    </select>

                    <button
                      onClick={() => setShowAddUserModal(true)}
                      className="ml-auto bg-[#FF7A50] hover:bg-[#E05A30] text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Создать</span>
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50/70 text-gray-500 font-bold border-b border-gray-100">
                          <th className="p-4 pl-6">Пользователь</th>
                          <th className="p-4">WhatsApp контакты</th>
                          <th className="p-4">Роль кабинета</th>
                          <th className="p-4">Записей</th>
                          <th className="p-4">Статус</th>
                          <th className="p-4 pr-6 text-right">Действие</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                        {filteredUsersList.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6 flex items-center gap-3">
                              <img 
                                src={u.avatar} 
                                alt={u.name}
                                className="w-9 h-9 rounded-full object-cover border-2 border-slate-100"
                              />
                              <div>
                                <h4 className="font-bold text-[#1E293B]">{u.name}</h4>
                                <span className="text-[10px] text-gray-400 block font-mono font-medium">{u.email}</span>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-medium text-[#1E293B]">{u.phone}</td>
                            <td className="p-4">
                              <select
                                value={u.role}
                                onChange={(e) => handleChangeRole(u.id, e.target.value as any)}
                                className="bg-slate-100 hover:bg-slate-200 text-[#1E293B] font-bold text-[10.5px] px-2.5 py-1 rounded-xl focus:outline-none"
                              >
                                <option value="admin">Admin</option>
                                <option value="moderator">Moderator</option>
                                <option value="host">Host / Хозяин</option>
                                <option value="guest">Guest / Гость</option>
                              </select>
                            </td>
                            <td className="p-4 font-mono font-bold text-[#FF7A50]">
                              {u.listingsCount || listings.filter(l => l.ownerName === u.name).length}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                u.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-650'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleUserBan(u.id)}
                                className={`p-1.5 rounded-xl text-xs cursor-pointer ${
                                  u.status === 'banned' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                                title={u.status === 'banned' ? 'Разблокировать' : 'Заблокировать'}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTicket({
                                    id: `ticket-generated-${Date.now()}`,
                                    userId: u.id,
                                    userName: u.name,
                                    userPhone: u.phone,
                                    userAvatar: u.avatar,
                                    subject: 'Сообщение модерации',
                                    status: 'open',
                                    createdAt: new Date().toISOString(),
                                    messages: [
                                      { id: 'gen1', sender: 'admin', text: 'Пожалуйста, верифицируйте профиль', timestamp: new Date().toISOString() }
                                    ]
                                  });
                                  setActiveTab('messages');
                                }}
                                className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-xl text-xs cursor-pointer"
                                title="Написать сообщение"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 bg-gray-100 text-gray-500 hover:bg-red-105 hover:text-red-600 rounded-xl text-xs cursor-pointer"
                                title="Удалить"
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
