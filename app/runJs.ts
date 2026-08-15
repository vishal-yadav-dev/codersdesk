/**
 * Run JavaScript in the browser, in a throwaway Web Worker.
 *
 * Keeping JS off the remote runner means it never burns Judge0 quota and can't
 * be rate-limited, so it keeps working when the other languages degrade to
 * display-only. A worker also gives us two things plain eval() can't: console
 * output capture, and a hard kill for infinite loops — terminate() stops a
 * runaway `while (true)` that would otherwise freeze the page.
 */
export function runJs(code: string, timeoutMs = 4000): Promise<string> {
  return new Promise((resolve) => {
    const workerSrc = `
      self.onmessage = (e) => {
        const logs = [];
        const fmt = (v) => {
          if (typeof v === 'string') return v;
          try { return JSON.stringify(v); } catch { return String(v); }
        };
        const push = (...a) => logs.push(a.map(fmt).join(' '));
        const shim = { log: push, info: push, warn: push, error: push, debug: push };
        try {
          const ret = new Function('console', e.data)(shim);
          if (ret !== undefined) logs.push(fmt(ret));
        } catch (err) {
          logs.push(String(err));
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

    worker.postMessage(code);
  });
}
