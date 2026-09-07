"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

type Unit = "minutes" | "hours";

export function DurationInput({
  valueName,
  unitName,
  defaultUnit = "hours",
  defaultValue,
  required,
}: {
  valueName: string;
  unitName: string;
  defaultUnit?: Unit;
  defaultValue?: number | string;
  required?: boolean;
}) {
  const [unit, setUnit] = useState<Unit>(defaultUnit);

  return (
    <div className="flex gap-2">
      <Input
        name={valueName}
        type="number"
        inputMode="decimal"
        required={required}
        min={unit === "minutes" ? 1 : 0.5}
        max={unit === "minutes" ? 59 : undefined}
        step={unit === "minutes" ? 1 : 0.5}
        defaultValue={defaultValue ?? ""}
        placeholder={unit === "minutes" ? "Ex: 45" : "Ex: 2"}
        className="flex-1"
      />
      <NativeSelect
        name={unitName}
        value={unit}
        onChange={(event) => setUnit(event.target.value as Unit)}
        className="w-28 shrink-0"
      >
        <option value="minutes">Minutos</option>
        <option value="hours">Horas</option>
      </NativeSelect>
    </div>
  );
}
