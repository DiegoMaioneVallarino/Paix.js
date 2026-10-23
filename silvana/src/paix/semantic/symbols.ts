import type {
  PaixFile,
  PaixProject,
} from "../../project/project.types";

export interface ProjectSymbols {
  components: Map<string, PaixFile>;
  wireframes: Map<string, PaixFile>;
  styles: Map<string, PaixFile>;
  actions: Map<string, PaixFile>;
}

export function createProjectSymbols(
  project: PaixProject,
): ProjectSymbols {
  const symbols: ProjectSymbols = {
    components: new Map(),
    wireframes: new Map(),
    styles: new Map(),
    actions: new Map(),
  };

  for (const file of Object.values(project.files)) {
    const name = getFileSymbolName(file);

    switch (file.type) {
      case "component":
        symbols.components.set(name, file);
        break;

      case "wireframe":
        symbols.wireframes.set(name, file);
        break;

      case "style":
        symbols.styles.set(name, file);
        break;

      case "action":
        symbols.actions.set(name, file);
        break;

      case "page":
        break;
    }
  }

  return symbols;
}

function getFileSymbolName(file: PaixFile): string {
  return file.name.replace(/\.paix$/i, "");
}