"use client";
import { useEffect, useRef, useState } from "react";
import { type Track } from "./playlist";

function ytId(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? m[1] : url; // allow bare ids
}

interface YTVideoData {
  video_id: string;
  title: string;
  author: string;
}
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  nextVideo(): void;
  previousVideo(): void;
  playVideoAt(index: number): void;
  cuePlaylist(opts: { listType?: string; list?: string; index?: number; startSeconds?: number }): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlaylistIndex(): number;
  getPlaylist?(): string[];
  getVideoData(): YTVideoData;
  destroy(): void;
}
interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: YTPlayerEvent) => void;
        onStateChange?: (e: YTPlayerEvent) => void;
      };
    }
  ) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Loads the IFrame API script once, shared by every player on the page. */
let apiReady: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (!apiReady) {
    apiReady = new Promise<void>((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return apiReady;
}

function readData(p: YTPlayer): YTVideoData | null {
  try {
    const d = p.getVideoData();
    return d?.video_id ? d : null;
  } catch {
    return null;
  }
}

function cleanTitle(raw: string): string {
  if (!raw) return "";
  let t = raw.trim();

  // credits after a pipe are film / cast / label, never the song name
  if (t.includes("|")) t = t.split("|")[0];

  // bracketed or parenthesised boilerplate, anywhere in the string
  t = t.replace(
    /[([][^)\]]*\b(?:official|full|video|lyric(?:al|s)?|audio|song|hd|4k|remaster(?:ed)?|reprise)\b[^)\]]*[)\]]/gi,
    " "
  );

  // a trailing "- Full Video Song", "– Official Audio", ": Lyrical" tail
  t = t.replace(
    /\s*[-–—:]\s*(?:new\s+|official\s+|full\s+|hd\s+|4k\s+|complete\s+)*(?:music\s+)?(?:video\s*song|lyric(?:al)?\s*video|video|lyrics?|lyrical|audio|song|track)\b.*$/i,
    ""
  );

  // boilerplate mid-title, but only when a separator or the end follows it, so
  // a genuine phrase like "Love Song Forever" is left alone
  t = t.replace(
    /\s+(?:new\s+|official\s+|full\s+|hd\s+|4k\s+)*(?:music\s+)?(?:video\s*song|lyric(?:al)?\s*video|video|lyrics?|lyrical|audio|song)\b(?=\s*(?:[-–—|:([]|$))[\s\S]*$/i,
    ""
  );

  t = t.replace(
    /\s+(?:new\s+|official\s+|full\s+|hd\s+|4k\s+)*(?:music\s+)?(?:video\s*song|lyric(?:al)?\s*video|video|lyrics?|lyrical|audio|song)\s*$/i,
    ""
  );

  t = t.replace(/\s*[-–—|:,]\s*$/g, "").replace(/\s{2,}/g, " ").trim();
  return t || raw.trim();
}

export default function Tablet({
  track,
  playlistId,
  sceneId,
  startIndex = 0,
  cue = 0,
  sceneOffset = 0,
  onPrev,
  onNext,
  onPlayingChange,
  onTrackChange,
  onToggleRef,
}: {
  track: Track;
  playlistId: string | null;
  sceneId: string;
  startIndex?: number;
  /** bumps only on a manual scene change, never on the clock rolling over */
  cue?: number;
  /** 0..1 — where in the playlist this scene should start */
  sceneOffset?: number;
  onPrev: () => void;
  onNext: () => void;
  onPlayingChange?: (playing: boolean) => void;
  /** reports what is actually on, so other panels can show a now-playing chip */
  onTrackChange?: (info: { title: string; artist: string; videoId: string }) => void;
  /** lets a caller drive play/pause and skipping without owning the player */
  onToggleRef?: { current: null | { toggle: () => void; prev: () => void; next: () => void } };
}) {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [now, setNow] = useState<YTVideoData | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const transitionLockRef = useRef(false);
  const wantPlayRef = useRef(false);
  const resumeAtRef = useRef<number | null>(null);

  useEffect(() => {
    onPlayingChange?.(playing);
  }, [playing, onPlayingChange]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;

      const nextX = d.originX + (e.clientX - d.startX);
      const nextY = d.originY + (e.clientY - d.startY);
      setPos({ x: nextX, y: nextY });
    };

    const onUp = () => { dragRef.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const cueRef = useRef(cue);
  const settledRef = useRef(false);

  const staticId = ytId(track.youtube);
  const kind = playlistId ? "list" : "video";
  const id = playlistId ?? staticId;
  const targetIndex = Number.isFinite(startIndex) ? Math.max(0, startIndex) : 0;

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;

    let cancelled = false;
    let player: YTPlayer | null = null;
    const el = document.createElement("div");
    host.appendChild(el);

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return;
      const playerVars: Record<string, string | number> = {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        iv_load_policy: 3,
      };
      if (kind === "list") {
        playerVars.listType = "playlist";
        playerVars.list = id;
      }
      player = new window.YT.Player(el, {
        ...(kind === "video" ? { videoId: id } : {}),
        playerVars,
        events: {
          onReady: (e) => {
            if (cancelled) return;

            // reposition FIRST. playVideoAt() is a play command — blocked by
            // the browser without a user gesture, which left index and loaded
            // video disagreeing: getVideoData() named one song, Play started
            // another. cuePlaylist() loads AND positions without playing.
            if (kind === "list" && targetIndex > 0) {
              try {
                e.target.cuePlaylist({ listType: "playlist", list: id, index: targetIndex });
              } catch {
                try {
                  e.target.playVideoAt(targetIndex);
                  if (!wantPlayRef.current) e.target.pauseVideo();
                } catch {
                }
              }
            }

            // read AFTER repositioning, so the label matches what Play starts
            setNow(readData(e.target));

            if (wantPlayRef.current) {
              if (resumeAtRef.current != null) {
                e.target.seekTo(resumeAtRef.current, true);
              }
              e.target.unMute();
              e.target.playVideo();
            }
          },
          onStateChange: (e) => {
            if (cancelled || !window.YT) return;
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              setPlaying(true);
            } else if (e.data === S.PAUSED || e.data === S.ENDED) {
              resumeAtRef.current = e.target.getCurrentTime();
              setPlaying(false);
            }
            setNow(readData(e.target));
            setThumbFailed(false);
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      try {
        player?.destroy();
      } catch {
        /* player may already be gone */
      }
      playerRef.current = null;
      host.replaceChildren();
    };
  }, [kind, id]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      wantPlayRef.current = false;
      resumeAtRef.current = p.getCurrentTime();
      p.pauseVideo();
    } else {
      wantPlayRef.current = true;
      if (resumeAtRef.current != null) {
        p.seekTo(resumeAtRef.current, true);
      }
      p.unMute();
      p.playVideo();
    }
  };

  const prev = () => {
    wantPlayRef.current = true;
    transitionLockRef.current = true;
    if (playlistId && playerRef.current) {
      const p = playerRef.current;
      const index = typeof p.getPlaylistIndex === "function" ? p.getPlaylistIndex() : -1;
      const playlist = typeof p.getPlaylist === "function" ? p.getPlaylist() : [];

      if (typeof index === "number" && Array.isArray(playlist) && playlist.length > 1) {
        if (index <= 0) {
          p.playVideoAt(playlist.length - 1);
          return;
        }
      }

      p.previousVideo();
      return;
    }
    onPrev();
  };
  const next = () => {
    wantPlayRef.current = true;
    transitionLockRef.current = true;
    if (playlistId && playerRef.current) {
      const p = playerRef.current;
      const index = typeof p.getPlaylistIndex === "function" ? p.getPlaylistIndex() : -1;
      const playlist = typeof p.getPlaylist === "function" ? p.getPlaylist() : [];

      if (typeof index === "number" && Array.isArray(playlist) && playlist.length > 1) {
        if (index >= playlist.length - 1) {
          p.playVideoAt(0);
          return;
        }
      }

      p.nextVideo();
      return;
    }
    onNext();
  };

  // Reconciliation, not just a one-time read: whichever call moved the
  // player (initial cue, scene change, prev/next) does not have to also
  // remember to update the label — this polls the player itself, so the
  // label can never drift from what Play will actually start.
  useEffect(() => {
    if (!playlistId) return;
    const sync = () => {
      const p = playerRef.current;
      if (!p) return;
      const d = readData(p);
      if (d?.video_id && d.video_id !== now?.video_id) setNow(d);
    };
    sync();
    const t = setInterval(sync, 500);
    return () => clearInterval(t);
  }, [playlistId, now?.video_id]);

  // the static PLAYLIST row is not a valid stand-in for a YouTube playlist
  // entry — using it as a fallback is what let the two disagree
  const displayMeta = playlistId ? now : null;
  const videoId = playlistId ? displayMeta?.video_id ?? "" : staticId;
  const title = playlistId
    ? displayMeta?.title
      ? cleanTitle(displayMeta.title)
      : "Loading…"
    : cleanTitle(track.title);
  const artist = playlistId ? displayMeta?.author ?? "" : track.artist;

  const isMoved = pos.x !== 0 || pos.y !== 0;

  useEffect(() => {
    onTrackChange?.({ title, artist, videoId });
  }, [title, artist, videoId, onTrackChange]);

  useEffect(() => {
    if (!onToggleRef) return;
    onToggleRef.current = { toggle: togglePlay, prev, next };
    return () => {
      onToggleRef.current = null;
    };
  });

  const query = encodeURIComponent(`${title} ${artist.split("·")[0].trim()}`.trim());

  const startMusicDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
    };
    e.preventDefault();
  };

  return (
    <div
      className="music-card"
      style={{
        left: "56%",
        bottom: "74px",
        transform: `translate(${pos.x}px, ${pos.y}px) translateX(-50%)`,
      }}
    >
      <div className="mus-head" onPointerDown={startMusicDrag}>
        {/* spins like a record while playing, freezes in place when paused */}
        <div className={`mus-art ${playing ? "mus-spin" : ""}`}>
          {/* 24/7 live streams often have no still thumbnail at all */}
          {thumbFailed || !videoId ? (
            <div className="mus-thumb mus-thumb-fallback" aria-hidden="true">♪</div>
          ) : (
            <img
              className="mus-thumb"
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              onError={() => setThumbFailed(true)}
            />
          )}
          <span className="mus-hole" aria-hidden="true" />
        </div>
        <div className="mus-meta">
          <span className="mus-now">{title}</span>
          <span className="mus-artist">{artist}</span>
          {playing && (
            <span className="mus-live"><span className="mus-live-dot" /> live</span>
          )}
        </div>
        {isMoved && (
          <button
            className="mus-reset"
            type="button"
            onClick={() => setPos({ x: 0, y: 0 })}
            aria-label="Reset player position"
          >
            Reset
          </button>
        )}
      </div>

      <div className="mus-btns">
        <button className="mus-btn" onClick={prev} aria-label="Previous track">⏮</button>
        <button className="mus-btn mus-play" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <button className="mus-btn" onClick={next} aria-label="Next track">⏭</button>
      </div>

      <div className="mus-divider" />

      <div className="mus-links">
        <a
          className="mus-yt"
          href={
            playlistId
              ? `https://www.youtube.com/playlist?list=${playlistId}`
              : `https://www.youtube.com/watch?v=${videoId}`
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          {playlistId ? "Open YouTube" : "Watch on YouTube"}
        </a>
        <a
          className="mus-yt"
          href={`https://open.spotify.com/search/${query}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          → Spotify
        </a>
      </div>

      {/* React owns this node; the API-generated iframe lives inside it */}
      <div className="mus-hidden-player" ref={mountRef} />
    </div>
  );
}
