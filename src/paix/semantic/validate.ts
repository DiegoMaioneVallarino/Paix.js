import type { PaixPageNode } from "../ast/ast.types";
import type { PaixDiagnostic } from "../diagnostics/diagnostic.types";
import type { PaixProject } from "../../project/project.types";
import { isStandardComponent } from "../../standard-library/manifest";
import { createProjectSymbols } from "./symbols";

interface SourcePosition {
  line: number;
  column: number;
}

export function validatePaixPage(
  ast: PaixPageNode,
  project: PaixProject,
  source: string,
): PaixDiagnostic[] {
  const diagnostics: PaixDiagnostic[] = [];
  const symbols = createProjectSymbols(project);

  if (!symbols.wireframes.has(ast.wireframe)) {
    const position = findSourcePosition(
      source,
      ast.wireframe,
    );

    diagnostics.push({
      source: "semantic",
      severity: "error",
      message: `Unknown wireframe "${ast.wireframe}".`,
      line: position.line,
      column: position.column,
      length: ast.wireframe.length,
    });
  }

  for (const placement of ast.placements) {
    const placedComponents =
      placement.type === "StackPlacement"
        ? placement.stack.items
        : [placement.component];

    if (
      placement.target.slots &&
      placement.type !== "StackPlacement"
    ) {
      const position = findSourcePosition(
        source,
        placement.target.path,
      );

      diagnostics.push({
        source: "semantic",
        severity: "error",
        message:
          `Slot target "${placement.target.path}" ` +
          "must receive a stack enclosed in [].",
        line: position.line,
        column: position.column,
        length: placement.target.path.length,
      });
    }

    if (
      placement.type === "StackPlacement" &&
      placement.stack.items.length === 0
    ) {
      const position = findSourcePosition(
        source,
        placement.target.path,
      );

      diagnostics.push({
        source: "semantic",
        severity: "warning",
        message:
          `Stack placed in "${placement.target.path}" ` +
          "is empty.",
        line: position.line,
        column: position.column,
        length: placement.target.path.length,
      });
    }

    for (const placedComponent of placedComponents) {
      const componentName = placedComponent.name;

      const position = findSourcePosition(
        source,
        `${componentName}(`,
      );

      const isNative =
        isStandardComponent(componentName);

      const componentFile =
        symbols.components.get(componentName);

      if (!isNative && !componentFile) {
        diagnostics.push({
          source: "semantic",
          severity: "error",
          message: `Unknown component "${componentName}".`,
          line: position.line,
          column: position.column,
          length: componentName.length,
        });
      }

      const argumentNames = new Set<string>();

      for (const argument of placedComponent.arguments) {
        if (argumentNames.has(argument.name)) {
          const argumentPosition =
            findSourcePosition(
              source,
              argument.name,
            );

          diagnostics.push({
            source: "semantic",
            severity: "error",
            message:
              `Argument "${argument.name}" is declared ` +
              `more than once in "${componentName}".`,
            line: argumentPosition.line,
            column: argumentPosition.column,
            length: argument.name.length,
          });
        }

        argumentNames.add(argument.name);
      }
    }
  }

  return diagnostics;
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

  const sourceBeforeMatch = source.slice(0, offset);
  const lines = sourceBeforeMatch.split(/\r?\n/);
  const currentLine =
    lines[lines.length - 1] ?? "";

  return {
    line: lines.length,
    column: currentLine.length + 1,
  };
}