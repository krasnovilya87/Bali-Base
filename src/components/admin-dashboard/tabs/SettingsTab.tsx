import React from 'react';
import {
  Search, AlertCircle, TrendingUp, Check, Play, Square, Mail, Eye, Trash2, Edit3, MessageCircle,
  RefreshCw, Sparkles, CheckCircle2, XCircle, PlusCircle, UserCheck, UserX, Ban, HelpCircle,
  ArrowRight, DollarSign, Briefcase, Send, Volume2, ShieldCheck, Heart, MapPin, Percent, Star,
  List, Image as ImageIcon, MessageSquare, Database, Settings, X, Upload, FileText
} from 'lucide-react';
import { useI18n } from '../../../i18nContext';

type AdminTabProps = Record<string, any>;
export function SettingsTab(props: AdminTabProps) {
  const { tr } = useI18n();
  const {
    totalListings, activeListings, moderationListings, totalClicksCol, totalViews, districtViewsStats, totalDistrictViews,
    filteredUsersList, userSearch, setUserSearch, userRoleFilter, setUserRoleFilter, userStatusFilter, setUserStatusFilter, setShowAddUserModal, handleChangeRole, handleToggleUserBan, handleDeleteUser, listings,
    filteredListingsList, listingSearch, setListingSearch, listingCategoryFilter, setListingCategoryFilter, listingStatusFilter, setListingStatusFilter, onUpdateListing, showToast, onToggleStatus, onDeleteListing,
    moderationItems, handleApprove, handleOpenReject,
    tickets, selectedTicket, setSelectedTicket, replyText, setReplyText, handleSendReply,
    autoApprove, setAutoApprove, maintenanceMode, setMaintenanceMode, commissionRate, setCommissionRate, siteName, setSiteName, telegramSupportLink, setTelegramSupportLink,
    wizardLevel, setWizardLevel, l1SelectedId, setL1SelectedId, l1Label, setL1Label, l1Desc, setL1Desc, l1Image, setL1Image,
    l2ParentId, setL2ParentId, l2SelectedId, setL2SelectedId, l2Label, setL2Label, l2Icon, setL2Icon, l2CustomImage, setL2CustomImage, l2IconType, setL2IconType,
    uploadMethod, setUploadMethod, isMenuSaving, jsonImportCollection, setJsonImportCollection, jsonImportFileName, jsonImportSummary, isJsonImporting, dragActive, setDragActive, handleUploadFile, handleImportJsonFile, handleSaveL1, handleSaveL2
  } = props;
  return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in text-left">
                
                {/* Left Card: Core Platform parameters */}
                <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6 shadow-sm">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base">{tr('admin.settings.publicationTitle')}</h3>
                    <p className="text-[10px] text-gray-400">{tr('admin.settings.publicationBody')}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Auto-moderation Checker toggle */}
                    <label className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={autoApprove}
                        onChange={(e) => {
                          setAutoApprove(e.target.checked);
                          localStorage.setItem('bali_base_config_autoapprove', String(e.target.checked));
                          showToast(e.target.checked ? tr('admin.settings.autoApproveOn') : tr('admin.settings.autoApproveOff'));
                        }}
                        className="w-4.5 h-4.5 text-[#FF7A50] focus:ring-opacity-40 rounded" 
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">{tr('admin.settings.autoApprove')}</span>
                        <span className="text-[10px] text-gray-400 font-semibold block">{tr('admin.settings.autoApproveBody')}</span>
                      </div>
                    </label>

                    {/* Maintenance Mode toggle */}
                    <label className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={maintenanceMode}
                        onChange={(e) => {
                          setMaintenanceMode(e.target.checked);
                          localStorage.setItem('bali_base_config_maintenance', String(e.target.checked));
                          showToast(e.target.checked ? tr('admin.settings.maintenanceOn') : tr('admin.settings.maintenanceOff'));
                        }}
                        className="w-4.5 h-4.5 text-[#FF7A50] focus:ring-opacity-40 rounded" 
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">{tr('admin.settings.maintenance')}</span>
                        <span className="text-[10px] text-gray-400 font-semibold block font-sans">{tr('admin.settings.maintenanceBody')}</span>
                      </div>
                    </label>

                    {/* Commission Rate selection overlay */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 block">{tr('admin.settings.commission')}</label>
                      <div className="flex gap-2 items-center">
                        <Percent className="w-4 h-4 text-gray-400" />
                        <input 
                          type="number"
                          value={commissionRate}
                          onChange={(e) => setCommissionRate(Number(e.target.value))}
                          className="w-24 bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none text-xs font-bold font-mono text-[#1E293B]"
                        />
                        <span className="text-[10.5px] text-gray-400 font-semibold">{tr('admin.settings.commissionBody')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Platform variables meta */}
                <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6 shadow-sm">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base">{tr('admin.settings.brandingTitle')}</h3>
                    <p className="text-[10px] text-gray-400">{tr('admin.settings.brandingBody')}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Site Name text input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">{tr('admin.settings.serviceTitle')}</label>
                      <input 
                        type="text" 
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-4 py-2 focus:outline-none text-xs sm:text-sm focus:border-[#FF7A50] font-sans font-semibold text-[#1E293B]"
                      />
                    </div>

                    {/* Telegram Support Link text input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">{tr('admin.settings.telegram')}</label>
                      <input 
                        type="text" 
                        value={telegramSupportLink}
                        onChange={(e) => setTelegramSupportLink(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-4 py-2 focus:outline-none text-xs sm:text-sm focus:border-[#FF7A50] font-sans font-semibold text-[#1E293B]-font font-mono"
                      />
                    </div>

                    {/* Meta contacts warnings */}
                    <div className="p-3.5 bg-amber-50 text-amber-800 border border-amber-100 rounded-2xl text-xs sm:text-[12.5px] font-semibold space-y-1 flex gap-2">
                      <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span>{tr('admin.settings.whatsappNote')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-150 space-y-5 shadow-sm text-left">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-[#0F172A] text-base sm:text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#2F7D69]" />
                        <span>{tr('admin.settings.importTitle')}</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                        {tr('admin.settings.importBody')}
                      </p>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-[#2F7D69]/10 text-[#2F7D69] text-[10px] font-black uppercase tracking-wide">
                      Housing rent
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">{tr('admin.settings.collection')}</label>
                      <select
                        value={jsonImportCollection}
                        onChange={(e) => setJsonImportCollection(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#2F7D69]"
                      >
                        <option value="housing_for_rent_listing">housing_for_rent_listing</option>
                        <option value="transport_listing" disabled>transport_listing - {tr('admin.settings.soon')}</option>
                        <option value="investment_listing" disabled>investment_listing - {tr('admin.settings.soon')}</option>
                      </select>
                    </div>

                    <div className="lg:col-span-2">
                      <input
                        id="firebase-json-import"
                        type="file"
                        accept="application/json,text/csv,.json,.csv"
                        className="hidden"
                        disabled={isJsonImporting}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImportJsonFile(file);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <label
                        htmlFor="firebase-json-import"
                        className={`w-full min-h-[76px] px-4 py-3 border border-dashed rounded-2xl flex items-center justify-center gap-3 transition cursor-pointer ${
                          isJsonImporting
                            ? 'bg-slate-50 border-gray-200 text-gray-400 pointer-events-none'
                            : 'bg-[#F8FAFC] border-[#2F7D69]/40 text-[#2F7D69] hover:bg-[#2F7D69]/5'
                        }`}
                      >
                        {isJsonImporting ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                        <div>
                          <span className="text-xs font-black block">
                            {isJsonImporting ? tr('admin.settings.importing') : tr('admin.settings.chooseImport')}
                          </span>
                          <span className="text-[10px] text-gray-500 font-semibold block">
                            {tr('admin.settings.importFormat')}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {(jsonImportFileName || jsonImportSummary) && (
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-gray-600 font-semibold space-y-1">
                      {jsonImportFileName && <div>{tr('admin.settings.file')} <span className="font-mono">{jsonImportFileName}</span></div>}
                      {jsonImportSummary && <div>{jsonImportSummary}</div>}
                    </div>
                  )}
                </div>

                {/* Full Width Card: Category & Subcategory Menu Image Wizard */}
                <div className="md:col-span-2 bg-[#F8FAFC] p-6 sm:p-8 rounded-3xl border border-gray-150 space-y-6 shadow-xs mt-6 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-5">
                    <div>
                      <h3 className="font-extrabold text-[#0F172A] text-base sm:text-lg flex items-center gap-2">
                        <Database className="w-5.5 h-5.5 text-[#FF7A50]" />
                        <span>{tr('admin.settings.menuWizard')}</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{tr('admin.settings.menuWizardBody')}</p>
                    </div>

                    {/* Step Selector Tab buttons */}
                    <div className="bg-slate-200/70 p-1 rounded-2xl flex self-start sm:self-center">
                      <button
                        onClick={() => setWizardLevel(1)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          wizardLevel === 1 ? 'bg-white shadow-xs text-black font-extrabold' : 'text-gray-500 hover:text-black font-medium'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        <span>{tr('admin.settings.l1Categories')}</span>
                      </button>
                      <button
                        onClick={() => setWizardLevel(2)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          wizardLevel === 2 ? 'bg-white shadow-xs text-black font-extrabold' : 'text-gray-500 hover:text-black font-medium'
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span>{tr('admin.settings.l2Subcategories')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode & Storage Settings */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-150 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-gray-800 block">{tr('admin.settings.storageMethod')}</span>
                      <span className="text-gray-400 block font-medium">{tr('admin.settings.storageMethodBody')}</span>
                    </div>

                    <div className="flex items-center gap-2 select-none">
                      <button
                        onClick={() => setUploadMethod('base64')}
                        className={`px-4 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
                          uploadMethod === 'base64'
                            ? 'bg-[#2F7D69]/10 border-[#2F7D69] text-[#2F7D69]'
                            : 'border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 bg-slate-50'
                        }`}
                      >
                        {tr('admin.settings.base64InFirestore')}
                      </button>
                      <button
                        onClick={() => setUploadMethod('freeimage')}
                        className={`px-4 py-1.5 rounded-xl border font-bold transition flex items-center gap-1 cursor-pointer ${
                          uploadMethod === 'freeimage'
                            ? 'bg-[#FF7A50]/10 border-[#FF7A50] text-[#FF7A50]'
                            : 'border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 bg-slate-50'
                        }`}
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>{tr('admin.settings.freeimageHostRecommended')}</span>
                      </button>
                    </div>
                  </div>

                  {/* STEP 1: CATEGORY LEVEL 1 MANAGEMENT PANEL */}
                  {wizardLevel === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                      {/* L1 Categories selectors */}
                      <div className="space-y-2 select-none">
                        <label className="text-xs font-bold text-gray-700 block">{tr('admin.settings.selectL1')}</label>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
                          {[
                            { id: 'housing', label: `🏡 ${tr('category.housing.label')}` },
                            { id: 'transport', label: `🛵 ${tr('category.transport.label')}` },
                            { id: 'investments', label: `📈 ${tr('category.investments.label')}` },
                            { id: 'services', label: `💼 ${tr('category.services.label')}` },
                            { id: 'ads', label: `📢 ${tr('category.ads.label')}` },
                            { id: 'afisha', label: `🎉 ${tr('category.afisha.label')}` },
                            { id: 'life', label: `💬 ${tr('category.life.label')}` },
                            { id: 'useful', label: `🧭 ${tr('category.useful.label')}` }
                          ].map(item => (
                            <button
                              key={item.id}
                              onClick={() => setL1SelectedId(item.id)}
                              className={`w-full text-left px-4 py-3 rounded-2xl border transition-all text-xs font-bold flex items-center justify-between cursor-pointer ${
                                l1SelectedId === item.id 
                                  ? 'border-[#FF7A50] bg-[#FF7A50]/5 text-[#FF7A50] shadow-2xs font-extrabold' 
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-slate-50 bg-white'
                              }`}
                            >
                              <span>{item.label}</span>
                              {l1SelectedId === item.id && <Check className="w-4 h-4 text-[#FF7A50]" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Config Form and fields */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-100">
                          <h4 className="font-bold text-gray-850 text-xs sm:text-sm flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-[#FF7A50]" />
                            <span>{tr('admin.settings.categoryDisplay')}</span>
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 text-left">
                              <label className="text-xs font-bold text-gray-600">{tr('admin.settings.menuName')}</label>
                              <input
                                type="text"
                                value={l1Label}
                                onChange={e => setL1Label(e.target.value)}
                                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#FF7A50]"
                                placeholder={tr('admin.settings.menuNamePlaceholder')}
                              />
                            </div>

                            <div className="space-y-1.5 text-left">
                              <label className="text-xs font-bold text-gray-600">{tr('admin.settings.sectionDescription')}</label>
                              <input
                                type="text"
                                value={l1Desc}
                                onChange={e => setL1Desc(e.target.value)}
                                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#FF7A50]"
                                placeholder={tr('admin.settings.sectionDescriptionPlaceholder')}
                              />
                            </div>
                          </div>

                          {/* Image drag upload panel */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600 block">{tr('admin.settings.uploadBackground')}</label>
                            
                            <div className="flex flex-col md:flex-row items-center gap-5">
                              {/* Preview Box */}
                              <div className="w-full md:w-36 h-24 rounded-2xl bg-slate-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner">
                                {l1Image ? (
                                  <>
                                    <img 
                                      src={l1Image} 
                                      alt="L1 Category" 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    <button
                                      onClick={() => setL1Image('')}
                                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-90 transition shadow cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <div className="text-center p-2 text-gray-300 flex flex-col items-center">
                                    <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                                    <span className="text-[9px] font-bold">{tr('admin.settings.noBackground')}</span>
                                  </div>
                                )}
                              </div>

                              {/* Upload field */}
                              <div 
                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={async (e) => {
                                  e.preventDefault();
                                  setDragActive(false);
                                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    const base = await handleUploadFile(e.dataTransfer.files[0], 'l1');
                                    setL1Image(base);
                                  }
                                }}
                                className={`flex-1 border-2 border-dashed rounded-2xl p-5 text-center transition flex flex-col items-center justify-center cursor-pointer relative bg-slate-50/50 ${
                                  dragActive ? 'border-[#FF7A50] bg-[#FF7A50]/5' : 'border-gray-200 hover:border-[#FF7A50] hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="file"
                                  id="l1-file-input"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const base = await handleUploadFile(e.target.files[0], 'l1');
                                      setL1Image(base);
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label htmlFor="l1-file-input" className="cursor-pointer space-y-1">
                                  <PlusCircle className="w-6 h-6 text-[#FF7A50] mx-auto opacity-75 animate-pulse" />
                                  <span className="text-xs font-bold text-gray-700 block">{tr('admin.settings.dropOrClick')}</span>
                                  <span className="text-[10px] text-gray-400 block font-medium">{tr('admin.settings.imageRecommendation')}</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-3">
                            <button
                              onClick={handleSaveL1}
                              disabled={isMenuSaving}
                              className="px-6 py-2.5 bg-[#FF7A50] hover:bg-[#E56E48] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none font-sans"
                            >
                              {isMenuSaving ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>{tr('admin.settings.syncing')}</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>{tr('admin.settings.updateL1')}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: SUBCATEGORY LEVEL 2 MANAGEMENT PANEL */}
                  {wizardLevel === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                      {/* Selection row */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 block">{tr('admin.settings.parentL1')}</label>
                          <select
                            value={l2ParentId}
                            onChange={e => setL2ParentId(e.target.value)}
                            className="w-full bg-white border border-gray-250 rounded-xl px-3 py-2 text-xs font-bold font-sans text-gray-700 outline-none focus:border-[#FF7A50]"
                          >
                            <option value="housing">🏡 {tr('category.housing.label')}</option>
                            <option value="transport">🛵 {tr('category.transport.label')}</option>
                            <option value="investments">📈 {tr('category.investments.label')}</option>
                            <option value="services">💼 {tr('category.services.label')}</option>
                            <option value="ads">📢 {tr('category.ads.label')}</option>
                            <option value="afisha">🎉 {tr('category.afisha.label')}</option>
                            <option value="life">💬 {tr('category.life.label')}</option>
                            <option value="useful">🧭 {tr('category.useful.label')}</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 select-none">
                          <label className="text-xs font-bold text-gray-700 block">{tr('admin.settings.selectL2')}</label>
                          <div className="grid grid-cols-1 gap-2.5 max-h-52 overflow-y-auto pr-1">
                            {([
                              { id: 'entire_place', label: `🏠 ${tr('subcategory.entire_place')}` },
                              { id: 'private_suite', label: `🏢 ${tr('subcategory.private_suite')}` },
                              { id: 'private_room', label: `🛌 ${tr('subcategory.private_room')}` },
                              { id: 'scooters', label: `🛵 ${tr('subcategory.scooters')}` },
                              { id: 'motorcycles', label: `🏍 ${tr('subcategory.motorcycles')}` },
                              { id: 'cars', label: `🚗 ${tr('subcategory.cars')}` },
                              { id: 'villas', label: `🏢 ${tr('subcategory.villas')}` },
                              { id: 'land', label: `🏝 ${tr('subcategory.land')}` },
                              { id: 'business', label: `💼 ${tr('subcategory.business')}` },
                              { id: 'household_services', label: `🧰 ${tr('subcategory.household_services')}` },
                              { id: 'beauty_care', label: `✨ ${tr('subcategory.beauty_care')}` },
                              { id: 'health', label: `🩺 ${tr('subcategory.health')}` },
                              { id: 'education', label: `📚 ${tr('subcategory.education')}` },
                              { id: 'sport', label: `🏄‍♂️ ${tr('subcategory.sport')}` },
                              { id: 'photo_video', label: `📷 ${tr('subcategory.photo_video')}` },
                              { id: 'consultations', label: `💡 ${tr('subcategory.consultations')}` },
                              { id: 'service_business', label: `💼 ${tr('subcategory.service_business')}` },
                              { id: 'service_transport', label: `🛵 ${tr('subcategory.service_transport')}` },
                              { id: 'other_services', label: `⭐ ${tr('subcategory.other_services')}` },
                              { id: 'electronics', label: `🔌 ${tr('subcategory.electronics')}` },
                              { id: 'trans_sale', label: `🛵 ${tr('subcategory.trans_sale')}` },
                              { id: 'clothes', label: `👕 ${tr('subcategory.clothes')}` },
                              { id: 'house_furn', label: `🏡 ${tr('subcategory.house_furn')}` },
                              { id: 'festivals', label: `🎉 ${tr('subcategory.festivals')}` },
                              { id: 'seminars', label: `💼 ${tr('subcategory.seminars')}` },
                              { id: 'exhibitions', label: `🎨 ${tr('subcategory.exhibitions')}` },
                              { id: 'meetings', label: `💬 ${tr('subcategory.meetings')}` },
                              { id: 'buddies', label: `🛵 ${tr('subcategory.buddies')}` }
                            ].filter(item => {
                              // Filter subcategories matching the parent
                              if (l2ParentId === 'housing') return ['entire_place', 'private_suite', 'private_room'].includes(item.id);
                              if (l2ParentId === 'transport') return ['scooters', 'motorcycles', 'cars'].includes(item.id);
                              if (l2ParentId === 'investments') return ['villas', 'land', 'business'].includes(item.id);
                              if (l2ParentId === 'services') return [
                                'household_services',
                                'beauty_care',
                                'health',
                                'education',
                                'sport',
                                'photo_video',
                                'consultations',
                                'service_business',
                                'service_transport',
                                'other_services'
                              ].includes(item.id);
                              if (l2ParentId === 'ads') return ['electronics', 'trans_sale', 'clothes', 'house_furn'].includes(item.id);
                              if (l2ParentId === 'afisha') return ['festivals', 'seminars', 'exhibitions'].includes(item.id);
                              if (l2ParentId === 'life') return ['meetings', 'buddies'].includes(item.id);
                              return false;
                            })).map((sub: any) => (
                              <button
                                key={sub.id}
                                onClick={() => setL2SelectedId(sub.id)}
                                className={`w-full text-left px-4 py-3 rounded-2xl border transition text-xs font-bold flex items-center justify-between cursor-pointer bg-white ${
                                  l2SelectedId === sub.id 
                                    ? 'border-[#2F7D69] bg-[#2F7D69]/5 text-[#2F7D69] font-extrabold' 
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                <span>{sub.label}</span>
                                {l2SelectedId === sub.id && <Check className="w-4 h-4 text-[#2F7D69]" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Settings Form L2 */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-100">
                          <h4 className="font-bold text-gray-850 text-xs sm:text-sm flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-[#2F7D69]" />
                            <span>{tr('admin.settings.subcategoryDisplay')}</span>
                          </h4>
                          
                          <div className="space-y-1.5 text-left">
                            <label className="text-xs font-bold text-gray-600">{tr('admin.settings.subcategoryName')}</label>
                            <input
                              type="text"
                              value={l2Label}
                              onChange={e => setL2Label(e.target.value)}
                              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#2F7D69]"
                              placeholder={tr('admin.settings.subcategoryPlaceholder')}
                            />
                          </div>

                          {/* Icon Selector Type Toggle tabs */}
                          <div className="space-y-2 select-none">
                            <label className="text-xs font-bold text-gray-600 block">{tr('admin.settings.iconType')}</label>
                            <div className="bg-slate-150 p-1 rounded-xl flex w-64 text-[11px] font-bold">
                              <button
                                onClick={() => setL2IconType('emoji')}
                                className={`flex-1 text-center py-1 rounded-lg transition cursor-pointer ${
                                  l2IconType === 'emoji' ? 'bg-white text-black shadow-2xs font-extrabold' : 'text-gray-500 hover:text-black'
                                }`}
                              >
                                3D Fluent Emoji
                              </button>
                              <button
                                onClick={() => setL2IconType('image')}
                                className={`flex-1 text-center py-1 rounded-lg transition cursor-pointer ${
                                  l2IconType === 'image' ? 'bg-white text-black shadow-2xs font-extrabold' : 'text-gray-500 hover:text-black'
                                }`}
                              >
                                {tr('admin.settings.imageFile')}
                              </button>
                            </div>
                          </div>

                          {/* 3D Emoji configuration */}
                          {l2IconType === 'emoji' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-gray-150">
                              <div className="space-y-2 text-left">
                                <label className="text-xs font-extrabold text-gray-500 block">{tr('admin.settings.emojiSymbol')}</label>
                                <input
                                  type="text"
                                  value={l2Icon}
                                  onChange={e => setL2Icon(e.target.value)}
                                  className="w-full bg-white border border-gray-250 rounded-xl px-3 py-1.5 text-xs font-bold text-center outline-none focus:border-[#2F7D69]"
                                  placeholder={tr('admin.settings.emojiPlaceholder')}
                                />
                                <span className="text-[10px] text-gray-400 block leading-tight font-medium">{tr('admin.settings.emojiHelp')}</span>
                              </div>

                              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-dashed border-gray-200">
                                <span className="text-[10px] font-bold text-gray-400 mb-1.5">{tr('admin.settings.currentEmoji')}</span>
                                <div className="text-3.5xl filter hover:scale-[1.12] transition duration-200">
                                  {l2Icon || '🏡'}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Dynamic Custom Image uploader */}
                          {l2IconType === 'image' && (
                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-gray-150">
                              <label className="text-[11px] font-extrabold text-gray-500 block">{tr('admin.settings.customL2Image')}</label>
                              
                              <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-white border border-gray-250 shrink-0 overflow-hidden flex items-center justify-center relative shadow-sm">
                                  {l2CustomImage ? (
                                    <>
                                      <img src={l2CustomImage} alt="icon sub" className="w-full h-full object-cover" />
                                      <button
                                        onClick={() => setL2CustomImage('')}
                                        className="absolute -top-0.5 -right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-90 cursor-pointer shadow"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <ImageIcon className="w-6 h-6 text-gray-300" />
                                  )}
                                </div>

                                <div
                                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                  onDragLeave={() => setDragActive(false)}
                                  onDrop={async (e) => {
                                    e.preventDefault();
                                    setDragActive(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                      const base = await handleUploadFile(e.dataTransfer.files[0], 'l2');
                                      setL2CustomImage(base);
                                    }
                                  }}
                                  className={`flex-1 border border-dashed rounded-xl p-3.5 text-center transition flex flex-col items-center justify-center cursor-pointer relative bg-white ${
                                    dragActive ? 'border-[#2F7D69]' : 'border-gray-255 hover:border-[#2F7D69]'
                                  }`}
                                >
                                  <input
                                    type="file"
                                    id="l2-file-input"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        const base = await handleUploadFile(e.target.files[0], 'l2');
                                        setL2CustomImage(base);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label htmlFor="l2-file-input" className="cursor-pointer space-y-0.5">
                                    <PlusCircle className="w-5 h-5 text-[#2F7D69] mx-auto opacity-75" />
                                    <span className="text-[10px] font-bold text-gray-700 block">{tr('admin.settings.dropOrClickShort')}</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end pt-3">
                            <button
                              onClick={handleSaveL2}
                              disabled={isMenuSaving}
                              className="px-6 py-2.5 bg-[#2F7D69] hover:bg-[#256353] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none font-sans"
                            >
                              {isMenuSaving ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>{tr('admin.settings.syncing')}</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>{tr('admin.settings.updateL2')}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

  );
}
