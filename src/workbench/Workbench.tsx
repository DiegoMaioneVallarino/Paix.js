import { useMemo } from "react";

import { CodeEditor } from "../features/code-editor/CodeEditor";
import { DiagnosticsPanel } from "../features/diagnostics/DiagnosticsPanel";
import { FileExplorer } from "../features/file-explorer/FileExplorer";
import { PreviewPanel } from "../features/preview/PreviewPanel";

import { compilePaixProject } from "../paix/compiler/compile";
import { parsePaixPage } from "../paix/parser/parse";
import { parsePaixComponent } from "../paix/parser/parseComponent";
import { validatePaixPage } from "../paix/semantic/validate";

import { useProjectStore } from "../project/project.store";

export function Workbench() {
  const project = useProjectStore(
    (state) => state.project,
  );

  const activeFilePath = useProjectStore(
    (state) => state.activeFilePath,
  );

  const modifiedFiles = useProjectStore(
    (state) => state.modifiedFiles,
  );

  const updateFile = useProjectStore(
    (state) => state.updateFile,
  );

  const resetProject = useProjectStore(
    (state) => state.resetProject,
  );

  const activeFile =
    project.files[activeFilePath];

  const activeFileIsModified =
    modifiedFiles.includes(activeFilePath);

  const compiledProject = useMemo(
    () => compilePaixProject(project),
    [project],
  );

  const activeAnalysis = useMemo(() => {
    if (!activeFile) {
      return {
        ast: null,
        diagnostics: [],
      };
    }

    if (activeFile.type === "component") {
      return parsePaixComponent(
        activeFile.content,
      );
    }

    if (activeFile.type === "page") {
      const syntaxResult = parsePaixPage(
        activeFile.content,
      );

      if (!syntaxResult.ast) {
        return syntaxResult;
      }

      return {
        ast: syntaxResult.ast,

        diagnostics: [
          ...syntaxResult.diagnostics,

          ...validatePaixPage(
            syntaxResult.ast,
            project,
            activeFile.content,
          ),
        ],
      };
    }

    return {
      ast: null,
      diagnostics: [],
    };
  }, [activeFile, project]);

  if (!activeFile) {
    return (
      <section className="workbench">
        <div className="empty-workbench">
          No active Paix file
        </div>
      </section>
    );
  }

  const handleResetProject = () => {
    const shouldReset = window.confirm(
      "Reset the example project and discard all changes?",
    );

    if (shouldReset) {
      resetProject();
    }
  };

  return (
    <section className="workbench">
      <header className="workbench-header">
        <div className="brand">
          <span className="brand-symbol">P</span>

          <div>
            <strong>
              p<b className="ai-brand-text">ai</b>x
            </strong>
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
            onClick={handleResetProject}
          >
            Reset
          </button>

          <button
            type="button"
            className="toolbar-button"
          >
            Export
          </button>

          <button
            type="button"
            className="toolbar-button primary"
          >
            Run
          </button>
        </div>
      </header>

      <div className="workbench-content">
        <FileExplorer />

        <section className="editor-panel panel">
          <div className="editor-tabs">
            <button
              type="button"
              className="editor-tab active"
            >
              <span className="paix-file-icon">
                P
              </span>

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
            diagnostics={
              activeAnalysis.diagnostics
            }
            onChange={(content) => {
              updateFile(
                activeFile.path,
                content,
              );
            }}
          />
        </section>

        <PreviewPanel
          program={compiledProject}
        />
      </div>

      <DiagnosticsPanel
        fileType={activeFile.type}
        parseResult={activeAnalysis}
      />
    </section>
  );
}