"use client";

import { useRef, useState, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { CircleNotch, Signature as SignatureIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import {
  SIGNATURE_IMAGE_MAX_SIZE_BYTES,
  SIGNATURE_IMAGE_MAX_SIZE_LABEL,
  SIGNATURE_UPLOAD_PREFIX,
  isAdminImageContentType,
  sanitizeUploadFilename,
} from "@/lib/upload-rules";
import { createSignature, updateSignature } from "./actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type SignatureFormValue = {
  id: string;
  coordinatorName: string;
  coordinatorRole: string | null;
  signatureImageBlobUrl: string;
  isDefault: boolean;
};

type Status = "idle" | "uploading" | "saving";

export function SignatureFormDialog({
  open,
  onOpenChange,
  signature,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signature?: SignatureFormValue | null;
}) {
  const isEdit = Boolean(signature);
  // Só bloqueia o fechamento durante o envio; usar ref (em vez de estado) evita
  // que o wrapper precise re-renderizar a cada mudança de status do formulário.
  const isBusyRef = useRef(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isBusyRef.current) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar assinatura" : "Nova assinatura"}</DialogTitle>
          <DialogDescription>
            PNG ou JPEG, de preferência com fundo transparente.
          </DialogDescription>
        </DialogHeader>

        {/* Montado só enquanto o Dialog está aberto, para que cada abertura
            comece com estado limpo (preview, progresso, erro) sem precisar
            de um efeito para resetá-lo. */}
        {open && (
          <SignatureFormBody
            signature={signature}
            isEdit={isEdit}
            onBusyChange={(busy) => {
              isBusyRef.current = busy;
            }}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SignatureFormBody({
  signature,
  isEdit,
  onBusyChange,
  onOpenChange,
}: {
  signature?: SignatureFormValue | null;
  isEdit: boolean;
  onBusyChange: (busy: boolean) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    signature?.signatureImageBlobUrl ?? null,
  );

  const idPrefix = signature?.id ?? "new";
  const isBusy = status === "uploading" || status === "saving";

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : signature?.signatureImageBlobUrl ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const coordinatorName = String(values.get("coordinatorName") ?? "").trim();
    const coordinatorRole = String(values.get("coordinatorRole") ?? "").trim();
    const isDefault = values.get("isDefault") === "on";
    const file = values.get("signatureImage");
    const hasNewFile = file instanceof File && file.size > 0;

    setError(null);

    if (!coordinatorName) {
      setError("Informe o nome do coordenador.");
      return;
    }
    if (!isEdit && !hasNewFile) {
      setError("Selecione a imagem da assinatura.");
      return;
    }
    if (hasNewFile && !isAdminImageContentType((file as File).type)) {
      setError("Use uma imagem PNG ou JPG.");
      return;
    }
    if (hasNewFile && (file as File).size > SIGNATURE_IMAGE_MAX_SIZE_BYTES) {
      setError(`A imagem deve ter no máximo ${SIGNATURE_IMAGE_MAX_SIZE_LABEL}.`);
      return;
    }

    try {
      let signatureImageBlobUrl = "";
      if (hasNewFile) {
        setStatus("uploading");
        onBusyChange(true);
        const blob = await upload(
          `${SIGNATURE_UPLOAD_PREFIX}${Date.now()}-${sanitizeUploadFilename((file as File).name)}`,
          file as File,
          {
            access: "public",
            contentType: (file as File).type,
            handleUploadUrl: "/api/blob/upload",
            onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
          },
        );
        signatureImageBlobUrl = blob.url;
      }

      setStatus("saving");
      onBusyChange(true);
      const payload = new FormData();
      payload.set("coordinatorName", coordinatorName);
      payload.set("coordinatorRole", coordinatorRole);
      if (signatureImageBlobUrl) payload.set("signatureImageBlobUrl", signatureImageBlobUrl);
      if (isDefault) payload.set("isDefault", "on");

      const result = signature
        ? await updateSignature(signature.id, payload)
        : await createSignature(payload);

      if (!result.ok) {
        setStatus("idle");
        onBusyChange(false);
        setError(result.error ?? "Não foi possível salvar.");
        return;
      }

      toast.success(isEdit ? "Assinatura atualizada." : "Assinatura adicionada.");
      onBusyChange(false);
      onOpenChange(false);
      router.refresh();
    } catch (uploadError) {
      console.error(uploadError);
      setStatus("idle");
      onBusyChange(false);
      setError("Não foi possível enviar a assinatura. Verifique sua conexão e tente novamente.");
    }
  }

  return (
    <>
      <form id="signature-form" onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-signatureImage`}>Imagem da assinatura</Label>
          <div className="flex h-28 items-center justify-center overflow-hidden rounded-md border border-dashed bg-white">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Pré-visualização da assinatura"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <SignatureIcon size={24} className="text-muted-foreground" />
            )}
          </div>
          <Input
            id={`${idPrefix}-signatureImage`}
            name="signatureImage"
            type="file"
            accept="image/png,image/jpeg"
            required={!isEdit}
            disabled={isBusy}
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground">
            Máximo {SIGNATURE_IMAGE_MAX_SIZE_LABEL}.
            {isEdit && " Deixe em branco para manter a imagem atual."}
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-coordinatorName`}>Nome do coordenador</Label>
          <Input
            id={`${idPrefix}-coordinatorName`}
            name="coordinatorName"
            required
            maxLength={120}
            placeholder="Ex: Maria Souza"
            defaultValue={signature?.coordinatorName}
            disabled={isBusy}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-coordinatorRole`}>Cargo</Label>
          <Input
            id={`${idPrefix}-coordinatorRole`}
            name="coordinatorRole"
            maxLength={120}
            placeholder="Ex: Coordenadora Técnica"
            defaultValue={signature?.coordinatorRole ?? ""}
            disabled={isBusy}
          />
        </div>

        <Label className="flex items-center gap-2 font-normal">
          <Checkbox
            name="isDefault"
            value="on"
            defaultChecked={signature?.isDefault}
            disabled={isBusy}
          />
          Usar como assinatura padrão
        </Label>

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </form>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost" disabled={isBusy}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" form="signature-form" disabled={isBusy}>
          {isBusy && <CircleNotch size={16} className="animate-spin" />}
          {status === "uploading"
            ? `Enviando… ${progress}%`
            : status === "saving"
              ? "Salvando…"
              : isEdit
                ? "Salvar alterações"
                : "Enviar assinatura"}
        </Button>
      </DialogFooter>
    </>
  );
}
