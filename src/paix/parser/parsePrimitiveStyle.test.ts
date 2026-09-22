import {
  describe,
  expect,
  test,
} from "vitest";

import {
  parsePaixPage,
} from "./parse";

describe(
  "Paix primitive style references",
  () => {
    test(
      "parses a named style on a primitive component",
      () => {
        const source = `page "home" MainFrame

contentArea >
    Button(
        label: "Home",
        style: GlassPanel
    )`;

        const result =
          parsePaixPage(source);

        expect(
          result.diagnostics,
        ).toEqual([]);

        const placement =
          result.ast?.placements[0];

        if (
          !placement ||
          placement.type !== "Placement"
        ) {
          throw new Error(
            "Expected a component placement.",
          );
        }

        const styleArgument =
          placement.component.arguments.find(
            (argument) =>
              argument.name === "style",
          );

        expect(styleArgument).toEqual({
          type: "Argument",
          name: "style",
          state: false,

          value: {
            type: "Reference",
            name: "GlassPanel",
            kind: "value",
          },
        });
      },
    );
  },
);