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
  const baseClass =
    getStyleClassName(style.name);

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
  const baseClass =
    getStyleClassName(style.name);

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
  const values = new Map(
    properties.map((property) => [
      property.name,
      property.value.trim(),
    ]),
  );

  const regularProperties = properties
    .map(compileProperty)
    .filter(Boolean)
    .join("");

  const boxShadow =
    compileBoxShadow(values);

  return (
    regularProperties +
    (boxShadow
      ? `box-shadow:${boxShadow};`
      : "")
  );
}

function compileProperty(
  property: PaixStylePropertyNode,
): string {
  const value = property.value.trim();

  switch (property.name) {
    /*
     * Superficie
     */

    case "color":
      return `color:${value};`;

    case "backgroundColor":
      return `background-color:${value};`;

    case "backgroundImage":
      return (
        `background-image:` +
        `${normalizeBackgroundImage(value)};`
      );

    case "opacity":
      return `opacity:${value};`;

    case "radius":
      return (
        `border-radius:` +
        `${normalizeLength(value)};`
      );

    /*
     * Estas propiedades se combinan
     * en compileBoxShadow().
     */

    case "inline":
    case "inlineColor":
    case "outline":
    case "outlineColor":
    case "shadow":
    case "shadowColor":
      return "";

    /*
     * Texto
     */

    case "font":
      return `font-family:${value};`;

    case "textSize":
      return (
        `font-size:` +
        `${normalizeLength(value)};`
      );

    case "textWeight":
      return `font-weight:${value};`;

    case "textStyle":
      return `font-style:${value};`;

    case "textShadow":
      return (
        `text-shadow:` +
        `${normalizeTextShadow(value)};`
      );

    case "textAlign":
      return `text-align:${value};`;

    case "lineHeight":
      return `line-height:${value};`;

    case "letterSpacing":
      return (
        `letter-spacing:` +
        `${normalizeLength(value)};`
      );

    /*
     * Efectos
     */

    case "backdropBlur":
      return (
        `backdrop-filter:` +
        `${normalizeBlur(value)};` +
        `-webkit-backdrop-filter:` +
        `${normalizeBlur(value)};`
      );

    case "blur":
      return (
        `filter:` +
        `${normalizeBlur(value)};`
      );

    case "scale":
      return (
        `transform:` +
        `${normalizeScale(value)};`
      );

    case "transitionTime":
      return (
        `transition:` +
        `${normalizeTransitionTime(value)};`
      );

    default:
      return "";
  }
}

function compileBoxShadow(
  values: Map<string, string>,
): string {
  const layers: string[] = [];

  const inline =
    values.get("inline");

  if (
    inline &&
    inline !== "none" &&
    inline !== "0"
  ) {
    const inlineColor =
      values.get("inlineColor") ??
      "currentColor";

    layers.push(
      `inset 0 0 0 ` +
        `${normalizeLength(inline)} ` +
        `${inlineColor}`,
    );
  }

  const outline =
    values.get("outline");

  if (
    outline &&
    outline !== "none" &&
    outline !== "0"
  ) {
    const outlineColor =
      values.get("outlineColor") ??
      "currentColor";

    layers.push(
      `0 0 0 ` +
        `${normalizeLength(outline)} ` +
        `${outlineColor}`,
    );
  }

  const shadow =
    values.get("shadow");

  if (
    shadow &&
    shadow !== "none"
  ) {
    const shadowColor =
      values.get("shadowColor");

    layers.push(
      normalizeBoxShadow(
        shadow,
        shadowColor,
      ),
    );
  }

  return layers.join(", ");
}

function normalizeBoxShadow(
  value: string,
  configuredColor?: string,
): string {
  const parts = value
    .split(/\s+/)
    .filter(Boolean);

  const preset = parts[0];

  const color =
    configuredColor ??
    parts.slice(1).join(" ") ??
    "black";

  const resolvedColor =
    color || "black";

  switch (preset) {
    case "soft":
      return (
        `0 6px 18px ` +
        `${resolvedColor}`
      );

    case "strong":
      return (
        `0 14px 40px ` +
        `${resolvedColor}`
      );

    case "inner":
      return (
        `inset 0 0 14px ` +
        `${resolvedColor}`
      );

    case "glow":
      return (
        `0 0 20px ` +
        `${resolvedColor}`
      );

    default:
      return normalizeAdvancedShadow(
        value,
      );
  }
}

function normalizeTextShadow(
  value: string,
): string {
  if (value === "none") {
    return "none";
  }

  const parts = value
    .split(/\s+/)
    .filter(Boolean);

  const preset = parts[0];

  const color =
    parts.slice(1).join(" ") ||
    "black";

  switch (preset) {
    case "soft":
      return `0 2px 6px ${color}`;

    case "strong":
      return `0 3px 10px ${color}`;

    case "glow":
      return `0 0 10px ${color}`;

    default:
      return normalizeAdvancedShadow(
        value,
      );
  }
}

function normalizeAdvancedShadow(
  value: string,
): string {
  return value
    .split(/\s+/)
    .map((part) => {
      if (part === "0") {
        return part;
      }

      if (
        /^-?\d+(?:\.\d+)?$/.test(part)
      ) {
        return `${part}px`;
      }

      return part;
    })
    .join(" ");
}

function normalizeBackgroundImage(
  value: string,
): string {
  if (value === "none") {
    return "none";
  }

  const radial = value.match(
    /^radial\s+gradient\s+from\s+(.+?)\s+to\s+(.+)$/,
  );

  if (radial) {
    return (
      `radial-gradient(circle, ` +
      `${radial[1]}, ${radial[2]})`
    );
  }

  const right = value.match(
    /^gradient\s+right\s+from\s+(.+?)\s+to\s+(.+)$/,
  );

  if (right) {
    return (
      `linear-gradient(90deg, ` +
      `${right[1]}, ${right[2]})`
    );
  }

  const down = value.match(
    /^gradient\s+down\s+from\s+(.+?)\s+to\s+(.+)$/,
  );

  if (down) {
    return (
      `linear-gradient(180deg, ` +
      `${down[1]}, ${down[2]})`
    );
  }

  const defaultGradient = value.match(
    /^gradient\s+from\s+(.+?)\s+to\s+(.+)$/,
  );

  if (defaultGradient) {
    return (
      `linear-gradient(135deg, ` +
      `${defaultGradient[1]}, ` +
      `${defaultGradient[2]})`
    );
  }

  return normalizeCssFunctions(value);
}

function normalizeBlur(
  value: string,
): string {
  if (value === "none") {
    return "none";
  }

  return `blur(${normalizeLength(value)})`;
}

function normalizeScale(
  value: string,
): string {
  if (value === "none") {
    return "none";
  }

  return `scale(${value})`;
}

function normalizeTransitionTime(
  value: string,
): string {
  if (value === "none") {
    return "none";
  }

  if (value === "fast") {
    return "all 120ms ease-out";
  }

  if (value === "smooth") {
    return "all 180ms ease";
  }

  if (value === "slow") {
    return "all 320ms ease-in-out";
  }

  if (
    /^\d+(?:\.\d+)?$/.test(value)
  ) {
    return `all ${value}ms ease`;
  }

  return value;
}

function normalizeLength(
  value: string,
): string {
  return /^-?\d+(?:\.\d+)?$/.test(value)
    ? `${value}px`
    : value;
}

function normalizeCssFunctions(
  value: string,
): string {
  return value
    .replace(/\s+\(/g, "(")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*,\s*/g, ", ");
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