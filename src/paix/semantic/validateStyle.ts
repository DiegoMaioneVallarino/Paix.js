import type {
  PaixStyleNode,
  PaixStylePropertyNode,
} from "../ast/ast.types";

import type {
  PaixDiagnostic,
} from "../diagnostics/diagnostic.types";

const allowedProperties = new Set<string>([
  "color",

  "backgroundColor",
  "backgroundImage",

  "opacity",

  "inline",
  "inlineColor",

  "outline",
  "outlineColor",

  "shadow",
  "shadowColor",

  "radius",

  "font",
  "textSize",
  "textWeight",
  "textStyle",
  "textShadow",
  "textAlign",
  "lineHeight",
  "letterSpacing",

  "backdropBlur",
  "blur",
  "scale",
  "transitionTime",
]);

const geometryProperties = new Set<string>([
  "display",
  "position",

  "width",
  "height",

  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",

  "grid",
  "gridArea",
  "gridColumn",
  "gridRow",

  "flex",
  "flexBasis",
  "flexDirection",
  "flexGrow",
  "flexShrink",

  "zIndex",

  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",

  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "contentPadding",

  "gap",
  "rowGap",
  "columnGap",

  "top",
  "right",
  "bottom",
  "left",
  "border",
    "borderColor",
]);

interface SourcePosition {
  line: number;
  column: number;
}

export function validatePaixStyle(
  style: PaixStyleNode,
  source: string,
): PaixDiagnostic[] {
  const diagnostics: PaixDiagnostic[] = [];

  validateProperties(
    style.properties,
    source,
    diagnostics,
  );

  for (const condition of style.conditions) {
    validateProperties(
      condition.properties,
      source,
      diagnostics,
    );
  }

  return diagnostics;
}

function validateProperties(
  properties: PaixStylePropertyNode[],
  source: string,
  diagnostics: PaixDiagnostic[],
): void {
  const declaredProperties =
    new Set<string>();

  for (const property of properties) {
    const position = findPropertyPosition(
      source,
      property.name,
    );

    if (
      declaredProperties.has(property.name)
    ) {
      diagnostics.push({
        source: "semantic",
        severity: "error",

        message:
          `Style property "${property.name}" ` +
          "is declared more than once in the same block.",

        line: position.line,
        column: position.column,
        length: property.name.length,
      });

      continue;
    }

    declaredProperties.add(property.name);

    if (
      geometryProperties.has(property.name)
    ) {
      diagnostics.push({
        source: "semantic",
        severity: "error",

        message:
          `"${property.name}" cannot be used ` +
          "inside a Paix style. Geometry belongs " +
          "to the wireframe.",

        line: position.line,
        column: position.column,
        length: property.name.length,
      });

      continue;
    }

    if (
      !allowedProperties.has(property.name)
    ) {
      diagnostics.push({
        source: "semantic",
        severity: "error",

        message:
          `Unknown Paix style property ` +
          `"${property.name}".`,

        line: position.line,
        column: position.column,
        length: property.name.length,
      });
    }
  }
}

function findPropertyPosition(
  source: string,
  propertyName: string,
): SourcePosition {
  const expression = new RegExp(
    `(^|\\n)[\\t ]*${escapeRegExp(
      propertyName,
    )}[\\t ]*:`,
  );

  const match = expression.exec(source);

  if (!match) {
    return {
      line: 1,
      column: 1,
    };
  }

  const propertyOffset =
    match.index +
    match[0].lastIndexOf(propertyName);

  const sourceBeforeProperty =
    source.slice(0, propertyOffset);

  const lines =
    sourceBeforeProperty.split(/\r?\n/);

  const currentLine =
    lines[lines.length - 1] ?? "";

  return {
    line: lines.length,
    column: currentLine.length + 1,
  };
}

function escapeRegExp(
  value: string,
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}