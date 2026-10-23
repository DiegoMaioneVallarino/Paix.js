import { describe, expect, test } from "vitest";

import { parsePaixWireframe } from "../parser/parseWireframe";
import { validatePaixWireframe } from "./validateWireframe";

function validate(source: string) {
  const parseResult = parsePaixWireframe(source);

  expect(parseResult.diagnostics).toEqual([]);
  expect(parseResult.ast).not.toBeNull();

  return validatePaixWireframe(
    parseResult.ast!,
    source,
  );
}

describe("Paix wireframe validation", () => {
  test("accepts the complete slice laboratory", () => {
    const source = `wireframe "WireframeLab"

main slice grid 2x2 >
    "gridArea"
    "islandArea"
    "verticalCenteredArea"
    "horizontalCenteredArea"

gridArea slice grid 3x2

islandArea slice island 14 >
    "islandContentArea"

islandContentArea slice layer 3 >
    "bottomLayer"
    "middleLayer"
    "topLayer"

verticalCenteredArea slice vertical centered 90 >
    "leftArea"
    "verticalCenterArea"
    "rightArea"

horizontalCenteredArea slice horizontal centered 54 >
    "topArea"
    "horizontalCenterArea"
    "bottomArea"`;

    expect(validate(source)).toEqual([]);
  });

  test("rejects unknown slice targets", () => {
    const diagnostics = validate(
      `wireframe "Broken"

missingArea slice rows 3`,
    );

    expect(
      diagnostics.some((diagnostic) =>
        diagnostic.message.includes(
          'Unknown slice target "missingArea"',
        ),
      ),
    ).toBe(true);
  });

  test("requires three areas for centered slices", () => {
    const diagnostics = validate(
      `wireframe "Broken"

main slice vertical centered 100 >
    "leftArea"
    "centerArea"`,
    );

    expect(
      diagnostics.some((diagnostic) =>
        diagnostic.message.includes(
          "requires 3 named areas",
        ),
      ),
    ).toBe(true);
  });

  test("rejects slicing the same area twice", () => {
    const diagnostics = validate(
      `wireframe "Broken"

main slice horizontal 70 >
    "headerArea"
    "contentArea"

main slice vertical 200 >
    "sidebarArea"
    "bodyArea"`,
    );

    expect(
      diagnostics.some((diagnostic) =>
        diagnostic.message.includes(
          'Area "main" is sliced more than once',
        ),
      ),
    ).toBe(true);
  });
});