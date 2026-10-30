import type {
  PaixExpressionNode,
} from "../paix/ast/ast.types";

import {
  executePaixAction,
  type PaixActionContext,
} from "./ActionRuntime";

import {
  evaluateExpression,
} from "./evaluateExpression";

export type PaixEventHandler = (
  ...eventArguments: unknown[]
) => unknown;

export function isPaixEventArgument(
  argumentName: string,
): boolean {
  return /^on[A-Z]/.test(argumentName);
}

export function resolvePaixEvent(
  expression: PaixExpressionNode,
  context: PaixActionContext,
): PaixEventHandler | undefined {
  if (
    typeof expression === "object" &&
    expression !== null &&
    expression.type === "CallExpression"
  ) {
    return () =>
      executePaixAction(
        expression,
        context,
      );
  }

  const possibleHandler =
    evaluateExpression(
      expression,
      context.scope,
    );

  if (typeof possibleHandler !== "function") {
    return undefined;
  }

  return (...eventArguments: unknown[]) =>
    possibleHandler(...eventArguments);
}