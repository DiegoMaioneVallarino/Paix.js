import { useCallback, useMemo, useState } from "react";
import { PreviewRuntimeContext, type PreviewSnapshot } from "../../runtime/PreviewRuntime";
import type { PaixInteraction } from "../../runtime/StyleRuntime";
import "./previewInspector.css";

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

function PreviewSession({
  program,
  activeFileType,
  inspectedWireframe,
  inspectedComponent,
  inspectedStyle,
}: PreviewPanelProps) {
  const [device, setDevice] = useState<PreviewDevice>("desktop");

  const [interaction, setInteraction] = useState<PaixInteraction | undefined>();
  const [snapshot, setSnapshot] = useState<PreviewSnapshot | null>(null);
  const publish = useCallback((next: PreviewSnapshot | null) => setSnapshot(next), []);
  const context = useMemo(() => ({ interaction, publish }), [interaction, publish]);
  const inspect = activeFileType === "component" || activeFileType === "style";
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
    <PreviewRuntimeContext.Provider value={context}>
    <section className="preview-panel panel">
      <div className="panel-header">
        <span>Preview</span>

        <div className="preview-controls">
          {inspect && <>
            <select className="paix-preview-mode" aria-label="Modo visual" value={interaction ?? "normal"}
              onChange={event => setInteraction(event.target.value === "normal" ? undefined : event.target.value as PaixInteraction)}>
              <option value="normal">Normal</option><option value="hover">Hover</option>
              <option value="focus">Focus</option><option value="active">Active</option>
            </select>
            <details className="paix-preview-states">
              <summary>{activeFileType === "style" ? "Valores de prueba" : "Estados"} ({Object.keys(snapshot?.values ?? {}).length})</summary>
              <div className="paix-preview-state-list">
                {Object.entries(snapshot?.values ?? {}).map(([name, value]) => <label key={name}>
                  <span>{name}</span>
                  {typeof value === "boolean" ? <input aria-label={name} type="checkbox" checked={value} onChange={event => snapshot?.setValue(name, event.target.checked)} />
                    : typeof value === "number" ? <input aria-label={name} type="number" step="any" value={value} onChange={event => { if (event.target.value !== "") snapshot?.setValue(name, Number(event.target.value)); }} />
                    : typeof value === "string" ? <input aria-label={name} value={value} onChange={event => snapshot?.setValue(name, event.target.value)} />
                    : <code>{value === undefined ? "undefined" : JSON.stringify(value)}</code>}
                </label>)}
                {!Object.keys(snapshot?.values ?? {}).length && <small>No hay estados declarados.</small>}
              </div>
            </details>
          </>}
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
    </PreviewRuntimeContext.Provider>
  );
}

export function PreviewPanel(props: PreviewPanelProps) {
  const name = props.inspectedComponent?.name ?? props.inspectedStyle?.name ?? props.inspectedWireframe?.name ?? "page";
  return <PreviewSession key={`${props.activeFileType}:${name}`} {...props} />;
}
