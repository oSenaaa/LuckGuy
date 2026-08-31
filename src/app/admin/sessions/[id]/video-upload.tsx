"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { setSessionVideo } from "../actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => reject(new Error("Não foi possível ler o vídeo"));
    video.src = URL.createObjectURL(file);
  });
}

export function VideoUpload({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const durationSeconds = await readVideoDuration(file);
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      });
      await setSessionVideo(sessionId, blob.url, durationSeconds);
      toast.success("Vídeo enviado com sucesso");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar vídeo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <Label className="flex items-center gap-2">
        <Upload className="size-4 text-muted-foreground" />
        Enviar arquivo de vídeo
      </Label>
      <Input
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleChange}
        disabled={uploading}
        className="mt-2"
      />
      {uploading && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Enviando vídeo…
        </p>
      )}
    </div>
  );
}
