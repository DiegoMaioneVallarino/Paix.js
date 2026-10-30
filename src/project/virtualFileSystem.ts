import type {
  PaixFile,
  PaixFileType,
  PaixProject,
} from "./project.types";

export type CreatablePaixFileType = Extract<
  PaixFileType,
  "page" | "component" | "wireframe" | "style" | "action"
>;

interface CreateFileSuccess {
  ok: true;
  file: PaixFile;
  folder: string;
  companions?: PaixFile[];
}

interface CreateFileFailure {
  ok: false;
  error: string;
}

export type CreateFileResult =
  | CreateFileSuccess
  | CreateFileFailure;

const folderByType: Record<
  CreatablePaixFileType,
  string
> = {
  page: "pages",
  component: "components",
  wireframe: "wireframes",
  style: "styles",
  action: "actions",
};

export function createPaixFile(
  project: PaixProject,
  type: CreatablePaixFileType,
  rawName: string,
): CreateFileResult {
  const name = normalizeFileName(rawName);

  if (!name) {
    return {
      ok: false,
      error: "Enter a name for the file.",
    };
  }

  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
    return {
      ok: false,
      error:
        "Names must start with a letter and contain only letters, numbers, or underscores.",
    };
  }

  const owner = Object.values(project.files).find(file => file.type === "component" && file.name === `${name}.paix` && file.path === `components/${name}/${name}.paix`);
  const suffix = type === "wireframe" ? "frame" : type === "style" ? "style" : "actions";
  const folder = type === "component" || owner ? `components/${name}` : folderByType[type];
  const path = owner && type !== "component" ? `${folder}/${name}.${suffix}.paix` : `${folder}/${name}.paix`;
  if (type === "component" && Object.values(project.files).some(file => file.type === "component" && file.name.toLowerCase() === `${name}.paix`.toLowerCase())) {
    return { ok: false, error: `Component "${name}" already exists.` };
  }

  if (type === "component") {
    const paths = new Set(Object.keys(project.files).map(path => path.toLowerCase()));
    if (createCompanions(folder, name).some(file => paths.has(file.path.toLowerCase()))) {
      return { ok: false, error: "A companion file already exists; creation would overwrite it." };
    }
  }
  const alreadyExists = Object.keys(
    project.files,
  ).some(
    (filePath) =>
      filePath.toLowerCase() ===
      path.toLowerCase(),
  );

  if (alreadyExists) {
    return {
      ok: false,
      error: `${name}.paix already exists in ${folder}.`,
    };
  }

  return {
    ok: true,
    folder,
    companions: type === "component" ? createCompanions(folder, name) : [],
    file: {
      id: createFileId(type),
      name: path.split("/").at(-1)!,
      path,
      type,
      content: owner && type !== "component" ? "" : createInitialContent(type, name),
    },
  };
}

function normalizeFileName(
  rawName: string,
): string {
  const trimmedName = rawName.trim();

  if (trimmedName.toLowerCase().endsWith(".paix")) {
    return trimmedName.slice(0, -5).trim();
  }

  return trimmedName;
}

function createInitialContent(
  type: CreatablePaixFileType,
  name: string,
): string {
  switch (type) {
    case "page":
      return `page "${name}" MainFrame
`;

    case "component":
      return `main >
    Text(value: inputs.label / "${name}")
`;

    case "wireframe":
      return `wireframe "${name}"

main slice horizontal 80 >
    "headerArea"
    "contentArea"
`;

    case "action":
      return `states:
    count: 0

action add:
    states.count: states.count + 1
`;

    case "style":
      return `style "${name}"
`;
  }
}

function createFileId(
  type: CreatablePaixFileType,
): string {
  return (
    `${type}-${Date.now()}-` +
    Math.random().toString(36).slice(2, 8)
  );
}
function createCompanions(folder: string, name: string): PaixFile[] {
  return ([ ["frame", "wireframe", "// Geometry: main is available without slices.\n"],
    ["style", "style", "color: white\nbackgroundColor: #0d3a5c\nradius: 12\n"],
    ["actions", "action", "// Define states and actions here.\n"] ] as const).map(([suffix, type, content]) => ({
      id: createFileId(type), path: `${folder}/${name}.${suffix}.paix`, name: `${name}.${suffix}.paix`, type, content,
    }));
}
