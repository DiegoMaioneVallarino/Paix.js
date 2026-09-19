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
    ],

    constants: ["true", "false", "none", "empty"],

    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],

        [
          /\b(application|page|component|components|wireframe|wireframes|state|action|setter|when|otherwise|place|in|use|style|styles|repeat|as|from|request|shared|resource|finally)\b/,
          "keyword",
        ],

        [/\b(onSuccess|onError|onClick|onInput|onChange|onSubmit|onLoad)\b/, "event"],
        [/\bon[A-Z][a-zA-Z0-9_]*/, "event"],

        [/\bset_[a-zA-Z_][a-zA-Z0-9_]*/, "setter"],
        [/\b_[a-zA-Z][a-zA-Z0-9_]*/, "state"],

        [/\b(true|false|none|empty)\b/, "constant"],
        [/\b[A-Z][a-zA-Z0-9_]*/, "component"],

        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],

        [/\d+(\.\d+)?(%|px|rem|vh|vw)?/, "number"],

        [/[>&]/, "layoutOperator"],
        [/:/, "assignmentOperator"],
        [/[=+\-*/]/, "operator"],

        [/[{}[\]()]/, "@brackets"],
        [/[a-zA-Z][a-zA-Z0-9_]*/, "identifier"],
        [/[,.]/, "delimiter"],
      ],

      string: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
      ],
    },
  });
}