import React, { useMemo } from 'react';
import type { CountryCode } from 'libphonenumber-js';
import { formatPhoneInput } from '../utils/phone';

type PhoneInputProps = {
  value: string;
  onChange: (displayValue: string, e164Number: string, country?: CountryCode, whatsappNumber?: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  required?: boolean;
  defaultCountry?: CountryCode;
  className?: string;
};

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = 'WhatsApp номер',
  ariaLabel = 'WhatsApp номер',
  required = false,
  defaultCountry = 'RU',
  className = ''
}) => {
  const activeDefaultCountry = defaultCountry as CountryCode;
  const phoneInfo = useMemo(() => formatPhoneInput(value, activeDefaultCountry), [activeDefaultCountry, value]);

  return (
    <div className="phone-input-shell">
      <input
        type="tel"
        required={required}
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={event => {
          const nextInfo = formatPhoneInput(event.target.value, activeDefaultCountry);
          onChange(nextInfo.displayValue, nextInfo.e164Number, nextInfo.country, nextInfo.whatsappNumber);
        }}
        className={`phone-input-field ${className}`}
      />
      {phoneInfo.country && (
        <span className="phone-input-country" aria-hidden="true">
          {phoneInfo.country}
        </span>
      )}
    </div>
  );
};

export default PhoneInput;
