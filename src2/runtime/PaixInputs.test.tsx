import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { PaixArgumentNode, PaixComponentDefinitionNode, PaixExpressionNode } from "../paix/ast/ast.types";
import type { PaixCompiledProject } from "../paix/compiler/compiled.types";
import { PaixRenderer } from "./PaixRenderer";

const target = { type: "AreaReference" as const, path: "main", segments: ["main"], slots: false };
const input: PaixExpressionNode = { type: "InputReference", name: "value" };
const argument = (name: string, value: PaixExpressionNode): PaixArgumentNode => ({ type: "Argument", name, state: false, value });
function definition(value: PaixExpressionNode): PaixComponentDefinitionNode {
  return { type: "ComponentDefinition", name: "Card", wireframe: "Frame", style: null, states: [], placements: [{ type: "Placement", target, component: { type: "Component", name: "Text", arguments: [argument("value", value)] } }] };
}
function program(component: PaixComponentDefinitionNode, args: PaixArgumentNode[] = []): PaixCompiledProject {
  return { diagnostics: [], styles: {}, wireframes: { Frame: { type: "Wireframe", name: "Frame", slices: [] } }, components: { [component.name]: component }, entryPage: { type: "Page", name: "home", wireframe: "Frame", placements: [{ type: "Placement", target, component: { type: "Component", name: component.name, arguments: args } }] } };
}
const render = (compiled: PaixCompiledProject) => renderToStaticMarkup(<PaixRenderer program={compiled} />);
describe("Paix inputs without declarations", () => {
  test("reads a supplied named attribute directly", () => {
    expect(render(program(definition(input), [argument("value", "Aurora")]))).toContain(">Aurora</span>");
  });
  test("applies a local fallback only when the attribute is missing", () => {
    const component = definition({ type: "OtherwiseExpression", value: input, fallback: "Default title" });
    expect(render(program(component))).toContain("Default title");
    expect(render(program(component, [argument("value", false)]))).toContain(">false</span>");
    expect(render(program(component, [argument("value", 0)]))).toContain(">0</span>");
  });
  test("can initialize an internal state from an input", () => {
    const component = definition({ type: "Reference", name: "_count", kind: "state" });
    component.states = [{ type: "State", name: "_count", initialValue: { type: "OtherwiseExpression", value: input, fallback: 0 } }];
    expect(render(program(component, [argument("value", 7)]))).toContain(">7</span>");
  });
  test("forwards named attributes explicitly to a nested component", () => {
    const card = definition(input);
    const wrapper: PaixComponentDefinitionNode = { type: "ComponentDefinition", name: "Wrapper", wireframe: "Frame", style: null, states: [], placements: [{ type: "Placement", target, component: { type: "Component", name: "Card", arguments: [argument("value", input)] } }] };
    const compiled = program(wrapper, [argument("value", "Nested title")]);
    compiled.components.Card = card;
    expect(render(compiled)).toContain(">Nested title</span>");
  });
});
