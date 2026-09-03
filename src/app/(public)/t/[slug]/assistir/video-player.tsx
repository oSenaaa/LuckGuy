"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Award,
  CheckCircle2,
  Download,
  Gauge,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import {
  createYoutubePlayer,
  loadYoutubeIframeApi,
  YOUTUBE_PLAYER_STATE,
  YoutubePlayer,
} from "@/lib/youtube-iframe-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const BLOB_PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const MAX_PLAYBACK_RATE = 2;
const SEEK_EPSILON_SECONDS = 0.05;
const YOUTUBE_SEEK_TOLERANCE_SECONDS = 1;
const PROGRESS_RECONCILIATION_TOLERANCE_SECONDS = 2;
const DEFAULT_VOLUME = 100;

type Props = {
  courseSessionId: string;
  provider: "blob" | "youtube";
  videoUrl: string | null;
  youtubeId: string | null;
  minWatchPercent: number;
  initialCurrentTime: number;
  initialWatchedPercent: number;
  initialCompleted: boolean;
  initialCertificateUrl: string | null;
};

type PlayerControlsProps = {
  availablePlaybackRates: number[];
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
  isMuted: boolean;
  isPlaying: boolean;
  playbackRate: number;
  ready: boolean;
  volume: number;
  onPlaybackRateChange: (rate: number) => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onTogglePlayback: () => void;
  onVolumeChange: (volume: number) => void;
};

