import { useState } from "react";
import type { PaixPageNode } from "../../paix/ast/ast.types";
import { PaixRenderer } from "../../runtime/PaixRenderer";

type PreviewDevice = "desktop" | "mobile";

interface PreviewPanelProps {
  ast: PaixPageNode | null;
}

export function PreviewPanel({
  ast,
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
          <PaixRenderer ast={ast} />
        </div>
      </div>
    </section>
  );
}