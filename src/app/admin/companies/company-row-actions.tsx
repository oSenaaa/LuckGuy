"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  MoreVertical,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { archiveCompany, unarchiveCompany, updateCompany } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentInput } from "@/components/ui/document-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CompanyRowActionsProps = {
  id: string;
  name: string;
  cnpj: string | null;
  workplace: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isArchived: boolean;
};

export function CompanyRowActions({
  id,
  name,
  cnpj,
  workplace,
  contactEmail,
  contactPhone,
  isArchived,
}: CompanyRowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successMessage: string,
  ) {
    setPending(true);
    try {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível concluir a ação.");
        return;
      }
      toast.success(successMessage);
      router.refresh();
    } catch {
      toast.error("Não foi possível concluir a ação. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditPending(true);
    setEditError(null);
    try {
      const result = await updateCompany(id, new FormData(event.currentTarget));
      if (!result.ok) {
        setEditError(result.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success("Empresa atualizada.");
      setEditOpen(false);
      router.refresh();
    } catch {
      setEditError("Não foi possível salvar. Tente novamente.");
    } finally {
      setEditPending(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={`Ações da empresa ${name}`}
          >
            {pending ? <Loader2 className="animate-spin" /> : <MoreVertical />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onSelect={() => {
              setEditError(null);
              setEditOpen(true);
            }}
          >
            <Pencil />
            Editar dados
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {isArchived ? (
            <DropdownMenuItem
              onSelect={() =>
                run(() => unarchiveCompany(id), "Empresa desarquivada.")
              }
            >
              <ArchiveRestore />
              Desarquivar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => run(() => archiveCompany(id), "Empresa arquivada.")}
            >
              <Archive />
              Arquivar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar {name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`edit-name-${id}`}>Nome da empresa</Label>
              <Input
                id={`edit-name-${id}`}
                name="name"
                required
                defaultValue={name}
                disabled={editPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-cnpj-${id}`}>CNPJ ou CPF</Label>
              <DocumentInput
                id={`edit-cnpj-${id}`}
                name="cnpj"
                required
                title="Digite o CPF (11 dígitos) ou CNPJ (14 dígitos)"
                defaultValue={cnpj ?? ""}
                disabled={editPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-workplace-${id}`}>Posto de trabalho</Label>
              <Input
                id={`edit-workplace-${id}`}
                name="workplace"
                required
                defaultValue={workplace ?? ""}
                disabled={editPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-email-${id}`}>E-mail de contato</Label>
              <Input
                id={`edit-email-${id}`}
                name="contactEmail"
                type="email"
                defaultValue={contactEmail ?? ""}
                disabled={editPending}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`edit-${id}-phone`}>Telefone de contato</Label>
              <PhoneInput idPrefix={`edit-${id}`} defaultValue={contactPhone} disabled={editPending} />
            </div>
            {editError && (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {editError}
              </p>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={editPending}>
                {editPending && <Loader2 className="animate-spin" />}
                {editPending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
