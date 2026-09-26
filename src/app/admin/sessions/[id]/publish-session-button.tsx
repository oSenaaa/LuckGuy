"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, PaperPlaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";

import { publishSession } from "../actions";
import { Button } from "@/components/ui/button";

export function PublishSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handlePublish() {
    setPending(true);
    try {
      const result = await publishSession(sessionId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Turma publicada.");
      router.refresh();
    } catch {
      toast.error("Não foi possível publicar a turma. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" disabled={pending} onClick={handlePublish}>
      {pending ? <CircleNotch className="animate-spin" size={16} /> : <PaperPlaneTilt size={16} />}
      Publicar turma
    </Button>
  );
}
