import type { CSSProperties } from "react";

import type { PaixStyleNode } from "../paix/ast/ast.types";
import type { PaixCompiledProject } from "../paix/compiler/compiled.types";

import {
  PaixStyleSheet,
  resolvePaixStyleClasses,
} from "./StyleRuntime";

interface PaixStylePreviewProps {
  program: PaixCompiledProject;
  style: PaixStyleNode;
}

const stageLayout: CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: 260,
  display: "grid",
  placeItems: "center",
};

const sampleLayout: CSSProperties = {
  width: "min(75%, 360px)",
  height: "min(55%, 220px)",
  minHeight: 120,
  display: "grid",
  placeItems: "center",
};

export function PaixStylePreview({
  program,
  style,
}: PaixStylePreviewProps) {
  const classes = resolvePaixStyleClasses(style, {});

  return (
    <div
      className="paix-style-preview-stage"
      data-paix-style-preview={style.name}
      style={stageLayout}
    >
      <PaixStyleSheet
        styles={{ ...program.styles, [style.name]: style }}
      />

      <div
        className={`paix-style-preview-surface ${classes}`}
        style={sampleLayout}
      >
        <span className="paix-text-content">
          Preview text
        </span>
      </div>
    </div>
  );
}
