import type { PaixStyleNode, PaixStylePropertyNode } from "../ast/ast.types";

export function styleTagNames(value: string): string[] {
  if (!/^[A-Za-z][A-Za-z0-9_]*(\s*,\s*[A-Za-z][A-Za-z0-9_]*)*$/.test(value.trim())) {
    throw new Error('"styles" expects tag names separated by commas.');
  }
  return value.split(",").map(name => name.trim());
}

export function mergeStyleProperties(...groups: PaixStylePropertyNode[][]): PaixStylePropertyNode[] {
  const result = new Map<string, PaixStylePropertyNode>();
  for (const group of groups) for (const property of group) result.set(property.name, property);
  return [...result.values()];
}

export function expandStyleProperties(properties: PaixStylePropertyNode[], tags: Record<string, PaixStyleNode>): PaixStylePropertyNode[] {
  const inherited: PaixStylePropertyNode[][] = [];
  for (const property of properties) if (property.name === "styles") {
    for (const name of styleTagNames(property.value)) {
      if (!Object.hasOwn(tags, name)) throw new Error(`Unknown style tag "${name}".`);
      inherited.push(tags[name].properties);
    }
  }
  return mergeStyleProperties(...inherited, properties.filter(property => property.name !== "styles"));
}

export function expandStyle(style: PaixStyleNode, tags: Record<string, PaixStyleNode>): PaixStyleNode {
  return { ...style, properties: expandStyleProperties(style.properties, tags),
    conditions: style.conditions.map(condition => ({ ...condition, properties: expandStyleProperties(condition.properties, tags) })) };
}

/** Deterministic composition; each rendered combination receives its own CSS rule. */
export function composeStyle(base: PaixStyleNode | undefined, names: string[], tags: Record<string, PaixStyleNode>): PaixStyleNode | undefined {
  if (!names.length) return base;
  const additions = names.map(name => {
    if (!Object.hasOwn(tags, name)) throw new Error(`Unknown style tag "${name}".`);
    return tags[name].properties;
  });
  // Encode the complete composition without a lossy hash or name normalization collisions.
  const key = JSON.stringify([base?.name ?? null, names]);
  const name = "composition-" + Array.from(key).map(character => character.codePointAt(0)!.toString(16)).join("-");
  return { type: "Style", name,
    properties: mergeStyleProperties(base?.properties ?? [], ...additions),
    conditions: base?.conditions ?? [] };
}
