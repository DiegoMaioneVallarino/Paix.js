import { describe, expect, test } from "vitest";
import { parsePaixPage } from "./parse";

describe("Paix page parser", () => {
  test("parses a page with component placements", () => {
    const source = `page "home" MainFrame

header >
    Header(title: "Hello Paix")

content >
    Counter(
        label: "Count",
        _count: 0
    )`;

    const result = parsePaixPage(source);

    expect(result.diagnostics).toEqual([]);

    expect(result.ast).toEqual({
      type: "Page",
      name: "home",
      wireframe: "MainFrame",

      placements: [
        {
          type: "Placement",
          target: {
  type: "AreaReference",
  path: "header",
  segments: ["header"],
  slots: false,
},

          component: {
            type: "Component",
            name: "Header",

            arguments: [
              {
                type: "Argument",
                name: "title",
                state: false,
                value: "Hello Paix",
              },
            ],
          },
        },

        {
          type: "Placement",
          target: {
  type: "AreaReference",
  path: "content",
  segments: ["content"],
  slots: false,
},

          component: {
            type: "Component",
            name: "Counter",

            arguments: [
              {
                type: "Argument",
                name: "label",
                state: false,
                value: "Count",
              },
              {
                type: "Argument",
                name: "_count",
                state: true,
                value: 0,
              },
            ],
          },
        },
      ],
    });
  });

 test("returns diagnostics for invalid syntax", () => {
  const source = `page "home" MainFrame

content
    Button(label: "Continue")`;

  const result = parsePaixPage(source);

  expect(result.ast).toBeNull();
  expect(result.diagnostics.length).toBeGreaterThan(0);
});

test("parses an ordered stack placed into slots", () => {
  const source = `page "navigation" MainFrame

navigation.slots > [
    Button(label: "Home"),
    Button(label: "Catalogue"),
    Button(label: "Contact")
]`;

  const result = parsePaixPage(source);

  expect(result.diagnostics).toEqual([]);
  expect(result.ast?.placements).toHaveLength(1);

  const placement = result.ast?.placements[0];

  expect(placement?.type).toBe("StackPlacement");

  if (!placement || placement.type !== "StackPlacement") {
    throw new Error("Expected a StackPlacement");
  }

  expect(placement.target).toEqual({
    type: "AreaReference",
    path: "navigation.slots",
    segments: ["navigation", "slots"],
    slots: true,
  });

  expect(placement.stack).toEqual({
    type: "Stack",

    items: [
      {
        type: "Component",
        name: "Button",

        arguments: [
          {
            type: "Argument",
            name: "label",
            state: false,
            value: "Home",
          },
        ],
      },
      {
        type: "Component",
        name: "Button",

        arguments: [
          {
            type: "Argument",
            name: "label",
            state: false,
            value: "Catalogue",
          },
        ],
      },
      {
        type: "Component",
        name: "Button",

        arguments: [
          {
            type: "Argument",
            name: "label",
            state: false,
            value: "Contact",
          },
        ],
      },
    ],
  });
});
});