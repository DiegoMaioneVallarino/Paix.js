import type {
  PaixSliceNode,
  PaixWireframeNode,
} from "../ast/ast.types";

import type {
  PaixDiagnostic,
} from "../diagnostics/diagnostic.types";

interface SourcePosition {
  line: number;
  column: number;
}

export function validatePaixWireframe(
  ast: PaixWireframeNode,
  source: string,
): PaixDiagnostic[] {
  const diagnostics: PaixDiagnostic[] = [];

  const availableAreas = new Set<string>([
    "main",
  ]);

  const slicedAreas = new Set<string>();

  for (const slice of ast.slices) {
    const target = slice.target.path;

    if (slice.target.slots) {
      addDiagnostic(
        diagnostics,
        source,
        target,
        `Slots cannot be sliced directly: "${target}".`,
      );
    }

    if (!availableAreas.has(target)) {
      addDiagnostic(
        diagnostics,
        source,
        target,
        `Unknown slice target "${target}".`,
      );
    }

    if (slicedAreas.has(target)) {
      addDiagnostic(
        diagnostics,
        source,
        target,
        `Area "${target}" is sliced more than once.`,
      );
    } else {
      slicedAreas.add(target);
    }

    validateSliceValue(
      slice,
      source,
      diagnostics,
    );

    validateAreaCount(
      slice,
      source,
      diagnostics,
    );

    for (const area of slice.areas) {
      if (availableAreas.has(area)) {
        addDiagnostic(
          diagnostics,
          source,
          `"${area}"`,
          `Area "${area}" is declared more than once.`,
          area.length + 2,
        );

        continue;
      }

      availableAreas.add(area);
    }
  }

  return diagnostics;
}

function validateSliceValue(
  slice: PaixSliceNode,
  source: string,
  diagnostics: PaixDiagnostic[],
) {
  if ("size" in slice && slice.size.value <= 0) {
    addDiagnostic(
      diagnostics,
      source,
      String(slice.size.value),
      "Slice size must be greater than zero.",
    );
  }

  if ("count" in slice && slice.count <= 0) {
    addDiagnostic(
      diagnostics,
      source,
      String(slice.count),
      "Slice count must be greater than zero.",
    );
  }

  if (
    slice.mode === "grid" &&
    (slice.columns <= 0 || slice.rows <= 0)
  ) {
    addDiagnostic(
      diagnostics,
      source,
      `${slice.columns}x${slice.rows}`,
      "Grid dimensions must be greater than zero.",
    );
  }
}

function validateAreaCount(
  slice: PaixSliceNode,
  source: string,
  diagnostics: PaixDiagnostic[],
) {
  const areaCount = slice.areas.length;

  switch (slice.mode) {
    case "vertical":
    case "horizontal":
      requireExactAreaCount(
        slice,
        2,
        areaCount,
        source,
        diagnostics,
      );
      return;

    case "vertical-centered":
    case "horizontal-centered":
      requireExactAreaCount(
        slice,
        3,
        areaCount,
        source,
        diagnostics,
      );
      return;

    case "island":
      requireExactAreaCount(
        slice,
        1,
        areaCount,
        source,
        diagnostics,
      );
      return;

    case "layer":
      requireExactAreaCount(
        slice,
        slice.count,
        areaCount,
        source,
        diagnostics,
      );
      return;

    case "columns":
    case "rows":
      requireOptionalAreaCount(
        slice,
        slice.count,
        areaCount,
        source,
        diagnostics,
      );
      return;

    case "grid":
      requireOptionalAreaCount(
        slice,
        slice.columns * slice.rows,
        areaCount,
        source,
        diagnostics,
      );
  }
}

function requireExactAreaCount(
  slice: PaixSliceNode,
  expected: number,
  received: number,
  source: string,
  diagnostics: PaixDiagnostic[],
) {
  if (received === expected) {
    return;
  }

  addDiagnostic(
    diagnostics,
    source,
    slice.target.path,
    `${formatMode(slice.mode)} requires ` +
      `${expected} named area${
        expected === 1 ? "" : "s"
      }, but received ${received}.`,
  );
}

function requireOptionalAreaCount(
  slice: PaixSliceNode,
  expected: number,
  received: number,
  source: string,
  diagnostics: PaixDiagnostic[],
) {
  if (received === 0 || received === expected) {
    return;
  }

  addDiagnostic(
    diagnostics,
    source,
    slice.target.path,
    `${formatMode(slice.mode)} must have either ` +
      `no named areas or exactly ${expected}, ` +
      `but received ${received}.`,
  );
}

function formatMode(mode: PaixSliceNode["mode"]) {
  return `slice ${mode.replace("-", " ")}`;
}

function addDiagnostic(
  diagnostics: PaixDiagnostic[],
  source: string,
  search: string,
  message: string,
  length = search.length,
) {
  const position = findSourcePosition(
    source,
    search,
  );

  diagnostics.push({
    source: "semantic",
    severity: "error",
    message,
    line: position.line,
    column: position.column,
    length,
  });
}

function findSourcePosition(
  source: string,
  search: string,
): SourcePosition {
  const offset = source.indexOf(search);

  if (offset < 0) {
    return {
      line: 1,
      column: 1,
    };
  }

  const beforeMatch = source.slice(0, offset);
  const lines = beforeMatch.split(/\r?\n/);

  return {
    line: lines.length,
    column:
      (lines[lines.length - 1]?.length ?? 0) + 1,
  };
}