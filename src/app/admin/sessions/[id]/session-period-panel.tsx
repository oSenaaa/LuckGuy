"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CircleNotch, StopCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

import { archiveSession } from "../actions";
import { Button } from "@/components/ui/button";
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
  const [pending, setPending] = useState(false);

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
      toast.success("Turma encerrada.");
      router.refresh();
    } catch {
      toast.error("Não foi possível encerrar a turma. Tente novamente.");
    } finally {
      setPending(false);
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
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleArchive}>
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
    </>
  );
}
