"use client";

import { useId, useState, type ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { formatCpfCnpj, isValidCpfCnpj, onlyDigits } from "@/lib/document";

type DocumentInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "inputMode" | "value" | "onChange" | "defaultValue" | "maxLength" | "pattern"
> & {
  defaultValue?: string;
};

export function DocumentInput({ defaultValue = "", className, ...props }: DocumentInputProps) {
  const [digits, setDigits] = useState(() => onlyDigits(defaultValue).slice(0, 14));
  const errorId = useId();

  const showError = (digits.length === 11 || digits.length === 14) && !isValidCpfCnpj(digits);

  return (
    <div className="grid gap-1">
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        value={formatCpfCnpj(digits)}
        onChange={(event) => setDigits(onlyDigits(event.target.value).slice(0, 14))}
        aria-invalid={showError || undefined}
        aria-describedby={showError ? errorId : undefined}
        className={className}
      />
      {showError && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {digits.length === 11 ? "CPF inválido." : "CNPJ inválido."}
        </p>
      )}
    </div>
  );
}
