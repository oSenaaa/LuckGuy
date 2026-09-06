"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

type DigitsInputProps = Omit<ComponentProps<typeof Input>, "type" | "inputMode" | "onChange"> & {
  maxDigits: number;
};

export function DigitsInput({ maxDigits, pattern, onInput, ...props }: DigitsInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      maxLength={maxDigits}
      pattern={pattern}
      onInput={(event) => {
        const input = event.currentTarget;
        input.value = input.value.replace(/\D/g, "").slice(0, maxDigits);
        onInput?.(event);
      }}
    />
  );
}
