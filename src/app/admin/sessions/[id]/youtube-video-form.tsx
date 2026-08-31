"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { extractYoutubeVideoId } from "@/lib/youtube";
import { createYoutubePlayer, loadYoutubeIframeApi } from "@/lib/youtube-iframe-api";
import { setSessionVideoYoutube } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = String(formData.get("youtubeUrl") ?? "");
    const videoId = extractYoutubeVideoId(url);

    if (!videoId) {
      toast.error("Link do YouTube inválido");
      return;
    }

    setLoading(true);
    try {
      await loadYoutubeIframeApi();
      const duration = await readDuration(videoId, `yt-probe-${sessionId}`);
      await setSessionVideoYoutube(sessionId, videoId, duration);
      toast.success("Vídeo do YouTube configurado");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar o vídeo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <Label className="flex items-center gap-2">
        <Link2 className="size-4 text-muted-foreground" />
        Vídeo via link do YouTube
      </Label>
      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <Input
          name="youtubeUrl"
          type="url"
          required
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : null}
          {loading ? "Verificando…" : "Usar vídeo"}
        </Button>
      </form>
      <div id={`yt-probe-${sessionId}`} className="hidden" />
    </div>
  );
}
