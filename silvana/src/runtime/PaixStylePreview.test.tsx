import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import type { PaixStyleNode } from "../paix/ast/ast.types";
import type { PaixCompiledProject } from "../paix/compiler/compiled.types";
import { PaixStylePreview } from "./PaixStylePreview";

describe("Paix style preview", () => {
  test("shows a sample surface and provisional text", () => {
    const style: PaixStyleNode = {
      type: "Style",
      name: "Ink",
      properties: [
        { type: "StyleProperty", name: "backgroundColor", value: "navy" },
        { type: "StyleProperty", name: "color", value: "gradient right from cyan to purple" },
      ],
      conditions: [],
    };

    const program: PaixCompiledProject = {
      entryPage: null,
      components: {},
      wireframes: {},
      styles: { Ink: style },
      diagnostics: [],
    };

    const html = renderToStaticMarkup(
      <PaixStylePreview program={program} style={style} />,
    );

    expect(html).toContain('data-paix-style-preview="Ink"');
    expect(html).toContain('class="paix-style-preview-surface paix-style-ink"');
    expect(html).toContain("Preview text");
    expect(html).toContain("--paix-text-gradient:linear-gradient(90deg, cyan, purple)");
  });
});
