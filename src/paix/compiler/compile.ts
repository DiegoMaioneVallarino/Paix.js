import { parsePaixActions } from "../parser/parseActions";
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
      file.path,
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
      file.path,
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
    parsePaixStyle(file.content, file.path);

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

// Companion files bind by exact sibling path; their display headers are optional.
for (const [name, component] of Object.entries(components)) {
  const path = componentSourcePaths[name];
  const folder = path.slice(0, path.lastIndexOf("/"));
  const fileName = path.slice(path.lastIndexOf("/") + 1);
  const associated = fileName === `${name}.paix` && folder.endsWith(`/${name}`);
  if (!associated) {
    if (!/^\s*component\b/m.test(project.files[path].content)) diagnostics.push({ source: "semantic", severity: "error", message: `Place this component at components/${name}/${name}.paix to associate its companions.`, line: 1, column: 1, length: 1, filePath: path });
    continue; // Compatibility for existing flat projects.
  }
  const diagnostic = (message: string, filePath = path) => diagnostics.push({ source: "semantic", severity: "error", message, line: 1, column: 1, length: 1, filePath });
  const frameFile = project.files[`${folder}/${name}.frame.paix`];
  if (!frameFile || frameFile.type !== "wireframe") diagnostic(`Component "${name}" requires sibling "${name}.frame.paix".`);
  else {
    const parsed = parsePaixWireframe(frameFile.content, frameFile.path);
    if (parsed.ast) component.wireframe = parsed.ast.name;
  }
  const styleFile = project.files[`${folder}/${name}.style.paix`];
  component.style = null;
  if (styleFile) {
    if (styleFile.type !== "style") diagnostic(`"${styleFile.path}" must have type "style".`);
    else component.style = parsePaixStyle(styleFile.content, styleFile.path).ast?.name ?? null;
  }
  const actionsFile = project.files[`${folder}/${name}.actions.paix`];
  if (component.states.length) diagnostic("Move component states to its .actions.paix file.");
  component.states = [];
  component.actions = [];
  if (actionsFile) {
    if (actionsFile.type !== "action") diagnostic(`"${actionsFile.path}" must have type "action".`);
    else {
      const parsed = parsePaixActions(actionsFile.content, actionsFile.path);
      if (parsed.ast) { component.states = parsed.ast.states; component.actions = parsed.ast.actions; }
    }
  }
  for (const placement of component.placements) {
    const children = placement.type === "Placement" ? [placement.component] : placement.stack.items;
    for (const child of children) for (const argument of child.arguments) {
      const value = argument.value;
      if (argument.type === "Argument" && /^on[A-Z]/.test(argument.name) && value && typeof value === "object" && value.type === "MemberExpression" && value.object && typeof value.object === "object" && value.object.type === "Reference" && value.object.name === "actions" && !component.actions.some(action => action.name === value.property)) {
        diagnostic(`Unknown action "actions.${value.property}" in component "${name}".`);
      }
    }
  }
}
for (const file of Object.values(project.files)) {
  if (file.type !== "action") continue;
  const parsed = parsePaixActions(file.content, file.path);
  diagnostics.push(...parsed.diagnostics.map(diagnostic => ({ ...diagnostic, filePath: file.path })));
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