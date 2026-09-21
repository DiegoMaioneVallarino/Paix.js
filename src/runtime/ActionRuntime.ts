import type {
  PaixCallExpressionNode,
  PaixExpressionNode,
} from "../paix/ast/ast.types";

import {
  evaluateExpression,
  type PaixScope,
} from "./evaluateExpression";

import type {
  PaixStateSetter,
} from "./StateRuntime";

export interface PaixActionContext {
  scope: PaixScope;
  setState?: PaixStateSetter;
}

export function executePaixAction(
  expression: PaixExpressionNode,
  context: PaixActionContext,
): unknown {
  if (
    typeof expression !== "object" ||
    expression === null
  ) {
    return evaluateExpression(
      expression,
      context.scope,
    );
  }

  if (expression.type !== "CallExpression") {
    return evaluateExpression(
      expression,
      context.scope,
    );
  }

  return executeCallExpression(
    expression,
    context,
  );
}

function executeCallExpression(
  expression: PaixCallExpressionNode,
  context: PaixActionContext,
): unknown {
  if (expression.callee.startsWith("set_")) {
    return executeSetter(expression, context);
  }

  const possibleFunction =
    context.scope[expression.callee];

  if (typeof possibleFunction === "function") {
    const argumentsList =
      expression.arguments.map((argument) =>
        evaluateExpression(
          argument,
          context.scope,
        ),
      );

    return possibleFunction(...argumentsList);
  }

  return undefined;
}

function executeSetter(
  expression: PaixCallExpressionNode,
  context: PaixActionContext,
): unknown {
  if (!context.setState) {
    return undefined;
  }

  const stateName =
    `_${expression.callee.slice("set_".length)}`;

  const valueExpression =
    expression.arguments[0];

  if (valueExpression === undefined) {
    return undefined;
  }

  if (
    !Object.hasOwn(context.scope, stateName)
  ) {
    return undefined;
  }

  const nextValue = evaluateExpression(
    valueExpression,
    context.scope,
  );

  context.setState(
    stateName,
    nextValue,
  );

  return nextValue;
}