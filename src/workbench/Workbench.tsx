import { FileExplorer } from "../features/file-explorer/FileExplorer";
import { CodeEditor } from "../features/code-editor/CodeEditor";
import { useProjectStore } from "../project/project.store";

import { useMemo } from "react";
import { DiagnosticsPanel } from "../features/diagnostics/DiagnosticsPanel";
import { parsePaixPage } from "../paix/parser/parse";

import { PreviewPanel } from "../features/preview/PreviewPanel";

export function Workbench() {
  const project = useProjectStore((state) => state.project);

  const activeFilePath = useProjectStore(
    (state) => state.activeFilePath,
  );

  const updateFile = useProjectStore(
    (state) => state.updateFile,
  );

    const modifiedFiles = useProjectStore(
    (state) => state.modifiedFiles,
    );

    const resetProject = useProjectStore(
    (state) => state.resetProject,
    );

    const activeFileIsModified =
    modifiedFiles.includes(activeFilePath);



  const activeFile = project.files[activeFilePath];

  if (!activeFile) {
    return (
      <section className="workbench">
        <div className="empty-workbench">
          No active Paix file
        </div>
      </section>
    );
  }
const parseResult = useMemo(() => {
  if (!activeFile || activeFile.type !== "page") {
    return {
      ast: null,
      diagnostics: [],
    };
  }

  return parsePaixPage(activeFile.content);
}, [activeFile]);
  return (
    <section className="workbench">
      <header className="workbench-header">
        <div className="brand">
          <span className="brand-symbol">P</span>

          <div>
           <strong>p<b className="ai-brand-text" >ai</b>x</strong>
          </div>
        </div>

       <div className="project-name">
  <span className="status-dot" />

  {modifiedFiles.length === 0
    ? "Saved locally"
    : `${modifiedFiles.length} modified`}
</div>

        <div className="header-actions">
            <button
  type="button"
  className="toolbar-button"
  onClick={() => {
    const shouldReset = window.confirm(
      "Reset the example project and discard all changes?",
    );

    if (shouldReset) {
      resetProject();
    }
  }}
>
  Reset
</button>
          <button type="button" className="toolbar-button">
            Export
          </button>

          <button type="button" className="toolbar-button primary">
            Run
          </button>
        </div>
      </header>

      <div className="workbench-content">
        <FileExplorer />

        <section className="editor-panel panel">
          <div className="editor-tabs">
           <button type="button" className="editor-tab active">
  <span className="paix-file-icon">P</span>

  {activeFile.name}

  {activeFileIsModified && (
    <span className="tab-modified-dot" />
  )}

  <span className="tab-close">×</span>
</button>
          </div>

       <CodeEditor
  path={activeFile.path}
  value={activeFile.content}
  diagnostics={parseResult.diagnostics}
  onChange={(content) => {
    updateFile(activeFile.path, content);
  }}
/>
        </section>

        <PreviewPanel ast={parseResult.ast} />
      </div>
<DiagnosticsPanel
  fileType={activeFile.type}
  parseResult={parseResult}
/>
      
    </section>
  );
}