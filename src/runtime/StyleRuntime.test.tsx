import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { parsePaixStyle } from "../paix/parser/parseStyle";
import { validatePaixStyle } from "../paix/semantic/validateStyle";
import { PaixStyleSheet } from "./StyleRuntime";

describe("gradient text styles", () => {
  test("parses color gradients and compiles a separate text layer", () => {
    const source = `style "Ink"

backgroundImage: gradient down from black to gray
color: gradient right from cyan to purple
inline: 2
inlineColor: gradient right from red to blue`;

    const result = parsePaixStyle(source);
    expect(result.diagnostics).toEqual([]);
    expect(result.ast).not.toBeNull();

    const style = result.ast!;
    expect(validatePaixStyle(style, source)).toEqual([]);

    const html = renderToStaticMarkup(
      <PaixStyleSheet styles={{ Ink: style }} />,
    );

    expect(html).toContain("background-clip:text");
    expect(html).toContain("--paix-text-gradient:linear-gradient(90deg, cyan, purple)");
    expect(html).toContain("background-image:linear-gradient(180deg, black, gray)");
    expect(html).toContain("--paix-inline-paint:linear-gradient(90deg, red, blue)");
  });
});
