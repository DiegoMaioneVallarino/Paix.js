import { useState } from "react";
import type { PaixPageParseResult } from "../../paix/parser/parse";
import type { PaixFileType } from "../../project/project.types";
import { AstViewer } from "./AstViewer";

type DiagnosticTab =
  | "problems"
  | "ast"
  | "state"
  | "events";

interface DiagnosticsPanelProps {
  fileType: PaixFileType;
  parseResult: PaixPageParseResult;
}

export function DiagnosticsPanel({
  fileType,
  parseResult,
}: DiagnosticsPanelProps) {
  const [activeTab, setActiveTab] =
    useState<DiagnosticTab>("problems");

  const parserAvailable = fileType === "page";
  const problemCount = parseResult.diagnostics.length;

  return (
    <footer className="diagnostics-panel panel">
      <nav className="diagnostic-tabs">
        <button
          type="button"
          className={`diagnostic-tab ${
            activeTab === "problems" ? "active" : ""
          }`}
          onClick={() => setActiveTab("problems")}
        >
          Problems <span>{problemCount}</span>
        </button>

        <button
          type="button"
          className={`diagnostic-tab ${
            activeTab === "ast" ? "active" : ""
          }`}
          onClick={() => setActiveTab("ast")}
        >
          AST
        </button>

        <button
          type="button"
          className={`diagnostic-tab ${
            activeTab === "state" ? "active" : ""
          }`}
          onClick={() => setActiveTab("state")}
        >
          State
        </button>

        <button
          type="button"
          className={`diagnostic-tab ${
            activeTab === "events" ? "active" : ""
          }`}
          onClick={() => setActiveTab("events")}
        >
          Events
        </button>
      </nav>

      <div className="diagnostic-panel-content">
        {activeTab === "problems" && (
          <>
            {!parserAvailable && (
              <div className="diagnostic-placeholder">
                The parser for {fileType} files has not been
                implemented yet.
              </div>
            )}

            {parserAvailable && problemCount === 0 && (
              <div className="diagnostic-success">
                <span className="success-indicator">✓</span>

                <div>
                  <strong>No problems detected</strong>
                  <p>
                    The active Paix page was parsed
                    successfully.
                  </p>
                </div>
              </div>
            )}

            {parserAvailable && problemCount > 0 && (
              <div className="diagnostic-list">
                {parseResult.diagnostics.map(
                  (diagnostic, index) => (
                    <div
                      className="diagnostic-error"
                      key={`${diagnostic.line}-${diagnostic.column}-${index}`}
                    >
                      <span className="diagnostic-error-icon">
                        !
                      </span>

                      <div className="diagnostic-error-body">
                        <strong>
                          {diagnostic.source} error
                        </strong>

                        <p>{diagnostic.message}</p>
                      </div>

                      <span className="diagnostic-location">
                        Ln {diagnostic.line}, Col{" "}
                        {diagnostic.column}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "ast" && (
          <>
            {parserAvailable ? (
              <AstViewer ast={parseResult.ast} />
            ) : (
              <div className="diagnostic-placeholder">
                AST visualization is not available for this
                file type yet.
              </div>
            )}
          </>
        )}

        {activeTab === "state" && (
          <div className="diagnostic-placeholder">
            Runtime state inspector coming soon.
          </div>
        )}

        {activeTab === "events" && (
          <div className="diagnostic-placeholder">
            Runtime event log coming soon.
          </div>
        )}
      </div>
    </footer>
  );
}