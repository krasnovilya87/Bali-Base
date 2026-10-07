import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { useI18n } from '../../../i18nContext';
import { AI_MODERATION_RULES } from '../../../utils/aiModerationRules';
import ListingCard from '../../ListingCard';
import Del from '../../Del';

type AdminTabProps = Record<string, any>;

const AiModerationReport = ({ item }: { item: any }) => {
  const { tr } = useI18n();
  const aiModeration = item.aiModeration;
  const checks = aiModeration?.checks || [];
  const failedCount = checks.filter((check: any) => !check.passed).length;

  if (!aiModeration) {
    return (
      <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">
        {tr('admin.aiModeration.notChecked')}
      </div>
    );
  }

  if (aiModeration.status === 'error') {
    return (
      <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
        <div className="flex items-center gap-1.5 font-black">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{tr('admin.aiModeration.error')}</span>
        </div>
        {aiModeration.summary && (
          <p className="mt-1 leading-relaxed text-rose-600">{aiModeration.summary}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>{tr('admin.aiModeration.title')}</span>
          </div>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
            {aiModeration.status === 'passed'
              ? tr('admin.aiModeration.passed')
              : tr('admin.aiModeration.manualReview', { count: failedCount })}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
          failedCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
          {failedCount > 0 ? tr('admin.aiModeration.failedBadge') : tr('admin.aiModeration.okBadge')}
        </span>
      </div>

      {aiModeration.summary && (
        <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-500">{aiModeration.summary}</p>
      )}

      <div className="mt-3 space-y-1.5">
        {AI_MODERATION_RULES.map(rule => {
          const check = checks.find((candidate: any) => candidate.id === rule.id);
          const passed = check?.passed === true;

          return (
            <div
              key={rule.id}
              className={`rounded-xl border px-2.5 py-2 ${
                passed ? 'border-emerald-100 bg-emerald-50/70' : 'border-rose-100 bg-rose-50/80'
              }`}
            >
              <div className="flex items-start gap-2">
                {passed ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                )}
                <div className="min-w-0">
                  <div className={`text-[10.5px] font-black leading-snug ${passed ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {tr(rule.titleKey)}
                  </div>
                  {check?.reason && !passed && (
                    <div className="mt-0.5 text-[10px] font-medium leading-snug text-rose-600">
                      {check.reason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function ModerationTab(props: AdminTabProps) {
  const { tr } = useI18n();
  const {
    moderationItems,
    handleDeleteAllModeration,
    handleApprove,
    handleOpenReject,
    currencySymbol,
    currencyRate,
    onSelectListing
  } = props;

  return (
    <div className="space-y-6 animate-fade-in">
      {moderationItems.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-150 text-center space-y-4 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-800 text-base">{tr('admin.moderation.emptyTitle')}</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">{tr('admin.moderation.emptyBody')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-gray-800 text-sm">{tr('admin.moderation.title')}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {tr('admin.moderation.found', { count: moderationItems.length })}
              </p>
            </div>
            <Del
              title={tr('admin.moderation.deleteAllTitle')}
              message={tr('admin.moderation.deleteAllBody', { count: moderationItems.length })}
              confirmLabel={tr('admin.moderation.deleteAllConfirm')}
              cancelLabel={tr('common.cancel')}
              onConfirm={handleDeleteAllModeration}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{tr('admin.moderation.deleteAll')}</span>
            </Del>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {moderationItems.map(item => (
              <div key={item.id} className="flex flex-col">
                <ListingCard
                  listing={item}
                  onSelect={onSelectListing}
                  currencySymbol={currencySymbol}
                  currencyRate={currencyRate}
                  actions={(
                    <div className="flex gap-2.5">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleApprove(item.id);
                        }}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{tr('admin.moderation.approve')}</span>
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenReject(item.id);
                        }}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{tr('admin.moderation.reject')}</span>
                      </button>
                    </div>
                  )}
                />
                <AiModerationReport item={item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
