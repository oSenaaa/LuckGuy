"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, PencilSimple } from "@phosphor-icons/react";
import { toast } from "sonner";

import { updateSessionPeriod } from "../actions";
import { formatBrasiliaInputValue } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditPeriodButton({
  sessionId,
  startsAt,
  endsAt,
}: {
  sessionId: string;
  startsAt: Date | null;
  endsAt: Date | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await updateSessionPeriod(sessionId, new FormData(event.currentTarget));
      if (!result.ok) {
        setError(result.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success("Período da turma atualizado.");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <PencilSimple size={16} />
        Editar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar período da turma</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-startsAt">Início (horário de Brasília)</Label>
              <Input
                id="edit-startsAt"
                name="startsAt"
                type="datetime-local"
                defaultValue={formatBrasiliaInputValue(startsAt)}
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-endsAt">Fim (horário de Brasília)</Label>
              <Input
                id="edit-endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={formatBrasiliaInputValue(endsAt)}
                disabled={pending}
              />
            </div>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <CircleNotch className="animate-spin" size={16} />}
                {pending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
