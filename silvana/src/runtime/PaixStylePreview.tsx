import { useEffect, useState, type CSSProperties } from "react";
import type { PaixExpressionNode, PaixStyleNode } from "../paix/ast/ast.types";
import type { PaixCompiledProject } from "../paix/compiler/compiled.types";
import { PAIX_INPUTS_SCOPE_KEY } from "./evaluateExpression";
import { PaixStyleSheet, resolvePaixStyleClasses } from "./StyleRuntime";
import { usePreviewRuntime } from "./PreviewRuntime";

interface Props { program: PaixCompiledProject; style: PaixStyleNode }
const stage: CSSProperties = { width: "100%", height: "100%", minHeight: 260, display: "grid", placeItems: "center" };
const sample: CSSProperties = { width: "min(75%, 360px)", height: "min(55%, 220px)", minHeight: 120, display: "grid", placeItems: "center" };

// A style file has no component instance. These are sample values for its conditions.
export function getStyleSampleValues(style: PaixStyleNode): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  const visit = (node: PaixExpressionNode, comparison?: PaixExpressionNode) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "InputReference" || (node.type === "Reference" && node.kind === "state")) {
      const key = node.type === "InputReference" ? `this.${node.name}` : node.name;
      if (!Object.hasOwn(values, key)) values[key] = typeof comparison === "string" ? "" : typeof comparison === "number" ? 0 : false;
    } else if (node.type === "ComparisonExpression" || node.type === "BinaryExpression") {
      visit(node.left, node.right); visit(node.right, node.left);
    } else if (node.type === "OtherwiseExpression") { visit(node.value); visit(node.fallback); }
    else if (node.type === "CallExpression") node.arguments.forEach(argument => visit(argument));
  };
  style.conditions.forEach(condition => visit(condition.condition));
  return values;
}
export function PaixStylePreview({ program, style }: Props) {
  const preview = usePreviewRuntime();
  const publish = preview?.publish;
  const [values, setValues] = useState(() => getStyleSampleValues(style));
  const schema = JSON.stringify(getStyleSampleValues(style));
  useEffect(() => { setValues(current => {
    const next = JSON.parse(schema) as Record<string, unknown>;
    for (const name of Object.keys(next)) if (Object.hasOwn(current, name)) next[name] = current[name];
    return next;
  }); }, [schema]);
  useEffect(() => {
    publish?.({ values, setValue: (name, value) => setValues(current => ({ ...current, [name]: value })) });
  }, [publish, values]);
  useEffect(() => () => publish?.(null), [publish]);
  const inputs = Object.fromEntries(Object.entries(values).filter(([name]) => name.startsWith("this.")).map(([name, value]) => [name.slice(5), value]));
  const classes = resolvePaixStyleClasses(style, { ...values, [PAIX_INPUTS_SCOPE_KEY]: inputs }, preview?.interaction);
  return <div className="paix-style-preview-stage" data-paix-style-preview={style.name} style={stage}>
    <PaixStyleSheet styles={{ ...program.styles, [style.name]: style }} />
    <div className={`paix-style-preview-surface ${classes}`} style={sample} tabIndex={0}>
      <span className="paix-text-content">Preview text</span>
    </div>
  </div>;
}
