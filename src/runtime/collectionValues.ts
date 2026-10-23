export function isCollectionState(name: string): boolean {
  return /^_[A-Z][A-Z0-9_]*$/.test(name);
}
export function isPaixObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function readOwn(value: unknown, name: string): unknown {
  return isPaixObject(value) && Object.hasOwn(value, name) ? value[name] : undefined;
}
export function validateCollectionValue(name: string, value: unknown): void {
  if (!isCollectionState(name)) return;
  if (!Array.isArray(value)) throw new Error(`Collection "${name}" must contain an array of objects.`);
  const ids = new Set<string | number>();
  value.forEach((item, index) => {
    if (!isPaixObject(item)) throw new Error(`Collection "${name}": item ${index + 1} must be an object.`);
    const id = readOwn(item, "id");
    if ((typeof id !== "string" && typeof id !== "number") || (typeof id === "number" && !Number.isFinite(id))) {
      throw new Error(`Collection "${name}": item ${index + 1} requires a string or numeric id.`);
    }
    if (ids.has(id)) throw new Error(`Collection "${name}" has duplicate id ${JSON.stringify(id)}.`);
    ids.add(id);
  });
}
