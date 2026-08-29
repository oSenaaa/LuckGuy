"use client";

import { useEffect, useRef, useState } from "react";
import {
  createYoutubePlayer,
  loadYoutubeIframeApi,
  YOUTUBE_PLAYER_STATE,
  YoutubePlayer,
} from "@/lib/youtube-iframe-api";

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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao emitir certificado");
      setCertificateUrl(data.pdfUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao emitir certificado");
    } finally {
      setIssuing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {provider === "blob" ? (
        <video
          ref={videoRef}
          src={videoUrl ?? undefined}
          controls
          className="w-full rounded bg-black"
          onPause={sendHeartbeat}
          onEnded={sendHeartbeat}
        />
      ) : (
        <div className="aspect-video w-full overflow-hidden rounded bg-black">
          <div id={`yt-player-${courseSessionId}`} className="h-full w-full" />
        </div>
      )}

      <div>
        <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
          <div
            className="h-full bg-black transition-all"
            style={{ width: `${Math.min(100, watchedPercent)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-600">
          {watchedPercent.toFixed(0)}% assistido — mínimo necessário: {minWatchPercent}%
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {certificateUrl ? (
        <a
          href={certificateUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded bg-green-600 px-4 py-2 text-center text-white"
        >
          Baixar certificado
        </a>
      ) : (
        <button
          type="button"
          disabled={!completed || issuing}
          onClick={issueCertificate}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-40"
        >
          {issuing ? "Gerando certificado..." : "Emitir certificado"}
        </button>
      )}
    </div>
  );
}
