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

export function PaixStyleSheet({ styles }: PaixStyleSheetProps) {
  const css = Object.values(styles).map(compileStyle).join("\n");
  return css ? <style data-paix-style-sheet>{css}</style> : null;
}

export function resolvePaixStyleClasses(
  style: PaixStyleNode,
  scope: PaixScope,
): string {
  const baseClass = getStyleClassName(style.name);
  const classes = [baseClass];

  style.conditions.forEach((condition, index) => {
    if (Boolean(evaluateExpression(condition.condition, scope))) {
      classes.push(`${baseClass}--when-${index}`);
    }
  });

  return classes.join(" ");
}

function compileStyle(style: PaixStyleNode): string {
  const baseClass = getStyleClassName(style.name);
  const base = `.${baseClass}`;

  const rules = [
    `${base}{position:relative;--paix-outline-width:0px;--paix-inline-width:0px;--paix-outline-paint:transparent;--paix-inline-paint:transparent;--paix-shadow-color:black;${compileProperties(style.properties)}}`,
    `${base}::before,${base}::after{content:"";position:absolute;box-sizing:border-box;pointer-events:none;border-style:solid;border-color:transparent;background-clip:border-box;mask:linear-gradient(#000 0 0) border-box,linear-gradient(#000 0 0) padding-box;mask-composite:exclude;-webkit-mask:linear-gradient(#fff 0 0) border-box,linear-gradient(#fff 0 0) padding-box;-webkit-mask-composite:xor;}`,
    `${base}::before{inset:0;border-width:var(--paix-outline-width);border-radius:inherit;background:var(--paix-outline-paint) border-box;}`,
    `${base}::after{inset:var(--paix-outline-width);border-width:var(--paix-inline-width);border-radius:max(0px,calc(var(--paix-radius,0px) - var(--paix-outline-width)));background:var(--paix-inline-paint) border-box;}`,
  ];

  style.conditions.forEach((condition, index) => {
    rules.push(
      `${base}--when-${index}{${compileProperties(condition.properties)}}`,
    );
  });

  return rules.join("\n");
}

function compileProperties(properties: PaixStylePropertyNode[]): string {
  const declarations = properties
    .filter((property) => property.name !== "shadowColor")
    .map(compileProperty).filter(Boolean).join("");
  const shadowColor = [...properties].reverse()
    .find((property) => property.name === "shadowColor");

  return declarations + (shadowColor
    ? `--paix-shadow-color:${shadowColor.value.trim()};`
    : "");
}

function compileProperty(property: PaixStylePropertyNode): string {
  const value = property.value.trim();

  switch (property.name) {
    case "color":
      return `color:${value};`;
    case "backgroundColor":
      return `background-color:${value};`;
    case "backgroundImage":
      return `background-image:${normalizeBackgroundImage(value)};`;
    case "opacity":
      return `opacity:${value};`;
    case "radius":
      return `--paix-radius:${normalizeLength(value)};border-radius:var(--paix-radius);`;

    // Ambos anillos son capas visuales dentro del rectángulo del componente.
    case "outline":
      return `--paix-outline-width:${normalizeRingWidth(value)};`;
    case "outlineColor":
      return `--paix-outline-paint:${normalizePaint(value)};`;
    case "inline":
      return `--paix-inline-width:${normalizeRingWidth(value)};`;
    case "inlineColor":
      return `--paix-inline-paint:${normalizePaint(value)};`;

    case "shadow":
      return `--paix-shadow-color:${value.split(/\s+/).slice(1).join(" ") || "black"};box-shadow:${normalizeBoxShadow(value)};`;
    case "shadowColor":
      return `--paix-shadow-color:${value};`;
    case "shadowBlur":
      return `--paix-shadow-blur:${normalizeLength(value)};`;

    case "font":
      return `font-family:${value};`;
    case "textSize":
      return `font-size:${normalizeLength(value)};`;
    case "textWeight":
      return `font-weight:${value};`;
    case "textStyle":
      return `font-style:${value};`;
    case "textShadow":
      return `text-shadow:${normalizeTextShadow(value)};`;
    case "textAlign":
      return `text-align:${value};`;
    case "lineHeight":
      return `line-height:${value};`;
    case "letterSpacing":
      return `letter-spacing:${normalizeLength(value)};`;

    case "backdropBlur":
      return `backdrop-filter:${normalizeBlur(value)};-webkit-backdrop-filter:${normalizeBlur(value)};`;
    case "blur":
      return `filter:${normalizeBlur(value)};`;
    case "scale":
      return `transform:${normalizeScale(value)};`;
    case "transitionTime":
      return `transition:${normalizeTransitionTime(value)};`;
    default:
      return "";
  }
}

