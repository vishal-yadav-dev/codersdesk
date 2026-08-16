
import { PYTHON } from "./python";
import { JAVA } from "./java";
import { CPP } from "./cpp";
import { GO } from "./go";
import { PHP } from "./php";

export interface LangCode {
  /** stub shown in the editor when this language is picked */
  starter: string;
  /** reference implementation, line by line */
  solution: string[];
  /** what the bundled driver prints, used by the verifier */
  expectedOutput?: string;
}

/** problem id -> language id -> code */
export type LangTable = Record<string, LangCode>;

export const SOLUTIONS: Record<string, LangTable> = {
  python: PYTHON,
  java: JAVA,
  cpp: CPP,
  go: GO,
  php: PHP,
};

export const SCRATCH: Record<string, string> = {
  javascript: '// Scratchpad — write anything and hit Run.\n\nconsole.log("hello from the desk");',
  typescript:
    '// Scratchpad — write anything and hit Run.\n\nconst greet = (who: string): string => `hello ${who}`;\nconsole.log(greet("desk"));',
  python: '# Scratchpad — write anything and hit Run.\n\nprint("hello from the desk")',
  java:
    'public class Main {\n    public static void main(String[] args) {\n        // Scratchpad — write anything and hit Run.\n        System.out.println("hello from the desk");\n    }\n}',
  cpp:
    '#include <iostream>\n\nint main() {\n    // Scratchpad — write anything and hit Run.\n    std::cout << "hello from the desk" << std::endl;\n    return 0;\n}',
  go:
    'package main\n\nimport "fmt"\n\nfunc main() {\n\t// Scratchpad — write anything and hit Run.\n\tfmt.Println("hello from the desk")\n}',
  php: '<?php\n// Scratchpad — write anything and hit Run.\n\necho "hello from the desk\\n";',
};

/** The scratchpad snippet for a language, falling back to JavaScript's. */
export function scratchFor(langId: string): string {
  return SCRATCH[langId] ?? SCRATCH.javascript;
}

/** Starter + reference solution for a problem in a language, if one exists. */
export function codeFor(problemId: string, langId: string): LangCode | null {
  // TypeScript reuses the JavaScript entries, which live on the Problem itself
  const table = SOLUTIONS[langId];
  return table?.[problemId] ?? null;
}
