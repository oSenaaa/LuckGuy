import { onlyDigits } from "@/lib/document";

export type PhoneCountry = { iso: string; name: string; dial: string };

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "BR", name: "Brasil", dial: "55" },
  { iso: "PT", name: "Portugal", dial: "351" },
  { iso: "US", name: "Estados Unidos", dial: "1" },
  { iso: "AR", name: "Argentina", dial: "54" },
  { iso: "PY", name: "Paraguai", dial: "595" },
  { iso: "UY", name: "Uruguai", dial: "598" },
  { iso: "CL", name: "Chile", dial: "56" },
  { iso: "BO", name: "Bolívia", dial: "591" },
  { iso: "CO", name: "Colômbia", dial: "57" },
  { iso: "PE", name: "Peru", dial: "51" },
  { iso: "MX", name: "México", dial: "52" },
  { iso: "ES", name: "Espanha", dial: "34" },
  { iso: "DE", name: "Alemanha", dial: "49" },
  { iso: "IT", name: "Itália", dial: "39" },
  { iso: "FR", name: "França", dial: "33" },
  { iso: "GB", name: "Reino Unido", dial: "44" },
  { iso: "JP", name: "Japão", dial: "81" },
  { iso: "CN", name: "China", dial: "86" },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

export function formatBrazilPhone(rawDigits: string) {
  const digits = rawDigits.slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;

  const isMobile = digits.length > 10;
  const splitAt = isMobile ? 5 : 4;
  const localFirst = rest.slice(0, splitAt);
  const localSecond = rest.slice(splitAt);
  return localSecond ? `(${ddd}) ${localFirst}-${localSecond}` : `(${ddd}) ${localFirst}`;
}

export function buildPhoneValue(dial: string, nationalDigits: string) {
  if (!nationalDigits) return "";
  if (dial === DEFAULT_PHONE_COUNTRY.dial) return nationalDigits;
  return `+${dial}${nationalDigits}`;
}

export function parsePhoneValue(value: string | null | undefined) {
  const raw = value ?? "";
  if (raw.startsWith("+")) {
    const digits = onlyDigits(raw);
    const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    for (const country of sorted) {
      if (digits.startsWith(country.dial)) {
        return { dial: country.dial, national: digits.slice(country.dial.length) };
      }
    }
    return { dial: DEFAULT_PHONE_COUNTRY.dial, national: digits };
  }
  return { dial: DEFAULT_PHONE_COUNTRY.dial, national: onlyDigits(raw) };
}
