"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { onlyDigits } from "@/lib/document";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  formatBrazilPhone,
  parsePhoneValue,
} from "@/lib/phone";

type PhoneInputProps = {
  idPrefix: string;
  disabled?: boolean;
  defaultValue?: string | null;
};

export function PhoneInput({ idPrefix, disabled, defaultValue }: PhoneInputProps) {
  const parsed = parsePhoneValue(defaultValue);
  const [dial, setDial] = useState(parsed.dial);
  const [national, setNational] = useState(parsed.national);

  const isBrazil = dial === DEFAULT_PHONE_COUNTRY.dial;
  const maxDigits = isBrazil ? 11 : 15;

  return (
    <div className="flex gap-2">
      <NativeSelect
        aria-label="Código do país"
        name="contactPhoneCountry"
        value={dial}
        onChange={(event) => setDial(event.target.value)}
        disabled={disabled}
        className="w-36 shrink-0"
      >
        {PHONE_COUNTRIES.map((country) => (
          <option key={country.iso} value={country.dial}>
            {country.name} (+{country.dial})
          </option>
        ))}
      </NativeSelect>
      <Input
        id={`${idPrefix}-phone`}
        name="contactPhoneNumber"
        inputMode="numeric"
        disabled={disabled}
        placeholder={isBrazil ? "Somente números, com DDD" : "Somente números"}
        value={isBrazil ? formatBrazilPhone(national) : national}
        onChange={(event) => setNational(onlyDigits(event.target.value).slice(0, maxDigits))}
        className="flex-1"
      />
    </div>
  );
}
