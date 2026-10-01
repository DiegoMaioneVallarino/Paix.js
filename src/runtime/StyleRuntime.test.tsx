import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { parsePaixStyle } from "../paix/parser/parseStyle";
import { validatePaixStyle } from "../paix/semantic/validateStyle";
import { compileStyle, PaixStyleSheet, resolvePaixStyleClasses } from "./StyleRuntime";
import type { PaixStyleNode } from "../paix/ast/ast.types";

function parse(source: string): PaixStyleNode {
  const result = parsePaixStyle(source);
  expect(result.diagnostics).toEqual([]);
  if (!result.ast) throw new Error("Expected style AST");
  expect(validatePaixStyle(result.ast, source)).toEqual([]);
  return result.ast;
}
describe("Paix visual style engine", () => {
  test("keeps text gradients separate from surface gradients and ring paints", () => {
    const style = parse(`style "Ink"
backgroundImage: gradient down from black to gray
color: gradient right from cyan to purple
inlineSpread: 2
inlineWeight: 0
inlineColor: gradient right from red to blue`);
    const html = renderToStaticMarkup(<PaixStyleSheet styles={{ Ink: style }} />);
    expect(html).toContain("background-clip:text");
    expect(html).toContain("--paix-text-gradient:linear-gradient(90deg, cyan, purple)");
    expect(html).toContain("background-image:linear-gradient(180deg, black, gray)");
    expect(html).toContain("--paix-inline-paint:linear-gradient(90deg, red, blue)");
  });
  test("compiles the three independent shadow and outline values", () => {
    const style = parse(`style "Panel"
shadowWeight: 12
shadowSpread: 3
shadowColor: black
outlineWeight: 0
outlineSpread: 2
outlineColor: gradient right from cyan to blue`);
    const css = compileStyle(style);
    expect(css).toContain("--paix-shadow-weight:12px;");
    expect(css).toContain("--paix-shadow-spread:3px;");
    expect(css).toContain("--paix-outline-width:2px;");
    expect(css).toContain("--paix-outline-paint:linear-gradient(90deg, cyan, blue)");
    expect(css).toContain("box-shadow:0 0 var(--paix-shadow-weight) var(--paix-shadow-spread) var(--paix-shadow-color)");
    expect(css).not.toContain("padding:");
  });
  test("compiles native pseudo states and supports forced preview modes", () => {
    const style = parse(`style "Panel"
color: white
when hover:
    color: cyan
when focus:
    outlineSpread: 2
when active:
    scale: 0.98`);
    const css = compileStyle(style);
    expect(css).toContain(".paix-style-panel:hover,.paix-style-panel--when-0");
    expect(css).toContain(".paix-style-panel:focus-within,.paix-style-panel--when-1");
    expect(css).toContain(".paix-style-panel:active,.paix-style-panel--when-2");
    expect(resolvePaixStyleClasses(style, {})).toBe("paix-style-panel");
    expect(resolvePaixStyleClasses(style, {}, "hover")).toBe("paix-style-panel paix-style-panel--when-0");
  });
  test("reads component state independently of the interaction mode", () => {
    const style = parse(`style "Panel"
color: white
when _selected:
    color: cyan`);
    expect(resolvePaixStyleClasses(style, { _selected: false })).toBe("paix-style-panel");
    expect(resolvePaixStyleClasses(style, { _selected: true })).toContain("--when-0");
  });
});
