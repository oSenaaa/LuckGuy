export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function hasAllSameDigits(value: string) {
  return /^(\d)\1*$/.test(value);
}

export function isValidCPF(digits: string) {
  if (digits.length !== 11 || hasAllSameDigits(digits)) return false;

  const nums = digits.split("").map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += nums[i] * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== nums[9]) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += nums[i] * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === nums[10];
}

export function isValidCNPJ(digits: string) {
  if (digits.length !== 14 || hasAllSameDigits(digits)) return false;

  const nums = digits.split("").map(Number);

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = weights1.reduce((acc, weight, i) => acc + nums[i] * weight, 0);
  let rest = sum % 11;
  const digit1 = rest < 2 ? 0 : 11 - rest;
  if (digit1 !== nums[12]) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = weights2.reduce((acc, weight, i) => acc + nums[i] * weight, 0);
  rest = sum % 11;
  const digit2 = rest < 2 ? 0 : 11 - rest;
  return digit2 === nums[13];
}

export function isValidCpfCnpj(digits: string) {
  if (digits.length === 11) return isValidCPF(digits);
  if (digits.length === 14) return isValidCNPJ(digits);
  return false;
}

function formatCPF(digits: string) {
  let result = digits.slice(0, 3);
  if (digits.length > 3) result += `.${digits.slice(3, 6)}`;
  if (digits.length > 6) result += `.${digits.slice(6, 9)}`;
  if (digits.length > 9) result += `-${digits.slice(9, 11)}`;
  return result;
}

function formatCNPJ(digits: string) {
  let result = digits.slice(0, 2);
  if (digits.length > 2) result += `.${digits.slice(2, 5)}`;
  if (digits.length > 5) result += `.${digits.slice(5, 8)}`;
  if (digits.length > 8) result += `/${digits.slice(8, 12)}`;
  if (digits.length > 12) result += `-${digits.slice(12, 14)}`;
  return result;
}

export function formatCpfCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits.length <= 11 ? formatCPF(digits) : formatCNPJ(digits);
}
