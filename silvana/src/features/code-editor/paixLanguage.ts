import type { Monaco } from "@monaco-editor/react";

const PAIX_LANGUAGE_ID = "paix";

export function registerPaixLanguage(monaco: Monaco) {
 const isRegistered = monaco.languages
  .getLanguages()
  .some((language: { id: string }) => language.id === PAIX_LANGUAGE_ID);

  if (!isRegistered) {
    monaco.languages.register({
      id: PAIX_LANGUAGE_ID,
      extensions: [".paix"],
      aliases: ["Paix", "paix"],
    });
  }

  monaco.languages.setLanguageConfiguration(PAIX_LANGUAGE_ID, {
    comments: {
      lineComment: "//",
    },

    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],

    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
    ],

    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
    ],

    indentationRules: {
      increaseIndentPattern:
        /^\s*(component|page|wireframe|action|setter|state|when|otherwise|repeat|shared)\b.*$/,
      decreaseIndentPattern: /^\s*(otherwise|})\b/,
    },
  });

  monaco.languages.setMonarchTokensProvider(PAIX_LANGUAGE_ID, {
    keywords: [
  "application",
  "page",
  "component",
  "components",
  "wireframe",
  "wireframes",
  "state",
  "action",
  "setter",
  "when",
  "otherwise",
  "place",
  "in",
  "this",
  "use",
  "style",
  "styles",
  "repeat",
  "as",
  "from",
  "request",
  "shared",
  "resource",
  "finally",
  "slice",
  "vertical",
  "horizontal",
  "centered",
  "columns",
  "rows",
  "grid",
  "island",
  "layer",
  "slots",
],

    constants: ["true", "false", "none", "empty"],

    tokenizer: {
  root: [
    [/\/\/.*$/, "comment"],

    // Debe aparecer antes de reconocer "this" como keyword.
    [
      /\bthis\.[a-zA-Z][a-zA-Z0-9_]*/,
      "variable.predefined",
    ],

    [
      /\b(onSuccess|onError|onClick|onInput|onChange|onSubmit|onLoad)\b/,
      "event",
    ],
    [/\bon[A-Z][a-zA-Z0-9_]*/, "event"],

    [/\bset_[a-zA-Z_][a-zA-Z0-9_]*/, "setter"],
    [/\b_[a-zA-Z][a-zA-Z0-9_]*/, "state"],

    [/\b[A-Z][a-zA-Z0-9_]*/, "component"],

    [/"([^"\\]|\\.)*$/, "string.invalid"],
    [
      /"/,
      {
        token: "string.quote",
        bracket: "@open",
        next: "@string",
      },
    ],

    [/#[0-9a-fA-F]{3,8}\b/, "number.hex"],

    [
      /\d+(\.\d+)?(%|px|rem|vh|vw)?/,
      "number",
    ],

    [/[>&]/, "layoutOperator"],
    [/:/, "assignmentOperator"],
    [/[=+\-*/]/, "operator"],

    [/[{}[\]()]/, "@brackets"],
    [/[,.]/, "delimiter"],

    [
      /[a-zA-Z][a-zA-Z0-9_]*/,
      {
        cases: {
          "@keywords": "keyword",
          "@constants": "constant",
          "@default": "identifier",
        },
      },
    ],
  ],

  string: [
    [/[^\\"]+/, "string"],
    [/\\./, "string.escape"],

    [
      /"/,
      {
        token: "string.quote",
        bracket: "@close",
        next: "@pop",
      },
    ],
  ],
},
  });
}