"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ArrowUpRight,
  Loader2,
  MoreVertical,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveSignature,
  setDefaultSignature,
  unarchiveSignature,
} from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SignatureRowActionsProps = {
  id: string;
  coordinatorName: string;
  signatureImageBlobUrl: string;
  isDefault: boolean;
  isArchived: boolean;
};

export function SignatureRowActions({
  id,
  coordinatorName,
  signatureImageBlobUrl,
  isDefault,
  isArchived,
}: SignatureRowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function run(
    action: () => Promise<{ ok: boolean; error?: string } | undefined>,
    successMessage: string,
  ) {
    setPending(true);
    try {
      const result = await action();
      if (result && !result.ok) {
        toast.error(result.error ?? "Não foi possível concluir a ação.");
        return;
      }
      toast.success(successMessage);
      router.refresh();
    } catch {
      toast.error("Não foi possível concluir a ação. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={`Ações da assinatura ${coordinatorName}`}
          >
            {pending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <MoreVertical />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {!isArchived && !isDefault && (
            <DropdownMenuItem
              onSelect={() =>
                run(() => setDefaultSignature(id), "Assinatura definida como padrão.")
              }
            >
              <Star />
              Tornar padrão
            </DropdownMenuItem>
          )}

          {isArchived ? (
            <DropdownMenuItem
              onSelect={() =>
                run(() => unarchiveSignature(id), "Assinatura desarquivada.")
              }
            >
              <ArchiveRestore />
              Desarquivar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={isDefault}
              title={
                isDefault
                  ? "Torne outra assinatura padrão antes de arquivar esta."
                  : undefined
              }
              onSelect={() =>
                run(() => archiveSignature(id), "Assinatura arquivada.")
              }
            >
              <Archive />
              Arquivar
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setPreviewOpen(true)}>
            <ArrowUpRight />
            Visualizar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{coordinatorName}</DialogTitle>
          </DialogHeader>
          {/* Blob URL não está em images.remotePatterns; usar <img> puro. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signatureImageBlobUrl}
            alt={`Pré-visualização da assinatura de ${coordinatorName}`}
            className="max-h-[50vh] w-full rounded-md border bg-white object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
