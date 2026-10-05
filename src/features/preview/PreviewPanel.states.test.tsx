// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PaixCompiledProject } from "../../paix/compiler/compiled.types";
import { PreviewPanel } from "./PreviewPanel";

vi.mock("../../runtime/WireframeRenderer", () => ({ WireframeRenderer: ({ renderArea }: { renderArea?: (name: string) => import("react").ReactNode }) => <div>{renderArea?.("main")}</div> }));
vi.mock("../../standard-library/registerStandardLibrary", () => ({ registerStandardLibrary: () => {} }));
vi.mock("../../runtime/ComponentRegistry", () => ({ componentRegistry: { get: () => undefined } }));
afterEach(cleanup);
const program: PaixCompiledProject = {
  entryPage: null, diagnostics: [],
  wireframes: { Frame: { type: "Wireframe", name: "Frame", slices: [] } },
  components: {},
  styles: { Panel: { type: "Style", name: "Panel", properties: [], conditions: [
    { type: "StyleCondition", condition: { type: "Reference", name: "hover", kind: "value" }, properties: [{ type: "StyleProperty", name: "color", value: "cyan" }] },
    { type: "StyleCondition", condition: { type: "Reference", name: "_selected", kind: "state" }, properties: [{ type: "StyleProperty", name: "color", value: "blue" }] },
  ] } },
};
const definition: import("../../paix/ast/ast.types").PaixComponentDefinitionNode = { type: "ComponentDefinition", name: "Card", wireframe: "Frame", style: "Panel", states: [{ type: "State", name: "_selected", initialValue: false }], placements: [] };
describe("Preview states and interaction", () => {
  test("edits a real component state and switches the forced interaction mode", async () => {
    const { container } = render(<PreviewPanel program={program} activeFileType="component" inspectedComponent={definition} inspectedStyle={null} inspectedWireframe={null} />);
    const input = await screen.findByLabelText("_selected");
    fireEvent.click(input);
    await waitFor(() => expect(container.querySelector('[data-paix-component="Card"]')?.className).toContain("--when-1"));
    fireEvent.change(screen.getByLabelText("Modo visual"), { target: { value: "hover" } });
    expect(container.querySelector('[data-paix-component="Card"]')?.className).toContain("--when-0");
    fireEvent.change(screen.getByLabelText("Modo visual"), { target: { value: "normal" } });
    expect(container.querySelector('[data-paix-component="Card"]')?.className).not.toContain("--when-0");
    expect(container.querySelector('[data-paix-component="Card"]')?.className).toContain("--when-1");
  });
  test("exposes sample state values when inspecting a style file", async () => {
    const { container } = render(<PreviewPanel program={program} activeFileType="style" inspectedComponent={null} inspectedStyle={program.styles.Panel} inspectedWireframe={null} />);
    fireEvent.click(await screen.findByLabelText("_selected"));
    await waitFor(() => expect(container.querySelector(".paix-style-preview-surface")?.className).toContain("--when-1"));
    expect(screen.getByText("Preview text")).toBeTruthy();
  });
});
