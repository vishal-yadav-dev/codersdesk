"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SCENES, sceneForHour, type Scene } from "./scenes";
import { tracksForScene } from "./playlist";
import DeskScene from "./DeskScene";
import Solver, { type SolverHandle } from "./Solver";
import Floating from "./Floating";
import Tablet from "./Tablet";
import CodeLab from "./CodeLab";

const IDE_W = 430;

/**
 * Park the live IDE in the empty band between the title and the scene copy.
 * That band shrinks on short viewports, so when it can't fit we move the
 * panel to the right of the copy column instead of covering the text.
 */
function ideDefaultRect() {
  const hero = document.querySelector(".hero")?.getBoundingClientRect();
  const copy = document.querySelector(".bottom")?.getBoundingClientRect();
  const top = (hero ? hero.bottom : 280) + 18;
  const avail = (copy ? copy.top : window.innerHeight) - top - 18;

  if (avail >= 210) {
    return { x: 56, y: top, w: IDE_W, h: Math.min(300, avail) };
  }
  // not enough vertical room — sit clear of the copy column on the right
  const x = Math.max((copy?.right ?? 720) + 24, window.innerWidth - IDE_W - 40);
  return {
    x: Math.min(x, window.innerWidth - IDE_W - 24),
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
  const [trackIdx, setTrackIdx] = useState(0);
  const [userPickedTrack, setUserPickedTrack] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  const solverRef = useRef<SolverHandle | null>(null);

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

  // moving to a new time frame restarts that frame's list (unless the
  // listener has taken over with prev/next)
  useEffect(() => {
    if (userPickedTrack) return;
    setTrackIdx(0);
  }, [scene.id, userPickedTrack]);

  const track = sceneTracks[trackIdx % sceneTracks.length];

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

  const prevTrack = () => { setUserPickedTrack(true); setTrackIdx((i) => (i - 1 + sceneTracks.length) % sceneTracks.length); };
  const nextTrack = () => { setUserPickedTrack(true); setTrackIdx((i) => (i + 1) % sceneTracks.length); };

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
          <h1 className="hero-title">the coder desk</h1>
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
              <button className="dsa-btn" onClick={() => solverRef.current?.solveNow()}>▷ Solve</button>
              <button className="dsa-btn" onClick={() => solverRef.current?.next()}>Next →</button>
              <button className="dsa-btn dsa-lab" onClick={() => setLabOpen(true)}>⌨ Code Lab</button>
            </div>
          </div>
        </div>
      </div>

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
        className="float-ide"
      >
        <Solver ref={solverRef} onProblemChange={setSolving} />
      </Floating>

      <Tablet track={track} onPrev={prevTrack} onNext={nextTrack} />

      <div className="timeline">
        {SCENES.map((s) => {
          const active = s.id === scene.id;
          return (
            <button
              key={s.id}
              className={`tl-node ${active ? "tl-active" : ""}`}
              onClick={() => setOverride(s.id === liveScene.id && isLive ? null : s)}
              title={s.label}
            >
              <span className="tl-dot" />
              <span className="tl-label">{s.range.split(" ")[0]}</span>
            </button>
          );
        })}
        <button
          className={`tl-now ${isLive ? "tl-now-on" : ""}`}
          onClick={() => setOverride(null)}
          title={isLive ? "following your clock" : "back to the live hour"}
        >
          now
        </button>
      </div>

      <div className="credit">
        built by{" "}
        <a href="https://vishal-portfolio-neon.vercel.app" target="_blank" rel="noopener noreferrer">Vishal</a>
      </div>

      {labOpen && <CodeLab onClose={() => setLabOpen(false)} />}
    </main>
  );
}
