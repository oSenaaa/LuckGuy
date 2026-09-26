"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Loader2, Pencil, StopCircle } from "lucide-react";
import { toast } from "sonner";

import { archiveSession, updateSessionPeriod } from "../actions";
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
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SessionPeriodPanel({
  sessionId,
  status,
  startsAt,
  endsAt,
  canEdit,
}: {
  sessionId: string;
  status: "draft" | "published" | "archived";
  startsAt: Date | null;
  endsAt: Date | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [endingNow, setEndingNow] = useState(false);

  const formatBrasiliaDateTime = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(date);

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditPending(true);
    setEditError(null);
    try {
      const result = await updateSessionPeriod(sessionId, new FormData(event.currentTarget));
      if (!result.ok) {
        setEditError(result.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success("Período da turma atualizado.");
      setEditOpen(false);
      router.refresh();
    } catch {
      setEditError("Não foi possível salvar. Tente novamente.");
    } finally {
      setEditPending(false);
    }
  }

  async function handleEndNow() {
    setEndingNow(true);
    try {
      const formData = new FormData();
      formData.set("id", sessionId);
      await archiveSession(formData);
      toast.success("Turma encerrada.");
      router.refresh();
    } catch {
      toast.error("Não foi possível encerrar a turma. Tente novamente.");
    } finally {
      setEndingNow(false);
    }
  }

  return (
    <>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="size-4 text-muted-foreground" />
          Período da turma
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Início</p>
          <p className="font-medium">
            {startsAt ? (
              formatBrasiliaDateTime(startsAt)
            ) : (
              <span className="text-muted-foreground">Sem data definida</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Fim</p>
          <p className="font-medium">
            {endsAt ? (
              formatBrasiliaDateTime(endsAt)
            ) : (
              <span className="text-muted-foreground">Sem data definida</span>
            )}
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditError(null);
                setEditOpen(true);
              }}
            >
              <Pencil />
              Editar período
            </Button>
            {status === "published" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={endingNow}
                onClick={handleEndNow}
              >
                {endingNow ? <Loader2 className="animate-spin" /> : <StopCircle />}
                Encerrar turma agora
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar período da turma</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-startsAt">Início (horário de Brasília)</Label>
              <Input
                id="edit-startsAt"
                name="startsAt"
                type="datetime-local"
                defaultValue={formatBrasiliaInputValue(startsAt)}
                disabled={editPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-endsAt">Fim (horário de Brasília)</Label>
              <Input
                id="edit-endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={formatBrasiliaInputValue(endsAt)}
                disabled={editPending}
              />
            </div>
            {editError && (
              <p role="alert" className="text-sm text-destructive">
                {editError}
              </p>
            )}
            <div>
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
