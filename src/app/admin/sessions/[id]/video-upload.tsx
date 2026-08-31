"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  VIDEO_MAX_SIZE_BYTES,
  VIDEO_UPLOAD_PREFIX,
  isVideoContentType,
  sanitizeUploadFilename,
} from "@/lib/upload-rules";
import { setSessionVideo } from "../actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const MULTIPART_UPLOAD_THRESHOLD_BYTES = 100 * 1024 * 1024;

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
      if (!isVideoContentType(file.type)) {
        throw new Error("Use um vídeo MP4, WebM ou MOV.");
      }
      if (file.size > VIDEO_MAX_SIZE_BYTES) {
        throw new Error("O vídeo deve ter no máximo 5 GB.");
      }

      const durationSeconds = await readVideoDuration(file);
      const blob = await upload(
        `${VIDEO_UPLOAD_PREFIX}${sessionId}/${Date.now()}-${sanitizeUploadFilename(file.name)}`,
        file,
        {
          access: "public",
          contentType: file.type,
          handleUploadUrl: "/api/blob/upload",
          multipart: file.size > MULTIPART_UPLOAD_THRESHOLD_BYTES,
        },
      );
      const result = await setSessionVideo(sessionId, blob.url, durationSeconds);
      if (!result.ok) throw new Error(result.error);
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
