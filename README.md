# the coder desk — कोडर की मेज़

One developer's desk, every hour of the day. A full-bleed illustrated Indian
scene that changes with the real clock, a live DSA solver you can edit and run,
a Bollywood playlist that follows the hour, and a multi-language Code Lab.

## Features

- **Time-aware backgrounds** — six periods (deep night → dawn → morning →
  afternoon → dusk → night), each its own illustrated image in `public/scenes/`.
  Follows the visitor's real clock; timeline scrubber previews any hour.
- **Live IDE** — a draggable, resizable panel that auto-solves interview
  problems in typed, syntax-highlighted JS. **Solve** prints instantly,
  **Next** changes problem, **✎ Edit** turns it into a real editor you can
  type in and **▶ Run** on the spot.
- **Code Lab** (⌨ button) — a full panel with a problem list (Interview +
  NeetCode 150 scaffold), a multi-language editor, and **Run**. Toggle the
  reference solution per problem.
- **Playlist** — Bollywood tracks grouped by time of day; the player card
  shows spinning cover art with prev/play/next and links out to YouTube,
  Spotify and Saavn.
- **Hindi accent title** कोडर की मेज़ over the English wordmark.

## How code execution works

Two tiers, so the lab keeps working when the free quota runs out:

| Tier | Languages | Where it runs |
| --- | --- | --- |
| 1 | Python, TypeScript, Java, C++, Go | [Judge0](https://judge0.com) via `/api/run` |
| 2 | JavaScript | a Web Worker in your browser |

JavaScript never leaves the browser — it's free, instant, and can't be
rate-limited, so it keeps running for real no matter what. If Judge0 returns
429/402/403, the other languages degrade to **display-only** (Run disables and
the reference solution is revealed) rather than erroring.

`/api/run` is a server route, not a browser fetch: it keeps any API key out of
the client bundle and sidesteps CORS. It defaults to the public Judge0 CE
instance, which needs **no key**. For a higher quota, set:

```bash
JUDGE0_URL=https://judge0-ce.p.rapidapi.com   # RapidAPI host
JUDGE0_KEY=your-rapidapi-key
```

Note: submissions use `base64_encoded=true`. This is required, not optional —
compiler diagnostics contain non-UTF-8 bytes and plain mode rejects the whole
request with HTTP 400.

## Run locally

```bash
npm install
npm run dev     # http://localhost:8000
```

Needs Node ≥ 20.9 (Next 16).

## Deploy

Push to GitHub → import at vercel.com/new (auto-detects Next.js). This is a
**server-rendered** app, not a static export — `/api/run` needs a Node runtime,
so `output: 'export'` static hosting won't serve it.

## Make it yours

- **Backgrounds:** replace the six files in `public/scenes/` (`deep-night`,
  `dawn`, `morning`, `afternoon`, `dusk`, `night` — all `.jpg`).
- **Problems / solutions:** `app/problems.ts`. A problem shows on the live IDE
  once its `solution` array is non-empty; NeetCode 150 entries ship as stubs
  (empty `solution` = "coming soon"). Add `starter` code to make it runnable,
  and `example` to show the IN/OUT strip.
- **Playlist:** `app/playlist.ts` — one row per song with a `scene` (which time
  frame it plays in) and an 11-char `youtube` id. Spotify and Saavn links are
  generated as searches from the title and artist, so only the YouTube id is
  needed.
- **Scene copy / palettes:** `app/scenes.ts`. Every panel colour derives from
  the scene's `palette`, so changing `glow` / `ink` / `muted` re-themes the
  whole UI for that hour.

## Notes / honest caveats

- **Judge0's public instance is a shared free service** with no published
  quota. If it rate-limits or goes down, non-JS languages fall back to
  display-only; JavaScript is unaffected. Set `JUDGE0_URL` / `JUDGE0_KEY` for a
  dedicated quota.
- **Java must use a class named `Main`** — Judge0 compiles submissions to
  `Main.java`.
- **Live-stream YouTube ids often have no thumbnail** (every size 404s), so the
  player falls back to a ♪ tile rather than a broken image.
- **NeetCode 150** ships as ~20 category-organised stubs; solutions get filled
  into `problems.ts` over time.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Judge0 · Web Workers.
