"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { reissueCertificate } from "../actions";
import { Button } from "@/components/ui/button";

export function ReissueCertificateButton({
  participantId,
  sessionId,
}: {
  participantId: string;
  sessionId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleReissue() {
    setPending(true);
    try {
      const result = await reissueCertificate(participantId, sessionId);
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível reemitir o certificado.");
        return;
      }
      toast.success("Certificado reemitido.");
      router.refresh();
    } catch {
      toast.error("Não foi possível reemitir o certificado. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={handleReissue}
    >
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      Reemitir
    </Button>
  );
}
