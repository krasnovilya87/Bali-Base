import React from 'react';
import {
  Search, AlertCircle, TrendingUp, Check, Play, Square, Mail, Eye, Trash2, Edit3, MessageCircle,
  RefreshCw, Sparkles, CheckCircle2, XCircle, PlusCircle, UserCheck, UserX, Ban, HelpCircle,
  ArrowRight, DollarSign, Briefcase, Volume2, ShieldCheck, Heart, MapPin, Percent, Star,
  List, Image as ImageIcon, MessageSquare, Database, Settings, X
} from 'lucide-react';
import { useI18n } from '../../../i18nContext';
import { resolveSupportTicketPhone } from '../../../utils/supportTickets';

type AdminTabProps = Record<string, any>;
export function MessagesTab(props: AdminTabProps) {
  const { tr } = useI18n();
  const {
    totalListings, activeListings, moderationListings, totalClicksCol, totalViews, districtViewsStats, totalDistrictViews,
    adminUsers, filteredUsersList, userSearch, setUserSearch, userRoleFilter, setUserRoleFilter, userStatusFilter, setUserStatusFilter, setShowAddUserModal, handleChangeRole, handleToggleUserBan, handleDeleteUser, listings,
    filteredListingsList, listingSearch, setListingSearch, listingCategoryFilter, setListingCategoryFilter, listingStatusFilter, setListingStatusFilter, onUpdateListing, showToast, onToggleStatus, onDeleteListing,
    moderationItems, handleApprove, handleOpenReject,
    tickets, selectedTicket, setSelectedTicket, replyText, setReplyText, handleSendReply,
    autoApprove, setAutoApprove, maintenanceMode, setMaintenanceMode, commissionRate, setCommissionRate, siteName, setSiteName, telegramSupportLink, setTelegramSupportLink,
    wizardLevel, setWizardLevel, l1SelectedId, setL1SelectedId, l1Label, setL1Label, l1Desc, setL1Desc, l1Image, setL1Image,
    l2ParentId, setL2ParentId, l2SelectedId, setL2SelectedId, l2Label, setL2Label, l2Icon, setL2Icon, l2CustomImage, setL2CustomImage, l2IconType, setL2IconType,
    uploadMethod, setUploadMethod, isMenuSaving, dragActive, setDragActive, handleUploadFile, handleSaveL1, handleSaveL2,
    openUserInfo
  } = props;
  const [whatsAppDraftTicketId, setWhatsAppDraftTicketId] = React.useState<string | null>(null);
  const [whatsAppDraft, setWhatsAppDraft] = React.useState('');

  const formatReplyDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getWhatsAppPhone = (ticket: any) =>
    String(resolveSupportTicketPhone(ticket, Array.isArray(adminUsers) ? adminUsers : [])).replace(/\D/g, '');

  const buildWhatsAppTemplate = (ticket: any) => {
    const requestLabel = String(ticket?.listingTitle || ticket?.subject || 'your request').replace(/\s+(?:·|В·)\s+/g, ' - ');
    const dateText = formatReplyDate(ticket?.createdAt);
    return dateText
      ? `Bali Base. ${requestLabel}, in response to your message from ${dateText}, we inform you `
      : `Bali Base. ${requestLabel}, in response to your message, we inform you `;
  };

  const buildWhatsAppReplyUrl = (phone: string, message: string) => {
    if (!phone || !message.trim()) return '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const selectedWhatsAppPhone = selectedTicket ? getWhatsAppPhone(selectedTicket) : '';
  const isWhatsAppDraftOpen = Boolean(
    selectedTicket &&
    whatsAppDraftTicketId === selectedTicket.id &&
    selectedWhatsAppPhone
  );

  const openWhatsAppDraft = () => {
    if (!selectedTicket || !selectedWhatsAppPhone) return;
    setWhatsAppDraftTicketId(selectedTicket.id);
    const extraReply = replyText.trim();
    setWhatsAppDraft(`${buildWhatsAppTemplate(selectedTicket)}${extraReply}`);
  };

  const closeWhatsAppDraft = () => {
    setWhatsAppDraftTicketId(null);
    setWhatsAppDraft('');
  };

  const sendWhatsAppDraft = () => {
    const url = buildWhatsAppReplyUrl(selectedWhatsAppPhone, whatsAppDraft);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
    closeWhatsAppDraft();
  };

  const openTicketUserInfo = (ticket: any) => {
    const matchedUser = Array.isArray(adminUsers)
      ? adminUsers.find((user: any) =>
        user.id === ticket.userId ||
        user.name === ticket.userName ||
        user.email === ticket.userName
      )
      : null;

    openUserInfo(matchedUser || {
      id: ticket.userId,
      name: ticket.userName,
      phone: resolveSupportTicketPhone(ticket, Array.isArray(adminUsers) ? adminUsers : []),
      avatar: ticket.userAvatar,
      role: 'guest',
      status: 'active',
      registeredAt: ticket.createdAt,
      listingsCount: 0
    });
  };

  return (
    <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[55vh] items-stretch animate-fade-in">
                
                {/* Left side list of tickets */}
                <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm flex flex-col h-full">
                  <div className="p-4 bg-slate-50/70 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">{tr('admin.messages.dialogs')}</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {tickets.map(ticket => {
                      const isSelected = selectedTicket?.id === ticket.id;
                      const lastMsg = ticket.messages[ticket.messages.length - 1];
                      return (
                        <div
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') setSelectedTicket(ticket);
                          }}
                          className={`w-full text-left p-4 hover:bg-slate-50 transition block scrollbar-none cursor-pointer ${
                            isSelected ? 'bg-slate-100/70 border-l-4 border-[#FF7A50]' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openTicketUserInfo(ticket);
                              }}
                              className="shrink-0 rounded-full transition hover:opacity-80"
                              title={tr('admin.userInfo.title')}
                            >
                              <img 
                                src={ticket.userAvatar} 
                                alt={ticket.userName}
                                className="w-10 h-10 rounded-full object-cover" 
                              />
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openTicketUserInfo(ticket);
                                  }}
                                  className="truncate text-left font-bold text-sm text-[#1E293B] transition hover:text-[#FF7A50]"
                                  title={tr('admin.userInfo.title')}
                                >
                                  {ticket.userName}
                                </button>
                                <span className="text-[9px] text-gray-400 font-mono font-medium">{tr('admin.messages.minutesAgo')}</span>
                              </div>
                              <span className="text-xs text-gray-700 block truncate font-bold mt-0.5">{ticket.subject}</span>
                              <p className="text-[11px] text-gray-400 truncate mt-1">{lastMsg?.text}</p>
                            </div>
                          </div>
                        </div>
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
                        <button
                          type="button"
                          onClick={() => openTicketUserInfo(selectedTicket)}
                          className="flex items-center gap-3 text-left transition hover:opacity-80"
                          title={tr('admin.userInfo.title')}
                        >
                          <img 
                            src={selectedTicket.userAvatar} 
                            alt={selectedTicket.userName}
                            className="w-10 h-10 rounded-full object-cover" 
                          />
                          <div>
                            <h3 className="font-extrabold text-sm text-[#1E293B]">{selectedTicket.userName}</h3>
                            <span className="text-[10px] text-[#FF7A50] font-mono block">{tr('admin.messages.subject', { subject: selectedTicket.subject })}</span>
                            {selectedTicket.listingTitle && (
                              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                                {tr('details.problem.subtitle', { title: selectedTicket.listingTitle })}
                              </span>
                            )}
                          </div>
                        </button>

                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            selectedTicket.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {tr(`admin.messages.status.${selectedTicket.status}`)}
                          </span>
                        </div>
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
                          placeholder={tr('admin.messages.placeholder')}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') openWhatsAppDraft();
                          }}
                          className="flex-1 bg-slate-50 border border-gray-200 rounded-2xl px-4 py-2 focus:outline-none text-xs sm:text-sm focus:border-[#FF7A50] font-sans font-medium text-[#1E293B]"
                        />
                        {selectedWhatsAppPhone ? (
                          <button
                            type="button"
                            onClick={openWhatsAppDraft}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-xl cursor-pointer shadow-sm active:scale-95 transition"
                            title={tr('admin.messages.replyWhatsapp')}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="cursor-not-allowed bg-gray-100 text-gray-300 p-2.5 rounded-xl shadow-sm"
                            title={tr('admin.messages.noWhatsapp')}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                      <div className="bg-slate-50 text-slate-450 p-4 rounded-3xl">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#1E293B] text-base">{tr('admin.messages.emptyTitle')}</h4>
                        <p className="text-xs text-gray-400 max-w-sm mt-1">{tr('admin.messages.emptyBody')}</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
              {isWhatsAppDraftOpen && (
                <div className="fixed inset-0 z-[720] flex items-center justify-center bg-black/55 p-3 sm:p-5 backdrop-blur-xs animate-fade-in">
                  <div className="pu flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-2xl">
                    <div className="pu-header pu-window-header">
                      <div className="flex items-center gap-2.5">
                        <MessageCircle className="h-5 w-5 text-emerald-600" />
                        <h3>{tr('admin.messages.whatsappDraftTitle')}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={closeWhatsAppDraft}
                        className="pu-close"
                        title={tr('common.close')}
                        aria-label={tr('common.close')}
                      >
                        <X />
                      </button>
                    </div>

                    <div className="pu-body space-y-3 p-5">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5F6978]">
                        {tr('admin.messages.whatsappDraftLabel')}
                      </label>
                      <textarea
                        value={whatsAppDraft}
                        onChange={(event) => setWhatsAppDraft(event.target.value)}
                        rows={7}
                        className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-[#1E293B] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>

                    <div className="pu-footer justify-end">
                      <button
                        type="button"
                        onClick={closeWhatsAppDraft}
                        className="pu-button-secondary"
                      >
                        {tr('admin.messages.whatsappDraftCancel')}
                      </button>
                      <button
                        type="button"
                        onClick={sendWhatsAppDraft}
                        disabled={!whatsAppDraft.trim()}
                        className="pu-button-primary"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {tr('admin.messages.whatsappDraftSend')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
    </>

  );
}
