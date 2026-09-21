import {
  useCallback,
  useState,
} from "react";

import type {
  PaixStateNode,
} from "../paix/ast/ast.types";

import {
  evaluateExpression,
  type PaixScope,
} from "./evaluateExpression";

export type PaixStateValues =
  Record<string, unknown>;

export type PaixStateSetter = (
  stateName: string,
  value: unknown,
) => void;

interface PaixStateRuntime {
  values: PaixStateValues;
  setValue: PaixStateSetter;
}

export function usePaixState(
  definitions: PaixStateNode[],
  initialScope: PaixScope,
): PaixStateRuntime {
  const [values, setValues] =
    useState<PaixStateValues>(() =>
      createInitialState(
        definitions,
        initialScope,
      ),
    );

  const setValue = useCallback<PaixStateSetter>(
    (stateName, value) => {
      setValues((currentValues) => {
        if (
          Object.is(
            currentValues[stateName],
            value,
          )
        ) {
          return currentValues;
        }

        return {
          ...currentValues,
          [stateName]: value,
        };
      });
    },
    [],
  );

  return {
    values,
    setValue,
  };
}

export function createInitialState(
  definitions: PaixStateNode[],
  initialScope: PaixScope,
): PaixStateValues {
  const values: PaixStateValues = {};

  for (const definition of definitions) {
    const evaluationScope: PaixScope = {
      ...initialScope,
      ...values,
    };

    values[definition.name] =
      evaluateExpression(
        definition.initialValue,
        evaluationScope,
      );
  }

  return values;
}