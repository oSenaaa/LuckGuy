"use client";

import { useRef, useState, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import {
  SIGNATURE_IMAGE_MAX_SIZE_BYTES,
  SIGNATURE_IMAGE_MAX_SIZE_LABEL,
  SIGNATURE_UPLOAD_PREFIX,
  isAdminImageContentType,
  sanitizeUploadFilename,
} from "@/lib/upload-rules";
import { createSignature } from "./actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type UploadStatus = "idle" | "uploading" | "saving" | "done";

export function SignatureUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isBusy = status === "uploading" || status === "saving";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const coordinatorName = String(values.get("coordinatorName") ?? "").trim();
    const coordinatorRole = String(values.get("coordinatorRole") ?? "").trim();
    const isDefault = values.get("isDefault") === "on";
    const file = values.get("signatureImage");

    setStatus("idle");
    setError(null);
    setProgress(0);

    if (!coordinatorName) {
      setError("Informe o nome do coordenador.");
      return;
    }
    if (!(file instanceof File) || file.size === 0) {
      setError("Selecione a imagem da assinatura.");
      return;
    }
    if (!isAdminImageContentType(file.type)) {
      setError("Use uma imagem PNG ou JPG.");
      return;
    }
    if (file.size > SIGNATURE_IMAGE_MAX_SIZE_BYTES) {
      setError(`A imagem deve ter no máximo ${SIGNATURE_IMAGE_MAX_SIZE_LABEL}.`);
      return;
    }

    try {
      setStatus("uploading");
      const blob = await upload(
        `${SIGNATURE_UPLOAD_PREFIX}${Date.now()}-${sanitizeUploadFilename(file.name)}`,
        file,
        {
          access: "public",
          contentType: file.type,
          handleUploadUrl: "/api/blob/upload",
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        },
      );

      setStatus("saving");
      const signatureData = new FormData();
      signatureData.set("coordinatorName", coordinatorName);
      signatureData.set("coordinatorRole", coordinatorRole);
      signatureData.set("signatureImageBlobUrl", blob.url);
      if (isDefault) signatureData.set("isDefault", "on");

      const result = await createSignature(signatureData);
      if (!result.ok) {
        setStatus("idle");
        setError(result.error);
        return;
      }

      formRef.current?.reset();
      setStatus("done");
      router.refresh();
    } catch (uploadError) {
      console.error(uploadError);
      setStatus("idle");
      setError("Não foi possível enviar a assinatura. Verifique sua conexão e tente novamente.");
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Nova assinatura</CardTitle>
        <CardDescription>
          Envie a imagem da assinatura em PNG ou JPEG, de preferência com fundo transparente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="coordinatorName">Nome do coordenador</Label>
            <Input
              id="coordinatorName"
              name="coordinatorName"
              required
              maxLength={120}
              placeholder="Ex: Maria Souza"
              disabled={isBusy}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="coordinatorRole">Cargo</Label>
            <Input
              id="coordinatorRole"
              name="coordinatorRole"
              maxLength={120}
              placeholder="Ex: Coordenadora Técnica"
              disabled={isBusy}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="signatureImage">Imagem da assinatura</Label>
            <Input
              id="signatureImage"
              name="signatureImage"
              type="file"
              accept="image/png,image/jpeg"
              required
              disabled={isBusy}
            />
            <p className="text-xs text-muted-foreground">
              PNG ou JPG, com no máximo {SIGNATURE_IMAGE_MAX_SIZE_LABEL}.
            </p>
          </div>
          <Label className="flex items-center gap-2 font-normal sm:col-span-2">
            <Checkbox name="isDefault" value="on" disabled={isBusy} />
            Usar como assinatura padrão
          </Label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isBusy}>
              {status === "uploading"
                ? `Enviando… ${progress}%`
                : status === "saving"
                  ? "Salvando…"
                  : "Enviar assinatura"}
            </Button>
          </div>
          {status === "done" && (
            <p role="status" className="text-sm text-emerald-600 sm:col-span-2">
              Assinatura enviada com sucesso.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
