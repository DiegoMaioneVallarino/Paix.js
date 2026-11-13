import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { compilePaixProject } from "./compile";
import { composeStyle } from "./styleTags";
import { parsePaixPage } from "../parser/parse";
import { parsePaixStyle } from "../parser/parseStyle";
import { PaixRenderer } from "../../runtime/PaixRenderer";
import { compileStyle, resolvePaixStyleClasses } from "../../runtime/StyleRuntime";
import type { PaixFileType, PaixProject } from "../../project/project.types";

function project(extra: Array<[string, PaixFileType, string]> = []): PaixProject {
  const files: Array<[string, PaixFileType, string]> = [
    ["pages/home.paix", "page", 'page "home" Main\nmain >\n    Card(styles: Red, Rounded)'],
    ["wireframes/Main.paix", "wireframe", 'wireframe "Main"'],
    ["components/Card/Card.paix", "component", 'main >\n    Text(value: "Hello")'],
    ["components/Card/Card.frame.paix", "wireframe", 'wireframe "CardFrame"'],
    ["components/Card/Card.style.paix", "style", 'styles: Rounded\ncolor: blue\nwhen states.selected:\n    styles: Active'],
    ["components/Card/Card.actions.paix", "action", 'states:\n    selected: true'],
    ["styles/shared.paix", "style", 'tag Red:\n    color: red\ntag Rounded:\n    radius: 12\ntag Active:\n    color: lime'],
    ...extra,
  ];
  return { id: "tags", name: "tags", entry: "pages/home.paix", files: Object.fromEntries(files.map(([path, type, content]) => [path, { id: path, path, name: path.split("/").at(-1)!, type, content }])) };
}
const values = (properties: NonNullable<ReturnType<typeof composeStyle>>["properties"]) => Object.fromEntries(properties.map(p => [p.name, p.value]));

describe("shared accumulated style tags", () => {
  test("parses tag lists followed by another named argument", () => {
    const parsed = parsePaixPage('page "home" Main\nmain >\n    Button(styles: Red, Rounded, label: "Save")');
    expect(parsed.diagnostics).toEqual([]);
    const placement = parsed.ast!.placements[0];
    if (placement.type !== "Placement") throw new Error("Expected placement");
    expect(placement.component.arguments.map(a => a.type === "Argument" ? a.name : "spread")).toEqual(["styles", "label"]);
    expect(placement.component.arguments[0].value).toEqual({ type: "ArrayExpression", items: ["Red", "Rounded"] });
  });
  test("expands dependencies regardless of file order and overlays local properties", () => {
    const result = compilePaixProject(project([
      ["styles/first.paix", "style", 'tag Glass:\n    styles: Red, Rounded\n    color: white'],
      ["components/Card/Card.style.paix", "style", 'styles: Glass\ncolor: yellow'],
    ]));
    expect(result.diagnostics).toEqual([]);
    expect(values(result.tags!.Glass.properties)).toEqual({ color: "white", radius: "12" });
    expect(values(result.styles["Card.style"].properties)).toEqual({ color: "yellow", radius: "12" });
  });
  test("keeps instance composition independent and variants last", () => {
    const result = compilePaixProject(project());
    expect(result.diagnostics).toEqual([]);
    const base = result.styles["Card.style"];
    const first = composeStyle(base, ["Red", "Active"], result.tags!)!;
    const second = composeStyle(base, ["Active", "Red"], result.tags!)!;
    expect(values(first.properties).color).toBe("lime");
    expect(values(second.properties).color).toBe("red");
    expect(first.name).not.toBe(second.name);
    expect(values(base.properties).color).toBe("blue");
    expect(resolvePaixStyleClasses(second, { _selected: true })).toContain("--when-0");
    expect(compileStyle(second).lastIndexOf("color:lime")).toBeGreaterThan(compileStyle(second).indexOf("color:red"));
    const html = renderToStaticMarkup(<PaixRenderer program={result} />);
    expect(html).toContain('data-paix-component="Card"');
    expect(html).toContain("--when-0");
    expect(html).toContain("color:red");
    expect(html).toContain("border-radius:var(--paix-radius)");
  });
  test("applies tags to primitives without forwarding a styles DOM attribute", () => {
    const result = compilePaixProject(project([["pages/home.paix", "page", 'page "home" Main\nmain >\n    Button(styles: Red, Rounded, label: "Save")']]));
    expect(result.diagnostics).toEqual([]);
    const html = renderToStaticMarkup(<PaixRenderer program={result} />);
    expect(html).toContain("paix-button paix-style-composition-");
    expect(html).toContain("Save");
    expect(html).not.toContain(' styles=');
  });
  test.each([
    ['tag Bad:\n    styles: Missing', 'Unknown style tag'],
    ['tag A:\n    styles: B\ntag B:\n    styles: A', 'Circular style tags'],
    ['tag Red:\n    color: black', 'declared more than once'],
    ['tag Bad:\n    padding: 8', 'Geometry belongs'],
    ['tag Bad:\n    styles: Red Rounded', 'separated by commas'],
  ])("rejects invalid shared definitions: %s", (source, message) => {
    const result = compilePaixProject(project([["styles/bad.paix", "style", source]]));
    expect(result.diagnostics.some(d => d.message.includes(message))).toBe(true);
  });
  test("rejects component exports and unknown invocation tags", () => {
    const result = compilePaixProject(project([
      ["components/Card/Card.style.paix", "style", 'tag Private:\n    color: red'],
      ["pages/home.paix", "page", 'page "home" Main\nmain >\n    Button(styles: Unknown)'],
    ]));
    expect(result.diagnostics.some(d => d.message.includes("component style sheets cannot export"))).toBe(true);
    expect(result.diagnostics.some(d => d.message.includes('Unknown style tag "Unknown"'))).toBe(true);
  });
  test("rejects conditions inside shared tags", () => {
    expect(parsePaixStyle('tag Red:\n    when hover:\n        color: red').diagnostics[0].message).toContain("keep conditions");
  });
});
