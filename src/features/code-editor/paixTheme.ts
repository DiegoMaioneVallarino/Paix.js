import type { Monaco } from "@monaco-editor/react";

export function registerPaixTheme(monaco: Monaco) {
  monaco.editor.defineTheme("paix-blue", {
    base: "vs-dark",
    inherit: true,

    rules: [
      {
        token: "keyword",
        foreground: "4DAEFF",
        fontStyle: "bold",
      },
      {
        token: "component",
        foreground: "79D7FF",
      },
      {
        token: "state",
        foreground: "FFCB6B",
        fontStyle: "italic",
      },
      {
        token: "setter",
        foreground: "70E1B2",
      },
      {
        token: "event",
        foreground: "FF88C2",
      },
      {
        token: "constant",
        foreground: "C3A6FF",
      },
      {
        token: "string",
        foreground: "A8E6CF",
      },
      {
        token: "string.quote",
        foreground: "A8E6CF",
      },
      {
        token: "number",
        foreground: "FFB86C",
      },
      {
        token: "layoutOperator",
        foreground: "42C6FF",
        fontStyle: "bold",
      },
      {
        token: "assignmentOperator",
        foreground: "8BA9C7",
      },
      {
        token: "operator",
        foreground: "6FCBFF",
      },
      {
        token: "identifier",
        foreground: "D8E2EC",
      },
      {
        token: "comment",
        foreground: "52687D",
        fontStyle: "italic",
      },
      {
        token: "delimiter",
        foreground: "71869A",
      },
    ],

    colors: {
      "editor.background": "#0A1118",
      "editor.foreground": "#D8E2EC",

      "editorLineNumber.foreground": "#334759",
      "editorLineNumber.activeForeground": "#7DCFFF",

      "editorCursor.foreground": "#42B9FF",
      "editor.selectionBackground": "#164F7855",
      "editor.inactiveSelectionBackground": "#123A5655",
      "editor.lineHighlightBackground": "#10202D88",

      "editorIndentGuide.background1": "#172938",
      "editorIndentGuide.activeBackground1": "#2B638A",

      "editorBracketMatch.background": "#168ED633",
      "editorBracketMatch.border": "#42B9FF88",

      "editorWidget.background": "#101A24",
      "editorWidget.border": "#21405A",

      "editorSuggestWidget.background": "#101A24",
      "editorSuggestWidget.border": "#21405A",
      "editorSuggestWidget.selectedBackground": "#173A52",

      "scrollbarSlider.background": "#31557055",
      "scrollbarSlider.hoverBackground": "#3F719077",
      "scrollbarSlider.activeBackground": "#4C84A799",
    },
  });
}