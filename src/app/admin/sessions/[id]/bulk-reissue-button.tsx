"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { reissueCertificate } from "../actions";
import { Button } from "@/components/ui/button";

export function BulkReissueButton({
  participantIds,
  sessionId,
  label = "Reemitir todos",
}: {
  participantIds: string[];
  sessionId: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleReissueAll() {
    setPending(true);
    try {
      const results = await Promise.all(
        participantIds.map((participantId) => reissueCertificate(participantId, sessionId)),
      );
      const failed = results.filter((result) => !result.ok).length;
      const succeeded = results.length - failed;

      if (failed === 0) {
        toast.success(
          `${succeeded} certificado${succeeded === 1 ? "" : "s"} reemitido${succeeded === 1 ? "" : "s"}.`,
        );
      } else if (succeeded === 0) {
        toast.error("Não foi possível reemitir nenhum certificado.");
      } else {
        toast.warning(`${succeeded} reemitido${succeeded === 1 ? "" : "s"}, ${failed} falharam.`);
      }
      router.refresh();
    } catch {
      toast.error("Não foi possível reemitir os certificados. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending || participantIds.length === 0}
      onClick={handleReissueAll}
    >
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      {label}
    </Button>
  );
}
