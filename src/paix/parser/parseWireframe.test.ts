import { describe, expect, test } from "vitest";
import { parsePaixWireframe } from "./parseWireframe";

describe("Paix wireframe parser", () => {
  test("parses horizontal and column slices", () => {
    const source = `wireframe "MainFrame"

main slice horizontal 72 >
    "headerArea"
    "contentArea"

contentArea slice columns 3`;

    const result = parsePaixWireframe(source);

    expect(result.diagnostics).toEqual([]);

    expect(result.ast).toEqual({
      type: "Wireframe",
      name: "MainFrame",

      slices: [
        {
          type: "Slice",

          target: {
            type: "AreaReference",
            path: "main",
            segments: ["main"],
            slots: false,
          },

          mode: "horizontal",

          size: {
            value: 72,
            unit: "px",
          },

          areas: [
            "headerArea",
            "contentArea",
          ],
        },
        {
          type: "Slice",

          target: {
            type: "AreaReference",
            path: "contentArea",
            segments: ["contentArea"],
            slots: false,
          },

          mode: "columns",
          count: 3,
          areas: [],
        },
      ],
    });
  });

  test("parses centered, island, grid and layer slices", () => {
    const source = `wireframe "AdvancedFrame"

main slice vertical centered 100 >
    "leftArea"
    "centerArea"
    "rightArea"

centerArea slice island 10% >
    "islandArea"

islandArea slice grid 3x2

main slice layer 3 >
    "backgroundArea"
    "contentArea"
    "overlayArea"`;

    const result = parsePaixWireframe(source);

    expect(result.diagnostics).toEqual([]);
    expect(result.ast?.slices).toHaveLength(4);

    expect(result.ast?.slices[0]).toMatchObject({
      mode: "vertical-centered",
      size: {
        value: 100,
        unit: "px",
      },
    });

    expect(result.ast?.slices[1]).toMatchObject({
      mode: "island",
      size: {
        value: 10,
        unit: "percent",
      },
    });

    expect(result.ast?.slices[2]).toMatchObject({
      mode: "grid",
      columns: 3,
      rows: 2,
    });

    expect(result.ast?.slices[3]).toMatchObject({
      mode: "layer",
      count: 3,
    });
  });

  test("returns diagnostics for invalid wireframes", () => {
    const source = `wireframe "BrokenFrame"

main slice columns`;

    const result = parsePaixWireframe(source);

    expect(result.ast).toBeNull();
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});