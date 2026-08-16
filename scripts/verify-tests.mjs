#!/usr/bin/env node
import { readFile } from "node:fs/promises";

// --- load TESTS out of the TS file (plain data, so strip types and eval) ---
const tsrc = await readFile("app/problemTests.ts", "utf8");
const body = tsrc
  .replace(/export interface TestCase[\s\S]*?\n}\n/, "")
  .replace(/export const TESTS: Record<string, TestCase\[\]> =/, "const TESTS =")
  .replace(/export function testsFor[\s\S]*$/, "");
const TESTS = eval(body + "\n;TESTS");

// --- pull each reference solution out of problems.ts ---
const psrc = await readFile("app/problems.ts", "utf8");
const sols = {};
const re = /id:\s*"([^"]+)"[\s\S]*?solution:\s*\[([\s\S]*?)\n    \]/g;
let m;
while ((m = re.exec(psrc))) {
  const [, id, block] = m;
  sols[id] = [...block.matchAll(/"((?:[^"\\]|\\.)*)"/g)]
    .map((x) => x[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"))
    .join("\n");
}

const same = (a, b) => {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (typeof a !== "object") return Number.isNaN(a) && Number.isNaN(b);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => same(a[k], b[k]));
};
const fmt = (v) => { try { return JSON.stringify(v); } catch { return String(v); } };
const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;

let totalPass = 0, totalFail = 0, problems = 0;
for (const [id, cases] of Object.entries(TESTS)) {
  const sol = sols[id];
  problems++;
  if (!sol) { console.log(`\n${id}: NO SOLUTION FOUND`); totalFail += cases.length; continue; }
  const src =
    sol + "\n;return [" +
    cases.map((c) => `await (async()=>{try{return {ok:true,v:await (${c.call})}}catch(e){return {ok:false,e:String(e)}}})()`).join(",") +
    "];";
  let vals;
  try {
    vals = await new AsyncFn("console", src)({ log(){}, info(){}, warn(){}, error(){}, debug(){} });
  } catch (e) {
    console.log(`\n${id}: harness threw — ${e.message}`);
    totalFail += cases.length;
    continue;
  }
  const bad = [];
  cases.forEach((c, i) => {
    const r = vals[i];
    if (!r?.ok) bad.push(`      ✗ ${c.name} — threw ${r?.e}`);
    else if (!same(r.v, c.expect)) bad.push(`      ✗ ${c.name} — expected ${fmt(c.expect)}, got ${fmt(r.v)}`);
  });
  totalPass += cases.length - bad.length;
  totalFail += bad.length;
  const mark = bad.length ? "FAIL" : " ok ";
  console.log(`  [${mark}] ${id.padEnd(26)} ${cases.length - bad.length}/${cases.length}`);
  bad.forEach((b) => console.log(b));
}
console.log(`\n${problems} problems · ${totalPass} passed · ${totalFail} failed`);
process.exit(totalFail ? 1 : 0);
