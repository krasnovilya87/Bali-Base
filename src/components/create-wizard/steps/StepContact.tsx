import React from 'react';

type StepContactProps = {
  ownerName: string;
  setOwnerName: React.Dispatch<React.SetStateAction<string>>;
  whatsappInput: string;
  handlePhoneChange: (value: string) => void;
};

const StepContact: React.FC<StepContactProps> = ({
  ownerName,
  setOwnerName,
  whatsappInput,
  handlePhoneChange
}) => (
  <div className="space-y-4 animate-fade-in">
    <h3 className="text-sm font-bold font-sans text-[#1E293B] tracking-wider block ml-1">Контакты</h3>

    <div className="flex flex-col gap-4 pt-2">
      <input
        type="text"
        placeholder="Имя"
        aria-label="Имя"
        value={ownerName}
        onChange={event =>
          setOwnerName(event.target.value.replace(/(^|[\s-])(\p{L})/gu, (_, separator, letter) =>
            separator + letter.toLocaleUpperCase()
          ))
        }
        className="w-full !bg-white !border-0 p-2.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-0"
      />

      <input
        type="tel"
        placeholder="WhatsApp номер"
        aria-label="WhatsApp номер"
        value={whatsappInput}
        onChange={event => handlePhoneChange(event.target.value)}
        className="w-full !bg-white !border-0 p-2.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-0"
      />
    </div>
  </div>
);

export default StepContact;
