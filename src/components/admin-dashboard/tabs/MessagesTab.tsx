import React from 'react';
import {
  Search, AlertCircle, TrendingUp, Check, Play, Square, Mail, Eye, Trash2, Edit3, MessageCircle,
  RefreshCw, Sparkles, CheckCircle2, XCircle, PlusCircle, UserCheck, UserX, Ban, HelpCircle,
  ArrowRight, DollarSign, Briefcase, Send, Volume2, ShieldCheck, Heart, MapPin, Percent, Star,
  List, Image as ImageIcon, MessageSquare, Database, Settings, X
} from 'lucide-react';

type AdminTabProps = Record<string, any>;
export function MessagesTab(props: AdminTabProps) {
  const {
    totalListings, activeListings, moderationListings, totalClicksCol, totalViews, districtViewsStats, totalDistrictViews,
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[55vh] items-stretch animate-fade-in">
                
                {/* Left side list of tickets */}
                <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm flex flex-col h-full">
                  <div className="p-4 bg-slate-50/70 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Диалоги поддержки</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {tickets.map(ticket => {
                      const isSelected = selectedTicket?.id === ticket.id;
                      const lastMsg = ticket.messages[ticket.messages.length - 1];
                      return (
                        <button
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          className={`w-full text-left p-4 hover:bg-slate-50 transition block scrollbar-none cursor-pointer ${
                            isSelected ? 'bg-slate-100/70 border-l-4 border-[#FF7A50]' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <img 
                              src={ticket.userAvatar} 
                              alt={ticket.userName}
                              className="w-10 h-10 rounded-full object-cover shrink-0" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <h4 className="font-bold text-sm text-[#1E293B] truncate">{ticket.userName}</h4>
                                <span className="text-[9px] text-gray-400 font-mono font-medium">15 мин назад</span>
                              </div>
                              <span className="text-xs text-gray-700 block truncate font-bold mt-0.5">{ticket.subject}</span>
                              <p className="text-[11px] text-gray-400 truncate mt-1">{lastMsg?.text}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right side active chat container */}
                <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm lg:col-span-2 flex flex-col justify-between h-full">
                  {selectedTicket ? (
                    <>
                      {/* Ticket Header */}
                      <div className="p-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                          <img 
                            src={selectedTicket.userAvatar} 
                            alt={selectedTicket.userName}
                            className="w-10 h-10 rounded-full object-cover" 
                          />
                          <div>
                            <h3 className="font-extrabold text-sm text-[#1E293B]">{selectedTicket.userName}</h3>
                            <span className="text-[10px] text-[#FF7A50] font-mono block">Тема: {selectedTicket.subject}</span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          selectedTicket.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {selectedTicket.status}
                        </span>
                      </div>

                      {/* Messages Area Feed */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
                        {selectedTicket.messages.map(msg => {
                          const isAdmin = msg.sender === 'admin';
                          return (
                            <div 
                              key={msg.id} 
                              className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} animate-fade-in`}
                            >
                              <div className={`max-w-md p-3.5 rounded-2xl flex flex-col gap-1.5 shadow-sm text-xs sm:text-sm font-semibold transition ${
                                isAdmin 
                                  ? 'bg-[#0F172A] text-white rounded-tr-none' 
                                  : 'bg-white border border-gray-150 text-[#1E293B] rounded-tl-none'
                              }`}>
                                <p className="leading-relaxed">{msg.text}</p>
                                <span className={`text-[9px] font-semibold leading-none text-right ${isAdmin ? 'text-slate-400' : 'text-gray-400'}`}>
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Chat Input panel */}
                      <div className="p-4 border-t border-gray-100 bg-white flex gap-3 items-center shrink-0">
                        <input 
                          type="text" 
                          placeholder="Введите ответ пользователю в поддержку..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendReply();
                          }}
                          className="flex-1 bg-slate-50 border border-gray-200 rounded-2xl px-4 py-2 focus:outline-none text-xs sm:text-sm focus:border-[#FF7A50] font-sans font-medium text-[#1E293B]"
                        />
                        <button
                          onClick={handleSendReply}
                          className="bg-[#FF7A50] hover:bg-[#E05A30] text-white p-2.5 rounded-xl cursor-pointer shadow-sm active:scale-95 transition"
                          title="Отправить ответ"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                      <div className="bg-slate-50 text-slate-450 p-4 rounded-3xl">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#1E293B] text-base">Сообщение не выбрано</h4>
                        <p className="text-xs text-gray-400 max-w-sm mt-1">Выберите диалог на боковой панели, чтобы просмотреть переписку и ответить на обращение.</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

  );
}
