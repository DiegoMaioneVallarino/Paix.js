import { bindCompanions } from "./companions";
import { readDocumentOptions } from "../parser/documentOptions";
import { expandStyle, expandStyleProperties, styleTagNames } from "./styleTags";
import type { PaixStyleNode, PaixPageNode } from "../ast/ast.types";
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
  const inactive = new Set(Object.values(project.files).filter(file => file.enabled === false).map(file => file.path));
  for (const file of Object.values(project.files)) if (file.type === "component" || file.type === "page") {
    if (readDocumentOptions(file.content).options.frame) inactive.add(file.path.replace(/(?:\.page)?\.paix$/, ".frame.paix"));
  }
  project = { ...project, files: Object.fromEntries(Object.entries(project.files).filter(([path]) => !inactive.has(path))) };
  const pages: Record<string, PaixPageNode> = {};
  const pagePaths = new Map<PaixPageNode, string>();
  const diagnostics: PaixCompiledProject["diagnostics"] = [];

  const components: PaixCompiledProject["components"] = {};
  const wireframes: PaixCompiledProject["wireframes"] = {};
const styles: PaixCompiledProject["styles"] = {};
const tags: Record<string, PaixStyleNode> = Object.create(null);
const rawTags = new Map<string, { style: PaixStyleNode; filePath: string; line: number }>();
const stylePaths = new Map<string, string>();

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

  let entryPage: PaixPageNode | null = null;
  for (const file of Object.values(project.files)) if (file.type === "page") {
    const result = parsePaixPage(file.content,file.path);
    diagnostics.push(...result.diagnostics.map(d=>({...d,filePath:file.path})));
    if (!result.ast) continue;
    const page = result.ast;
    page.address ??= file.path === project.entry ? "/" : "/" + file.name.replace(/(?:\.page)?\.paix$/, "").toLowerCase();
    if (pages[page.address]) diagnostics.push({source:"semantic",severity:"error",message:`Duplicate page address "${page.address}".`,filePath:file.path,line:1,column:1,length:1});
    else pages[page.address] = page;
    pagePaths.set(page,file.path);
    if(file.path===project.entry) entryPage = page;
  }
  const pageResult = { ast: entryPage };
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

  if (styleResult.ast.tags) {
    if (!file.path.replace(/\\/g, "/").startsWith("styles/")) {
      diagnostics.push({ source: "semantic", severity: "error", message: "Shared tags must be declared in styles/; component style sheets cannot export tags.", filePath: file.path, line: 1, column: 1, length: 1 });
      continue;
    }
    for (const tag of styleResult.ast.tags) {
      const style: PaixStyleNode = { type: "Style", name: tag.name, properties: tag.properties, conditions: [] };
      diagnostics.push(...validatePaixStyle(style, file.content).map(d => ({ ...d, filePath: file.path })));
      if (rawTags.has(tag.name)) diagnostics.push({ source: "semantic", severity: "error", message: `Style tag "${tag.name}" is declared more than once.`, filePath: file.path, line: tag.line, column: 1, length: tag.name.length });
      else rawTags.set(tag.name, { style, filePath: file.path, line: tag.line });
    }
    continue;
  }
  stylePaths.set(styleResult.ast.name, file.path);
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

// Resolve shared tags independently of file order; reject cycles before expansion.
const resolving = new Set<string>();
const failed = new Set<string>();
const resolveTag = (name: string): PaixStyleNode => {
  if (Object.hasOwn(tags, name)) return tags[name];
  if (resolving.has(name)) throw new Error(`Circular style tags: ${[...resolving, name].join(" -> ")}.`);
  const entry = rawTags.get(name);
  if (!entry) throw new Error(`Unknown style tag "${name}".`);
  if (failed.has(name)) throw new Error(`Style tag "${name}" could not be resolved.`);
  resolving.add(name);
  try {
    for (const property of entry.style.properties) if (property.name === "styles") {
      for (const dependency of styleTagNames(property.value)) resolveTag(dependency);
    }
    tags[name] = { ...entry.style, properties: expandStyleProperties(entry.style.properties, tags) };
    return tags[name];
  } catch (error) { failed.add(name); throw error; }
  finally { resolving.delete(name); }
};
for (const [name, entry] of rawTags) {
  try { resolveTag(name); }
  catch (error) { diagnostics.push({ source: "semantic", severity: "error", message: String(error instanceof Error ? error.message : error), filePath: entry.filePath, line: entry.line, column: 1, length: name.length }); }
}
for (const [name, style] of Object.entries(styles)) {
  try { styles[name] = expandStyle(style, tags); }
  catch (error) { diagnostics.push({ source: "semantic", severity: "error", message: String(error instanceof Error ? error.message : error), filePath: stylePaths.get(name), line: 1, column: 1, length: 1 }); }
}

for (const [name, component] of Object.entries(components)) {
  bindCompanions(component,componentSourcePaths[name],project,wireframes,styles,tags,diagnostics);
}
for (const [page,path] of pagePaths) {
  bindCompanions(page,path,project,wireframes,styles,tags,diagnostics);
}
for(const [document,path] of [...Object.entries(components).map(([name,doc])=>[doc,componentSourcePaths[name]] as const), ...pagePaths.entries()]) {
  for(const action of document.actions ?? []) for(const step of action.steps) if('goTo' in step) {
    const [address,area] = step.goTo.split('#');
    const target=pages[address];
    const frame=target && wireframes[target.wireframe];
    if(!target || (area && area!=="main" && !frame?.slices.some(slice=>slice.areas.includes(area)))) diagnostics.push({source:"semantic",severity:"error",message:`Unknown navigation destination "${step.goTo}".`,filePath:path,line:1,column:1,length:1});
  }
}
for (const file of Object.values(project.files)) {
  if (file.type !== "action") continue;
  const parsed = parsePaixActions(file.content, file.path, true);
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

  for (const [document, filePath] of [
    ...Object.entries(components).map(([name, component]) => [component, componentSourcePaths[name]] as const),
    ...pagePaths.entries(),
  ]) {
    for (const placement of document.placements) {
      const children = placement.type === "Placement" ? [placement.component] : placement.stack.items;
      for (const child of children) for (const argument of child.arguments) {
        if (argument.type !== "Argument" || argument.name !== "styles") continue;
        const value = argument.value;
        if (value && typeof value === "object" && value.type === "ArrayExpression") for (const name of value.items) {
          if (typeof name !== "string" || !Object.hasOwn(tags, name)) diagnostics.push({ source: "semantic", severity: "error", message: `Unknown style tag "${String(name)}".`, filePath, line: 1, column: 1, length: 1 });
        }
      }
    }
  }
  for (const [page,path] of pagePaths) {
    diagnostics.push(...validatePaixPage(page, project, project.files[path].content).map(d=>({...d,filePath:path})));
  }

  return {
  entryPage: pageResult.ast,
  pages,
  components,
  wireframes,
  styles,
  tags,
  diagnostics,
};
}