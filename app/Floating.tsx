"use client";
import { useEffect, useRef, useState } from "react";

type Mode =
  | null
  | { kind: "drag"; dx: number; dy: number }
  | { kind: "resize"; sx: number; sy: number; sw: number; sh: number };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * A draggable + resizable glass panel. Drag by the header, resize from the
 * bottom-right corner, ⤢ toggles an expanded size and ⟲ resets to defaults.
 */
export interface Rect { x: number; y: number; w: number; h: number }

export default function Floating({
  title,
  tag,
  defaultX,
  defaultY,
  defaultW,
  defaultH,
  getDefault,
  minW = 260,
  minH = 160,
  onClose,
  className = "",
  children,
}: {
  title: string;
  tag?: React.ReactNode;
  defaultX: number;
  defaultY: number;
  defaultW: number;
  defaultH: number;
  /** Measured on mount (client-only) to place the panel in real free space. */
  getDefault?: () => Rect;
  minW?: number;
  minH?: number;
  onClose?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ w: defaultW, h: defaultH });
  const [expanded, setExpanded] = useState(false);
  const modeRef = useRef<Mode>(null);
  const touchedRef = useRef(false); // user has moved/resized it — stop auto-placing
  const defaultsRef = useRef<Rect>({ x: defaultX, y: defaultY, w: defaultW, h: defaultH });

  // adopt the measured default, then keep the panel on screen
  useEffect(() => {
    const applyDefault = () => {
      if (!getDefault || touchedRef.current) return;
      const r = getDefault();
      defaultsRef.current = r;
      setPos({ x: r.x, y: r.y });
      setSize({ w: r.w, h: r.h });
    };
    applyDefault();
    // the scene copy only reaches its real height once the clock resolves the
    // live scene, so re-measure after that settles (unless already dragged)
    const t = setTimeout(applyDefault, 350);
    const fit = () => {
      setSize((s) => ({
        w: clamp(s.w, minW, window.innerWidth - 24),
        h: clamp(s.h, minH, window.innerHeight - 24),
      }));
      setPos((p) => ({
        x: clamp(p.x, 0, Math.max(0, window.innerWidth - 120)),
        y: clamp(p.y, 0, Math.max(0, window.innerHeight - 60)),
      }));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", fit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minW, minH]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const m = modeRef.current;
      if (!m) return;
      e.preventDefault();
      if (m.kind === "drag") {
        setPos({
          x: clamp(e.clientX - m.dx, 0, window.innerWidth - 120),
          y: clamp(e.clientY - m.dy, 0, window.innerHeight - 60),
        });
      } else {
        setSize({
          w: clamp(m.sw + (e.clientX - m.sx), minW, window.innerWidth - 24),
          h: clamp(m.sh + (e.clientY - m.sy), minH, window.innerHeight - 24),
        });
      }
    };
    const onUp = () => { modeRef.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [minW, minH]);

  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return; // let header buttons click
    touchedRef.current = true;
    modeRef.current = { kind: "drag", dx: e.clientX - pos.x, dy: e.clientY - pos.y };
  };

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    touchedRef.current = true;
    modeRef.current = { kind: "resize", sx: e.clientX, sy: e.clientY, sw: size.w, sh: size.h };
  };

  const reset = () => {
    const d = defaultsRef.current;
    setExpanded(false);
    setPos({ x: d.x, y: d.y });
    setSize({ w: d.w, h: d.h });
  };

  const toggleExpand = () => {
    touchedRef.current = true;
    if (expanded) {
      reset();
      return;
    }
    setExpanded(true);
    setPos({ x: 24, y: 24 });
    setSize({ w: window.innerWidth - 48, h: window.innerHeight - 48 });
  };

  return (
    <div
      className={`float ${className}`}
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      <div className="float-head" onPointerDown={startDrag}>
        <span className="float-title">{title}</span>
        {tag && <span className="float-tag">{tag}</span>}
        <div className="float-actions">
          <button className="float-btn float-expand" onClick={toggleExpand} title={expanded ? "Restore" : "Expand"} aria-label={expanded ? "Restore" : "Expand"}>
            {expanded ? "⤡" : "⤢"}
          </button>
          <button className="float-btn float-reset" onClick={reset} title="Reset size &amp; position" aria-label="Reset size and position">⟲</button>
          {onClose && (
            <button className="float-btn float-x" onClick={onClose} title="Close" aria-label="Close">✕</button>
          )}
        </div>
      </div>

      <div className="float-body">{children}</div>

      <div className="float-resize" onPointerDown={startResize} title="Drag to resize" />
    </div>
  );
}
