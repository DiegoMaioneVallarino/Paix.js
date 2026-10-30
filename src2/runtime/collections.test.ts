import { describe, expect, test } from "vitest";
import { parsePaixComponent } from "../paix/parser/parseComponent";
import { evaluateExpression, PAIX_INPUTS_SCOPE_KEY } from "./evaluateExpression";
import { validateCollectionValue } from "./collectionValues";
import { inferComponentInputs, resolveComponentArguments } from "./resolveComponentArguments";
import { createInitialState } from "./StateRuntime";
const users = [
  { id: 333, name: "Aurora", category: "women", enabled: false, location: { city: "Mexico" } },
  { id: 334, name: "Atlas", category: "men", enabled: true },
  { id: 335, name: "Nova", category: "women", enabled: true },
];
function expression(source: string) {
  const result = parsePaixComponent(`component "Test" Frame\nmain > Text(value: ${source})`);
  expect(result.diagnostics).toEqual([]);
  const placement = result.ast?.placements[0];
  if (placement?.type !== "Placement") throw new Error("Expected placement");
  return placement.component.arguments[0].value;
}
const evaluate = (source: string) => evaluateExpression(expression(source), { _USERS: users });
describe("collection evaluation", () => {
  test("uses 1-based positions and direct id lookup", () => {
    expect(evaluate('_USERS{1}.name')).toBe("Aurora");
    expect(evaluate('_USERS{id: 334}.name')).toBe("Atlas");
    expect(evaluate('_USERS{id: "333"}.name otherwise "Missing"')).toBe("Missing");
    expect(evaluate('_USERS{0}.name otherwise "Missing"')).toBe("Missing");
    expect(evaluate('_USERS{50}.name otherwise "Missing"')).toBe("Missing");
  });
  test("filters every match, preserves order and supports conjunction and chains", () => {
    expect(evaluate('_USERS{category: "women"}')).toEqual([users[0], users[2]]);
    expect(evaluate('_USERS{category: "women", enabled: true}{1}.name')).toBe("Nova");
    expect(evaluate('_USERS{category: "missing"}')).toEqual([]);
    expect(evaluate('_USERS{missing: absent}')).toEqual([]);
    expect(users).toHaveLength(3);
  });
  test("reads nested input objects, uses own properties and preserves false and zero", () => {
    expect(evaluateExpression(expression('this.user.location.city'), { [PAIX_INPUTS_SCOPE_KEY]: { user: users[0] } })).toBe("Mexico");
    expect(evaluate('_USERS{1}.enabled otherwise true')).toBe(false);
    expect(evaluate('_USERS{1}.constructor otherwise "Missing"')).toBe("Missing");
    expect(evaluate('_USERS{1}.location.missing.name otherwise 0')).toBe(0);
  });
  test("validates unique ids on initialization and accepts string ids independently", () => {
    expect(() => validateCollectionValue("_USERS", [{ id: 1 }, { id: "1" }])).not.toThrow();
    expect(() => validateCollectionValue("_USERS", [{ id: 1 }, { id: 1 }])).toThrow("duplicate id");
    expect(() => createInitialState([{ type: "State", name: "_USERS", initialValue: { type: "InputReference", name: "users" } }], { [PAIX_INPUTS_SCOPE_KEY]: { users: [{ id: 1 }, { id: 1 }] } })).toThrow("duplicate id");
  });
  test("infers object-compatible inputs from body, state initializers and styles", () => {
    const result = parsePaixComponent(`component "Card" Frame
state:
    _count: this.count otherwise 0
main > Text(value: this.user.name)`);
    if (!result.ast) throw new Error("Expected AST");
    const names = inferComponentInputs(result.ast, { type: "Style", name: "Panel", properties: [], conditions: [{ type: "StyleCondition", condition: { type: "InputReference", name: "selected" }, properties: [] }] });
    expect([...names].sort()).toEqual(["count", "selected", "user"]);
  });
  test("filters unnamed object inputs and prioritizes explicit arguments regardless of order", () => {
    const result = parsePaixComponent(`component "Test" Frame
main > Button(label: "Explicit", this.product)`);
    const placement = result.ast?.placements[0];
    if (placement?.type !== "Placement") throw new Error("Expected placement");
    const scope = { [PAIX_INPUTS_SCOPE_KEY]: { product: { id: 333, label: "From object", disabled: false, price: 99 } } };
    expect(resolveComponentArguments(placement.component, scope, new Set(["label", "disabled"]))).toEqual({ label: "Explicit", disabled: false });
    expect(() => resolveComponentArguments(placement.component, { [PAIX_INPUTS_SCOPE_KEY]: { product: users } }, new Set())).toThrow("expects an object");
    expect(resolveComponentArguments(placement.component, {}, new Set())).toEqual({ label: "Explicit" });
  });
});
