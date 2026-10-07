import React from 'react';
import { AlertCircle, FileText, Percent, RefreshCw, Upload } from 'lucide-react';
import { useI18n } from '../../../i18nContext';

type AdminTabProps = Record<string, any>;
export function SettingsTab(props: AdminTabProps) {
  const { tr } = useI18n();
  const {
    showToast,
    autoApprove, setAutoApprove, maintenanceMode, setMaintenanceMode, commissionRate, setCommissionRate, siteName, setSiteName, telegramSupportLink, setTelegramSupportLink,
    jsonImportCollection, setJsonImportCollection, jsonImportFileName, jsonImportSummary, isJsonImporting, handleImportJsonFile
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

              </div>

  );
}
