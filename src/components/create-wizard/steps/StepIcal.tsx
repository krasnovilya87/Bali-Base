import React from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useI18n } from '../../../i18nContext';

type StepIcalProps = {
  icalInput: string;
  setIcalInput: React.Dispatch<React.SetStateAction<string>>;
  testIcalSync: () => void;
  icalStatus: string;
  simulatedBlockedCount: number;
};

const StepIcal: React.FC<StepIcalProps> = ({
  icalInput,
  setIcalInput,
  testIcalSync,
  icalStatus,
  simulatedBlockedCount
}) => {
  const { tr } = useI18n();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="pl space-y-2 pt-2 p-4 rounded-3xl">
        <label className="text-xs font-semibold block text-[#1E293B]">{tr('wizard.icalUrl')}</label>
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://www.airbnb.ru/calendar/ical/123456.ics..."
          value={icalInput}
          onChange={event => setIcalInput(event.target.value)}
          className="flex-1 bg-[#F4F7F6] px-3 py-2 rounded-xl text-xs font-mono"
        />
        <button
          onClick={testIcalSync}
          className="px-4 py-2 bg-[#2F7D69] hover:bg-[#205749] text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
          <span>{tr('wizard.check')}</span>
        </button>
      </div>

      {icalStatus && (
        <div className={`mt-2 flex items-center gap-1.5 p-2 rounded-xl text-[10.5px] ${simulatedBlockedCount > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-[#FF7A50]/10 text-[#FF7A50]'}`}>
          {simulatedBlockedCount > 0 ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{icalStatus}</span>
        </div>
      )}
    </div>

    <p className="text-[10.5px] text-gray-450 leading-relaxed max-w-xl text-center mx-auto">
      * {tr('wizard.icalNote')}
    </p>
  </div>
  );
};

export default StepIcal;