function normalizeRingWidth(value: string): string {
  return value === "none" ? "0px" : normalizeLength(value);
}

function normalizePaint(value: string): string {
  return value === "none" ? "transparent" : normalizeBackgroundImage(value);
}

function normalizeBoxShadow(value: string): string {
  if (value === "none") return "none";

  const parts = value.split(/\s+/).filter(Boolean);
  const color = "var(--paix-shadow-color)";

  switch (parts[0]) {
    case "soft":
      return `0 6px var(--paix-shadow-blur,18px) ${color}`;
    case "strong":
      return `0 14px var(--paix-shadow-blur,40px) ${color}`;
    case "inner":
      return `inset 0 0 var(--paix-shadow-blur,14px) ${color}`;
    case "glow":
      return `0 0 var(--paix-shadow-blur,20px) ${color}`;
    default:
      return normalizeAdvancedShadow(value);
  }
}

function normalizeTextShadow(value: string): string {
  if (value === "none") return "none";
  const parts = value.split(/\s+/).filter(Boolean);
  const color = parts.slice(1).join(" ") || "black";

  switch (parts[0]) {
    case "soft":
      return `0 2px 6px ${color}`;
    case "strong":
      return `0 3px 10px ${color}`;
    case "glow":
      return `0 0 10px ${color}`;
    default:
      return normalizeAdvancedShadow(value);
  }
}

function normalizeAdvancedShadow(value: string): string {
  return value.split(/\s+/).map((part) => {
    if (part === "0") return part;
    return /^-?\d+(?:\.\d+)?$/.test(part) ? `${part}px` : part;
  }).join(" ");
}

function normalizeBackgroundImage(value: string): string {
  if (value === "none") return "none";

  const radial = value.match(/^radial\s+gradient\s+from\s+(.+?)\s+to\s+(.+)$/);
  if (radial) return `radial-gradient(circle, ${radial[1]}, ${radial[2]})`;

  const right = value.match(/^gradient\s+right\s+from\s+(.+?)\s+to\s+(.+)$/);
  if (right) return `linear-gradient(90deg, ${right[1]}, ${right[2]})`;

  const down = value.match(/^gradient\s+down\s+from\s+(.+?)\s+to\s+(.+)$/);
  if (down) return `linear-gradient(180deg, ${down[1]}, ${down[2]})`;

  const standard = value.match(/^gradient\s+from\s+(.+?)\s+to\s+(.+)$/);
  if (standard) return `linear-gradient(135deg, ${standard[1]}, ${standard[2]})`;

  return normalizeCssFunctions(value);
}

function normalizeBlur(value: string): string {
  return value === "none" ? "none" : `blur(${normalizeLength(value)})`;
}

function normalizeScale(value: string): string {
  return value === "none" ? "none" : `scale(${value})`;
}

function normalizeTransitionTime(value: string): string {
  if (value === "none") return "none";
  if (value === "fast") return "all 120ms ease-out";
  if (value === "smooth") return "all 180ms ease";
  if (value === "slow") return "all 320ms ease-in-out";
  if (/^\d+(?:\.\d+)?$/.test(value)) return `all ${value}ms ease`;
  return value;
}

function normalizeLength(value: string): string {
  return /^-?\d+(?:\.\d+)?$/.test(value) ? `${value}px` : value;
}

function normalizeCssFunctions(value: string): string {
  return value.replace(/\s+\(/g, "(").replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")").replace(/\s*,\s*/g, ", ");
}

function getStyleClassName(styleName: string): string {
  return "paix-style-" + styleName.trim().toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
}
