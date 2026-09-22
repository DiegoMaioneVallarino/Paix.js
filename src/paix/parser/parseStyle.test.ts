import {
  describe,
  expect,
  test,
} from "vitest";

import { parsePaixStyle } from "./parseStyle";

describe("Paix style parser", () => {
  test("parses base style properties", () => {
    const source = `style "BlueSurface"

background: blue
color: white
border: 1 cyan
radius: 10
shadow: inset 0 0 8 blue`;

    const result = parsePaixStyle(source);

    expect(result.diagnostics).toEqual([]);

    expect(result.ast).toEqual({
      type: "Style",
      name: "BlueSurface",

      properties: [
        {
          type: "StyleProperty",
          name: "background",
          value: "blue",
        },
        {
          type: "StyleProperty",
          name: "color",
          value: "white",
        },
        {
          type: "StyleProperty",
          name: "border",
          value: "1 cyan",
        },
        {
          type: "StyleProperty",
          name: "radius",
          value: "10",
        },
        {
          type: "StyleProperty",
          name: "shadow",
          value: "inset 0 0 8 blue",
        },
      ],

      conditions: [],
    });
  });

  test("parses conditional style properties", () => {
    const source = `style "BlueSurface"

background: blue
color: white

when _selected:
    background: cyan
    color: black`;

    const result = parsePaixStyle(source);

    expect(result.diagnostics).toEqual([]);

    expect(result.ast?.conditions).toEqual([
      {
        type: "StyleCondition",

        condition: {
          type: "Reference",
          name: "_selected",
          kind: "state",
        },

        properties: [
          {
            type: "StyleProperty",
            name: "background",
            value: "cyan",
          },
          {
            type: "StyleProperty",
            name: "color",
            value: "black",
          },
        ],
      },
    ]);
  });

  test("parses a component style reference", async () => {
    const { parsePaixComponent } =
      await import("./parseComponent");

    const source = `component "BlueButton" ButtonFrame

style: BlueSurface

state:
    _selected: this.selected otherwise false

mainArea >
    Button(label: this.label)`;

    const result = parsePaixComponent(source);

    expect(result.diagnostics).toEqual([]);
    expect(result.ast?.style).toBe(
      "BlueSurface",
    );
  });
});