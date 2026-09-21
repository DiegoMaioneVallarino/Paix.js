import type {
  PaixExpressionNode,
} from "../paix/ast/ast.types";

export type PaixScope = Record<string, unknown>;

export const PAIX_INPUTS_SCOPE_KEY =
  "__paixInputs";

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

    case "InputReference": {
      const inputs =
        scope[PAIX_INPUTS_SCOPE_KEY];

      if (
        !inputs ||
        typeof inputs !== "object"
      ) {
        return undefined;
      }

      return (
        inputs as Record<string, unknown>
      )[expression.name];
    }

    case "OtherwiseExpression": {
      const value = evaluateExpression(
        expression.value,
        scope,
      );

      return value === undefined
        ? evaluateExpression(
            expression.fallback,
            scope,
          )
        : value;
    }

    case "BinaryExpression": {
      const left = evaluateExpression(
        expression.left,
        scope,
      );

      const right = evaluateExpression(
        expression.right,
        scope,
      );

      if (
        left === undefined ||
        right === undefined
      ) {
        return undefined;
      }

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