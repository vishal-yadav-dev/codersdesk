"use client";
import { Scene } from "./scenes";

/** Full-bleed photographic desk background for the current scene. */
export default function DeskScene({ scene }: { scene: Scene }) {
  const img = scene.image ?? "/scenes/night.jpg";
  return <div className="desk-photo" style={{ backgroundImage: `url(${img})` }} />;
}
