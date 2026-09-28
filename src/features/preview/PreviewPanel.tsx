import { useState } from "react";

import type {
  PaixComponentDefinitionNode,
  PaixStyleNode,
  PaixWireframeNode,
} from "../../paix/ast/ast.types";

import type {
  PaixCompiledProject,
} from "../../paix/compiler/compiled.types";

import type {
  PaixFileType,
} from "../../project/project.types";

import {
  PaixComponentPreview,
  PaixRenderer,
} from "../../runtime/PaixRenderer";

import { PaixStylePreview } from "../../runtime/PaixStylePreview";

import {
  WireframeRenderer,
} from "../../runtime/WireframeRenderer";

type PreviewDevice = "desktop" | "mobile";

interface PreviewPanelProps {
  program: PaixCompiledProject;
  activeFileType: PaixFileType;
  inspectedWireframe: PaixWireframeNode | null;
  inspectedComponent: PaixComponentDefinitionNode | null;
  inspectedStyle: PaixStyleNode | null;
}

export function PreviewPanel({
  program,
  activeFileType,
  inspectedWireframe,
  inspectedComponent,
  inspectedStyle,
}: PreviewPanelProps) {
  const [device, setDevice] = useState<PreviewDevice>("desktop");

  let content;

  if (activeFileType === "component") {
    content = inspectedComponent ? (
      <PaixComponentPreview
        definition={inspectedComponent}
        program={program}
      />
    ) : (
      <div className="paix-runtime-empty">
        Corrige los errores del componente
        para ver su preview.
      </div>
    );
  } else if (activeFileType === "wireframe") {
    content = inspectedWireframe ? (
      <WireframeRenderer
        wireframe={inspectedWireframe}
        debug
      />
    ) : (
      <div className="paix-runtime-empty">
        Corrige los errores del wireframe
        para ver su preview.
      </div>
    );
  } else if (activeFileType === "style") {
    content = inspectedStyle ? (
      <PaixStylePreview
        program={program}
        style={inspectedStyle}
      />
    ) : (
      <div className="paix-runtime-empty">
        Corrige los errores del estilo
        para ver su preview.
      </div>
    );
  } else {
    content = <PaixRenderer program={program} />;
  }

  return (
    <section className="preview-panel panel">
      <div className="panel-header">
        <span>Preview</span>

        <div className="preview-controls">
          <button
            type="button"
            className={`device-button ${device === "desktop" ? "active" : ""}`}
            onClick={() => setDevice("desktop")}
          >
            Desktop
          </button>

          <button
            type="button"
            className={`device-button ${device === "mobile" ? "active" : ""}`}
            onClick={() => setDevice("mobile")}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className="preview-background">
        <div className={`preview-canvas preview-${device}`}>
          {content}
        </div>
      </div>
    </section>
  );
}
