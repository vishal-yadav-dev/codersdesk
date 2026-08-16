"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SCENES, sceneForHour, type Scene } from "./scenes";
import { defaultTrackIndexForScene, playlistForScene, tracksForScene } from "./playlist";
import DeskScene from "./DeskScene";
import Solver, { type SolverHandle } from "./Solver";
import Floating from "./Floating";
import Tablet from "./Tablet";
import CodeLab from "./CodeLab";

const IDE_W = 430;
const TRACK_INDEX_STORAGE_KEY = "desk-scene-track-index-v1";

function readTrackIndexState(): Record<string, number> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(TRACK_INDEX_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([_, value]) => typeof value === "number")
        .map(([key, value]) => [key, Number(value)])
    );
  } catch {
    return {};
  }
}

function ideDefaultRect() {
  const hero = document.querySelector(".hero")?.getBoundingClientRect();
  const copy = document.querySelector(".bottom")?.getBoundingClientRect();
  const top = (hero ? hero.bottom : 280) + 18;
  const avail = (copy ? copy.top : window.innerHeight) - top - 18;

  if (avail >= 210) {
    return { x: 72, y: top, w: IDE_W, h: Math.min(300, avail) };
  }
  // not enough vertical room — sit clear of the copy column on the right
  const x = Math.max((copy?.right ?? 720) + 48, window.innerWidth - IDE_W - 24);
  return {
    x: Math.min(x, window.innerWidth - IDE_W - 12),
    y: top,
    w: IDE_W,
    h: Math.min(300, window.innerHeight - top - 110),
  };
}

