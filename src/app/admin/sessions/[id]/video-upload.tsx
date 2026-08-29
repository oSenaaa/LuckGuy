"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { setSessionVideo } from "../actions";

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
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);
    try {
      const durationSeconds = await readVideoDuration(file);
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      });
      await setSessionVideo(sessionId, blob.url, durationSeconds);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar vídeo");
      setStatus("error");
    }
  }

  return (
    <div className="rounded border p-4">
      <label className="text-sm font-medium">Vídeo do treinamento</label>
      <input
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleChange}
        disabled={status === "uploading"}
        className="mt-2 block text-sm"
      />
      {status === "uploading" && <p className="mt-1 text-xs text-gray-600">Enviando vídeo...</p>}
      {status === "done" && <p className="mt-1 text-xs text-green-700">Vídeo enviado. Atualize a página.</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
