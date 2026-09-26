"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CircleNotch, StopCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

import { archiveSession } from "../actions";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SessionPeriodPanel({
  sessionId,
  sessionName,
  status,
  startsAt,
  endsAt,
  canEdit,
}: {
  sessionId: string;
  sessionName: string;
  status: "draft" | "published" | "archived";
  startsAt: Date | null;
  endsAt: Date | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const formatBrasiliaDateTime = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(date);

  async function handleArchive() {
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("id", sessionId);
      await archiveSession(formData);
      toast.success(status === "published" ? "Turma encerrada." : "Turma arquivada.");
      router.refresh();
    } catch {
      toast.error("Não foi possível concluir a ação. Tente novamente.");
    } finally {
      setPending(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <CardHeader className="border-b">
        <CardTitle>Período da turma</CardTitle>
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
        {canEdit && status !== "archived" && (
          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => setConfirmOpen(true)}
            >
              {pending ? (
                <CircleNotch className="animate-spin" size={16} />
              ) : status === "published" ? (
                <StopCircle size={16} />
              ) : (
                <Archive size={16} />
              )}
              {status === "published" ? "Encerrar turma agora" : "Arquivar turma"}
            </Button>
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {status === "published" ? "Encerrar turma" : "Arquivar turma"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {status === "published"
                ? `Encerrar “${sessionName}” agora interrompe o acesso dos participantes que ainda não concluíram e não pode ser desfeito.`
                : `Arquivar “${sessionName}” não pode ser desfeito.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" disabled={pending} onClick={handleArchive}>
              {pending && <CircleNotch size={16} className="animate-spin" />}
              {status === "published" ? "Encerrar turma" : "Arquivar turma"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
