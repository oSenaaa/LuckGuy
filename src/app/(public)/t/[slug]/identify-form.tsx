"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

import {
  identifyParticipant,
  type IdentifyParticipantState,
} from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { DigitsInput } from "@/components/ui/digits-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: IdentifyParticipantState = { error: null };

type Workplace = { id: string; name: string };
type Company = { id: string; name: string; workplaces: Workplace[] };

export function IdentifyForm({
  accessSlug,
  requiresPin = false,
  companies,
}: {
  accessSlug: string;
  requiresPin?: boolean;
  companies: Company[];
}) {
  const identifyForSession = identifyParticipant.bind(null, accessSlug);
  const [state, formAction] = useActionState(identifyForSession, initialState);
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    companies.length === 1 ? companies[0].id : "",
  );
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState("");

  const selectedCompanyWorkplaces = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId)?.workplaces ?? [],
    [companies, selectedCompanyId],
  );
  const autoWorkplaceId =
    selectedCompanyWorkplaces.length === 1 ? selectedCompanyWorkplaces[0].id : "";

  function handleCompanyChange(companyId: string) {
    setSelectedCompanyId(companyId);
    setSelectedWorkplaceId("");
  }

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
        <DigitsInput
          id="phone"
          name="phone"
          required
          maxDigits={11}
          pattern="\d{10,11}"
          title="Digite o telefone com DDD (10 ou 11 dígitos), sem pontuação"
          placeholder="Somente números, com DDD"
          autoComplete="tel"
        />
      </div>
      {companies.length > 1 && (
        <div className="grid gap-2">
          <Label htmlFor="companySelect">Empresa</Label>
          <input type="hidden" name="companyId" value={selectedCompanyId} />
          <Select value={selectedCompanyId} onValueChange={handleCompanyChange} required>
            <SelectTrigger id="companySelect" className="w-full">
              <SelectValue placeholder="Selecione sua empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {companies.length === 1 && (
        <input type="hidden" name="companyId" value={companies[0].id} />
      )}
      {selectedCompanyWorkplaces.length > 1 && (
        <div className="grid gap-2">
          <Label htmlFor="workplaceSelect">Posto de trabalho</Label>
          <input type="hidden" name="workplaceId" value={selectedWorkplaceId} />
          <Select value={selectedWorkplaceId} onValueChange={setSelectedWorkplaceId} required>
            <SelectTrigger id="workplaceSelect" className="w-full">
              <SelectValue placeholder="Selecione seu posto de trabalho" />
            </SelectTrigger>
            <SelectContent>
              {selectedCompanyWorkplaces.map((workplace) => (
                <SelectItem key={workplace.id} value={workplace.id}>
                  {workplace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {autoWorkplaceId && <input type="hidden" name="workplaceId" value={autoWorkplaceId} />}
      {requiresPin && (
        <div className="grid gap-2">
          <Label htmlFor="accessPin">Código da turma</Label>
          <DigitsInput
            id="accessPin"
            name="accessPin"
            required
            maxDigits={6}
            pattern="\d{4,6}"
            title="Código numérico informado pela empresa"
            placeholder="Código informado pela empresa"
            autoComplete="one-time-code"
          />
        </div>
      )}
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
