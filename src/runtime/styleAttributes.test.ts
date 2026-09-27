import {
  describe,
  expect,
  test,
} from "vitest";

import {
  parsePaixStyle,
} from "../paix/parser/parseStyle";

import {
  parsePaixComponent,
} from "../paix/parser/parseComponent";

import {
  evaluateExpression,
  PAIX_INPUTS_SCOPE_KEY,
} from "./evaluateExpression";

import {
  resolvePaixStyleClasses,
} from "./StyleRuntime";

function parseCardStyle() {
  const result = parsePaixStyle(
    `style "CardSurface"

backgroundColor: gray

when this.category is "women":
    backgroundColor: purple

when this.category is "men":
    backgroundColor: blue`,
  );

  expect(result.diagnostics).toEqual([]);

  if (!result.ast) {
    throw new Error("Expected a style AST.");
  }

  return result.ast;
}

describe("Style variants from component inputs", () => {
  test("parses an input comparison", () => {
    const style = parseCardStyle();

    expect(
      style.conditions[0].condition,
    ).toEqual({
      type: "ComparisonExpression",
      operator: "is",
      left: {
        type: "InputReference",
        name: "category",
      },
      right: "women",
    });
  });

  test("resolves variants independently per instance", () => {
    const style = parseCardStyle();

    const firstScope = {
      [PAIX_INPUTS_SCOPE_KEY]: {
        category: "women",
      },
    };

    const secondScope = {
      [PAIX_INPUTS_SCOPE_KEY]: {
        category: "men",
      },
    };

    expect(
      resolvePaixStyleClasses(style, firstScope),
    ).toBe(
      "paix-style-cardsurface " +
      "paix-style-cardsurface--when-0",
    );

    expect(
      resolvePaixStyleClasses(style, secondScope),
    ).toBe(
      "paix-style-cardsurface " +
      "paix-style-cardsurface--when-1",
    );

    firstScope[PAIX_INPUTS_SCOPE_KEY].category =
      "men";

    expect(
      resolvePaixStyleClasses(style, firstScope),
    ).toBe(
      "paix-style-cardsurface " +
      "paix-style-cardsurface--when-1",
    );
  });

  test("uses only the base style for missing or unknown categories", () => {
    const style = parseCardStyle();

    for (const inputs of [
      {},
      { category: "other" },
    ]) {
      expect(
        resolvePaixStyleClasses(style, {
          [PAIX_INPUTS_SCOPE_KEY]: inputs,
        }),
      ).toBe("paix-style-cardsurface");
    }
  });

  test("compares values without converting their types", () => {
    expect(
      evaluateExpression(
        {
          type: "ComparisonExpression",
          operator: "is",
          left: 1,
          right: "1",
        },
        {},
      ),
    ).toBe(false);
  });

  test("preserves arithmetic and otherwise behavior", () => {
    const result = parsePaixComponent(
      `component "Example" ExampleFrame

state:
    _selected: this.selected otherwise false
    _matches: 1 + 2 is 3`,
    );

    expect(result.diagnostics).toEqual([]);

    if (!result.ast) {
      throw new Error("Expected a component AST.");
    }

    const [selected, matches] =
      result.ast.states;

    expect(
      evaluateExpression(
        selected.initialValue,
        {},
      ),
    ).toBe(false);

    expect(
      evaluateExpression(
        selected.initialValue,
        {
          [PAIX_INPUTS_SCOPE_KEY]: {
            selected: true,
          },
        },
      ),
    ).toBe(true);

    expect(
      evaluateExpression(
        matches.initialValue,
        {},
      ),
    ).toBe(true);
  });
});