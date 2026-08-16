"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { INTERVIEW, type Problem } from "./problems";
import { testsFor } from "./problemTests";
import { detailFor } from "./problemDetails";
import { codeFor, scratchFor } from "./solutions";
import Floating from "./Floating";
import { runJs, runJsTests, type TestResult } from "./runJs";
import NowPlaying, { type MusicBridge } from "./NowPlaying";

// CodeMirror touches the DOM on construction, so keep it out of the server render
const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => <div className="lab-editor-loading">Loading editor…</div>,
});

const LANGS = [
  { id: "javascript", label: "JavaScript", version: "local" },
  { id: "python",     label: "Python",     version: "3.11.2" },
  { id: "typescript", label: "TypeScript", version: "5.0.3" },
  { id: "java",       label: "Java",       version: "JDK 17" },
  { id: "cpp",        label: "C++",        version: "GCC 9.2" },
  { id: "go",         label: "Go",         version: "1.18.5" },
  { id: "php",        label: "PHP",        version: "8.3.11" },
];

export default function CodeLab({
  onClose,
  initialProblemId = null,
  music,
}: {
  onClose: () => void;
  /** open straight onto a problem — the monitor's Edit button uses this */
  initialProblemId?: string | null;
  /** lets the lab show and drive the music while it covers the card */
  music?: MusicBridge | null;
}) {
  // NeetCode 150 is parked for now — only the practice list is offered
  const problems = INTERVIEW;
  const [selId, setSelId] = useState<string | null>(initialProblemId);
  const sel = useMemo(
    () => (selId ? problems.find((p) => p.id === selId) ?? null : null),
    [problems, selId]
  );

  const [lang, setLang] = useState(LANGS[0]);
  const [code, setCode] = useState(() => {
    const p = initialProblemId ? INTERVIEW.find((x) => x.id === initialProblemId) : null;
    return p ? codeFor(p.id, LANGS[0].id)?.starter ?? p.starter ?? "" : scratchFor(LANGS[0].id);
  });
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [showSol, setShowSol] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [testing, setTesting] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [remoteDown, setRemoteDown] = useState(false);

  const isJs = lang.id === "javascript";
  const displayOnly = !isJs && remoteDown;
  const detail = sel ? detailFor(sel.id) : null;
  const cases = sel ? testsFor(sel.id) : [];

  const native = sel ? codeFor(sel.id, lang.id) : null;
  const solutionLines = native ? native.solution : sel?.solution ?? [];
  const starterFor = (p: Problem, langId: string) =>
    codeFor(p.id, langId)?.starter ?? p.starter ?? "";
  const canTest = isJs && cases.length > 0;
  const passed = results?.filter((r) => r.pass).length ?? 0;

  const grouped = useMemo(() => {
    const g: Record<string, Problem[]> = {};
    for (const p of problems) (g[p.category] ??= []).push(p);
    return g;
  }, [problems]);

  function pick(p: Problem) {
    setSelId(p.id);
    setCode(starterFor(p, lang.id));
    setOutput("");
    setShowSol(false);
    setResults(null);
    setListOpen(false);
  }

  /** Back to a blank editor with no problem attached. */
  function openScratch() {
    setSelId(null);
    setCode(scratchFor(lang.id));
    setOutput("");
    setShowSol(false);
    setResults(null);
    setListOpen(false);
  }

  /** Switching language swaps in that language's starter for what is open. */
  function pickLang(langId: string) {
    const next = LANGS.find((l) => l.id === langId)!;
    setLang(next);
    setCode(sel ? starterFor(sel, langId) : scratchFor(langId));
    setOutput("");
    setResults(null);
  }

  /** Run the problem's pre-written cases against the editor's code. */
  async function test() {
    setTesting(true);
    setResults(null);
    setResults(await runJsTests(code, cases));
    setTesting(false);
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
      setOutput(await runJs(code, 4000));
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
        body: JSON.stringify({ language: lang.id, source: code, input: "" }),
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
      brand={(
        <>
          <img src="/logo.png" alt="" />
          <span>coders desk</span>
        </>
      )}
      defaultX={90}
      defaultY={120}
      defaultW={1180}
      defaultH={680}
      minW={520}
      minH={360}
      onClose={onClose}
      className="float-lab"
    >
      <div className="lab">
        <div className="lab-head">
          {/* two modes, and the active one says where you are */}
          <div className="lab-modes">
            <button
              className={sel ? "on" : ""}
              onClick={() => setListOpen((o) => !o)}
              aria-expanded={listOpen}
              title={listOpen ? "Hide the problem list" : "Show the problem list"}
            >
              ☰ Practice problems
            </button>
            <button
              className={!sel ? "on" : ""}
              onClick={openScratch}
              title="A blank editor, no problem attached"
            >
              Scratchpad
            </button>
          </div>

          {music && <NowPlaying music={music} />}

        </div>

        <div className={`lab-body ${listOpen ? "" : "list-closed"}`}>
          {/* problem list */}
          <aside className="lab-list">
            <div className="lab-cat-name">Practice problems</div>
            {Object.entries(grouped).map(([cat, ps]) => (
              <div key={cat} className="lab-cat">
                <div className="lab-cat-name">{cat}</div>
                {ps.map((p) => (
                  <button
                    key={p.id}
                    className={`lab-prob ${p.id === sel?.id ? "sel" : ""}`}
                    onClick={() => pick(p)}
                  >
                    {p.title}
                    {p.solution.length === 0 && <span className="soon">soon</span>}
                  </button>
                ))}
              </div>
            ))}
          </aside>

          {/* statement on the left, workspace on the right — LeetCode layout.
              With no problem open the workspace takes the whole width. */}
          {sel && (
          <section className="lab-desc">
            <div className="lab-desc-head">
              <strong>{sel.title}</strong>
              <span className="lab-desc-tag">{sel.tag}</span>
            </div>

            <div className="lab-desc-prompt">{sel.prompt}</div>

            {detail ? (
              <>
                <p className="lab-desc-text">{detail.description}</p>

                {detail.examples.map((ex, i) => (
                  <div key={i} className="lab-ex">
                    <div className="lab-ex-title">Example {i + 1}</div>
                    <div className="lab-ex-row">
                      <span className="lab-ex-k">Input</span>
                      <pre className="lab-ex-v">{ex.in}</pre>
                    </div>
                    <div className="lab-ex-row">
                      <span className="lab-ex-k lab-ex-k-out">Output</span>
                      <pre className="lab-ex-v lab-ex-v-out">{ex.out}</pre>
                    </div>
                    {ex.note && (
                      <div className="lab-ex-row">
                        <span className="lab-ex-k">Note</span>
                        <span className="lab-ex-note">{ex.note}</span>
                      </div>
                    )}
                  </div>
                ))}

                {detail.constraints && detail.constraints.length > 0 && (
                  <div className="lab-constraints">
                    <div className="lab-ex-title">Constraints</div>
                    <ul>
                      {detail.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              sel.description && <p className="lab-desc-text">{sel.description}</p>
            )}

            <button className="lab-sol" onClick={() => setShowSol((s) => !s)}>
              {showSol ? "Hide solution" : "Show solution"}
            </button>

            {showSol && (
              <div className="lab-solution">
                {/* say which language this code actually IS, not which one is
                    selected — they differ whenever we fall back to JavaScript */}
                <div className="lab-output-label">
                  reference solution ({native ? lang.label : "JavaScript"})
                  {!native && !isJs && (
                    <span className="lab-fallback-note">no {lang.label} version yet</span>
                  )}
                </div>
                {solutionLines.length ? (
                  <pre>{solutionLines.join("\n")}</pre>
                ) : (
                  <pre className="soon-text">Solution coming soon — try solving it yourself and hit Run!</pre>
                )}
              </div>
            )}
          </section>
          )}

          <section className={`lab-work ${sel ? "" : "solo"}`}>

            <div className="lab-inline-help">
              {!sel ? (
                // scratchpad: there is no problem, so no test cases to mention
                <>
                  Scratchpad — write anything and hit Run.{" "}
                  {isJs
                    ? "JavaScript runs locally in your browser."
                    : `${lang.label} runs on Judge0.`}{" "}
                  Pick a practice problem for a statement, examples and tests.
                </>
              ) : isJs ? (
                <>
                  Runs locally in your browser — instant
                  {cases.length > 0 && <>, and the {cases.length} test cases run against it</>}.
                </>
              ) : native ? (
                <>
                  {lang.label} runs on Judge0. The test cases are written against the JavaScript API, so
                  switch to JavaScript to run them.
                </>
              ) : (
                <>
                  No {lang.label} starter yet — the editor and solution below are the JavaScript
                  reference. JavaScript and Python are the languages with full starters today.
                </>
              )}
            </div>

            <div className="lab-toolbar">
              <select value={lang.id} onChange={(e) => pickLang(e.target.value)}>
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

              {cases.length > 0 && (
                <button
                  className="lab-test"
                  onClick={test}
                  disabled={testing || !canTest}
                  title={
                    canTest
                      ? `Run ${cases.length} test cases against your code`
                      : "Test cases are written in JavaScript — switch the language to run them"
                  }
                >
                  {testing ? "Testing…" : `✓ Run ${cases.length} tests`}
                </button>
              )}

              {isJs ? (
                <span className="lab-badge lab-badge-live">runs locally</span>
              ) : remoteDown ? (
                <span className="lab-badge">display only</span>
              ) : null}
            </div>

            <Editor value={code} onChange={setCode} language={lang.id} />

            <div className="lab-output">
              <div className="lab-output-label">output</div>
              <pre>{output || "Run your code to see output here."}</pre>
            </div>

            {results && (
              <div className="lab-tests">
                <div className="lab-output-label">
                  test cases
                  <span className={`lab-tests-score ${passed === results.length ? "all" : "some"}`}>
                    {passed} / {results.length} passed
                  </span>
                </div>
                <ul className="lab-test-list">
                  {results.map((r, i) => (
                    <li key={i} className={r.pass ? "ok" : "bad"}>
                      <span className="lab-test-mark">{r.pass ? "✓" : "✗"}</span>
                      <span className="lab-test-name">{r.name}</span>
                      {!r.pass && (
                        <span className="lab-test-detail">
                          {r.error ? (
                            <code className="lab-test-err">{r.error}</code>
                          ) : (
                            <>
                              expected <code>{r.expected}</code> · got <code>{r.actual}</code>
                            </>
                          )}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </section>
        </div>

        {/* only mention Judge0 and its quota when a Judge0 language is actually
            selected — on JavaScript none of it applies */}
        <div className="lab-foot">
          {isJs ? (
            <>JavaScript runs locally in your browser · instant, unlimited, and it can never be rate-limited · edit the call at the bottom of the editor to try your own input</>
          ) : remoteDown ? (
            <>{lang.label} is display-only — the free{" "}
            <a href="https://judge0.com" target="_blank" rel="noopener noreferrer">Judge0</a> quota is used up · switch to JavaScript to keep running code for real</>
          ) : (
            <>{lang.label} runs on{" "}
            <a href="https://judge0.com" target="_blank" rel="noopener noreferrer">Judge0</a> while free quota lasts · edit the call at the bottom of the editor to try your own input</>
          )}
        </div>
      </div>
    </Floating>
  );
}
