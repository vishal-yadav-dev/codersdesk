#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const SRC = new URL("../app/playlist.ts", import.meta.url);
const OEMBED = "https://www.youtube.com/oembed";
const CONCURRENCY = 6;

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

/** Reads a var out of .env.local / .env, so this matches what `next dev` sees. */
async function fromEnvFile(name) {
  for (const file of [".env.local", ".env"]) {
    try {
      const txt = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
      const m = txt.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)$`, "m"));
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    } catch {
      /* file absent, try the next one */
    }
  }
  return "";
}

/** Pull the ids straight out of the source so there is one source of truth. */
async function readConfig() {
  const src = await readFile(SRC, "utf8");

  let single = src.match(/export const PLAYLIST_ID\s*=\s*"([^"]*)"/)?.[1] ?? "";
  if (!single) {
    // PLAYLIST_ID can be wired to an env var rather than a literal
    const envName = src.match(/export const PLAYLIST_ID\s*=\s*process\.env\.(\w+)/)?.[1];
    if (envName) single = (process.env[envName] ?? "").trim() || (await fromEnvFile(envName));
  }

  const listsBlock = src.match(/export const SCENE_LISTS[^{]*{([\s\S]*?)}/)?.[1] ?? "";
  const sceneLists = [...listsBlock.matchAll(/["']?([\w-]+)["']?\s*:\s*"([^"]*)"/g)]
    .map(([, scene, id]) => ({ scene, id: id.trim() }))
    .filter((r) => r.id);

  const tracks = [...src.matchAll(/\{\s*id:\s*"([^"]+)"[^}]*?title:\s*"([^"]+)"[^}]*?youtube:\s*"([^"]+)"/g)]
    .map(([, id, title, youtube]) => ({ id, title, youtube }));

  return { single, sceneLists, tracks };
}

async function head(url) {
  try {
    const r = await fetch(url, { redirect: "follow" });
    return r.status;
  } catch {
    return 0;
  }
}

const videoOembed = (id) =>
  `${OEMBED}?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
const listOembed = (id) =>
  `${OEMBED}?url=${encodeURIComponent(`https://www.youtube.com/playlist?list=${id}`)}&format=json`;

/** Runs `fn` over `items` with a small concurrency cap. */
async function pool(items, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

function explain(status) {
  if (status === 200) return null;
  if (status === 401 || status === 403) return "embedding disabled by uploader";
  if (status === 404) return "video not found / private / removed";
  if (status === 0) return "network error";
  return `unexpected status ${status}`;
}

/** Enumerate a playlist's videos. Needs the Data API; returns null without a key. */
async function playlistItems(listId, key) {
  if (!key) return null;
  const items = [];
  let pageToken = "";
  do {
    const u = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    u.searchParams.set("part", "snippet,status");
    u.searchParams.set("playlistId", listId);
    u.searchParams.set("maxResults", "50");
    u.searchParams.set("key", key);
    if (pageToken) u.searchParams.set("pageToken", pageToken);
    const r = await fetch(u);
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      throw new Error(`Data API ${r.status}: ${body.slice(0, 200)}`);
    }
    const json = await r.json();
    for (const it of json.items ?? []) {
      items.push({
        videoId: it.snippet?.resourceId?.videoId,
        title: it.snippet?.title ?? "(untitled)",
      });
    }
    pageToken = json.nextPageToken ?? "";
  } while (pageToken);
  return items;
}

async function main() {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  const { single, sceneLists, tracks } = await readConfig();
  let failures = 0;

  const configured = [
    ...(single ? [{ scene: "(all scenes)", id: single }] : []),
    ...sceneLists,
  ];

  console.log("\nYouTube playlists");
  if (!configured.length) {
    console.log(dim("  none configured — the static PLAYLIST rows are in use"));
  }
  for (const { scene, id } of configured) {
    const status = await head(listOembed(id));
    if (status === 200) {
      console.log(`  ${green("ok")}   ${scene} -> ${id}`);
    } else {
      failures++;
      console.log(`  ${red("FAIL")} ${scene} -> ${id}  ${red("playlist is private, empty or missing")}`);
      continue;
    }

    let contents;
    try {
      contents = await playlistItems(id, key);
    } catch (e) {
      console.log(`       ${yellow("!")} could not read contents: ${e.message}`);
      continue;
    }
    if (!contents) {
      console.log(dim("       set YOUTUBE_API_KEY to also embed-check every video inside"));
      continue;
    }
    console.log(dim(`       ${contents.length} videos`));
    const results = await pool(contents, async (v) => ({
      ...v,
      status: v.videoId ? await head(videoOembed(v.videoId)) : 404,
    }));
    for (const v of results) {
      const why = explain(v.status);
      if (why) {
        failures++;
        console.log(`       ${red("FAIL")} ${v.videoId ?? "?"}  ${v.title}  ${red(`(${why})`)}`);
      }
    }
    const bad = results.filter((v) => explain(v.status)).length;
    if (!bad) console.log(`       ${green("all embeddable")}`);
  }

  console.log(`\nStatic PLAYLIST fallback (${tracks.length} tracks)`);
  const results = await pool(tracks, async (t) => ({
    ...t,
    status: await head(videoOembed(t.youtube)),
  }));
  let bad = 0;
  for (const t of results) {
    const why = explain(t.status);
    if (why) {
      bad++;
      failures++;
      console.log(`  ${red("FAIL")} ${t.youtube}  ${t.title}  ${red(`(${why})`)}`);
    }
  }
  if (!bad) console.log(`  ${green("all embeddable")}`);

  if (failures) {
    console.log(`\n${red(`${failures} problem(s) found.`)}\n`);
    process.exit(1);
  }
  console.log(`\n${green("Everything checks out.")}\n`);
}

main().catch((e) => {
  console.error(red(`\nverify-playlist crashed: ${e.stack ?? e}\n`));
  process.exit(1);
});
