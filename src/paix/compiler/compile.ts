import type { PaixProject } from "../../project/project.types";
import { parsePaixComponent } from "../parser/parseComponent";
import { parsePaixPage } from "../parser/parse";
import { validatePaixPage } from "../semantic/validate";
import type { PaixCompiledProject } from "./compiled.types";

export function compilePaixProject(
  project: PaixProject,
): PaixCompiledProject {
  const diagnostics: PaixCompiledProject["diagnostics"] = [];
  const components: PaixCompiledProject["components"] = {};

  const entryFile = project.files[project.entry];

  if (!entryFile) {
    return {
      entryPage: null,
      components,
      diagnostics: [
        {
          source: "semantic",
          severity: "error",
          message: `Project entry "${project.entry}" does not exist.`,
          line: 1,
          column: 1,
          length: project.entry.length,
          filePath: project.entry,
        },
      ],
    };
  }

  const pageResult = parsePaixPage(entryFile.content);

  diagnostics.push(
    ...pageResult.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      filePath: entryFile.path,
    })),
  );

  for (const file of Object.values(project.files)) {
    if (file.type !== "component") {
      continue;
    }

    const componentResult = parsePaixComponent(
      file.content,
    );

    diagnostics.push(
      ...componentResult.diagnostics.map(
        (diagnostic) => ({
          ...diagnostic,
          filePath: file.path,
        }),
      ),
    );

    if (!componentResult.ast) {
      continue;
    }

    const componentName = componentResult.ast.name;

    if (components[componentName]) {
      diagnostics.push({
        source: "semantic",
        severity: "error",
        message: `Component "${componentName}" is declared more than once.`,
        line: 1,
        column: 1,
        length: componentName.length,
        filePath: file.path,
      });

      continue;
    }

    components[componentName] = componentResult.ast;
  }

  if (pageResult.ast) {
    diagnostics.push(
      ...validatePaixPage(
        pageResult.ast,
        project,
        entryFile.content,
      ).map((diagnostic) => ({
        ...diagnostic,
        filePath: entryFile.path,
      })),
    );
  }

  return {
    entryPage: pageResult.ast,
    components,
    diagnostics,
  };
}