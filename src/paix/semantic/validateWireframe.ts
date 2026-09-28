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

  const areaOwner = new Map<string, string>([
    ["main", "root"],
  ]);

  const rulesByTarget = new Map<
    string,
    PaixSliceNode[]
  >();

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

    const existingRules =
      rulesByTarget.get(target) ?? [];

    existingRules.push(slice);
    rulesByTarget.set(
      target,
      existingRules,
    );

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

    if (slice.condition) {
      const {
        left,
        operator,
        than,
        right,
      } = slice.condition;

      if (
        (left !== "width" &&
          left !== "height") ||
        (right !== "width" &&
          right !== "height") ||
        (operator !== "greater" &&
          operator !== "less") ||
        than !== "than" ||
        left === right
      ) {
        addDiagnostic(
          diagnostics,
          source,
          target,
          `Invalid size condition on "${target}". ` +
            'Use "width greater than height", ' +
            '"height greater than width", ' +
            'or the corresponding "less than" form.',
        );
      }
    }

    for (const area of slice.areas) {
      const owner =
        areaOwner.get(area);

      if (
        owner !== undefined &&
        owner !== target
      ) {
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
      areaOwner.set(area, target);
    }
  }

  for (
    const [target, rules] of
    rulesByTarget
  ) {
    const fallbackRules =
      rules.filter(
        (rule) => !rule.condition,
      );

    if (fallbackRules.length > 1) {
      addDiagnostic(
        diagnostics,
        source,
        target,
        `Area "${target}" is sliced more than once.`,
      );
    }

    if (fallbackRules.length === 0) {
      addDiagnostic(
        diagnostics,
        source,
        target,
        `Area "${target}" needs a slice without "when" as fallback.`,
      );
    }

    const seenConditions =
      new Set<string>();

    for (const rule of rules) {
      if (!rule.condition) {
        continue;
      }

      const {
        left,
        operator,
        right,
      } = rule.condition;

      const key =
        `${left}:${operator}:${right}`;

      if (seenConditions.has(key)) {
        addDiagnostic(
          diagnostics,
          source,
          target,
          `Area "${target}" repeats the same size condition.`,
        );
      }

      seenConditions.add(key);
    }

    const reference =
      fallbackRules[0] ?? rules[0];

    const expectedCount =
      getSliceSlotCount(reference);

    const expectedAreas =
      reference.areas.join("\u0000");

    for (const rule of rules) {
      if (
        getSliceSlotCount(rule) !==
          expectedCount ||
        rule.areas.join("\u0000") !==
          expectedAreas
      ) {
        addDiagnostic(
          diagnostics,
          source,
          target,
          `All size variants of "${target}" ` +
            "must keep the same number of slots " +
            "and the same named areas.",
        );

        break;
      }
    }
  }

  return diagnostics;
}
function getSliceSlotCount(
  slice: PaixSliceNode,
): number {
  switch (slice.mode) {
    case "vertical":
    case "horizontal":
      return 2;

    case "vertical-centered":
    case "horizontal-centered":
      return 3;

    case "island":
      return 1;

    case "columns":
    case "rows":
    case "layer":
      return slice.count;

    case "grid":
      return (
        slice.columns *
        slice.rows
      );
  }
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