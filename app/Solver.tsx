"use client";
import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { SOLVED_FOR_MONITOR as PROBLEMS } from "./problems";
import { runJs } from "./runJs";

export interface SolverHandle {
  solveNow: () => void;
  next: () => void;
}

/**
 * The live IDE. Idles by typing out each solution and cycling to the next one;
 * hitting Edit suspends all of that and hands the code area over as a real
 * editor, which runs locally via runJs(). Exposes solveNow()/next() so the
 * page's control bar can drive it too.
 */
const Solver = forwardRef<SolverHandle, { onProblemChange?: (title: string) => void }>(
  function Solver({ onProblemChange }, ref) {
    const [idx, setIdx] = useState(0);
    const [linesShown, setLinesShown] = useState(0);
    const [phase, setPhase] = useState<"typing" | "done">("typing");

    // hand-editing mode: the ambient animation steps aside so you can type
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    const [output, setOutput] = useState("");
    const [running, setRunning] = useState(false);

    const problem = PROBLEMS[idx];

    const solveNow = () => {
      setLinesShown(problem.solution.length);
      setPhase("done");
    };
    const next = () => {
      setEditing(false);
      setOutput("");
      setIdx((i) => (i + 1) % PROBLEMS.length);
      setLinesShown(0);
      setPhase("typing");
    };

    const startEdit = () => {
      setDraft(problem.solution.join("\n"));
      setLinesShown(problem.solution.length);
      setPhase("done");
      setOutput("");
      setEditing(true);
    };
    const stopEdit = () => {
      setEditing(false);
      setOutput("");
    };

    async function run() {
      setRunning(true);
      setOutput("Running…");
      setOutput(await runJs(draft)); // runs locally — no server round trip
      setRunning(false);
    }

    // random start (avoid SSR mismatch)
    useEffect(() => {
      const s = Math.floor(Math.random() * PROBLEMS.length);
      setIdx(s);
    }, []);

    useEffect(() => {
      onProblemChange?.(problem.title);
    }, [problem.title, onProblemChange]);

    useImperativeHandle(ref, () => ({ solveNow, next }));

    // type lines out — suspended while you're editing
    useEffect(() => {
      if (editing || phase !== "typing") return;
      if (linesShown >= problem.solution.length) {
        setPhase("done");
        return;
      }
      const t = setTimeout(() => setLinesShown((n) => n + 1), 480);
      return () => clearTimeout(t);
    }, [editing, phase, linesShown, problem.solution.length]);

    // auto-advance after solved — never yanks the problem out from under an edit
    useEffect(() => {
      if (editing || phase !== "done") return;
      const t = setTimeout(() => {
        setIdx((i) => (i + 1) % PROBLEMS.length);
        setLinesShown(0);
        setPhase("typing");
      }, 18_000);
      return () => clearTimeout(t);
    }, [editing, phase, idx]);

    return (
      <div className="solver">
        <div className="solver-top">
          <span className="dot dot-r" />
          <span className="dot dot-y" />
          <span className="dot dot-g" />
          <span className="solver-file">{problem.id}.js</span>
          <span className="solver-tag">{problem.tag}</span>
        </div>

        <div className="solver-body">
          <div className="solver-title">
            <span className="c-kw">problem</span> · {problem.title}
          </div>
          <div className="solver-prompt">{problem.prompt}</div>

          {editing ? (
            <textarea
              className="solver-editor"
              value={draft}
              spellCheck={false}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
            />
          ) : (
            <pre
              className="solver-code solver-code-tap"
              onClick={startEdit}
              title="click to edit this code"
            >
              {problem.solution.slice(0, linesShown).map((ln, i) => (
                <div key={i} className="code-line">
                  <span className="ln-no">{String(i + 1).padStart(2, "0")}</span>
                  <span dangerouslySetInnerHTML={{ __html: highlight(ln) }} />
                </div>
              ))}
              {phase === "typing" && (
                <div className="code-line">
                  <span className="ln-no">{String(linesShown + 1).padStart(2, "0")}</span>
                  <span className="type-caret">▋</span>
                </div>
              )}
            </pre>
          )}
        </div>

        {/* run output while editing, sample I/O otherwise */}
        {editing ? (
          output && (
            <div className="solver-io">
              <div className="io-row">
                <span className="io-k io-k-out">out</span>
                <span className="io-v io-v-out">{output}</span>
              </div>
            </div>
          )
        ) : (
          problem.example && (
            <div className="solver-io">
              <div className="io-row">
                <span className="io-k">in</span>
                <span className="io-v">{problem.example.in}</span>
              </div>
              <div className="io-row">
                <span className="io-k io-k-out">out</span>
                <span className="io-v io-v-out">
                  {phase === "done" ? problem.example.out : "…"}
                </span>
              </div>
            </div>
          )
        )}

        {/* on-monitor controls */}
        <div className="solver-controls">
          {editing ? (
            <>
              <button className="mon-btn mon-solve" onClick={run} disabled={running}>
                {running ? "running…" : "▶ Run"}
              </button>
              <button className="mon-btn" onClick={stopEdit}>✕ Done</button>
            </>
          ) : (
            <>
              {phase === "typing" ? (
                <button className="mon-btn mon-solve" onClick={solveNow}>▷ Solve</button>
              ) : (
                <span className="mon-status">✓ solved</span>
              )}
              <button className="mon-btn" onClick={startEdit}>✎ Edit</button>
              <button className="mon-btn" onClick={next}>Next →</button>
            </>
          )}
        </div>
      </div>
    );
  }
);

export default Solver;

function highlight(line: string): string {
  const esc = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (esc.trimStart().startsWith("//")) return `<span class="c-com">${esc}</span>`;
  const strings: string[] = [];
  let out = esc.replace(/'[^']*'/g, (m) => {
    strings.push(m);
    return `\u0000${strings.length - 1}\u0000`;
  });
  out = out
    .replace(/\b(function|const|let|return|for|if|else|class|constructor|new|of|this|while|continue)\b/g,
      '<span class="c-kw">$1</span>')
    .replace(/\b(Map|Math|Set|Promise|Array|Date|setTimeout|clearTimeout)\b/g,
      '<span class="c-fn">$1</span>');
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => `<span class="c-str">${strings[Number(i)]}</span>`);
  return out;
}
