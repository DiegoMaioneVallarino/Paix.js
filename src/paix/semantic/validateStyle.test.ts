import { describe, expect, test } from "vitest";
import { validatePaixStyle } from "./validateStyle";
import type { PaixStyleNode, PaixStylePropertyNode } from "../ast/ast.types";
const property = (name: string, value = "2"): PaixStylePropertyNode => ({ type: "StyleProperty", name, value });
const style = (properties: PaixStylePropertyNode[]): PaixStyleNode => ({ type: "Style", name: "Panel", properties, conditions: [] });
describe("Paix style validation", () => {
  test("accepts separated visual properties", () => {
    expect(validatePaixStyle(style([
      property("shadowWeight", "12"), property("shadowSpread"), property("shadowColor", "black"),
      property("outlineWeight", "0"), property("outlineSpread"), property("outlineColor", "gradient right from cyan to blue"),
      property("inlineWeight", "0"), property("inlineSpread"), property("inlineColor", "white"),
    ]), "")).toEqual([]);
  });
  test("rejects all padding and external geometry", () => {
    const names = ["padding", "contentPadding", "margin", "width", "height", "position", "grid", "flex", "border"];
    const diagnostics = validatePaixStyle(style(names.map(name => property(name))), "");
    expect(diagnostics).toHaveLength(names.length);
    expect(diagnostics.every(diagnostic => diagnostic.message.includes("Geometry belongs"))).toBe(true);
  });
  test("rejects mixed legacy properties and invalid weights", () => {
    expect(validatePaixStyle(style([property("shadow", "soft black"), property("outline"), property("inline"), property("shadowBlur")]), "")).toHaveLength(4);
    expect(validatePaixStyle(style([property("shadowWeight", "-1"), property("outlineSpread", "red"), property("inlineWeight", "2px")]), "")).toHaveLength(2);
  });
  test("validates conditional blocks and duplicate properties", () => {
    const node = style([property("color", "white")]);
    node.conditions = [{ type: "StyleCondition", condition: { type: "Reference", name: "_selected", kind: "state" }, properties: [property("padding"), property("color", "cyan"), property("color", "blue")] }];
    expect(validatePaixStyle(node, "")).toHaveLength(2);
  });
});
