"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowCounterClockwise,
  CircleNotch,
  PencilSimple,
  Star,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { archiveSignature, setDefaultSignature, unarchiveSignature } from "./actions";
import { SignatureFormDialog, type SignatureFormValue } from "./signature-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SignatureCard({
  signature,
  isArchived,
  canEdit,
}: {
  signature: SignatureFormValue;
  isArchived: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"default" | "remove" | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  async function run(
    action: () => Promise<{ ok: boolean; error?: string } | undefined>,
    successMessage: string,
    kind: "default" | "remove",
  ) {
    setPending(kind);
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
      setPending(null);
    }
  }

  return (
    <>
      <Card className={isArchived ? "opacity-70" : undefined}>
        <CardContent className="space-y-3">
          <div className="flex h-28 items-center justify-center overflow-hidden rounded-md border bg-white">
            {/* Blob URL não está em images.remotePatterns; usar <img> puro. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signature.signatureImageBlobUrl}
              alt={`Assinatura de ${signature.coordinatorName}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold">{signature.coordinatorName}</p>
              {signature.isDefault && <Badge variant="secondary">Padrão</Badge>}
              {isArchived && <Badge variant="outline">Arquivada</Badge>}
            </div>
            {signature.coordinatorRole && (
              <p className="text-sm text-muted-foreground">{signature.coordinatorRole}</p>
            )}
          </div>
        </CardContent>

        {canEdit && (
          <CardFooter className="justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={pending !== null}
              onClick={() => setEditOpen(true)}
            >
              <PencilSimple size={16} />
              Editar
            </Button>

            <div className="flex items-center gap-1">
              {!isArchived && !signature.isDefault && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Tornar padrão"
                  aria-label={`Tornar ${signature.coordinatorName} a assinatura padrão`}
                  disabled={pending !== null}
                  onClick={() =>
                    run(
                      () => setDefaultSignature(signature.id),
                      "Assinatura definida como padrão.",
                      "default",
                    )
                  }
                >
                  {pending === "default" ? (
                    <CircleNotch size={16} className="animate-spin" />
                  ) : (
                    <Star size={16} />
                  )}
                </Button>
              )}

              {isArchived ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Desarquivar"
                  aria-label={`Desarquivar assinatura de ${signature.coordinatorName}`}
                  disabled={pending !== null}
                  onClick={() =>
                    run(() => unarchiveSignature(signature.id), "Assinatura desarquivada.", "remove")
                  }
                >
                  {pending === "remove" ? (
                    <CircleNotch size={16} className="animate-spin" />
                  ) : (
                    <ArrowCounterClockwise size={16} />
                  )}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title={
                    signature.isDefault
                      ? "Torne outra assinatura padrão antes de remover esta."
                      : "Remover"
                  }
                  aria-label={`Remover assinatura de ${signature.coordinatorName}`}
                  disabled={pending !== null || signature.isDefault}
                  onClick={() => setRemoveOpen(true)}
                >
                  {pending === "remove" ? (
                    <CircleNotch size={16} className="animate-spin" />
                  ) : (
                    <Trash size={16} />
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>

      {canEdit && (
        <SignatureFormDialog open={editOpen} onOpenChange={setEditOpen} signature={signature} />
      )}

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              A assinatura de {signature.coordinatorName} deixa de aparecer para uso em novos
              treinamentos. É possível desarquivar depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending !== null}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending !== null}
              onClick={async () => {
                await run(() => archiveSignature(signature.id), "Assinatura removida.", "remove");
                setRemoveOpen(false);
              }}
            >
              {pending === "remove" && <CircleNotch size={16} className="animate-spin" />}
              Remover
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
