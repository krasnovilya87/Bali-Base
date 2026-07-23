import React from 'react';
import { CheckCircle2, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { useI18n } from '../../../i18nContext';
import ListingCard from '../../ListingCard';

type AdminTabProps = Record<string, any>;

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
            <button
              onClick={handleDeleteAllModeration}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{tr('admin.moderation.deleteAll')}</span>
            </button>
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
