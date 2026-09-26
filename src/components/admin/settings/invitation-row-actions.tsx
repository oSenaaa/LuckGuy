"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

import { revokeInvitation } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function InvitationRowActions({
  invitationId,
  invitationLabel,
}: {
  invitationId: string;
  invitationLabel: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

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
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          className="text-destructive hover:text-destructive"
        >
          {pending ? <CircleNotch size={16} className="animate-spin" /> : <XCircle size={16} />}
          Revogar convite
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revogar convite</AlertDialogTitle>
          <AlertDialogDescription>
            O convite para {invitationLabel} deixa de valer e o link enviado por e-mail para de
            funcionar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={handleRevoke}>
            {pending && <CircleNotch size={16} className="animate-spin" />}
            Revogar convite
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
