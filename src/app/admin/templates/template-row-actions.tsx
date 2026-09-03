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
  archiveTemplate,
  setDefaultTemplate,
  unarchiveTemplate,
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

type TemplateRowActionsProps = {
  id: string;
  name: string;
  backgroundImageBlobUrl: string;
  isDefault: boolean;
  isArchived: boolean;
};

export function TemplateRowActions({
  id,
  name,
  backgroundImageBlobUrl,
  isDefault,
  isArchived,
}: TemplateRowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successMessage: string,
  ) {
    setPending(true);
    try {
      const result = await action();
      if (!result.ok) {
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
            aria-label={`Ações do modelo ${name}`}
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
                run(() => setDefaultTemplate(id), "Modelo definido como padrão.")
              }
            >
              <Star />
              Tornar padrão
            </DropdownMenuItem>
          )}

          {isArchived ? (
            <DropdownMenuItem
              onSelect={() =>
                run(() => unarchiveTemplate(id), "Modelo desarquivado.")
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
                  ? "Torne outro modelo padrão antes de arquivar este."
                  : undefined
              }
              onSelect={() =>
                run(() => archiveTemplate(id), "Modelo arquivado.")
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
          </DialogHeader>
          {/* Blob URL não está em images.remotePatterns; usar <img> puro. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundImageBlobUrl}
            alt={`Pré-visualização do modelo ${name}`}
            className="max-h-[70vh] w-full rounded-md border object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
