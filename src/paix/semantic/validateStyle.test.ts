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

background: gradient from blue to white
color: white
opacity: 0.9
border: 1 solid cyan
radius: 18
shadow: soft black
outline: none

font: Inter
textSize: 16
textWeight: 600
textAlign: center
lineHeight: 1.4
letterSpacing: 1

blur: none
backdropBlur: 18
transform: scale(1)
transition: smooth 180`;

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

background: blue

when _selected:
    background: cyan
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