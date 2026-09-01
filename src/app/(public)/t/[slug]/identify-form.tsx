"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";

import {
  identifyParticipant,
  type IdentifyParticipantState,
} from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: IdentifyParticipantState = { error: null };

export function IdentifyForm({ accessSlug }: { accessSlug: string }) {
  const identifyForSession = identifyParticipant.bind(null, accessSlug);
  const [state, formAction] = useActionState(identifyForSession, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input
          id="fullName"
          name="fullName"
          required
          placeholder="Seu nome completo"
          autoComplete="name"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          name="phone"
          required
          placeholder="(00) 00000-0000"
          inputMode="tel"
          autoComplete="tel"
        />
      </div>
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <SubmitButton pendingText="Confirmando…" className="w-full">
        Confirmar presença e começar
      </SubmitButton>
    </form>
  );
}
