"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Archive, Briefcase, CircleNotch, PencilSimple, Plus, TrayArrowUp } from "@phosphor-icons/react";
import { toast } from "sonner";

import {
  addWorkplace,
  archiveWorkplace,
  unarchiveWorkplace,
  updateWorkplace,
} from "../actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Workplace = {
  id: string;
  name: string;
  archivedAt: Date | null;
};

function WorkplaceRow({ workplace, canEdit }: { workplace: Workplace; canEdit: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const isArchived = Boolean(workplace.archivedAt);

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
      const result = await updateWorkplace(workplace.id, new FormData(event.currentTarget));
      if (!result.ok) {
        const message = result.error ?? "Não foi possível salvar.";
        setEditError(message);
        toast.error(message);
        return;
      }
      toast.success("Posto atualizado.");
      setEditOpen(false);
      router.refresh();
    } catch {
      const message = "Não foi possível salvar. Tente novamente.";
      setEditError(message);
      toast.error(message);
    } finally {
      setEditPending(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <span className={isArchived ? "text-muted-foreground" : "font-medium"}>
        {workplace.name}
      </span>
      {canEdit && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={`Editar posto ${workplace.name}`}
            onClick={() => {
              setEditError(null);
              setEditOpen(true);
            }}
          >
            <PencilSimple size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={isArchived ? `Desarquivar posto ${workplace.name}` : `Arquivar posto ${workplace.name}`}
            onClick={() =>
              isArchived
                ? run(() => unarchiveWorkplace(workplace.id), "Posto desarquivado.")
                : run(() => archiveWorkplace(workplace.id), "Posto arquivado.")
            }
          >
            {pending ? (
              <CircleNotch size={16} className="animate-spin" />
            ) : isArchived ? (
              <TrayArrowUp size={16} />
            ) : (
              <Archive size={16} />
            )}
          </Button>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar posto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`edit-workplace-${workplace.id}`}>Nome do posto</Label>
              <Input
                id={`edit-workplace-${workplace.id}`}
                name="name"
                required
                defaultValue={workplace.name}
                disabled={editPending}
              />
            </div>
            {editError && (
              <p role="alert" className="text-xs text-destructive">
                {editError}
              </p>
            )}
            <div>
              <Button type="submit" disabled={editPending}>
                {editPending && <CircleNotch size={16} className="animate-spin" />}
                {editPending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </li>
  );
}

export function WorkplacesPanel({
  companyId,
  workplaces,
  canEdit,
}: {
  companyId: string;
  workplaces: Workplace[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const active = workplaces.filter((w) => !w.archivedAt);
  const archived = workplaces.filter((w) => w.archivedAt);

  async function handleAddSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdding(true);
    setAddError(null);
    const form = event.currentTarget;
    try {
      const result = await addWorkplace(companyId, new FormData(form));
      if (!result.ok) {
        const message = result.error ?? "Não foi possível adicionar o posto.";
        setAddError(message);
        toast.error(message);
        return;
      }
      toast.success("Posto adicionado.");
      form.reset();
      router.refresh();
    } catch {
      const message = "Não foi possível adicionar o posto. Tente novamente.";
      setAddError(message);
      toast.error(message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      {active.length === 0 && archived.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <Briefcase size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum posto de trabalho cadastrado ainda.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {active.map((workplace) => (
            <WorkplaceRow key={workplace.id} workplace={workplace} canEdit={canEdit} />
          ))}
          {archived.map((workplace) => (
            <WorkplaceRow key={workplace.id} workplace={workplace} canEdit={canEdit} />
          ))}
        </ul>
      )}

      {canEdit && (
        <form
          onSubmit={handleAddSubmit}
          className="flex items-start gap-2 border-t px-4 py-3"
        >
          <div className="flex-1">
            <Input name="name" placeholder="Ex: Obra Alfa - Setor Administrativo" disabled={adding} />
            {addError && <p className="mt-1 text-xs text-destructive">{addError}</p>}
          </div>
          <Button type="submit" variant="outline" size="sm" disabled={adding}>
            {adding ? <CircleNotch size={16} className="animate-spin" /> : <Plus size={16} />}
            Adicionar posto
          </Button>
        </form>
      )}
    </>
  );
}
