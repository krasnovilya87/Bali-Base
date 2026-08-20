import React from 'react';
import PhoneInput from '../../PhoneInput';
import { useI18n } from '../../../i18nContext';

type StepContactProps = {
  ownerName: string;
  setOwnerName: React.Dispatch<React.SetStateAction<string>>;
  whatsappInput: string;
  handlePhoneChange: (value: string, whatsappFormatted?: string) => void;
};

const StepContact: React.FC<StepContactProps> = ({
  ownerName,
  setOwnerName,
  whatsappInput,
  handlePhoneChange
}) => {
  const { tr } = useI18n();

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-sm font-bold font-sans text-[#1E293B] tracking-wider block ml-1">{tr('wizard.contacts')}</h3>

    <div className="flex flex-col gap-4 pt-2">
      <input
        type="text"
        placeholder={tr('wizard.name')}
        aria-label={tr('wizard.name')}
        value={ownerName}
        onChange={event =>
          setOwnerName(event.target.value.replace(/(^|[\s-])(\p{L})/gu, (_, separator, letter) =>
            separator + letter.toLocaleUpperCase()
          ))
        }
        className="w-full !bg-white !border-0 p-2.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-0"
      />

      <PhoneInput
        value={whatsappInput}
        onChange={(displayValue, whatsappNumber) => handlePhoneChange(displayValue, whatsappNumber)}
        placeholder={tr('wizard.whatsapp')}
        ariaLabel={tr('wizard.whatsapp')}
        className="w-full !bg-white !border-0 p-2.5 pr-14 rounded-xl text-xs font-mono focus:outline-none focus:ring-0"
      />
    </div>
    </div>
  );
};

export default StepContact;
