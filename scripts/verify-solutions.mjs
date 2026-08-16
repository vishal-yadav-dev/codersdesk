#!/usr/bin/env node
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

/** The solution files are plain data, so strip the TS wrapper and eval. */
async function loadTable(file, exportName) {
  const src = await readFile(new URL(`../app/solutions/${file}`, import.meta.url), "utf8");
  const body = src
    .replace(/import type[^\n]*\n/g, "")
    .replace(new RegExp(`export const ${exportName}: LangTable =`), "const T =");
  return eval(body + "\n;T");
}

async function has(cmd, args) {
  try {
    await run(cmd, args);
    return true;
  } catch (e) {
    return e.code !== "ENOENT";
  }
}

const LANGS = {
  python: {
    file: "python.ts",
    exportName: "PYTHON",
    ext: "py",
    available: () => has("python3", ["--version"]),
    exec: async (dir, file) => run("python3", [file], { cwd: dir, timeout: 20000 }),
  },
  java: {
    file: "java.ts",
    exportName: "JAVA",
    ext: "java",
    name: "Main.java",
    available: () => has("javac", ["-version"]),
    exec: async (dir) => {
      await run("javac", ["Main.java"], { cwd: dir, timeout: 60000 });
      return run("java", ["Main"], { cwd: dir, timeout: 20000 });
    },
  },
  cpp: {
    file: "cpp.ts",
    exportName: "CPP",
    ext: "cpp",
    name: "main.cpp",
    available: () => has("g++", ["--version"]),
    exec: async (dir) => {
      await run("g++", ["-std=c++17", "-O0", "-o", "prog", "main.cpp"], { cwd: dir, timeout: 60000 });
      return run("./prog", [], { cwd: dir, timeout: 20000 });
    },
  },
  go: {
    file: "go.ts",
    exportName: "GO",
    ext: "go",
    name: "main.go",
    available: () => has("go", ["version"]),
    exec: async (dir) => run("go", ["run", "main.go"], { cwd: dir, timeout: 90000 }),
  },
  php: {
    file: "php.ts",
    exportName: "PHP",
    ext: "php",
    name: "main.php",
    available: () => has("php", ["--version"]),
    exec: async (dir) => run("php", ["main.php"], { cwd: dir, timeout: 20000 }),
  },
};

let failures = 0;
let checked = 0;

for (const [langId, cfg] of Object.entries(LANGS)) {
  const table = await loadTable(cfg.file, cfg.exportName);
  const ids = Object.keys(table);
  console.log(`\n${langId} (${ids.length} solutions)`);

  if (!ids.length) {
    console.log(dim("  none written yet"));
    continue;
  }
  if (!(await cfg.available())) {
    console.log(yellow(`  UNVERIFIED — no ${langId} toolchain on this machine`));
    continue;
  }

  for (const id of ids) {
    const entry = table[id];
    const code = entry.solution.join("\n");
    const dir = await mkdtemp(join(tmpdir(), `sol-${langId}-`));
    const filename = cfg.name ?? `main.${cfg.ext}`;

    if (entry.starter) {
      const sdir = await mkdtemp(join(tmpdir(), `start-${langId}-`));
      try {
        await writeFile(join(sdir, filename), entry.starter);
        await cfg.exec(sdir, filename);
      } catch (e) {
        failures++;
        const msg = (e.stderr || e.message || "").toString().trim().split("\n")[0];
        console.log(`  ${red("FAIL")} ${id.padEnd(26)} ${red("starter does not build: " + msg.slice(0, 110))}`);
      } finally {
        await rm(sdir, { recursive: true, force: true });
      }
    }

    try {
      await writeFile(join(dir, filename), code);
      const { stdout } = await cfg.exec(dir, filename);
      const got = stdout.trim();
      const want = (entry.expectedOutput ?? "").trim();
      checked++;
      if (!want) {
        console.log(`  ${yellow("?")}    ${id.padEnd(26)} ran, but no expectedOutput to compare`);
      } else if (got === want) {
        console.log(`  ${green("ok")}   ${id.padEnd(26)} ${JSON.stringify(got)}`);
      } else {
        failures++;
        console.log(`  ${red("FAIL")} ${id.padEnd(26)} expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      }
    } catch (e) {
      failures++;
      checked++;
      const msg = (e.stderr || e.stdout || e.message || "").toString().trim().split("\n").slice(0, 3).join(" | ");
      console.log(`  ${red("FAIL")} ${id.padEnd(26)} ${red(msg.slice(0, 160))}`);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}

console.log(`\n${checked} solutions executed · ${failures} failed`);
process.exit(failures ? 1 : 0);
