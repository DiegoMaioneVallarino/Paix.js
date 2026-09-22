import type { PaixProject } from "../../project/project.types";
import { parsePaixComponent } from "../parser/parseComponent";
import { parsePaixPage } from "../parser/parse";
import { parsePaixWireframe } from "../parser/parseWireframe";
import { validatePaixPage } from "../semantic/validate";
import type { PaixCompiledProject } from "./compiled.types";

import { validatePaixWireframe } from "../semantic/validateWireframe";

import { parsePaixStyle } from "../parser/parseStyle";

import {
  validatePaixStyle,
} from "../semantic/validateStyle";


export function compilePaixProject(
  project: PaixProject,
): PaixCompiledProject {
  const diagnostics: PaixCompiledProject["diagnostics"] = [];

  const components: PaixCompiledProject["components"] = {};
  const wireframes: PaixCompiledProject["wireframes"] = {};
const styles: PaixCompiledProject["styles"] = {};

const componentSourcePaths: Record<
  string,
  string
> = {};
  const entryFile = project.files[project.entry];

  if (!entryFile) {
    return {
       entryPage: null,
  components,
  wireframes,
  styles,

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
        message:
          `Component "${componentName}" ` +
          "is declared more than once.",
        line: 1,
        column: 1,
        length: componentName.length,
        filePath: file.path,
      });

      continue;
    }

    components[componentName] = componentResult.ast;
componentSourcePaths[componentName] = file.path;
  }

  for (const file of Object.values(project.files)) {
    if (file.type !== "wireframe") {
      continue;
    }

    const wireframeResult = parsePaixWireframe(
      file.content,
    );

    diagnostics.push(
      ...wireframeResult.diagnostics.map(
        (diagnostic) => ({
          ...diagnostic,
          filePath: file.path,
        }),
      ),
    );

    if (!wireframeResult.ast) {
      continue;
    }

    const wireframeName = wireframeResult.ast.name;

    if (wireframes[wireframeName]) {
      diagnostics.push({
        source: "semantic",
        severity: "error",
        message:
          `Wireframe "${wireframeName}" ` +
          "is declared more than once.",
        line: 1,
        column: 1,
        length: wireframeName.length,
        filePath: file.path,
      });

      continue;
    }
diagnostics.push(
  ...validatePaixWireframe(
    wireframeResult.ast,
    file.content,
  ).map((diagnostic) => ({
    ...diagnostic,
    filePath: file.path,
  })),
);
    wireframes[wireframeName] = wireframeResult.ast;
  }
for (
  const file of Object.values(project.files)
) {
  if (file.type !== "style") {
    continue;
  }

  const styleResult =
    parsePaixStyle(file.content);

  diagnostics.push(
    ...styleResult.diagnostics.map(
      (diagnostic) => ({
        ...diagnostic,
        filePath: file.path,
      }),
    ),
  );

  if (!styleResult.ast) {
    continue;
  }

  diagnostics.push(
    ...validatePaixStyle(
      styleResult.ast,
      file.content,
    ).map((diagnostic) => ({
      ...diagnostic,
      filePath: file.path,
    })),
  );

  const styleName =
    styleResult.ast.name;

  if (styles[styleName]) {
    diagnostics.push({
      source: "semantic",
      severity: "error",

      message:
        `Style "${styleName}" ` +
        "is declared more than once.",

      line: 1,
      column: 1,
      length: styleName.length,
      filePath: file.path,
    });

    continue;
  }

  styles[styleName] =
    styleResult.ast;
}

for (
  const [componentName, component]
  of Object.entries(components)
) {
  if (!component.style) {
    continue;
  }

  if (styles[component.style]) {
    continue;
  }

  diagnostics.push({
    source: "semantic",
    severity: "error",

    message:
      `Component "${componentName}" uses ` +
      `unknown style "${component.style}".`,

    line: 1,
    column: 1,
    length: component.style.length,

    filePath:
      componentSourcePaths[componentName],
  });
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
  wireframes,
  styles,
  diagnostics,
};
}