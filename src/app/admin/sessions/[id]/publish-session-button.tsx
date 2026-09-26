"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
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
      {pending ? <Loader2 className="animate-spin" /> : <Send />}
      Publicar turma
    </Button>
  );
}
