"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

import { createCompany, updateCompany } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DocumentInput } from "@/components/ui/document-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

export function CompanyFormSheet({
  open,
  onOpenChange,
  company,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(company);
  const idPrefix = company?.id ?? "new";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const result = company
        ? await updateCompany(company.id, formData)
        : await createCompany(formData);
      if (!result.ok) {
        setError(result.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success(isEdit ? "Empresa atualizada." : "Empresa adicionada.");
      onOpenChange(false);
      router.refresh();
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          setError(null);
          onOpenChange(next);
        }
      }}
    >
      <SheetContent className="sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? `Editar ${company?.name}` : "Nova empresa"}</SheetTitle>
          <SheetDescription>
            Nome e CNPJ/CPF são obrigatórios. Os postos de trabalho podem ser adicionados
            depois, na página da empresa.
          </SheetDescription>
        </SheetHeader>

        <form
          id="company-form"
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
        >
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-name`}>Nome da empresa</Label>
            <Input
              id={`${idPrefix}-name`}
              name="name"
              required
              placeholder="Ex: Construtora Alfa Ltda"
              defaultValue={company?.name}
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-cnpj`}>CNPJ ou CPF</Label>
            <DocumentInput
              id={`${idPrefix}-cnpj`}
              name="cnpj"
              required
              title="Digite o CPF (11 dígitos) ou CNPJ (14 dígitos)"
              placeholder="Somente números"
              defaultValue={company?.cnpj ?? ""}
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-contactEmail`}>E-mail de contato</Label>
            <Input
              id={`${idPrefix}-contactEmail`}
              name="contactEmail"
              type="email"
              placeholder="contato@empresa.com"
              defaultValue={company?.contactEmail ?? ""}
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-phone`}>Telefone de contato</Label>
            <PhoneInput
              idPrefix={idPrefix}
              defaultValue={company?.contactPhone}
              disabled={pending}
            />
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t pt-4">
          <SheetClose asChild>
            <Button type="button" variant="ghost" disabled={pending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button type="submit" form="company-form" disabled={pending}>
            {pending && <CircleNotch size={16} className="animate-spin" />}
            {pending ? "Salvando…" : isEdit ? "Salvar alterações" : "Adicionar empresa"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
