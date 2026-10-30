// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, test } from "vitest";
import { cleanup, fireEvent, render, renderHook, act } from "@testing-library/react";
import { compilePaixProject } from "../paix/compiler/compile";
import { parsePaixComponent } from "../paix/parser/parseComponent";
import { collectionProject } from "../examples/collectionProject";
import { PaixRenderer } from "./PaixRenderer";
import { usePaixState } from "./StateRuntime";
import { evaluateExpression } from "./evaluateExpression";

afterEach(cleanup);

function compiled(source: string) {
  const project = structuredClone(collectionProject);
  // Keep a flat legacy fixture to verify compatibility with existing projects.
  delete project.files["components/CollectionDemo/CollectionDemo.paix"];
  project.files["components/CollectionDemo.paix"] = { id: "legacy-demo", path: "components/CollectionDemo.paix", name: "CollectionDemo.paix", type: "component", content: source };
  project.files["wireframes/CollectionFrame.paix"] = { id: "legacy-frame", path: "wireframes/CollectionFrame.paix", name: "CollectionFrame.paix", type: "wireframe", content: 'wireframe "CollectionFrame"\nmain slice grid 3x2' };
  const program = compilePaixProject(project);
  expect(program.diagnostics).toEqual([]);
  if (program.components.CollectionDemo.placements.every(placement => !placement.target.slots)) {
    program.wireframes.CollectionFrame = { type: "Wireframe", name: "CollectionFrame", slices: [] };
  }
  return program;
}
describe("collection inputs in rendered components", () => {
  test("renders the explicit stack, native matching fields, overrides and inferred style inputs", () => {
    const program = compilePaixProject(collectionProject);
    expect(program.diagnostics).toEqual([]);
    const view = render(<PaixRenderer program={program} />);
    expect(view.getByRole("button", { name: "Comprar Aurora" })).not.toHaveAttribute("price");
    expect(view.getByRole("button", { name: "Comprar Atlas" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Ver Nova" })).not.toBeDisabled();
    const cards = view.container.querySelectorAll('[data-paix-component="ProductCard"]');
    expect(cards).toHaveLength(6);
    expect(cards[0]).toHaveTextContent("AuroraPrecio: 120");
    expect(cards[0].className).toContain("--when-0");
    expect(cards[1].className).toContain("--when-1");
    expect(cards[2]).toHaveTextContent("NovaPrecio: 90");
  });
  test("updates selected object attributes reactively after set_PRODUCTS", () => {
    const program = compiled(`component "CollectionDemo" CollectionFrame
state:
    _PRODUCTS: [{ id: 333, label: "Original", disabled: false }]
main.slots > [
    Button(_PRODUCTS{id: 333}),
    Button(label: "Update", onClick: set_PRODUCTS([{ id: 333, label: "Updated", disabled: true }]))
]`);
    const view = render(<PaixRenderer program={program} />);
    fireEvent.click(view.getByRole("button", { name: "Update" }));
    expect(view.getByRole("button", { name: "Updated" })).toBeDisabled();
    expect(view.queryByRole("button", { name: "Original" })).toBeNull();
  });
  test("shows a local error for a collection supplied instead of a single object", () => {
    const view = render(<PaixRenderer program={compiled(`component "CollectionDemo" CollectionFrame
state:
    _PRODUCTS: [{ id: 333, label: "Aurora" }]
main > Button(_PRODUCTS)`) } />);
    expect(view.getByText(/expects an object as an unnamed argument/)).toBeTruthy();
  });
  test("rejects invalid setter updates without losing the previous collection", () => {
    const ast = parsePaixComponent(`component "CollectionDemo" CollectionFrame
state:
    _PRODUCTS: [{ id: 333, label: "Original" }]`).ast!;
    const hook = renderHook(() => usePaixState(ast.states, {}));
    const previous = hook.result.current.values._PRODUCTS;
    act(() => hook.result.current.setValue("_PRODUCTS", [{ id: 333 }, { id: 333 }]));
    expect(hook.result.current.values._PRODUCTS).toBe(previous);
    expect(hook.result.current.error).toContain("duplicate id");
    act(() => hook.result.current.setValue("_PRODUCTS", []));
    expect(hook.result.current.values._PRODUCTS).toEqual([]);
    expect(hook.result.current.error).toBeNull();
  });
  test("can pass whole nested objects by name without declaring parameters", () => {
    const program = compiled(`component "CollectionDemo" CollectionFrame
main > ProductCard(name: "Nested", price: 0)`);
    program.components.ProductCard.placements[0] = {
      type: "Placement", target: { type: "AreaReference", path: "nameArea", segments: ["nameArea"], slots: false },
      component: { type: "Component", name: "Text", arguments: [{ type: "Argument", name: "value", state: false, value: { type: "MemberExpression", object: { type: "InputReference", name: "user" }, property: "name" } }] },
    };
    const parsed = parsePaixComponent(`component "CollectionDemo" CollectionFrame
main > ProductCard({ user: { name: "Nested user" }, ignored: "Do not pass" })`).ast!;
    program.components.CollectionDemo = parsed;
    const view = render(<PaixRenderer program={program} />);
    expect(view.getByText("Nested user")).toBeTruthy();
    expect(evaluateExpression({ type: "MemberExpression", object: { type: "ObjectExpression", properties: [{ name: "value", value: 0 }] }, property: "value" }, {})).toBe(0);
  });
});
