export function sanitizeCodeForExecution(code: string): string {
  return code
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^(?:in|out)\s*[:=]/i.test(trimmed)) return false;
      if (/^(?:nums|target|input|output)\s*=/i.test(trimmed)) return false;
      if (/^out\s*\[/i.test(trimmed)) return false;
      return true;
    })
    .join("\n");
}

export function runJs(code: string, timeoutMs = 4000, input = ""): Promise<string> {
  return new Promise((resolve) => {
    const cleanCode = sanitizeCodeForExecution(code).trim();
    if (!cleanCode) {
      resolve("This looks like a problem statement/example, not JavaScript. Paste the function or starter code only.");
      return;
    }

    const workerSrc = `
      self.onmessage = (e) => {
        const { code, stdin } = e.data;
        const lines = (stdin ?? '').split(/\\r?\\n/);
        const readLine = () => {
          const next = lines.shift();
          return next === undefined ? '' : next;
        };
        const logs = [];
        const fmt = (v) => {
          if (typeof v === 'string') return v;
          try { return JSON.stringify(v); } catch { return String(v); }
        };
        const push = (...a) => logs.push(a.map(fmt).join(' '));
        const shim = { log: push, info: push, warn: push, error: push, debug: push };
        try {
          const ret = new Function('console', 'readLine', 'stdin', 'input', code)(
            shim,
            readLine,
            lines,
            stdin ?? ''
          );
          if (ret !== undefined) logs.push(fmt(ret));
        } catch (err) {
          const message = String(err);
          logs.push(
            message.includes('SyntaxError')
              ? 'SyntaxError: check that you pasted only valid JavaScript code, not the problem statement/example text.'
              : message
          );
        }
        self.postMessage(logs.join('\\n'));
      };
    `;

    let url: string;
    let worker: Worker;
    try {
      url = URL.createObjectURL(new Blob([workerSrc], { type: "text/javascript" }));
      worker = new Worker(url);
    } catch {
      resolve("This browser blocked the sandbox runner.");
      return;
    }

    const finish = (msg: string) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(msg);
    };

    const timer = setTimeout(
      () => finish(`Stopped after ${timeoutMs / 1000}s — infinite loop?`),
      timeoutMs
    );

    worker.onmessage = (e: MessageEvent<string>) =>
      finish(e.data || "(ran clean — add a console.log to see a value)");
    worker.onerror = (e) => finish(`Error: ${e.message}`);

    worker.postMessage({ code: cleanCode, stdin: input });
  });
}

export interface TestResult {
  name: string;
  pass: boolean;
  expected: string;
  actual: string;
  /** set when the case threw instead of returning a value */
  error?: string;
}

export function runJsTests(
  code: string,
  cases: { name: string; call: string; expect: unknown }[],
  timeoutMs = 6000
): Promise<TestResult[]> {
  return new Promise((resolve) => {
    const cleanCode = sanitizeCodeForExecution(code).trim();
    const fail = (msg: string): TestResult[] =>
      cases.map((c) => ({ name: c.name, pass: false, expected: fmtLocal(c.expect), actual: "—", error: msg }));

    if (!cleanCode) {
      resolve(fail("Editor is empty — write a solution first."));
      return;
    }

    const workerSrc = `
      const fmt = (v) => {
        if (typeof v === 'string') return JSON.stringify(v);
        if (v === undefined) return 'undefined';
        try { return JSON.stringify(v); } catch { return String(v); }
      };
      const same = (a, b) => {
        if (a === b) return true;
        if (typeof a !== typeof b || a === null || b === null) return false;
        if (typeof a !== 'object') return Number.isNaN(a) && Number.isNaN(b);
        if (Array.isArray(a) !== Array.isArray(b)) return false;
        const ka = Object.keys(a), kb = Object.keys(b);
        if (ka.length !== kb.length) return false;
        return ka.every((k) => same(a[k], b[k]));
      };
      self.onmessage = async (e) => {
        const { code, cases } = e.data;
        const noop = () => {};
        const shim = { log: noop, info: noop, warn: noop, error: noop, debug: noop };
        const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
        const out = [];
        let build;
        try {
          const body =
            code +
            '\\n;return [' +
            cases
              .map(
                (c) =>
                  'await (async () => { try { return { ok: true, v: await (' +
                  c.call +
                  ') }; } catch (err) { return { ok: false, e: String(err) }; } })()'
              )
              .join(',') +
            '];';
          build = new AsyncFn('console', body);
        } catch (err) {
          // the user's own code does not parse — report it against every case
          self.postMessage(
            cases.map((c) => ({ name: c.name, pass: false, expected: fmt(c.expect), actual: '—', error: String(err) }))
          );
          return;
        }
        let values;
        try {
          values = await build(shim);
        } catch (err) {
          self.postMessage(
            cases.map((c) => ({ name: c.name, pass: false, expected: fmt(c.expect), actual: '—', error: String(err) }))
          );
          return;
        }
        for (let i = 0; i < cases.length; i++) {
          const c = cases[i];
          const r = values[i];
          if (!r || r.ok === false) {
            out.push({ name: c.name, pass: false, expected: fmt(c.expect), actual: '—', error: r ? r.e : 'no result' });
          } else {
            out.push({ name: c.name, pass: same(r.v, c.expect), expected: fmt(c.expect), actual: fmt(r.v) });
          }
        }
        self.postMessage(out);
      };
    `;

    let url: string;
    let worker: Worker;
    try {
      url = URL.createObjectURL(new Blob([workerSrc], { type: "text/javascript" }));
      worker = new Worker(url);
    } catch {
      resolve(fail("This browser blocked the sandbox runner."));
      return;
    }

    const finish = (results: TestResult[]) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(results);
    };

    const timer = setTimeout(
      () => finish(fail(`Stopped after ${timeoutMs / 1000}s — infinite loop?`)),
      timeoutMs
    );

    worker.onmessage = (e: MessageEvent<TestResult[]>) => finish(e.data);
    worker.onerror = (e) => finish(fail(`Error: ${e.message}`));

    worker.postMessage({ code: cleanCode, cases });
  });
}

/** Same formatting as the worker, for results produced before it ever runs. */
function fmtLocal(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  if (v === undefined) return "undefined";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
