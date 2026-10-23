import { validateCollectionValue } from "./collectionValues";
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
  error: string | null;
}

export function usePaixState(
  definitions: PaixStateNode[],
  initialScope: PaixScope,
): PaixStateRuntime {
  const [runtime, setRuntime] = useState<{ values: PaixStateValues; error: string | null }>(() => {
    try { return { values: createInitialState(definitions, initialScope), error: null }; }
    catch (error) { return { values: {}, error: error instanceof Error ? error.message : String(error) }; }
  });
  const setValue = useCallback<PaixStateSetter>(
    (stateName, value) => {
      setRuntime(current => {
        if (!Object.hasOwn(current.values, stateName)) return current;
        try { validateCollectionValue(stateName, value); }
        catch (error) { return { ...current, error: error instanceof Error ? error.message : String(error) }; }
        if (Object.is(current.values[stateName], value) && current.error === null) return current;
        return { values: { ...current.values, [stateName]: value }, error: null };
      });
    },
    [],
  );

  return {
    values: runtime.values,
    error: runtime.error,
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
    validateCollectionValue(definition.name, values[definition.name]);
  }

  return values;
}