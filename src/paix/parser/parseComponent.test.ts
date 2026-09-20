import { describe, expect, test } from "vitest";
import { parsePaixComponent } from "./parseComponent";

describe("Paix component parser", () => {
  test("parses a reactive Counter component", () => {
    const source = `component "Counter" CounterFrame

state:
    _count: 0

valueArea >
    Text(value: _count)

actionsArea >
    Button(
        label: "Add",
        onClick: set_count(_count + 1)
    )

actionsArea >
    Button(
        label: "Reset",
        onClick: set_count(0)
    )`;

    const result = parsePaixComponent(source);

    expect(result.diagnostics).toEqual([]);
    expect(result.ast?.name).toBe("Counter");
    expect(result.ast?.wireframe).toBe(
      "CounterFrame",
    );

    expect(result.ast?.states).toEqual([
      {
        type: "State",
        name: "_count",
        initialValue: 0,
      },
    ]);

    expect(result.ast?.placements).toHaveLength(3);

    const addPlacement =
      result.ast?.placements[1];

    expect(addPlacement?.type).toBe("Placement");

    if (
      !addPlacement ||
      addPlacement.type !== "Placement"
    ) {
      throw new Error(
        "Expected the Add button to be a single placement.",
      );
    }

    const addButton = addPlacement.component;

    const onClick = addButton.arguments.find(
      (argument) => argument.name === "onClick",
    );

    expect(onClick?.value).toEqual({
      type: "CallExpression",
      callee: "set_count",

      arguments: [
        {
          type: "BinaryExpression",
          operator: "+",

          left: {
            type: "Reference",
            name: "_count",
            kind: "state",
          },

          right: 1,
        },
      ],
    });
  });

  test("parses component parameters", () => {
    const source = `component "Header" HeaderFrame

parameters:
    title: "Paix"

logoArea >
    Text(value: title)`;

    const result = parsePaixComponent(source);

    expect(result.diagnostics).toEqual([]);

    expect(result.ast?.parameters).toEqual([
      {
        type: "Parameter",
        name: "title",
        defaultValue: "Paix",
      },
    ]);
  });
});