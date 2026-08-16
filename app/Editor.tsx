"use client";
import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { php } from "@codemirror/lang-php";

function langExtension(langId: string) {
  switch (langId) {
    case "typescript":
      return javascript({ typescript: true });
    case "python":
      return python();
    case "java":
      return java();
    case "cpp":
      return cpp();
    case "go":
      return go();
    case "php":
      // plainly: highlight as PHP even before the opening <?php tag
      return php({ plain: true });
    default:
      return javascript();
  }
}

/** Matches .c-kw / .c-str / .c-com / .c-fn in globals.css. */
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.moduleKeyword, t.controlKeyword], color: "#c792ea" },
  { tag: [t.string, t.special(t.string)], color: "#c3e88d" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#546178", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#82aaff" },
  { tag: [t.definition(t.variableName), t.definition(t.propertyName)], color: "#82aaff" },
  { tag: [t.number, t.bool, t.null], color: "#f78c6c" },
  { tag: [t.className, t.typeName, t.namespace], color: "#ffcb6b" },
  { tag: [t.propertyName, t.attributeName], color: "#d6e2f2" },
  { tag: [t.operator, t.punctuation, t.separator, t.bracket], color: "#89a0bd" },
  { tag: [t.variableName], color: "#d6e2f2" },
  { tag: t.invalid, color: "#ff6b6b" },
]);

const editorTheme = EditorView.theme(
  {
    "&": {
      color: "var(--ink)",
      backgroundColor: "transparent",
      fontSize: "12.5px",
      borderRadius: "10px",
      height: "100%",
    },
    ".cm-scroller, .cm-content, .cm-gutter, .cm-gutters": { backgroundColor: "transparent" },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": {
      fontFamily: "inherit",
      lineHeight: "1.55",
      overflow: "auto",
    },
    ".cm-content": { caretColor: "var(--glow)", padding: "8px 0" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--glow)" },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "#38425a",
      border: "none",
      paddingRight: "2px",
    },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.035)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--glow)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "color-mix(in srgb, var(--glow) 34%, transparent)",
    },
    ".cm-matchingBracket, &.cm-focused .cm-matchingBracket": {
      backgroundColor: "color-mix(in srgb, var(--glow) 30%, transparent)",
      outline: "none",
    },
    ".cm-tooltip": {
      backgroundColor: "var(--panel)",
      border: "1px solid var(--panel-border)",
      borderRadius: "8px",
      color: "var(--ink)",
    },
    ".cm-panels": { backgroundColor: "var(--panel)", color: "var(--ink)" },
  },
  { dark: true }
);

export default function Editor({
  value,
  onChange,
  language,
}: {
  value: string;
  onChange: (next: string) => void;
  language: string;
}) {
  const extensions = useMemo(
    () => [
      langExtension(language),
      syntaxHighlighting(highlight),
      keymap.of([indentWithTab]),
      EditorView.lineWrapping,
    ],
    [language]
  );

  return (
    <div className="lab-editor-shell">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={editorTheme}
        height="100%"
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false, // suggestion popups get in the way of practice
          highlightActiveLineGutter: true,
        }}
      />
    </div>
  );
}
