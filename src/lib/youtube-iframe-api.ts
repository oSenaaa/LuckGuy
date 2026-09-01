export type YoutubePlayer = {
  getDuration: () => number;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  getAvailablePlaybackRates: () => number[];
  getIframe: () => HTMLIFrameElement;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (suggestedRate: number) => void;
  destroy: () => void;
};

export const YOUTUBE_PLAYER_STATE = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
} as const;

type YoutubePlayerEvents = {
  onReady?: (event: { target: YoutubePlayer }) => void;
  onStateChange?: (event: { data: number; target: YoutubePlayer }) => void;
  onPlaybackRateChange?: (event: { data: number; target: YoutubePlayer }) => void;
  onError?: () => void;
};

type YoutubePlayerVars = {
  controls?: 0 | 1;
  disablekb?: 0 | 1;
  fs?: 0 | 1;
  iv_load_policy?: 1 | 3;
  playsinline?: 0 | 1;
  rel?: 0 | 1;
  start?: number;
};

type YoutubeNamespace = {
  Player: new (
    element: string,
    options: {
      videoId: string;
      events: YoutubePlayerEvents;
      playerVars?: YoutubePlayerVars;
    },
  ) => YoutubePlayer;
};

declare global {
  interface Window {
    YT?: YoutubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<void> | null = null;

export function loadYoutubeIframeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });

  return apiLoadPromise;
}

export function createYoutubePlayer(
  containerId: string,
  videoId: string,
  events: YoutubePlayerEvents,
  playerVars?: YoutubePlayerVars,
) {
  return new window.YT!.Player(containerId, { videoId, events, playerVars });
}
