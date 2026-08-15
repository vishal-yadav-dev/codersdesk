"use client";
import { useMemo, useState } from "react";
import { INTERVIEW, NEETCODE_150, type Problem } from "./problems";
import Floating from "./Floating";
import { runJs } from "./runJs";

/**
 * Two-tier execution:
 *   1. Judge0 (via /api/run) for the compiled/other languages
 *   2. a local Web Worker for JavaScript
 *
 * JS always runs for real — tier 2 is free, instant, and can't be rate-limited.
 * When Judge0's free quota runs out, the other languages degrade to
 * display-only instead of erroring. Versions below match the language ids
 * verified in app/api/run/route.ts.
 */
const LANGS = [
  { id: "javascript", label: "JavaScript", version: "local" },
  { id: "python",     label: "Python",     version: "3.11.2" },
  { id: "typescript", label: "TypeScript", version: "5.0.3" },
  { id: "java",       label: "Java",       version: "JDK 17" },
  { id: "cpp",        label: "C++",        version: "GCC 9.2" },
  { id: "go",         label: "Go",         version: "1.18.5" },
];

export default function CodeLab({ onClose }: { onClose: () => void }) {
  const [list, setList] = useState<"interview" | "neetcode150">("interview");
  const problems = list === "interview" ? INTERVIEW : NEETCODE_150;
  const [selId, setSelId] = useState(problems[0].id);
  const sel = useMemo(
    () => problems.find((p) => p.id === selId) ?? problems[0],
    [problems, selId]
  );

  const [lang, setLang] = useState(LANGS[0]);
  const [code, setCode] = useState(sel.starter ?? "");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [showSol, setShowSol] = useState(false);
  // flips once the remote runner refuses (quota/whitelist/offline) and stays
  // flipped for the session, so we stop hammering a runner that's used up
  const [remoteDown, setRemoteDown] = useState(false);

  const isJs = lang.id === "javascript";
  const displayOnly = !isJs && remoteDown;

  const grouped = useMemo(() => {
    const g: Record<string, Problem[]> = {};
    for (const p of problems) (g[p.category] ??= []).push(p);
    return g;
  }, [problems]);

  function pick(p: Problem) {
    setSelId(p.id);
    setCode(p.starter ?? "");
    setOutput("");
    setShowSol(false);
  }

  /** Quota is gone: latch display-only and show the solution instead. */
  function degrade(reason: string) {
    setRemoteDown(true);
    setShowSol(true);
    setOutput(
      `${reason}\n\n${lang.label} is display-only from here — the reference solution is below. ` +
        `JavaScript still runs for real in this tab, so switch to it for live output.`
    );
  }

  async function run() {
    setRunning(true);
    setOutput("Running…");

    // tier 2: JavaScript executes locally, always available
    if (isJs) {
      setOutput(await runJs(code));
      setRunning(false);
      return;
    }

    // already known to be out of quota — don't call again
    if (remoteDown) {
      degrade("Remote runner is out of free quota.");
      setRunning(false);
      return;
    }

    // tier 1: Judge0, proxied so no key ever reaches the browser
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang.id, source: code }),
      });
      const data = await res.json().catch(() => null);

      if (data?.exhausted) {
        // quota is actually gone — stop trying for the rest of the session
        degrade(data.error ?? "Judge0 is out of free quota.");
      } else if (!res.ok) {
        // transient (slow/busy) — say so, but keep the language runnable
        setOutput(data?.error ?? "Judge0 didn't answer. Try Run again in a moment.");
      } else {
        const status = data.status && data.status !== "Accepted" ? `[${data.status}]\n` : "";
        setOutput(status + (data.output ?? "(no output)"));
      }
    } catch {
      degrade("Couldn't reach the remote runner.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Floating
      title="Code Lab"
      defaultX={90}
      defaultY={120}
      defaultW={960}
      defaultH={620}
      minW={520}
      minH={360}
      onClose={onClose}
      className="float-lab"
    >
      <div className="lab">
        <div className="lab-head">
          <div className="lab-listtabs">
            <button className={list === "interview" ? "on" : ""} onClick={() => { setList("interview"); setSelId(INTERVIEW[0].id); pick(INTERVIEW[0]); }}>Interview</button>
            <button className={list === "neetcode150" ? "on" : ""} onClick={() => { setList("neetcode150"); setSelId(NEETCODE_150[0].id); pick(NEETCODE_150[0]); }}>NeetCode 150</button>
          </div>
        </div>

        <div className="lab-body">
          {/* problem list */}
          <aside className="lab-list">
            {Object.entries(grouped).map(([cat, ps]) => (
              <div key={cat} className="lab-cat">
                <div className="lab-cat-name">{cat}</div>
                {ps.map((p) => (
                  <button
                    key={p.id}
                    className={`lab-prob ${p.id === sel.id ? "sel" : ""}`}
                    onClick={() => pick(p)}
                  >
                    {p.title}
                    {p.solution.length === 0 && <span className="soon">soon</span>}
                  </button>
                ))}
              </div>
            ))}
          </aside>

          {/* editor + run */}
          <section className="lab-main">
            <div className="lab-prompt">
              <strong>{sel.title}</strong> <span>{sel.prompt}</span>
            </div>

            {sel.example && (
              <div className="lab-example">
                <div className="io-row">
                  <span className="io-k">in</span>
                  <span className="io-v">{sel.example.in}</span>
                </div>
                <div className="io-row">
                  <span className="io-k io-k-out">out</span>
                  <span className="io-v io-v-out">{sel.example.out}</span>
                </div>
              </div>
            )}

            <div className="lab-toolbar">
              <select
                value={lang.id}
                onChange={(e) => setLang(LANGS.find((l) => l.id === e.target.value)!)}
              >
                {LANGS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                    {remoteDown && l.id !== "javascript" ? " · display only" : ""}
                  </option>
                ))}
              </select>

              <button className="lab-run" onClick={run} disabled={running || displayOnly}>
                {running ? "Running…" : displayOnly ? "Run unavailable" : "▶ Run"}
              </button>

              {isJs ? (
                <span className="lab-badge lab-badge-live">runs locally</span>
              ) : remoteDown ? (
                <span className="lab-badge">display only</span>
              ) : null}

              <button className="lab-sol" onClick={() => setShowSol((s) => !s)}>
                {showSol ? "Hide solution" : "Show solution"}
              </button>
            </div>

            <textarea
              className="lab-editor"
              value={code}
              spellCheck={false}
              onChange={(e) => setCode(e.target.value)}
            />

            <div className="lab-output">
              <div className="lab-output-label">output</div>
              <pre>{output || "Run your code to see output here."}</pre>
            </div>

            {showSol && (
              <div className="lab-solution">
                <div className="lab-output-label">reference solution (JavaScript)</div>
                {sel.solution.length ? (
                  <pre>{sel.solution.join("\n")}</pre>
                ) : (
                  <pre className="soon-text">Solution coming soon — try solving it yourself and hit Run!</pre>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="lab-foot">
          {remoteDown ? (
            <>JavaScript runs locally in your browser · other languages are display-only (free{" "}
            <a href="https://judge0.com" target="_blank" rel="noopener noreferrer">Judge0</a> quota used up)</>
          ) : (
            <>JavaScript runs locally in your browser · other languages run on{" "}
            <a href="https://judge0.com" target="_blank" rel="noopener noreferrer">Judge0</a> while free quota lasts</>
          )}
        </div>
      </div>
    </Floating>
  );
}
