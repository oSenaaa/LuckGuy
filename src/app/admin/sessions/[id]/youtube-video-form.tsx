"use client";

import { useState } from "react";
import { extractYoutubeVideoId } from "@/lib/youtube";
import { createYoutubePlayer, loadYoutubeIframeApi } from "@/lib/youtube-iframe-api";
import { setSessionVideoYoutube } from "../actions";

function readDuration(videoId: string, containerId: string): Promise<number> {
  return new Promise((resolve, reject) => {
    createYoutubePlayer(containerId, videoId, {
      onReady: (event) => {
        const duration = Math.round(event.target.getDuration());
        event.target.destroy();
        if (duration > 0) resolve(duration);
        else reject(new Error("Não foi possível obter a duração do vídeo"));
      },
      onError: () => reject(new Error("Vídeo do YouTube inválido ou indisponível")),
    });
  });
}

export function YoutubeVideoForm({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = String(formData.get("youtubeUrl") ?? "");
    const videoId = extractYoutubeVideoId(url);

    if (!videoId) {
      setError("Link do YouTube inválido");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      await loadYoutubeIframeApi();
      const duration = await readDuration(videoId, `yt-probe-${sessionId}`);
      await setSessionVideoYoutube(sessionId, videoId, duration);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar o vídeo");
      setStatus("error");
    }
  }

  return (
    <div className="rounded border p-4">
      <label className="text-sm font-medium">Vídeo via link do YouTube</label>
      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input
          name="youtubeUrl"
          type="url"
          required
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={status === "loading"}
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          {status === "loading" ? "Verificando..." : "Usar este vídeo"}
        </button>
      </form>
      <div id={`yt-probe-${sessionId}`} className="hidden" />
      {status === "done" && <p className="mt-1 text-xs text-green-700">Vídeo configurado. Atualize a página.</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
