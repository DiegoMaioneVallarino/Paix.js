import { useState } from "react";
import { PaixRenderer } from "../../runtime/PaixRenderer";
import type { PaixCompiledProject } from "../../paix/compiler/compiled.types";

type PreviewDevice = "desktop" | "mobile";

interface PreviewPanelProps {
  program: PaixCompiledProject;
}

export function PreviewPanel({
  program,
}: PreviewPanelProps) {
  const [device, setDevice] =
    useState<PreviewDevice>("desktop");

  return (
    <section className="preview-panel panel">
      <div className="panel-header">
        <span>Preview</span>

        <div className="preview-controls">
          <button
            type="button"
            className={`device-button ${
              device === "desktop" ? "active" : ""
            }`}
            onClick={() => setDevice("desktop")}
          >
            Desktop
          </button>

          <button
            type="button"
            className={`device-button ${
              device === "mobile" ? "active" : ""
            }`}
            onClick={() => setDevice("mobile")}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className="preview-background">
        <div
          className={`preview-canvas preview-${device}`}
        >
          <PaixRenderer program={program} />
        </div>
      </div>
    </section>
  );
}