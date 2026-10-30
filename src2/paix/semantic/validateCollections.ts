import type { PaixComponentDefinitionNode, PaixExpressionNode } from "../ast/ast.types";
import type { PaixDiagnostic } from "../diagnostics/diagnostic.types";
import { evaluateExpression } from "../../runtime/evaluateExpression";
import { isCollectionState, validateCollectionValue } from "../../runtime/collectionValues";

function isStatic(expression: PaixExpressionNode): boolean {
  if (expression === null || typeof expression !== "object") return true;
  switch (expression.type) {
    case "ArrayExpression": return expression.items.every(isStatic);
    case "ObjectExpression": return expression.properties.every(property => isStatic(property.value));
    case "OtherwiseExpression": return isStatic(expression.value) && isStatic(expression.fallback);
    case "BinaryExpression": case "ComparisonExpression": return isStatic(expression.left) && isStatic(expression.right);
    default: return false;
  }
}
export function validateCollectionDeclarations(ast: PaixComponentDefinitionNode, source: string): PaixDiagnostic[] {
  const diagnostics: PaixDiagnostic[] = [];
  for (const state of ast.states) {
    if (!isCollectionState(state.name) || !isStatic(state.initialValue)) continue;
    try { validateCollectionValue(state.name, evaluateExpression(state.initialValue, {})); }
    catch (error) {
      const offset = source.indexOf(state.name + ":");
      const lines = source.slice(0, Math.max(0, offset)).split(/\r?\n/);
      diagnostics.push({ source: "semantic", severity: "error", message: error instanceof Error ? error.message : String(error), line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1, length: state.name.length });
    }
  }
  return diagnostics;
}
