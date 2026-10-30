import { describe, expect, test } from "vitest";
import { parsePaixComponent } from "./parseComponent";
import { parsePaixActions } from "./parseActions";
import { parsePaixStyle } from "./parseStyle";
import { evaluateExpression } from "../../runtime/evaluateExpression";
import { compilePaixProject } from "../compiler/compile";
import { counterProject } from "../../examples/counterProject";
import { collectionProject } from "../../examples/collectionProject";
import { createComponentActions } from "../../runtime/componentActions";
import { createInitialState } from "../../runtime/StateRuntime";

const path = "components/Counter/Counter.paix";
describe("Readable component syntax", () => {
  test("infers identity and accepts spaces, inputs, states, references and newline arguments", () => {
    const result = parsePaixComponent(`main.spaces >
    Button(
        label: inputs.label / "Add"
        onClick: actions.add
    )
    Text(value: states.count)
footer >
    Text(value: "footer")`, path);
    expect(result.diagnostics).toEqual([]);
    expect(result.ast?.name).toBe("Counter");
    expect(result.ast?.wireframe).toBe("Counter.frame");
    expect(result.ast?.placements).toHaveLength(2);
    const stack = result.ast!.placements[0];
    if (stack.type !== "StackPlacement") throw new Error("Expected stack");
    expect(stack.stack.items).toHaveLength(2);
    expect(stack.target.slots).toBe(true);
    expect(stack.stack.items[0].arguments[1].value).toEqual({ type: "MemberExpression", object: { type: "Reference", name: "actions", kind: "value" }, property: "add" });
  });
  test("requires indentation after a multiline placement", () => {
    expect(parsePaixComponent(`main.spaces >\nButton()`, path).ast).toBeNull();
  });
  test("does not remove commas from arrays and object fields", () => {
    expect(parsePaixActions(`states:\n    USERS: [{ id: 1 name: "A" }]`).ast).toBeNull();
  });
  test.each([false, 0, "", null])("fallback preserves defined %j", value => {
    const parsed = parsePaixComponent(`main > Text(value: inputs.value / "fallback")`, path);
    const placement = parsed.ast!.placements[0];
    if (placement.type !== "Placement") throw new Error("Expected placement");
    const expression = placement.component.arguments[0].value;
    expect(evaluateExpression(expression, { __paixInputs: { value } })).toBe(value);
    expect(evaluateExpression(expression, { __paixInputs: {} })).toBe("fallback");
  });
  test("keeps slash inside quoted strings and supports comments", () => {
    const parsed = parsePaixComponent(`main > Text(value: inputs.label / "a/b") // note`, path);
    expect(parsed.diagnostics).toEqual([]);
  });
  test("styles can read states and inputs", () => {
    expect(parsePaixStyle(`color: white\nwhen states.selected:\n    color: cyan\nwhen inputs.category is "men":\n    color: blue`, "components/Card/Card.style.paix").diagnostics).toEqual([]);
  });
  test.each([counterProject, collectionProject])("compiles migrated example $name with no diagnostics", project => {
    expect(compilePaixProject(project).diagnostics).toEqual([]);
  });
  test("binds companions by file path, with no declarations in the component", () => {
    const program = compilePaixProject(counterProject);
    const counter = program.components.Counter;
    expect(counter.style).toBe("Counter.style");
    expect(counter.wireframe).toBe("Counter.frame");
    expect(counter.states.map(state => state.name)).toEqual(["_count"]);
    expect(counter.actions?.map(action => action.name)).toEqual(["add", "reset", "addTwice"]);
  });
  test("reports missing frame and unknown action", () => {
    const project = structuredClone(counterProject);
    delete project.files["components/Counter/Counter.frame.paix"];
    project.files[path].content = "main > Button(onClick: actions.missing)";
    const messages = compilePaixProject(project).diagnostics.map(d => d.message).join("\n");
    expect(messages).toContain("requires sibling");
    expect(messages).toContain("actions.missing");
  });
});

describe("Actions documents", () => {
  test("executes sequential composed actions against updated state", () => {
    const parsed = parsePaixActions(counterProject.files["components/Counter/Counter.actions.paix"].content);
    expect(parsed.diagnostics).toEqual([]);
    const values = createInitialState(parsed.ast!.states, { __paixInputs: { start: 10 } });
    const updates: unknown[] = [];
    const actions = createComponentActions(parsed.ast!.actions, values, (name, value) => updates.push([name, value]));
    actions.addTwice();
    expect(updates).toEqual([["_count", 12]]);
    actions.add();
    expect(updates.at(-1)).toEqual(["_count", 13]);
  });
  test.each([
    `states:\n    count: 0\n    count: 1`,
    `states:\ncount: 0`,
    `action add:\nstates.count: 1`,
    `action add:\n    states.missing: 1`,
    `action add:\n    actions.missing`,
    `action add:\n    actions.reset\naction reset:\n    actions.add`,
    `states:\n    USERS: [{id: 1}, {id: 1}]`,
  ])("rejects invalid document %#", source => {
    expect(parsePaixActions(source).diagnostics.length).toBeGreaterThan(0);
  });
  test("invalid collection update aborts the complete action", () => {
    const parsed = parsePaixActions(`states:
    count: 0
    USERS: [{id: 1}]
action broken:
    states.count: 5
    states.USERS: [{id: 1}, {id: 1}]`);
    const values = createInitialState(parsed.ast!.states, {});
    const updates: unknown[] = [];
    const actions = createComponentActions(parsed.ast!.actions, values, (...args) => updates.push(args));
    expect(() => actions.broken()).toThrow();
    expect(updates).toEqual([]);
    expect(values._count).toBe(0);
  });
});
