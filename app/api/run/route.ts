import { NextResponse } from "next/server";

const PUBLIC_CE = "https://ce.judge0.com";

export const maxDuration = 30;

const LANGUAGE_IDS: Record<string, number> = {
  python: 92,     // 3.11.2
  typescript: 94, // 5.0.3
  java: 91,       // JDK 17.0.6
  cpp: 54,        // GCC 9.2.0
  go: 95,         // 1.18.5
  php: 98,        // 8.3.11
  javascript: 93, // Node 18.15.0 (fallback only)
};

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const unb64 = (s: string | null | undefined) =>
  s ? Buffer.from(s, "base64").toString("utf8") : "";

export async function POST(req: Request) {
  let body: { language?: string; source?: string; input?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const languageId = LANGUAGE_IDS[body.language ?? ""];
  if (!languageId) {
    return NextResponse.json(
      { error: `Unsupported language: ${body.language}` },
      { status: 400 }
    );
  }

  const host = process.env.JUDGE0_URL ?? PUBLIC_CE;
  const key = process.env.JUDGE0_KEY;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) {
    // RapidAPI-hosted Judge0
    headers["X-RapidAPI-Key"] = key;
    headers["X-RapidAPI-Host"] = new URL(host).hostname;
  }

  const url = `${host}/submissions?base64_encoded=true&wait=true`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source_code: b64(body.source ?? ""),
        language_id: languageId,
        stdin: b64(body.input ?? ""),
      }),
      signal: ctrl.signal,
    });

    // quota/rate-limit signalling -> caller degrades to display-only
    if (res.status === 429) {
      return NextResponse.json(
        {
          exhausted: true,
          error:
            "Judge0 is rate-limiting us right now (429) — the free instance is shared with everyone. Give it a minute, or set JUDGE0_URL / JUDGE0_KEY for your own quota.",
        },
        { status: 429 }
      );
    }
    if (res.status === 402 || res.status === 403) {
      return NextResponse.json(
        {
          exhausted: true,
          error:
            "Judge0 turned this request away (quota used up or key rejected). Add JUDGE0_URL / JUDGE0_KEY, or come back tomorrow when the free tier resets.",
        },
        { status: 429 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        {
          exhausted: true,
          error: `Judge0 replied HTTP ${res.status}, which usually means it's having a moment rather than anything wrong with your code. Try again shortly.`,
        },
        { status: 502 }
      );
    }

    const d = await res.json();
    const compile = unb64(d.compile_output);
    const stderr = unb64(d.stderr);
    const stdout = unb64(d.stdout);

    // errors don't come back on stdout — surface whichever field has the detail
    const output =
      compile || stderr || stdout || d.message || "(no output)";

    return NextResponse.json({
      output,
      status: d.status?.description ?? "unknown",
      time: d.time ?? null,
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        exhausted: !aborted,
        error: aborted
          ? "Judge0 took longer than 20s to answer. It's usually just busy — hit Run again."
          : "Couldn't reach Judge0 at all. Check your connection (or JUDGE0_URL if you've pointed it somewhere custom).",
      },
      { status: 504 }
    );
  } finally {
    clearTimeout(timer);
  }
}
