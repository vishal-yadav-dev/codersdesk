"use client";
import { useRef, useState } from "react";
import { type Track } from "./playlist";

function ytId(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? m[1] : url; // allow bare ids
}

function postCommand(iframe: HTMLIFrameElement | null, func: string) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "https://www.youtube.com");
}

/**
 * Music card: spinning cover art, track meta, transport controls and links out
 * to YouTube / Spotify / Saavn. Audio plays through a 1px hidden iframe so the
 * YouTube player chrome never shows — the card is the only visible UI.
 */
export default function Tablet({
  track,
  onPrev,
  onNext,
}: {
  track: Track;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const id = ytId(track.youtube);

  const togglePlay = () => {
    if (playing) {
      postCommand(iframeRef.current, "pauseVideo");
    } else {
      postCommand(iframeRef.current, "unMute");
      postCommand(iframeRef.current, "playVideo");
    }
    setPlaying((p) => !p);
  };

  const prev = () => { setPlaying(true); onPrev(); };
  const next = () => { setPlaying(true); onNext(); };

  // only YouTube has a real id for this track; the others get a search link.
  // the artist field doubles as a genre blurb, so keep just the part before "·".
  const query = encodeURIComponent(`${track.title} ${track.artist.split("·")[0].trim()}`.trim());

  return (
    <div className="music-card">
      <div className="mus-head">
        {/* spins like a record while playing, freezes in place when paused */}
        <div className={`mus-art ${playing ? "mus-spin" : ""}`}>
          {/* 24/7 live streams often have no still thumbnail at all */}
          {thumbFailed ? (
            <div className="mus-thumb mus-thumb-fallback" aria-hidden="true">♪</div>
          ) : (
            <img
              className="mus-thumb"
              src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
              alt=""
              onError={() => setThumbFailed(true)}
            />
          )}
          <span className="mus-hole" aria-hidden="true" />
        </div>
        <div className="mus-meta">
          <span className="mus-now">{track.title}</span>
          <span className="mus-artist">{track.artist}</span>
          {playing && (
            <span className="mus-live"><span className="mus-live-dot" /> live</span>
          )}
        </div>
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
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch on YouTube
        </a>
        <a
          className="mus-yt"
          href={`https://open.spotify.com/search/${query}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch on Spotify
        </a>
        <a
          className="mus-yt"
          href={`https://www.jiosaavn.com/search/${query}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch on Saavn
        </a>
      </div>

      <div className="mus-hidden-player">
        <iframe
          ref={iframeRef}
          key={id}
          src={`https://www.youtube.com/embed/${id}?autoplay=1&mute=${playing ? 0 : 1}&enablejsapi=1&rel=0&modestbranding=1&playsinline=1&controls=0&disablekb=1&iv_load_policy=3`}
          title={track.title}
          allow="autoplay; encrypted-media"
        />
      </div>
    </div>
  );
}
