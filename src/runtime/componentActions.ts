import type { PaixActionNode } from "../paix/ast/ast.types";
import { evaluateExpression, type PaixScope } from "./evaluateExpression";
import { validateCollectionValue } from "./collectionValues";
import type { PaixStateSetter } from "./StateRuntime";

/** Each component instance supplies its own live scope and setter. */
export function createComponentActions(definitions: PaixActionNode[], scope: PaixScope, setState: PaixStateSetter): Record<string, () => void> {
  const definitionsByName = new Map(definitions.map(action => [action.name, action]));
  return Object.fromEntries(definitions.map(definition => [definition.name, () => {
    const pending = new Map<string, unknown>();
    const working = { ...scope };
    const run = (name: string, chain: Set<string>) => {
      if (chain.has(name)) throw new Error(`Recursive action: ${name}`);
      const action = definitionsByName.get(name);
      if (!action) throw new Error(`Unknown action: ${name}`);
      const next = new Set(chain).add(name);
      for (const step of action.steps) {
        if ("action" in step) { run(step.action, next); continue; }
        if (!Object.hasOwn(working, step.state)) throw new Error(`Unknown state: ${step.state}`);
        const value = evaluateExpression(step.value, working);
        validateCollectionValue(step.state, value);
        working[step.state] = value;
        pending.set(step.state, value);
      }
    };
    run(definition.name, new Set());
    // Validate the complete action before committing any state changes.
    for (const [name, value] of pending) { scope[name] = value; setState(name, value); }
  }]));
}
