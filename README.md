# the coder desk — कोडर की मेज़

A time-aware coding desk with a live IDE, a scene-based playlist, and an interactive Code Lab.

## Highlights

- Real-time desk scenes that shift with the current hour
- Draggable live IDE for coding and problem solving
- Code Lab with runnable snippets and a problem list
- Playlist-driven music player with YouTube and Spotify links
- Hindi/English title treatment for the desk branding

## Run locally

```bash
npm install
npm run dev
```

Then open: `http://localhost:8000`

Requires Node 20.9+.

## Environment variables

```bash
NEXT_PUBLIC_PLAYLIST_ID=your_playlist_id
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_KEY=your_rapidapi_key
PORT=8000
```

## Deployment

This project is built on Next.js and is suitable for deployment on Vercel. The API route uses a Node runtime, so it is not intended for a static export.

## Project structure

- `app/` — main UI, scenes, music player, solver, and API
- `public/scenes/` — artwork for each time-based scene
- `app/problems.ts` — problem definitions and solution data
- `app/playlist.ts` — scene-to-playlist mapping

## Stack

Next.js 16 · TypeScript · Tailwind v4 · Judge0

Built by Vishal
