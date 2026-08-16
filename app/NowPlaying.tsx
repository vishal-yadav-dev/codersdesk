"use client";
import { useState } from "react";

export interface MusicBridge {
  title: string;
  artist: string;
  videoId: string;
  playing: boolean;
  toggle: () => void;
  prev: () => void;
  next: () => void;
}

export default function NowPlaying({ music }: { music: MusicBridge }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`np ${hovered ? "np-open" : "np-shut"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={hovered ? undefined : music.title || "nothing playing"}
    >
      <button
        className={`np-disc ${music.playing ? "np-spin" : ""}`}
        onClick={music.toggle}
        aria-label={music.playing ? "Pause" : "Play"}
      >
        {music.videoId ? (
          <img src={`https://img.youtube.com/vi/${music.videoId}/default.jpg`} alt="" />
        ) : (
          <span className="np-note">♪</span>
        )}
        <span className="np-hole" aria-hidden="true" />
      </button>

      {/* everything past the disc slides away when the pointer leaves */}
      <div className={`np-rest ${hovered ? "" : "np-rest-hidden"}`}>
        <div className="np-meta">
          <span className="np-title">{music.title || "nothing playing"}</span>
          {music.artist && <span className="np-artist">{music.artist}</span>}
        </div>
        <div className="np-btns">
          <button onClick={music.prev} aria-label="Previous track" title="Previous track">⏮</button>
          <button
            onClick={music.toggle}
            aria-label={music.playing ? "Pause" : "Play"}
            title={music.playing ? "Pause" : "Play"}
          >
            {music.playing ? "❚❚" : "▶"}
          </button>
          <button onClick={music.next} aria-label="Next track" title="Next track">⏭</button>
        </div>
      </div>
    </div>
  );
}
