import type { PaixComponentDefinitionNode, PaixComponentNode, PaixStyleNode } from "../paix/ast/ast.types";
import { evaluateExpression, type PaixScope } from "./evaluateExpression";
import { isPaixEventArgument, resolvePaixEvent } from "./EventRuntime";
import { isPaixObject } from "./collectionValues";
import type { PaixStateSetter } from "./StateRuntime";

export function inferComponentInputs(definition: PaixComponentDefinitionNode, style?: PaixStyleNode): Set<string> {
  const names = new Set<string>();
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    const record = node as Record<string, unknown>;
    if (record.type === "InputReference" && typeof record.name === "string") names.add(record.name);
    Object.values(record).forEach(visit);
  };
  visit(definition); visit(style?.conditions);
  return names;
}

export function resolveComponentArguments(component: PaixComponentNode, scope: PaixScope, acceptedInputs: ReadonlySet<string>, setState?: PaixStateSetter): PaixScope {
  const entries: [string, unknown][] = [];
  for (const argument of component.arguments) {
    if (argument.type !== "ObjectArgument") continue;
    const source = evaluateExpression(argument.value, scope);
    if (source === undefined || source === null) continue;
    if (!isPaixObject(source)) throw new Error(`Component "${component.name}" expects an object as an unnamed argument. Select one object by position or id before passing a collection.`);
    for (const [name, value] of Object.entries(source)) {
      if (acceptedInputs.has(name) && value !== undefined) entries.push([name, value]);
    }
  }
  // Explicit named arguments always win, irrespective of their written order.
  for (const argument of component.arguments) {
    if (argument.type !== "Argument") continue;
    entries.push([argument.name, argument.name === "style" && argument.value && typeof argument.value === "object" && argument.value.type === "Reference"
      ? argument.value.name
      : isPaixEventArgument(argument.name)
        ? resolvePaixEvent(argument.value, { scope, setState })
        : evaluateExpression(argument.value, scope)]);
  }
  return Object.fromEntries(entries);
}
