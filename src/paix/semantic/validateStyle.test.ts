import {
  describe,
  expect,
  test,
} from "vitest";

import type {
  PaixDiagnostic,
} from "../diagnostics/diagnostic.types";

import {
  parsePaixStyle,
} from "../parser/parseStyle";

import {
  validatePaixStyle,
} from "./validateStyle";

function parseAndValidate(
  source: string,
): PaixDiagnostic[] {
  const parseResult =
    parsePaixStyle(source);

  expect(
    parseResult.diagnostics,
  ).toEqual([]);

  if (!parseResult.ast) {
    throw new Error(
      "Expected a valid Paix style AST.",
    );
  }

  return validatePaixStyle(
    parseResult.ast,
    source,
  );
}

describe("Paix style validation", () => {
  test("accepts visual properties", () => {
  const source = `style "GlassPanel"

color: white
backgroundColor: blue
backgroundImage: gradient from blue to white
opacity: 1

inline: 1
inlineColor: cyan
outline: 2
outlineColor: blue
shadow: soft
shadowColor: black
radius: 18

font: Inter
textSize: 16
textWeight: 600
textStyle: normal
textShadow: soft black
textAlign: center
lineHeight: 1.4
letterSpacing: 1

backdropBlur: 18
blur: none
scale: 1
transitionTime: 180`;

    const diagnostics =
      parseAndValidate(source);

    expect(diagnostics).toEqual([]);
  });

  test("rejects geometry properties", () => {
    const source = `style "InvalidGeometry"

display: flex
position: absolute
width: 200
height: 100
grid: 3
flex: 1
zIndex: 2
margin: 10
padding: 10
contentPadding: 10
gap: 8
top: 0
left: 0`;

    const diagnostics =
      parseAndValidate(source);

    expect(diagnostics).toHaveLength(13);

    expect(
      diagnostics.every(
        (
          diagnostic: PaixDiagnostic,
        ) =>
          diagnostic.severity === "error",
      ),
    ).toBe(true);

    expect(
      diagnostics[0]?.message,
    ).toContain(
      "Geometry belongs to the wireframe",
    );
  });

  test("rejects unknown properties", () => {
    const source = `style "UnknownStyle"

sparkle: strong
banana: yellow`;

    const diagnostics =
      parseAndValidate(source);

    expect(diagnostics).toHaveLength(2);

    expect(
      diagnostics[0]?.message,
    ).toBe(
      'Unknown Paix style property "sparkle".',
    );

    expect(
      diagnostics[1]?.message,
    ).toBe(
      'Unknown Paix style property "banana".',
    );
  });

  test("validates conditional blocks", () => {
    const source = `style "ConditionalStyle"

backgroundColor: blue

when _selected:
    backgroundColor: cyan
    padding: 10`;

    const diagnostics =
      parseAndValidate(source);

    expect(diagnostics).toHaveLength(1);

    expect(
      diagnostics[0]?.message,
    ).toContain(
      '"padding" cannot be used',
    );
  });
});