type PendingYoutubeSeek = {
  target: number;
  resumePlayback: boolean;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatPlaybackRate(rate: number) {
  return `${rate.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x`;
}

function VolumeIcon({ muted, volume }: { muted: boolean; volume: number }) {
  if (muted || volume === 0) return <VolumeX />;
  if (volume < 50) return <Volume1 />;
  return <Volume2 />;
}

function PlayerControls({
  availablePlaybackRates,
  currentTime,
  duration,
  isFullscreen,
  isMuted,
  isPlaying,
  playbackRate,
  ready,
  volume,
  onPlaybackRateChange,
  onToggleFullscreen,
  onToggleMute,
  onTogglePlayback,
  onVolumeChange,
}: PlayerControlsProps) {
  return (
    <div
      role="group"
      aria-label="Controles do vídeo"
      className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-linear-to-t from-black/90 via-black/60 to-transparent px-3 pb-3 pt-8 text-white"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        disabled={!ready}
        onClick={onTogglePlayback}
        aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
        className="text-white hover:bg-white/15 hover:text-white focus-visible:border-white/50 focus-visible:ring-white/40"
      >
        {isPlaying ? <Pause /> : <Play />}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        disabled={!ready}
        onClick={onToggleMute}
        aria-label={isMuted || volume === 0 ? "Ativar som" : "Silenciar"}
        className="text-white hover:bg-white/15 hover:text-white focus-visible:border-white/50 focus-visible:ring-white/40"
      >
        <VolumeIcon muted={isMuted} volume={volume} />
      </Button>

      <Slider
        aria-label="Volume"
        disabled={!ready}
        min={0}
        max={100}
        step={1}
        value={[isMuted ? 0 : volume]}
        onValueChange={([nextVolume]) => onVolumeChange(nextVolume)}
        className="hidden w-20 sm:flex [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:bg-white/25"
      />

      <span className="text-xs tabular-nums text-white/85" aria-hidden="true">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!ready}
            aria-label={`Velocidade de reprodução: ${formatPlaybackRate(playbackRate)}`}
            className="ml-auto min-w-18 text-white hover:bg-white/15 hover:text-white focus-visible:border-white/50 focus-visible:ring-white/40"
          >
            <Gauge />
            {formatPlaybackRate(playbackRate)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="min-w-32">
          <DropdownMenuLabel>Velocidade</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={String(playbackRate)}
            onValueChange={(value) => onPlaybackRateChange(Number(value))}
          >
            {availablePlaybackRates.map((rate) => (
              <DropdownMenuRadioItem key={rate} value={String(rate)}>
                {formatPlaybackRate(rate)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        disabled={!ready}
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        className="text-white hover:bg-white/15 hover:text-white focus-visible:border-white/50 focus-visible:ring-white/40"
      >
        {isFullscreen ? <Minimize /> : <Maximize />}
      </Button>
    </div>
  );
}

export function VideoPlayer({
  courseSessionId,
  provider,
  videoUrl,
  youtubeId,
  minWatchPercent,
  initialCurrentTime,
  initialWatchedPercent,
  initialCompleted,
  initialCertificateUrl,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<YoutubePlayer | null>(null);
  const lastAllowedBlobTimeRef = useRef(Math.max(0, initialCurrentTime));
  const internalBlobSeekTargetRef = useRef<number | null>(null);
  const correctingBlobSeekTargetRef = useRef<number | null>(null);
  const heartbeatRequestSequenceRef = useRef(0);
  const lastAppliedHeartbeatSequenceRef = useRef(0);
  const lastAllowedYoutubeTimeRef = useRef(Math.max(0, initialCurrentTime));
  const lastYoutubeSampleAtRef = useRef<number | null>(null);
  const pendingYoutubeSeekRef = useRef<PendingYoutubeSeek | null>(null);
  const youtubePlaybackRateRef = useRef(1);
  const hasYoutubePlaybackStartedRef = useRef(false);
  const lastYoutubePlayerStateRef = useRef<number | null>(null);
  const suppressNextYoutubePauseHeartbeatRef = useRef(false);
  const [watchedPercent, setWatchedPercent] = useState(initialWatchedPercent);
  const [completed, setCompleted] = useState(initialCompleted);
  const [certificateUrl, setCertificateUrl] = useState(initialCertificateUrl);
  const [issuing, setIssuing] = useState(false);
  const [isPlayingState, setIsPlayingState] = useState(false);
  const [playerReady, setPlayerReady] = useState(provider === "blob");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [availablePlaybackRates, setAvailablePlaybackRates] = useState<number[]>(
    provider === "blob" ? BLOB_PLAYBACK_RATES : [1],
  );
  const [currentTime, setCurrentTime] = useState(Math.max(0, initialCurrentTime));
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getCurrentTime = useCallback(() => {
    if (provider === "blob") return videoRef.current?.currentTime ?? 0;
    return youtubePlayerRef.current?.getCurrentTime() ?? 0;
  }, [provider]);

  const isPlaying = useCallback(() => {
    if (provider === "blob") {
      return videoRef.current ? !videoRef.current.paused : false;
    }
    return youtubePlayerRef.current?.getPlayerState() === YOUTUBE_PLAYER_STATE.PLAYING;
  }, [provider]);

  const reconcilePlaybackTime = useCallback(
    (acceptedCurrentTime: number, reportedCurrentTime: number) => {
      if (
        !Number.isFinite(acceptedCurrentTime) ||
        reportedCurrentTime <=
          acceptedCurrentTime + PROGRESS_RECONCILIATION_TOLERANCE_SECONDS
      ) {
        return;
      }

      if (provider === "blob") {
        const video = videoRef.current;
        if (!video) return;

        internalBlobSeekTargetRef.current = acceptedCurrentTime;
        lastAllowedBlobTimeRef.current = acceptedCurrentTime;
        video.currentTime = acceptedCurrentTime;
      } else {
        const player = youtubePlayerRef.current;
        if (!player) return;

        const resumePlayback =
          player.getPlayerState() === YOUTUBE_PLAYER_STATE.PLAYING;
        if (resumePlayback) {
          suppressNextYoutubePauseHeartbeatRef.current = true;
          player.pauseVideo();
        }
        pendingYoutubeSeekRef.current = {
          target: acceptedCurrentTime,
          resumePlayback,
        };
        lastAllowedYoutubeTimeRef.current = acceptedCurrentTime;
        lastYoutubeSampleAtRef.current = performance.now();
        player.seekTo(acceptedCurrentTime, false);
        setCurrentTime(acceptedCurrentTime);
      }

      toast.info("O vídeo voltou ao último ponto de reprodução validado.");
    },
    [provider],
  );

  const sendHeartbeat = useCallback(async () => {
    const requestSequence = ++heartbeatRequestSequenceRef.current;
    const reportedCurrentTime = getCurrentTime();

    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSessionId, currentTime: reportedCurrentTime }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (requestSequence < lastAppliedHeartbeatSequenceRef.current) return;

      lastAppliedHeartbeatSequenceRef.current = requestSequence;
      setWatchedPercent((previous) => Math.max(previous, data.watchedPercent));
      setCompleted((previous) => previous || data.completed);
      reconcilePlaybackTime(data.acceptedCurrentTime, reportedCurrentTime);
    } catch {
      // heartbeat failures are non-fatal; next tick retries
    }
  }, [courseSessionId, getCurrentTime, reconcilePlaybackTime]);

  useEffect(() => {
    if (provider !== "youtube" || !youtubeId) return;

    let cancelled = false;
    let player: YoutubePlayer | null = null;

    loadYoutubeIframeApi().then(() => {
      if (cancelled) return;

      player = createYoutubePlayer(
        `yt-player-${courseSessionId}`,
        youtubeId,
        {
          onReady: (event) => {
            if (cancelled) return;

            youtubePlayerRef.current = event.target;
            event.target.getIframe().setAttribute("tabindex", "-1");

            const videoDuration = event.target.getDuration();
            const requestedResumeTime = Math.max(0, initialCurrentTime);
            const resumeAt =
              videoDuration > 0
                ? Math.min(requestedResumeTime, videoDuration)
                : requestedResumeTime;
            const supportedRates = event.target
              .getAvailablePlaybackRates()
              .filter(
                (rate) => Number.isFinite(rate) && rate > 0 && rate <= MAX_PLAYBACK_RATE,
              );

            event.target.setVolume(DEFAULT_VOLUME);
            event.target.unMute();

            setCurrentTime(resumeAt);
            setDuration(videoDuration);
            setAvailablePlaybackRates(supportedRates.length > 0 ? supportedRates : [1]);
            lastAllowedYoutubeTimeRef.current = resumeAt;
            lastYoutubeSampleAtRef.current = performance.now();
            lastYoutubePlayerStateRef.current = event.target.getPlayerState();
            setPlayerReady(true);
          },
          onStateChange: (event) => {
            const observedTime = event.target.getCurrentTime();
            const now = performance.now();
            const playing = event.data === YOUTUBE_PLAYER_STATE.PLAYING;
            setIsPlayingState(playing);
            setCurrentTime(observedTime);

            if (playing && !hasYoutubePlaybackStartedRef.current) {
              hasYoutubePlaybackStartedRef.current = true;
              lastAllowedYoutubeTimeRef.current = observedTime;
            } else if (pendingYoutubeSeekRef.current === null) {
              const sampledAt = lastYoutubeSampleAtRef.current ?? now;
              const elapsedSeconds = Math.max(0, (now - sampledAt) / 1000);
              const allowedAdvance =
                lastYoutubePlayerStateRef.current === YOUTUBE_PLAYER_STATE.PLAYING
                  ? elapsedSeconds * youtubePlaybackRateRef.current
                  : 0;
              const previousTime = lastAllowedYoutubeTimeRef.current;
              const plausiblePosition =
                observedTime <=
                  previousTime + allowedAdvance + YOUTUBE_SEEK_TOLERANCE_SECONDS &&
                observedTime >= previousTime - YOUTUBE_SEEK_TOLERANCE_SECONDS;

              if (plausiblePosition) {
                lastAllowedYoutubeTimeRef.current = observedTime;
              }
            }

            lastYoutubeSampleAtRef.current = now;
            lastYoutubePlayerStateRef.current = event.data;

            if (
              event.data === YOUTUBE_PLAYER_STATE.PAUSED ||
              event.data === YOUTUBE_PLAYER_STATE.ENDED
            ) {
              if (
                event.data === YOUTUBE_PLAYER_STATE.PAUSED &&
                suppressNextYoutubePauseHeartbeatRef.current
              ) {
                suppressNextYoutubePauseHeartbeatRef.current = false;
              } else {
                void sendHeartbeat();
              }
            }
          },
          onPlaybackRateChange: (event) => {
            if (event.data <= MAX_PLAYBACK_RATE) {
              youtubePlaybackRateRef.current = event.data;
              setPlaybackRate(event.data);
            }
          },
        },
        {
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          playsinline: 1,
          rel: 0,
          start: Math.max(0, Math.floor(initialCurrentTime)),
        },
      );
      youtubePlayerRef.current = player;
    });

    return () => {
      cancelled = true;
      player?.destroy();
      if (youtubePlayerRef.current === player) youtubePlayerRef.current = null;
    };
  }, [courseSessionId, initialCurrentTime, provider, sendHeartbeat, youtubeId]);

  useEffect(() => {
    if (provider !== "youtube") return;

    const interval = setInterval(() => {
      const player = youtubePlayerRef.current;
      if (!player) return;

      const nextCurrentTime = player.getCurrentTime();
      const nextDuration = player.getDuration();
      const playerState = player.getPlayerState();
      const now = performance.now();

      if (
        Number.isFinite(nextCurrentTime) &&
        (playerState === YOUTUBE_PLAYER_STATE.PLAYING ||
          playerState === YOUTUBE_PLAYER_STATE.PAUSED ||
          playerState === YOUTUBE_PLAYER_STATE.ENDED)
      ) {
        const pendingSeek = pendingYoutubeSeekRef.current;
        if (pendingSeek !== null) {
          if (
            Math.abs(nextCurrentTime - pendingSeek.target) <=
            YOUTUBE_SEEK_TOLERANCE_SECONDS
          ) {
            pendingYoutubeSeekRef.current = null;
            lastAllowedYoutubeTimeRef.current = nextCurrentTime;
            setCurrentTime(nextCurrentTime);
            if (pendingSeek.resumePlayback) player.playVideo();
          } else {
            player.seekTo(pendingSeek.target, false);
            setCurrentTime(pendingSeek.target);
          }
          lastYoutubeSampleAtRef.current = now;
        } else {
          const sampledAt = lastYoutubeSampleAtRef.current ?? now;
          const elapsedSeconds = Math.max(0, (now - sampledAt) / 1000);
          const allowedAdvance =
            playerState === YOUTUBE_PLAYER_STATE.PLAYING
              ? elapsedSeconds * youtubePlaybackRateRef.current
              : 0;
          const previousTime = lastAllowedYoutubeTimeRef.current;
          const jumped =
            nextCurrentTime >
              previousTime + allowedAdvance + YOUTUBE_SEEK_TOLERANCE_SECONDS ||
            nextCurrentTime < previousTime - YOUTUBE_SEEK_TOLERANCE_SECONDS;

          if (jumped) {
            const resumePlayback =
              playerState === YOUTUBE_PLAYER_STATE.PLAYING;
            if (resumePlayback) {
              suppressNextYoutubePauseHeartbeatRef.current = true;
              player.pauseVideo();
            }
            pendingYoutubeSeekRef.current = {
              target: previousTime,
              resumePlayback,
            };
            player.seekTo(previousTime, false);
            setCurrentTime(previousTime);
          } else {
            lastAllowedYoutubeTimeRef.current = nextCurrentTime;
            setCurrentTime(nextCurrentTime);
          }
          lastYoutubeSampleAtRef.current = now;
        }
      }
      if (Number.isFinite(nextDuration) && nextDuration > 0) setDuration(nextDuration);
    }, 500);

    return () => clearInterval(interval);
  }, [provider]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying()) void sendHeartbeat();
    }, 10000);
    return () => clearInterval(interval);
  }, [isPlaying, sendHeartbeat]);

  useEffect(() => {
    function handleFullscreenChange() {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      const fullscreenElement = document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setIsFullscreen(fullscreenElement !== null && fullscreenElement === containerRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const togglePlayback = useCallback(async () => {
    if (!playerReady) return;

    if (provider === "blob") {
      const video = videoRef.current;
      if (!video) return;

      if (video.paused) {
        if (video.ended) {
          internalBlobSeekTargetRef.current = 0;
          lastAllowedBlobTimeRef.current = 0;
          video.currentTime = 0;
        }

        try {
          await video.play();
        } catch {
          toast.error("Não foi possível reproduzir o vídeo");
        }
      } else {
        video.pause();
      }
      return;
    }

    const player = youtubePlayerRef.current;
    if (!player) return;

    if (player.getPlayerState() === YOUTUBE_PLAYER_STATE.PLAYING) {
      player.pauseVideo();
    } else {
      if (player.getPlayerState() === YOUTUBE_PLAYER_STATE.ENDED) {
        pendingYoutubeSeekRef.current = null;
        lastAllowedYoutubeTimeRef.current = 0;
        lastYoutubeSampleAtRef.current = performance.now();
        player.seekTo(0, true);
        setCurrentTime(0);
      }
      player.playVideo();
    }
  }, [playerReady, provider]);

  function changePlaybackRate(rate: number) {
    if (!availablePlaybackRates.includes(rate) || rate > MAX_PLAYBACK_RATE) return;

    if (provider === "blob") {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = rate;
      return;
    }

    youtubePlayerRef.current?.setPlaybackRate(rate);
  }

  function changeVolume(nextVolume: number) {
    const clamped = Math.round(Math.min(100, Math.max(0, nextVolume)));
    setVolume(clamped);
    setIsMuted(clamped === 0);

    if (provider === "blob") {
      const video = videoRef.current;
      if (!video) return;
      video.volume = clamped / 100;
      video.muted = clamped === 0;
      return;
    }

    const player = youtubePlayerRef.current;
    if (!player) return;
    player.setVolume(clamped);
    if (clamped === 0) player.mute();
    else player.unMute();
  }

  function toggleMute() {
    if (provider === "blob") {
      const video = videoRef.current;
      if (!video) return;
      const nextMuted = !video.muted;
      video.muted = nextMuted;
      setIsMuted(nextMuted);
      return;
    }

    const player = youtubePlayerRef.current;
    if (!player) return;
    const nextMuted = !player.isMuted();
    if (nextMuted) player.mute();
    else player.unMute();
    setIsMuted(nextMuted);
  }

  async function toggleFullscreen() {
    const container = containerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => void })
      | null;
    if (!container) return;

    const doc = document as Document & {
      webkitExitFullscreen?: () => void;
      webkitFullscreenElement?: Element | null;
    };
    const fullscreenElement = document.fullscreenElement ?? doc.webkitFullscreenElement;

    try {
      if (fullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else doc.webkitExitFullscreen?.();
      } else if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else {
        container.webkitRequestFullscreen?.();
      }
    } catch {
      toast.error("Não foi possível alternar a tela cheia");
    }
  }

  function syncBlobTime(video: HTMLVideoElement) {
    setCurrentTime(video.currentTime);
    if (Number.isFinite(video.duration)) setDuration(video.duration);
  }

  function handleBlobLoadedMetadata(video: HTMLVideoElement) {
    const resumeAt = Math.min(Math.max(0, initialCurrentTime), video.duration);
    lastAllowedBlobTimeRef.current = resumeAt;
    video.volume = volume / 100;
    video.muted = isMuted;
    syncBlobTime(video);

    if (resumeAt > 0) {
      internalBlobSeekTargetRef.current = resumeAt;
      video.currentTime = resumeAt;
    }
  }

  function handleBlobTimeUpdate(video: HTMLVideoElement) {
    if (
      !video.seeking &&
      internalBlobSeekTargetRef.current === null &&
      correctingBlobSeekTargetRef.current === null
    ) {
      lastAllowedBlobTimeRef.current = video.currentTime;
    }
    syncBlobTime(video);
  }

  function handleBlobSeeking(video: HTMLVideoElement) {
    const correctionTarget = correctingBlobSeekTargetRef.current;
    if (correctionTarget !== null) {
      if (Math.abs(video.currentTime - correctionTarget) >= SEEK_EPSILON_SECONDS) {
        video.currentTime = correctionTarget;
      }
      return;
    }

    const internalTarget = internalBlobSeekTargetRef.current;
    if (
      internalTarget !== null &&
      Math.abs(video.currentTime - internalTarget) < SEEK_EPSILON_SECONDS
    ) {
      return;
    }

    const allowedTime = lastAllowedBlobTimeRef.current;
    if (Math.abs(video.currentTime - allowedTime) < SEEK_EPSILON_SECONDS) return;

    correctingBlobSeekTargetRef.current = allowedTime;
    video.currentTime = allowedTime;
  }

  function handleBlobSeeked(video: HTMLVideoElement) {
    const internalTarget = internalBlobSeekTargetRef.current;
    if (
      internalTarget !== null &&
      Math.abs(video.currentTime - internalTarget) < SEEK_EPSILON_SECONDS
    ) {
      internalBlobSeekTargetRef.current = null;
      lastAllowedBlobTimeRef.current = video.currentTime;
    }

    const correctionTarget = correctingBlobSeekTargetRef.current;
    if (correctionTarget !== null) {
      if (Math.abs(video.currentTime - correctionTarget) >= SEEK_EPSILON_SECONDS) {
        video.currentTime = correctionTarget;
        return;
      }
      correctingBlobSeekTargetRef.current = null;
    }

    syncBlobTime(video);
  }

  function handleBlobRateChange(video: HTMLVideoElement) {
    if (!BLOB_PLAYBACK_RATES.includes(video.playbackRate)) {
      video.playbackRate = 1;
      return;
    }
    setPlaybackRate(video.playbackRate);
  }

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
      toast.error(err instanceof Error ? err.message : "Erro ao emitir certificado");
    } finally {
      setIssuing(false);
    }
  }

  const pct = Math.min(100, watchedPercent);

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={containerRef}
        className={cn(
          "relative w-full overflow-hidden bg-black",
          isFullscreen ? "h-full" : "aspect-video rounded-lg",
        )}
        onContextMenu={(event) => event.preventDefault()}
      >
        {provider === "blob" ? (
          <video
            ref={videoRef}
            src={videoUrl ?? undefined}
            preload="metadata"
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload nofullscreen noremoteplayback"
            aria-label="Vídeo do treinamento"
            className="h-full w-full bg-black object-contain"
            onLoadedMetadata={(event) => handleBlobLoadedMetadata(event.currentTarget)}
            onTimeUpdate={(event) => handleBlobTimeUpdate(event.currentTarget)}
            onSeeking={(event) => handleBlobSeeking(event.currentTarget)}
            onSeeked={(event) => handleBlobSeeked(event.currentTarget)}
            onRateChange={(event) => handleBlobRateChange(event.currentTarget)}
            onPlay={() => setIsPlayingState(true)}
            onPause={() => {
              setIsPlayingState(false);
              void sendHeartbeat();
            }}
            onEnded={() => {
              setIsPlayingState(false);
              void sendHeartbeat();
            }}
          />
        ) : (
          <div className="h-full w-full overflow-hidden bg-black">
            <div id={`yt-player-${courseSessionId}`} className="h-full w-full" />
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={() => void togglePlayback()}
        />

        <PlayerControls
          availablePlaybackRates={availablePlaybackRates}
          currentTime={currentTime}
          duration={duration}
          isFullscreen={isFullscreen}
          isMuted={isMuted}
          isPlaying={isPlayingState}
          playbackRate={playbackRate}
          ready={playerReady}
          volume={volume}
          onPlaybackRateChange={changePlaybackRate}
          onToggleFullscreen={() => void toggleFullscreen()}
          onToggleMute={toggleMute}
          onTogglePlayback={() => void togglePlayback()}
          onVolumeChange={changeVolume}
        />
      </div>

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
