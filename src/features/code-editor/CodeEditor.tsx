import { useEffect, useRef } from "react";

import Editor, {
  type BeforeMount,
  type Monaco,
  type OnMount,
} from "@monaco-editor/react";

import type { PaixDiagnostic } from "../../paix/diagnostics/diagnostic.types";
import { registerPaixLanguage } from "./paixLanguage";
import { registerPaixTheme } from "./paixTheme";

interface CodeEditorProps {
  path: string;
  value: string;
  diagnostics: PaixDiagnostic[];
  onChange: (value: string) => void;
}

export function CodeEditor({
  path,
  value,
  diagnostics,
  onChange,
}: CodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);

  const handleBeforeMount: BeforeMount = (monaco) => {
    registerPaixLanguage(monaco);
    registerPaixTheme(monaco);
  };

  const applyMarkers = (monaco: Monaco) => {
    const uri = monaco.Uri.parse(`file:///${path}`);
    const model = monaco.editor.getModel(uri);

    if (!model) {
      return;
    }

    monaco.editor.setModelMarkers(
      model,
      "paix-parser",
      diagnostics.map((diagnostic) => ({
        severity:
          diagnostic.severity === "error"
            ? monaco.MarkerSeverity.Error
            : monaco.MarkerSeverity.Warning,

        message: diagnostic.message,

        startLineNumber: diagnostic.line,
        startColumn: diagnostic.column,

        endLineNumber: diagnostic.line,
        endColumn:
          diagnostic.column +
          Math.max(diagnostic.length, 1),
      })),
    );
  };

  const handleMount: OnMount = (_editor, monaco) => {
    monacoRef.current = monaco;
    applyMarkers(monaco);
  };

  useEffect(() => {
    const monaco = monacoRef.current;

    if (!monaco) {
      return;
    }

    applyMarkers(monaco);
  }, [path, diagnostics]);

  return (
    <div className="code-editor">
      <Editor
        height="100%"
        width="100%"
        path={`file:///${path}`}
        language="paix"
        theme="paix-blue"
        value={value}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        saveViewState
        options={{
          automaticLayout: true,

          minimap: {
            enabled: false,
          },

          fontFamily:
            '"Cascadia Code", "SFMono-Regular", Consolas, monospace',
          fontSize: 13,
          lineHeight: 23,
          fontLigatures: true,

          padding: {
            top: 18,
            bottom: 18,
          },

          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: "on",
          cursorBlinking: "smooth",
          renderLineHighlight: "line",

          bracketPairColorization: {
            enabled: true,
          },

          guides: {
            bracketPairs: true,
            indentation: true,
          },

          tabSize: 4,
          insertSpaces: true,
          wordWrap: "on",
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
        }}
      />
    </div>
  );
}