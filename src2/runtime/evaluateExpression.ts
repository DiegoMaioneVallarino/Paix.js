import { isPaixObject, readOwn } from "./collectionValues";
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
    case "ArrayExpression":
      return expression.items.map(item => evaluateExpression(item, scope));
    case "ObjectExpression":
      return Object.fromEntries(expression.properties.map(property => [property.name, evaluateExpression(property.value, scope)]));
    case "MemberExpression":
      return readOwn(evaluateExpression(expression.object, scope), expression.property);
    case "SelectorExpression": {
      const source = evaluateExpression(expression.source, scope);
      if (!Array.isArray(source)) return undefined;
      if (expression.position !== undefined) {
        const position = evaluateExpression(expression.position, scope);
        return typeof position === "number" && Number.isInteger(position) && position >= 1 ? source[position - 1] : undefined;
      }
      const criteria = (expression.criteria ?? []).map(criterion => ({ name: criterion.name, value: evaluateExpression(criterion.value, scope) }));
      // Missing selector values never match absent fields accidentally.
      const matches = source.filter(item => isPaixObject(item) && criteria.every(criterion => criterion.value !== undefined && Object.hasOwn(item, criterion.name) && item[criterion.name] === criterion.value));
      if (criteria.some(criterion => criterion.name === "id")) {
        if (matches.length > 1) throw new Error("Selection by id matched multiple objects; ids must be unique.");
        return matches[0];
      }
      return matches;
    }
    case "Reference":
      return readOwn(scope, expression.name);

    case "InputReference": {
      const inputs =
        scope[PAIX_INPUTS_SCOPE_KEY];

      if (
        !inputs ||
        typeof inputs !== "object"
      ) {
        return undefined;
      }

      return readOwn(inputs, expression.name);
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

    case "ComparisonExpression": {
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
        return false;
      }

      return left === right;
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