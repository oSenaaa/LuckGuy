"use client";

import { useRef, useState, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import {
  TEMPLATE_IMAGE_MAX_SIZE_BYTES,
  TEMPLATE_IMAGE_MAX_SIZE_LABEL,
  TEMPLATE_UPLOAD_PREFIX,
  isAdminImageContentType,
  sanitizeUploadFilename,
} from "@/lib/upload-rules";
import { createTemplate } from "./actions";
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

export function TemplateUploadForm() {
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
    const name = String(values.get("name") ?? "").trim();
    const isDefault = values.get("isDefault") === "on";
    const file = values.get("backgroundImage");

    setStatus("idle");
    setError(null);
    setProgress(0);

    if (!name) {
      setError("Informe o nome do modelo.");
      return;
    }
    if (!(file instanceof File) || file.size === 0) {
      setError("Selecione a imagem de fundo.");
      return;
    }
    if (!isAdminImageContentType(file.type)) {
      setError("Use uma imagem PNG ou JPG.");
      return;
    }
    if (file.size > TEMPLATE_IMAGE_MAX_SIZE_BYTES) {
      setError(`A imagem deve ter no máximo ${TEMPLATE_IMAGE_MAX_SIZE_LABEL}.`);
      return;
    }

    try {
      setStatus("uploading");
      const blob = await upload(
        `${TEMPLATE_UPLOAD_PREFIX}${Date.now()}-${sanitizeUploadFilename(file.name)}`,
        file,
        {
          access: "public",
          contentType: file.type,
          handleUploadUrl: "/api/blob/upload",
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        },
      );

      setStatus("saving");
      const templateData = new FormData();
      templateData.set("name", name);
      templateData.set("backgroundImageBlobUrl", blob.url);
      if (isDefault) templateData.set("isDefault", "on");

      const result = await createTemplate(templateData);
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
      setError("Não foi possível enviar o modelo. Verifique sua conexão e tente novamente.");
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Novo modelo</CardTitle>
        <CardDescription>
          Envie a imagem de fundo (com a margem para assinatura já desenhada). Nome, treinamento,
          carga horária e código de validação são sobrepostos automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do modelo</Label>
            <Input
              id="name"
              name="name"
              required
              maxLength={120}
              placeholder="Ex: Padrão 2026"
              disabled={isBusy}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="backgroundImage">Imagem de fundo</Label>
            <Input
              id="backgroundImage"
              name="backgroundImage"
              type="file"
              accept="image/png,image/jpeg"
              required
              disabled={isBusy}
            />
            <p className="text-xs text-muted-foreground">
              PNG ou JPG, com no máximo {TEMPLATE_IMAGE_MAX_SIZE_LABEL}.
            </p>
          </div>
          <Label className="flex items-center gap-2 font-normal">
            <Checkbox name="isDefault" value="on" disabled={isBusy} />
            Usar como modelo padrão
          </Label>
          <div>
            <Button type="submit" disabled={isBusy}>
              {status === "uploading"
                ? `Enviando… ${progress}%`
                : status === "saving"
                  ? "Salvando…"
                  : "Enviar modelo"}
            </Button>
          </div>
          {status === "done" && (
            <p role="status" className="text-sm text-emerald-600">
              Modelo enviado com sucesso.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
