// @vitest-environment jsdom


import {
  describe,
  expect,
  test,
} from "vitest";

import {
  render,
} from "@testing-library/react";

import type {
  PaixWireframeNode,
} from "../paix/ast/ast.types";

import {
  WireframeRenderer,
} from "./WireframeRenderer";

describe("WireframeRenderer island", () => {
  test(
    "applies all four island insets",
    () => {
      const wireframe: PaixWireframeNode = {
        type: "Wireframe",
        name: "IslandFrame",

        slices: [
          {
            type: "Slice",

            target: {
              type: "AreaReference",
              path: "main",
              segments: ["main"],
              slots: false,
            },

            mode: "island",

            size: {
              value: 14,
              unit: "px",
            },

            areas: [
              "islandContentArea",
            ],
          },
        ],
      };

      const { container } = render(
        <WireframeRenderer
          wireframe={wireframe}
        />,
      );

      const island =
        container.querySelector(
          '[data-paix-area="islandContentArea"]',
        );

      if (!(island instanceof HTMLElement)) {
        throw new Error(
          "Expected the island area to render.",
        );
      }

      expect(island.style.position).toBe(
        "absolute",
      );

      expect(island.style.top).toBe(
        "14px",
      );

      expect(island.style.right).toBe(
        "14px",
      );

      expect(island.style.bottom).toBe(
        "14px",
      );

      expect(island.style.left).toBe(
        "14px",
      );

      expect(island.style.width).toBe(
        "auto",
      );

      expect(island.style.height).toBe(
        "auto",
      );
    },
  );

  test(
    "supports percentage island insets",
    () => {
      const wireframe: PaixWireframeNode = {
        type: "Wireframe",
        name: "PercentageIslandFrame",

        slices: [
          {
            type: "Slice",

            target: {
              type: "AreaReference",
              path: "main",
              segments: ["main"],
              slots: false,
            },

            mode: "island",

            size: {
              value: 10,
              unit: "percent",
            },

            areas: ["contentArea"],
          },
        ],
      };

      const { container } = render(
        <WireframeRenderer
          wireframe={wireframe}
        />,
      );

      const island =
        container.querySelector(
          '[data-paix-area="contentArea"]',
        );

      if (!(island instanceof HTMLElement)) {
        throw new Error(
          "Expected the island area to render.",
        );
      }

      expect(island.style.top).toBe("10%");
      expect(island.style.right).toBe("10%");
      expect(island.style.bottom).toBe("10%");
      expect(island.style.left).toBe("10%");
    },
  );
});