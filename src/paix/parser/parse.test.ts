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
          area: "header",

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
          area: "content",

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
    Counter(label: "Count")`;

    const result = parsePaixPage(source);

    expect(result.ast).toBeNull();
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});