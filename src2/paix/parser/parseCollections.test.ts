import { describe, expect, test } from "vitest";
import { parsePaixComponent } from "./parseComponent";
import { parsePaixPage } from "./parse";

describe("Paix collections and object arguments", () => {
  test("parses collection literals, selectors and mixed object/named arguments", () => {
    const result = parsePaixComponent(`component "Catalogue" Frame
state:
    _PRODUCTS: [
        { id: 333, name: "Aurora", profile: { city: "Mexico" } },
        { id: 334, name: "Atlas" }
    ]
main.slots > [
    Button(_PRODUCTS{1}),
    Button(_PRODUCTS{id: 333}, label: "Open"),
    Text(value: _PRODUCTS{id: 333}.profile.city otherwise "Unknown")
]`);
    expect(result.diagnostics).toEqual([]);
    expect(result.ast?.states[0].initialValue).toMatchObject({ type: "ArrayExpression", items: [{ type: "ObjectExpression" }, { type: "ObjectExpression" }] });
    const placement = result.ast?.placements[0];
    if (placement?.type !== "StackPlacement") throw new Error("Expected stack");
    expect(placement.stack.items[1].arguments).toMatchObject([
      { type: "ObjectArgument", value: { type: "SelectorExpression", criteria: [{ name: "id", value: 333 }] } },
      { type: "Argument", name: "label", value: "Open" },
    ]);
  });
  test("parses nested input members and filter chains", () => {
    const result = parsePaixComponent(`component "Profile" Frame
main > Text(value: this.user.location.city)`);
    expect(result.diagnostics).toEqual([]);
    const placement = result.ast?.placements[0];
    if (placement?.type !== "Placement") throw new Error("Expected placement");
    expect(placement.component.arguments[0].value).toEqual({ type: "MemberExpression", object: { type: "MemberExpression", object: { type: "InputReference", name: "user" }, property: "location" }, property: "city" });
    expect(parsePaixComponent(`component "Filter" Frame
main > Text(value: this.users{category: "women", enabled: true}{1}.name)`).diagnostics).toEqual([]);
  });
  test("parses object literals as positional and named inputs on a page", () => {
    const result = parsePaixPage(`page "home" Frame
main > Button({ label: "Buy", disabled: false }, label: "Open")`);
    expect(result.diagnostics).toEqual([]);
  });
  test("reports duplicate ids and invalid collection contents", () => {
    for (const value of ['[{ id: 1 }, { id: 1 }]', '[{ name: "No id" }]', '[3]', 'false']) {
      const result = parsePaixComponent(`component "Invalid" Frame\nstate:\n    _USERS: ${value}`);
      expect(result.ast).toBeNull();
      expect(result.diagnostics[0]).toMatchObject({ source: "semantic", line: 3 });
    }
  });
  test("allows empty collections and preserves ordinary state defaults", () => {
    expect(parsePaixComponent(`component "Empty" Frame
state:
    _USERS: []
    _count: 0
    _selected: false`).diagnostics).toEqual([]);
  });
});
