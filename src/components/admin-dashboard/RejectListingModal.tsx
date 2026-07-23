import React from 'react';
import { X, XCircle } from 'lucide-react';
import { useI18n } from '../../i18nContext';

interface RejectListingModalProps {
  reason: string;
  onReasonChange: (value: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const REJECTION_REASON_GROUPS = [
  {
    titleKey: 'admin.reject.group.insufficientInfo',
    reasonKeys: [
      'admin.reject.reason.missingPhotos',
      'admin.reject.reason.lowQualityPhotos',
      'admin.reject.reason.missingDescription',
      'admin.reject.reason.insufficientLocation',
      'admin.reject.reason.missingPrice',
      'admin.reject.reason.missingAmenities'
    ]
  },
  {
    titleKey: 'admin.reject.group.incorrectData',
    reasonKeys: [
      'admin.reject.reason.wrongCategory',
      'admin.reject.reason.incorrectAddress',
      'admin.reject.reason.titleMismatch',
      'admin.reject.reason.falseDescription',
      'admin.reject.reason.wrongPrice',
      'admin.reject.reason.contradictions'
    ]
  },
  {
    titleKey: 'admin.reject.group.listingQuality',
    reasonKeys: [
      'admin.reject.reason.photosMismatch',
      'admin.reject.reason.watermarkedPhotos',
      'admin.reject.reason.promotionalImages',
      'admin.reject.reason.duplicateListing',
      'admin.reject.reason.tooLittleInfo',
      'admin.reject.reason.misleadingListing'
    ]
  },
  {
    titleKey: 'admin.reject.group.policyViolation',
    reasonKeys: [
      'admin.reject.reason.notAvailable',
      'admin.reject.reason.prohibitedObject',
      'admin.reject.reason.fraudSigns',
      'admin.reject.reason.invalidContacts',
      'admin.reject.reason.platformViolation',
      'admin.reject.reason.spam'
    ]
  },
  {
    titleKey: 'admin.reject.group.verificationRequired',
    reasonKeys: [
      'admin.reject.reason.ownershipUnverified',
      'admin.reject.reason.contactVerification',
      'admin.reject.reason.objectVerification'
    ]
  },
  {
    titleKey: 'admin.reject.group.other',
    reasonKeys: [
      'admin.reject.reason.needsFixBeforePublish',
      'admin.reject.reason.temporarilyRejected',
      'admin.reject.reason.other'
    ]
  }
];

const OTHER_REASON_KEY = 'admin.reject.reason.other';

export default function RejectListingModal({
  reason,
  onReasonChange,
  comment,
  onCommentChange,
  onClose,
  onConfirm
}: RejectListingModalProps) {
  const { tr } = useI18n();
  const otherReason = tr(OTHER_REASON_KEY);
  const isOtherReason = reason === otherReason;
  const canConfirm = Boolean(reason) && (!isOtherReason || Boolean(comment.trim()));

  return (
    <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-[510] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[#E2E8F0] shadow-2xl relative text-left select-none animate-fade-in space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base flex items-center gap-1.5">
            <XCircle className="w-5 h-5 text-rose-500" />
            <span>{tr('admin.reject.title')}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl bg-gray-50 hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-505" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-600">{tr('admin.reject.reason')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REJECTION_REASON_GROUPS.map(group => (
                <div key={group.titleKey} className="rounded-2xl border border-gray-200 bg-slate-50 p-3 space-y-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                    {tr(group.titleKey)}
                  </h4>
                  <div className="space-y-1.5">
                    {group.reasonKeys.map(reasonKey => {
                      const label = tr(reasonKey);
                      return (
                        <label
                          key={reasonKey}
                          className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 border border-transparent hover:border-[#FF7A50]/30 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="rejection-reason"
                            value={label}
                            checked={reason === label}
                            onChange={() => onReasonChange(label)}
                            className="mt-0.5 accent-rose-500"
                          />
                          <span>{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 block">
              {isOtherReason ? tr('admin.reject.commentRequired') : tr('admin.reject.commentOptional')}
            </label>
            <textarea
              rows={4}
              required={isOtherReason}
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-gray-200 rounded-2xl focus:outline-none text-xs sm:text-sm font-semibold focus:border-[#FF7A50] leading-relaxed"
              placeholder={tr('admin.reject.placeholder')}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              disabled={!canConfirm}
              className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-200 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer"
            >
              {tr('admin.reject.submit')}
            </button>
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 rounded-xl text-xs font-bold transition cursor-pointer font-sans"
            >
              {tr('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
