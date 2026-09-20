import type { PaixExpressionNode } from "../paix/ast/ast.types";

export type PaixScope = Record<string, unknown>;

export function evaluateExpression(
  expression: PaixExpressionNode,
  scope: PaixScope,
): unknown {
  if (
    expression === null ||
    typeof expression !== "object"
  ) {
    return expression;
  }

  switch (expression.type) {
    case "Reference":
      return scope[expression.name];

    case "BinaryExpression": {
      const left = evaluateExpression(
        expression.left,
        scope,
      );

      const right = evaluateExpression(
        expression.right,
        scope,
      );

      if (expression.operator === "+") {
        if (
          typeof left === "number" &&
          typeof right === "number"
        ) {
          return left + right;
        }

        return `${left ?? ""}${right ?? ""}`;
      }

      return Number(left) - Number(right);
    }

    case "CallExpression":
      return undefined;
  }
}