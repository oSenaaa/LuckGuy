"use client";

import { useEffect, useRef, useState } from "react";
import { Award, CheckCircle2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createYoutubePlayer,
  loadYoutubeIframeApi,
  YOUTUBE_PLAYER_STATE,
  YoutubePlayer,
} from "@/lib/youtube-iframe-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Props = {
  courseSessionId: string;
  provider: "blob" | "youtube";
  videoUrl: string | null;
  youtubeId: string | null;
  minWatchPercent: number;
  initialWatchedPercent: number;
  initialCompleted: boolean;
  initialCertificateUrl: string | null;
};

export function VideoPlayer({
  courseSessionId,
  provider,
  videoUrl,
  youtubeId,
  minWatchPercent,
  initialWatchedPercent,
  initialCompleted,
  initialCertificateUrl,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<YoutubePlayer | null>(null);
  const [watchedPercent, setWatchedPercent] = useState(initialWatchedPercent);
  const [completed, setCompleted] = useState(initialCompleted);
  const [certificateUrl, setCertificateUrl] = useState(initialCertificateUrl);
  const [issuing, setIssuing] = useState(false);

  function getCurrentTime() {
    if (provider === "blob") return videoRef.current?.currentTime ?? 0;
    return youtubePlayerRef.current?.getCurrentTime() ?? 0;
  }

  function isPlaying() {
    if (provider === "blob") return videoRef.current ? !videoRef.current.paused : false;
    return youtubePlayerRef.current?.getPlayerState() === YOUTUBE_PLAYER_STATE.PLAYING;
  }

  async function sendHeartbeat() {
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSessionId, currentTime: getCurrentTime() }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setWatchedPercent(data.watchedPercent);
      setCompleted(data.completed);
    } catch {
      // heartbeat failures are non-fatal; next tick retries
    }
  }

  useEffect(() => {
    if (provider !== "youtube" || !youtubeId) return;

    let cancelled = false;
    loadYoutubeIframeApi().then(() => {
      if (cancelled) return;
      youtubePlayerRef.current = createYoutubePlayer(`yt-player-${courseSessionId}`, youtubeId, {
        onStateChange: (event) => {
          if (event.data === YOUTUBE_PLAYER_STATE.PAUSED || event.data === YOUTUBE_PLAYER_STATE.ENDED) {
            sendHeartbeat();
          }
        },
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, youtubeId, courseSessionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying()) sendHeartbeat();
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function issueCertificate() {
    setIssuing(true);
    try {
      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao emitir certificado");
      setCertificateUrl(data.pdfUrl);
      toast.success("Certificado emitido com sucesso");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao emitir certificado",
      );
    } finally {
      setIssuing(false);
    }
  }

  const pct = Math.min(100, watchedPercent);

  return (
    <div className="flex flex-col gap-4">
      {provider === "blob" ? (
        <video
          ref={videoRef}
          src={videoUrl ?? undefined}
          controls
          className="aspect-video w-full rounded-lg bg-black"
          onPause={sendHeartbeat}
          onEnded={sendHeartbeat}
        />
      ) : (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <div id={`yt-player-${courseSessionId}`} className="h-full w-full" />
        </div>
      )}

      <div className="space-y-1.5">
        <Progress value={pct} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{pct.toFixed(0)}% assistido</span>
          <span>mínimo: {minWatchPercent}%</span>
        </div>
      </div>

      {completed && !certificateUrl && (
        <Badge
          variant="secondary"
          className="w-fit gap-1 text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 />
          Treinamento concluído
        </Badge>
      )}

      {certificateUrl ? (
        <Button asChild className="w-full sm:w-fit">
          <a href={certificateUrl} target="_blank" rel="noreferrer">
            <Download />
            Baixar certificado
          </a>
        </Button>
      ) : (
        <Button
          type="button"
          disabled={!completed || issuing}
          onClick={issueCertificate}
          className="w-full sm:w-fit"
        >
          {issuing ? <Loader2 className="animate-spin" /> : <Award />}
          {issuing ? "Gerando certificado…" : "Emitir certificado"}
        </Button>
      )}
    </div>
  );
}
