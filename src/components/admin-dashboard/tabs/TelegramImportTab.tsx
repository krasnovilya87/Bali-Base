import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Send, Square, Trash2 } from 'lucide-react';
import { useI18n } from '../../../i18nContext';
import Del from '../../Del';
import {
  addTelegramImportChannel,
  loadTelegramImportStatus,
  removeTelegramImportChannel,
  startTelegramImport,
  stopTelegramImport,
  TELEGRAM_IMPORT_API_UNAVAILABLE,
  type TelegramImportSection,
  type TelegramImportStatus
} from '../../../utils/telegramImportClient';

type TelegramImportTabProps = {
  showToast?: (message: string) => void;
};

const SECTIONS: TelegramImportSection[] = ['ads', 'services', 'afisha', 'life'];
const STOPPED_BY_ADMIN = 'Stopped by admin'; // same text as the server's run error
const POLL_MS = 3000;
const DEFAULT_SCAN_DAYS = 30;
const MAX_SCAN_DAYS = 365;

export function TelegramImportTab({ showToast }: TelegramImportTabProps) {
  const { tr } = useI18n();
  const [status, setStatus] = useState<TelegramImportStatus | null>(null);
  const [error, setError] = useState('');
  const [channelInput, setChannelInput] = useState('');
  const [scanDays, setScanDays] = useState(String(DEFAULT_SCAN_DAYS));
  const [busy, setBusy] = useState(false);

  const errorText = useCallback((requestError: unknown) => {
    const message = requestError instanceof Error ? requestError.message : String(requestError);
    return message === TELEGRAM_IMPORT_API_UNAVAILABLE ? tr('admin.telegram.localOnly') : message;
  }, [tr]);

  const refresh = useCallback(async () => {
    try {
      setStatus(await loadTelegramImportStatus());
      setError('');
    } catch (requestError) {
      setError(errorText(requestError));
    }
  }, [errorText]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!status?.running) return undefined;
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [status?.running, refresh]);

  const runAction = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await action();
      showToast?.(message);
      await refresh();
    } catch (requestError) {
      const message = errorText(requestError);
      setError(message);
      showToast?.(message);
    } finally {
      setBusy(false);
    }
  };

  const scanDaysValue = Number(scanDays);
  const scanDaysValid = Number.isInteger(scanDaysValue) && scanDaysValue >= 1 && scanDaysValue <= MAX_SCAN_DAYS;

  const handleAdd = () => {
    if (!channelInput.trim() || !scanDaysValid) return;
    void runAction(async () => {
      await addTelegramImportChannel(channelInput, scanDaysValue);
      setChannelInput('');
    }, tr('admin.telegram.added'));
  };

  const lastRun = status?.lastRun;
  const disabled = busy || !status?.available || status.running;

  return (
    <div className="space-y-5 animate-fade-in text-left">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#1E293B]">{tr('admin.telegram.title')}</h3>
            <p className="text-[11px] text-gray-400 font-semibold">{tr('admin.telegram.body')}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void runAction(startTelegramImport, tr('admin.telegram.started'))}
              disabled={disabled}
              className="h-10 px-4 rounded-full bg-[#FF7A50] text-white text-xs font-extrabold flex items-center gap-2 hover:bg-[#F0693F] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${status?.running ? 'animate-spin' : ''}`} />
              {status?.running ? tr('admin.telegram.running') : tr('admin.telegram.update')}
            </button>
            {status?.running && (
              <button
                type="button"
                onClick={() => void runAction(stopTelegramImport, tr('admin.telegram.stopRequested'))}
                disabled={busy || status.stopping}
                className="h-10 px-4 rounded-full bg-[#1E293B] text-white text-xs font-extrabold flex items-center gap-2 hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                {status.stopping ? tr('admin.telegram.stopping') : tr('admin.telegram.stop')}
              </button>
            )}
          </div>
        </div>
        {status?.running && status.step && (
          <p className="mt-3 text-xs font-bold text-[#FF7A50]">{tr(`admin.telegram.step.${status.step}`)}</p>
        )}
        {(error || (status && !status.available)) && (
          <p className="mt-3 text-xs font-semibold text-red-500">{error || `${tr('admin.telegram.unavailable')} ${status?.reason || ''}`}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h4 className="text-sm font-extrabold text-[#1E293B]">{tr('admin.telegram.channels')}</h4>
          <div className="flex flex-wrap gap-2">
            <input
              value={channelInput}
              onChange={event => setChannelInput(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') handleAdd(); }}
              placeholder={tr('admin.telegram.channelPlaceholder')}
              className="flex-1 min-w-[160px] h-10 px-4 rounded-full border border-gray-200 text-sm outline-none focus:border-[#FF7A50]"
            />
            <label className="h-10 pl-4 pr-1 rounded-full border border-gray-200 flex items-center gap-2 text-[11px] font-bold text-gray-500 focus-within:border-[#FF7A50]">
              {tr('admin.telegram.scanPeriod')}
              <input
                type="number"
                min={1}
                max={MAX_SCAN_DAYS}
                value={scanDays}
                onChange={event => setScanDays(event.target.value)}
                onKeyDown={event => { if (event.key === 'Enter') handleAdd(); }}
                aria-invalid={!scanDaysValid}
                className={`w-14 h-8 text-center text-sm font-bold rounded-full outline-none ${scanDaysValid ? 'text-[#1E293B]' : 'text-red-500'}`}
              />
              <span className="pr-3">{tr('admin.telegram.days')}</span>
            </label>
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy || !channelInput.trim() || !scanDaysValid}
              className="h-10 px-4 rounded-full bg-[#1E293B] text-white text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {tr('admin.telegram.add')}
            </button>
          </div>
          {status?.channels.length ? (
            <ul className="divide-y divide-gray-100">
              {status.channels.map(channel => (
                <li key={channel.name} className="flex items-center gap-3 py-2.5">
                  <Send className="w-4 h-4 text-sky-500 shrink-0" />
                  <a href={`https://t.me/${channel.name}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#1E293B] hover:underline">
                    @{channel.name}
                  </a>
                  <span className="text-[11px] text-gray-400 font-semibold">
                    {channel.lastMessageId
                      ? `${tr('admin.telegram.posts').replace('{count}', String(channel.posts))} · ${tr('admin.telegram.period').replace('{days}', String(channel.firstScanDays))}`
                      : tr('admin.telegram.firstScan').replace('{days}', String(channel.firstScanDays))}
                  </span>
                  {status.running || busy ? (
                    <span className="ml-auto p-2 text-gray-300" aria-hidden="true"><Trash2 className="w-4 h-4" /></span>
                  ) : (
                    <Del
                      title={tr('admin.telegram.removeTitle').replace('{channel}', `@${channel.name}`)}
                      message={tr('admin.telegram.removeBody')}
                      confirmLabel={tr('admin.telegram.remove')}
                      cancelLabel={tr('common.cancel')}
                      onConfirm={() => void runAction(() => removeTelegramImportChannel(channel.name), tr('admin.telegram.removed'))}
                      className="ml-auto p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Del>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 font-semibold">{tr('admin.telegram.empty')}</p>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h4 className="text-sm font-extrabold text-[#1E293B]">{tr('admin.telegram.lastRun')}</h4>
          {!lastRun ? (
            <p className="text-xs text-gray-400 font-semibold">{tr('admin.telegram.never')}</p>
          ) : (
            <>
              <p className={`text-xs font-bold ${lastRun.ok === false ? 'text-red-500' : 'text-emerald-600'}`}>
                {new Date(lastRun.startedAt).toLocaleString()} · {lastRun.ok === false
                  ? lastRun.error === STOPPED_BY_ADMIN
                    ? tr('admin.telegram.stopped')
                    : `${tr('admin.telegram.failed')}: ${lastRun.error || ''}`
                  : lastRun.finishedAt ? tr('admin.telegram.success') : tr('admin.telegram.running')}
              </p>
              {lastRun.ok && lastRun.error && (
                <p className="text-xs font-semibold text-amber-600">{tr('admin.telegram.geminiLimit')}</p>
              )}
              {lastRun.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SECTIONS.map(section => (
                    <div key={section} className="rounded-2xl bg-[#F4F7F6] p-3">
                      <div className="text-lg font-extrabold text-[#1E293B]">{lastRun.summary?.created[section] || 0}</div>
                      <div className="text-[11px] font-semibold text-gray-500">{tr(`admin.telegram.section.${section}`)}</div>
                    </div>
                  ))}
                </div>
              )}
              {lastRun.summary && (
                <p className="text-[11px] text-gray-500 font-semibold">
                  {tr('admin.telegram.reposts')}: {lastRun.summary.reposts} · {tr('admin.telegram.duplicatesRemoved')}: {lastRun.summary.removed || 0}
                  {' · '}{tr('admin.telegram.skipped')}: {lastRun.summary.skipped}
                  {' · '}{tr('admin.telegram.photoErrors')}: {lastRun.summary.photoErrors} · {tr('admin.telegram.uploadErrors')}: {lastRun.summary.failed}
                </p>
              )}
              <p className="text-[11px] text-gray-400 font-semibold">{tr('admin.telegram.moderationHint')}</p>
            </>
          )}
        </div>
      </div>

      {!!status?.log.length && (
        <div className="bg-[#0F172A] rounded-3xl p-5">
          <h4 className="text-sm font-extrabold text-white mb-3">{tr('admin.telegram.log')}</h4>
          <pre className="text-[11px] leading-relaxed text-slate-300 max-h-80 overflow-auto whitespace-pre-wrap">
            {status.log.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}
