export const standardComponentNames = [
  "Text",
  "Button",
  "Container",
] as const;

export function isStandardComponent(
  name: string,
): boolean {
  return standardComponentNames.some(
    (componentName) => componentName === name,
  );
}