"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

import { revokeInvitation } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";

export function InvitationRowActions({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleRevoke() {
    setPending(true);
    try {
      const result = await revokeInvitation(invitationId);
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível revogar o convite.");
        return;
      }
      toast.success("Convite revogado.");
      router.refresh();
    } catch {
      toast.error("Não foi possível revogar o convite. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={handleRevoke}
      className="text-destructive hover:text-destructive"
    >
      {pending ? <CircleNotch size={16} className="animate-spin" /> : <XCircle size={16} />}
      Revogar convite
    </Button>
  );
}