export default function Page() {
  const [now, setNow] = useState<Date | null>(null);
  const [override, setOverride] = useState<Scene | null>(null);
  const [atDesk, setAtDesk] = useState(16);
  const [solving, setSolving] = useState<string>("");
  const [trackIdxByScene, setTrackIdxByScene] = useState<Record<string, number>>({});
  const [userPickedTrack, setUserPickedTrack] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  const [labProblem, setLabProblem] = useState<string | null>(null);
  const solverRef = useRef<SolverHandle | null>(null);
  const [nowPlaying, setNowPlaying] = useState({ title: "", artist: "", videoId: "" });
  const musicRef = useRef<null | { toggle: () => void; prev: () => void; next: () => void }>(null);

  useEffect(() => {
    if (!labOpen) return;
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    const el = document.querySelector(".float-lab");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [labOpen]);

  useEffect(() => {
    setTrackIdxByScene(readTrackIndexState());
  }, []);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1_000); // tick live, not just on reload
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setAtDesk((n) => Math.max(3, Math.min(42, n + (Math.random() < 0.5 ? -1 : 1)))),
      4000
    );
    return () => clearInterval(t);
  }, []);

  const liveScene = useMemo(() => sceneForHour(now ? now.getHours() : 22), [now]);
  const scene = override ?? liveScene;
  const isLive = override === null;

  // the playlist follows the hour: each scene has its own set of songs
  const sceneTracks = useMemo(() => tracksForScene(scene.id), [scene.id]);
  const scenePlaylist = useMemo(() => playlistForScene(scene.id), [scene.id]);

  useEffect(() => {
    if (userPickedTrack || isPlaying) return;
    setTrackIdxByScene((prev) => ({
      ...prev,
      [scene.id]: prev[scene.id] ?? 0,
    }));
  }, [scene.id, userPickedTrack, isPlaying]);

  const sceneTrackIdx = trackIdxByScene[scene.id] ?? defaultTrackIndexForScene(scene.id);
  const track = sceneTracks[sceneTrackIdx % sceneTracks.length];

  useEffect(() => {
    try {
      window.localStorage.setItem(TRACK_INDEX_STORAGE_KEY, JSON.stringify(trackIdxByScene));
    } catch {
      // storage may be blocked; ignore silently
    }
  }, [trackIdxByScene]);

  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--sky", scene.palette.sky);
    r.setProperty("--horizon", scene.palette.horizon);
    r.setProperty("--room", scene.palette.room);
    r.setProperty("--glow", scene.palette.glow);
    r.setProperty("--ink", scene.palette.ink);
    r.setProperty("--muted", scene.palette.muted);
  }, [scene]);

  const clock = now
    ? now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "--:--:--";

  const prevTrack = () => {
    setUserPickedTrack(true);
    setTrackIdxByScene((prev) => ({
      ...prev,
      [scene.id]: ((prev[scene.id] ?? defaultTrackIndexForScene(scene.id)) - 1 + sceneTracks.length) % sceneTracks.length,
    }));
  };
  const nextTrack = () => {
    setUserPickedTrack(true);
    setTrackIdxByScene((prev) => ({
      ...prev,
      [scene.id]: ((prev[scene.id] ?? defaultTrackIndexForScene(scene.id)) + 1) % sceneTracks.length,
    }));
  };

  const jumpToScene = (target: Scene | null) => {
    setOverride(target);
    if (!target) return;

    const targetTracks = tracksForScene(target.id);
    const baseIndex = defaultTrackIndexForScene(target.id);
    const currentIndex = trackIdxByScene[target.id] ?? baseIndex;
    const nextIndex = (currentIndex + 1) % targetTracks.length;

    setUserPickedTrack(true);
    setTrackIdxByScene((prev) => ({
      ...prev,
      [target.id]: nextIndex,
    }));
  };

  return (
    <main className="scene-root fixed inset-0 overflow-hidden">
      <DeskScene scene={scene} />

      <div className="scrim" />

      <div className="overlay">
        <div className="top-row">
          <div className="live-count">
            <span className="pulse" /> {atDesk} at the desk
          </div>
          <div className="clock">{clock}{!isLive && " · preview"}</div>
        </div>

        <div className="hero">
          <div className="hero-accent">कोडर की मेज़</div>
          <h1 className="hero-title">the coder&apos;s desk</h1>
        </div>

        <div className="bottom">
          <div className="scene-copy">
            <div className="eyebrow">{scene.label} · {scene.range}</div>
            <h2 className="headline">{scene.headline}</h2>
            <p className="detail">{scene.detail}</p>
          </div>

          {/* DSA control bar */}
          <div className="dsa-bar">
            <span className="dsa-now">
              <span className="dsa-label">on screen</span> {solving || "…"}
            </span>
            <div className="dsa-btns">
              <button className="dsa-btn" onClick={() => solverRef.current?.prev()}>← Prev</button>
              <button className="dsa-btn" onClick={() => solverRef.current?.next()}>Next →</button>
              <button
                className="dsa-btn dsa-lab"
                onClick={() => { setLabProblem(null); setLabOpen(true); }}
                title="Practice DSA questions in the IDE and open the full Code Lab for other languages, bigger editors, and custom stdin runs."
              >
                ⌨ Code Lab
              </button>
            </div>
          </div>
        </div>
      </div>

      <Tablet
        track={track}
        playlistId={scenePlaylist}
        sceneId={scene.id}
        startIndex={sceneTrackIdx}
        onPrev={prevTrack}
        onNext={nextTrack}
        onPlayingChange={setIsPlaying}
        onTrackChange={setNowPlaying}
        onToggleRef={musicRef}
      />

      {/* live IDE — floats in the open space under the title, draggable/resizable */}
      <Floating
        title="live ide"
        tag={solving || "…"}
        defaultX={60}
        defaultY={300}
        defaultW={430}
        defaultH={230}
        minW={300}
        minH={170}
        getDefault={ideDefaultRect}
        autoResetKey={scene.id}
        className="float-ide"
      >
        <Solver
          ref={solverRef}
          onProblemChange={setSolving}
          onEditInLab={(id) => { setLabProblem(id); setLabOpen(true); }}
        />
      </Floating>

      <div className="timeline">
        {SCENES.map((s) => {
          const active = s.id === scene.id;
          return (
            <button
              key={s.id}
              className={`tl-node ${active ? "tl-active" : ""}`}
              onClick={() => jumpToScene(s.id === liveScene.id && isLive ? null : s)}
              title={s.label}
            >
              <span className="tl-dot" />
              <span className="tl-label">{s.range.split(" ")[0]}</span>
            </button>
          );
        })}
        <button
          className={`tl-now ${isLive ? "tl-now-on" : ""}`}
          onClick={() => jumpToScene(null)}
          title={isLive ? "following your clock" : "back to the live hour"}
        >
          now
        </button>
      </div>

      <div className="credit">
        built by{" "}
        <a href="https://vishal-portfolio-neon.vercel.app" target="_blank" rel="noopener noreferrer">Vishal</a>
      </div>

      {labOpen && (
        <CodeLab
          key={labProblem ?? "scratch"}
          initialProblemId={labProblem}
          music={{
            ...nowPlaying,
            playing: isPlaying,
            toggle: () => musicRef.current?.toggle(),
            prev: () => musicRef.current?.prev(),
            next: () => musicRef.current?.next(),
          }}
          onClose={() => setLabOpen(false)}
        />
      )}
    </main>
  );
}
