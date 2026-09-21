import { useMemo } from "react";

import { CodeEditor } from "../features/code-editor/CodeEditor";
import { DiagnosticsPanel } from "../features/diagnostics/DiagnosticsPanel";
import { FileExplorer } from "../features/file-explorer/FileExplorer";
import { PreviewPanel } from "../features/preview/PreviewPanel";

import type { PaixWireframeNode } from "../paix/ast/ast.types";
import { compilePaixProject } from "../paix/compiler/compile";
import { parsePaixPage } from "../paix/parser/parse";
import { parsePaixComponent } from "../paix/parser/parseComponent";
import { parsePaixWireframe } from "../paix/parser/parseWireframe";
import { validatePaixPage } from "../paix/semantic/validate";

import { useProjectStore } from "../project/project.store";
import { FileTypeIcon } from "../features/file-explorer/FileTypeIcon";

import { validatePaixWireframe } from "../paix/semantic/validateWireframe";


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

    if (activeFile.type === "wireframe") {
  const syntaxResult = parsePaixWireframe(
    activeFile.content,
  );

  if (!syntaxResult.ast) {
    return syntaxResult;
  }

  return {
    ast: syntaxResult.ast,

    diagnostics: [
      ...syntaxResult.diagnostics,

      ...validatePaixWireframe(
        syntaxResult.ast,
        activeFile.content,
      ),
    ],
  };
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

  const inspectedWireframe: PaixWireframeNode | null =
    activeFile?.type === "wireframe" &&
    activeAnalysis.ast?.type === "Wireframe"
      ? activeAnalysis.ast
      : null;

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
                    <img
                    className="brand-logo"
                    src="/images/logo.png"
                    alt="Paix"
/>
          <div>
            <strong>
              p<b className="ai-brand-text">ai</b>x
              <b className="js-type-text">.js</b>
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
              <FileTypeIcon type={activeFile.type} />

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
          inspectedWireframe={
            inspectedWireframe
          }
        />
      </div>

      <DiagnosticsPanel
        fileType={activeFile.type}
        parseResult={activeAnalysis}
      />
    </section>
  );
}