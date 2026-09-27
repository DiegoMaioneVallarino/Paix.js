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
  PaixProject,
} from "../project/project.types";

import {
  compilePaixProject,
} from "../paix/compiler/compile";

import {
  PaixRenderer,
} from "./PaixRenderer";

function createStyleTestProject(
  invocationStyle = "",
): PaixProject {
  return {
    id: "style-test-project",
    name: "style-test",
    entry: "pages/home.paix",

    files: {
      "pages/home.paix": {
        id: "home-page",
        name: "home.paix",
        path: "pages/home.paix",
        type: "page",

        content: `page "home" MainFrame

main >
    Card(${invocationStyle})`,
      },

      "components/Card.paix": {
        id: "card-component",
        name: "Card.paix",
        path: "components/Card.paix",
        type: "component",

        content: `component "Card" CardFrame

style: DefaultPanel

main >
    Text(value: "Card")`,
      },

      "wireframes/MainFrame.paix": {
        id: "main-frame",
        name: "MainFrame.paix",
        path: "wireframes/MainFrame.paix",
        type: "wireframe",

        content: `wireframe "MainFrame"`,
      },

      "wireframes/CardFrame.paix": {
        id: "card-frame",
        name: "CardFrame.paix",
        path: "wireframes/CardFrame.paix",
        type: "wireframe",

        content: `wireframe "CardFrame"`,
      },

      "styles/DefaultPanel.paix": {
        id: "default-panel-style",
        name: "DefaultPanel.paix",
        path: "styles/DefaultPanel.paix",
        type: "style",

        content: `style "DefaultPanel"

backgroundColor: blue`,
      },

      "styles/GlassPanel.paix": {
        id: "glass-panel-style",
        name: "GlassPanel.paix",
        path: "styles/GlassPanel.paix",
        type: "style",

        content: `style "GlassPanel"

backgroundColor: cyan
radius: 12`,
      },
    },
  };
}

describe(
  "Paix basic component styles",
  () => {
    test(
      "uses the style declared by the component",
      () => {
        const program =
          compilePaixProject(
            createStyleTestProject(),
          );

        expect(
          program.diagnostics,
        ).toEqual([]);

        const { container } = render(
          <PaixRenderer
            program={program}
          />,
        );

        const component =
          container.querySelector(
            '[data-paix-component="Card"]',
          );

        expect(component).not.toBeNull();

        expect(
          component?.classList.contains(
            "paix-style-defaultpanel",
          ),
        ).toBe(true);

        expect(
          component?.getAttribute(
            "data-paix-style",
          ),
        ).toBe("DefaultPanel");
      },
    );

    test(
      "invocation style replaces the default style",
      () => {
        const program =
          compilePaixProject(
            createStyleTestProject(
              "style: GlassPanel",
            ),
          );

        expect(
          program.diagnostics,
        ).toEqual([]);

        const { container } = render(
          <PaixRenderer
            program={program}
          />,
        );

        const component =
          container.querySelector(
            '[data-paix-component="Card"]',
          );

        expect(component).not.toBeNull();

        expect(
          component?.classList.contains(
            "paix-style-glasspanel",
          ),
        ).toBe(true);

        expect(
          component?.classList.contains(
            "paix-style-defaultpanel",
          ),
        ).toBe(false);

        expect(
          component?.getAttribute(
            "data-paix-style",
          ),
        ).toBe("GlassPanel");
      },
    );

    test(
      "reports an unknown component style",
      () => {
        const program =
          compilePaixProject(
            createStyleTestProject(
              "style: MissingStyle",
            ),
          );

        const { getByText } = render(
          <PaixRenderer
            program={program}
          />,
        );

        expect(
          getByText(
            "Unknown style: MissingStyle",
          ),
        ).toBeTruthy();
      },
    );
  },
);