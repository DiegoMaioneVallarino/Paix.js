import type {
  PaixStyleNode,
  PaixStylePropertyNode,
} from "../paix/ast/ast.types";

import {
  evaluateExpression,
  type PaixScope,
} from "./evaluateExpression";

interface PaixStyleSheetProps {
  styles: Record<string, PaixStyleNode>;
}

export function PaixStyleSheet({
  styles,
}: PaixStyleSheetProps) {
  const css = Object.values(styles)
    .map(compileStyle)
    .join("\n");

  if (!css) {
    return null;
  }

  return (
    <style data-paix-style-sheet>
      {css}
    </style>
  );
}

export function resolvePaixStyleClasses(
  style: PaixStyleNode,
  scope: PaixScope,
): string {
  const baseClass = getStyleClassName(
    style.name,
  );

  const classes = [baseClass];

  style.conditions.forEach(
    (condition, index) => {
      const isActive = Boolean(
        evaluateExpression(
          condition.condition,
          scope,
        ),
      );

      if (isActive) {
        classes.push(
          `${baseClass}--when-${index}`,
        );
      }
    },
  );

  return classes.join(" ");
}

function compileStyle(
  style: PaixStyleNode,
): string {
  const baseClass = getStyleClassName(
    style.name,
  );

  const rules = [
    `.${baseClass}{${compileProperties(
      style.properties,
    )}}`,
  ];

  style.conditions.forEach(
    (condition, index) => {
      rules.push(
        `.${baseClass}--when-${index}{` +
          compileProperties(
            condition.properties,
          ) +
          "}",
      );
    },
  );

  return rules.join("\n");
}

function compileProperties(
  properties: PaixStylePropertyNode[],
): string {
  return properties
    .map(compileProperty)
    .filter(Boolean)
    .join("");
}

function compileProperty(
  property: PaixStylePropertyNode,
): string {
  const cssProperty = propertyMap[
    property.name
  ];

  if (!cssProperty) {
    return "";
  }

  const cssValue = normalizeValue(
    property.name,
    property.value,
  );

  return `${cssProperty}:${cssValue};`;
}

const propertyMap: Record<string, string> = {
  background: "background",
  color: "color",
  border: "border",
  radius: "border-radius",
  shadow: "box-shadow",
  opacity: "opacity",
  font: "font-family",
  fontSize: "font-size",
  fontWeight: "font-weight",
  textAlign: "text-align",
  padding: "padding",
  gap: "gap",
};

function normalizeValue(
  property: string,
  value: string,
): string {
  const trimmedValue = value.trim();

  if (property === "background") {
    return normalizeBackground(trimmedValue);
  }

  if (
    property === "radius" ||
    property === "fontSize" ||
    property === "padding" ||
    property === "gap"
  ) {
    return addPixelsToSingleNumber(
      trimmedValue,
    );
  }

  if (property === "border") {
    return normalizeBorder(trimmedValue);
  }

  if (property === "shadow") {
    return normalizeShadow(trimmedValue);
  }

  return trimmedValue;
}

function normalizeBackground(
  value: string,
): string {
  const gradientMatch = value.match(
    /^gradient\s+(.+?)\s+to\s+(.+)$/,
  );

  if (!gradientMatch) {
    return value;
  }

  const startColor = gradientMatch[1];
  const endColor = gradientMatch[2];

  return (
    `linear-gradient(135deg, ` +
    `${startColor}, ${endColor})`
  );
}

function normalizeBorder(
  value: string,
): string {
  const parts = value
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return `1px solid ${parts[0]}`;
  }

  if (/^\d+(?:\.\d+)?$/.test(parts[0])) {
    parts[0] = `${parts[0]}px`;
  }

  const borderStyles = new Set([
    "none",
    "solid",
    "dashed",
    "dotted",
    "double",
  ]);

  const hasBorderStyle = parts.some(
    (part) => borderStyles.has(part),
  );

  if (!hasBorderStyle) {
    parts.splice(1, 0, "solid");
  }

  return parts.join(" ");
}

function normalizeShadow(
  value: string,
): string {
  return value
    .split(/\s+/)
    .map((part) => {
      if (part === "0") {
        return part;
      }

      if (/^-?\d+(?:\.\d+)?$/.test(part)) {
        return `${part}px`;
      }

      return part;
    })
    .join(" ");
}

function addPixelsToSingleNumber(
  value: string,
): string {
  return /^\d+(?:\.\d+)?$/.test(value)
    ? `${value}px`
    : value;
}

function getStyleClassName(
  styleName: string,
): string {
  return (
    "paix-style-" +
    styleName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
  );
}