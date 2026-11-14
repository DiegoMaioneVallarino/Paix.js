import type {
  PaixFile,
  PaixFileType,
  PaixProject,
} from "./project.types";

export type CreatablePaixFileType = Extract<
  PaixFileType,
  "page" | "component" | "wireframe" | "style" | "action"
>;

export interface CreationOptions { ownFrame?: boolean; ownStyle?: boolean; ownActions?: boolean; frame?: string; styles?: string[]; actions?: string[]; address?: string }

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
  options: CreationOptions = {},
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

  if (type === "page" && Object.values(project.files).some(file=>file.type === "page" && file.name.replace(/(?:\.page)?\.paix$/i, "").toLowerCase()===name.toLowerCase())) return {ok:false,error:`Page "${name}" already exists.`};
  if (type === "page" && options.address && !/^\/(?:[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*)?\/?$/.test(options.address)) return {ok:false,error:'Use a local address such as /catalogue.'};
  
  const folder = type === "component" || type === "page" ? `${folderByType[type]}/${name}` : folderByType[type];
  const path = `${folder}/${name}${type === "page" ? ".page" : ""}.paix`;
  if (type === "component" && Object.values(project.files).some(file => file.type === "component" && file.name.toLowerCase() === `${name}.paix`.toLowerCase())) {
    return { ok: false, error: `Component "${name}" already exists.` };
  }

  if (type === "component" || type === "page") {
    const paths = new Set(Object.keys(project.files).map(path => path.toLowerCase()));
    if (createCompanions(folder, name, options).some(file => paths.has(file.path.toLowerCase()))) {
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
    companions: type === "component" || type === "page" ? createCompanions(folder, name, options) : [],
    file: {
      id: createFileId(type),
      name: path.split("/").at(-1)!,
      path,
      type,
      content: (type === "component" || type === "page") ? [
        ...(type === "page" ? [`address: ${JSON.stringify(options.address || '/' + name.toLowerCase())}`] : []),
        ...(options.frame ? [`frame: ${options.frame}`] : []),
        ...(options.styles?.length ? [`styles: ${options.styles.join(', ')}`] : []),
        ...(options.actions?.length ? [`actions: ${options.actions.join(', ')}`] : []),
        '', `main >`, `    Text(value: "${name}")`, ''
      ].join('\n') : createInitialContent(type, name),
    },
  };
}

function normalizeFileName(
  rawName: string,
): string {
  const trimmedName = rawName.trim();

  if (trimmedName.toLowerCase().endsWith(".paix")) {
    return trimmedName.replace(/(?:\.page)?\.paix$/i, "").trim();
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
      return `tag ${name}:
    color: white
    radius: 12
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
function createCompanions(folder: string, name: string, options: CreationOptions): PaixFile[] {
  return ([ ["frame", "wireframe", "// Geometry: main is available without slices.\n"],
    ["style", "style", "color: white\nbackgroundColor: #0d3a5c\nradius: 12\n"],
    ["actions", "action", "// Define states and actions here.\n"] ] as const).filter(([suffix]) => suffix === "frame" ? options.ownFrame && !options.frame : suffix === "style" ? options.ownStyle : options.ownActions).map(([suffix, type, content]) => ({
      id: createFileId(type), path: `${folder}/${name}.${suffix}.paix`, name: `${name}.${suffix}.paix`, type, content,
    }));
}

export function makeCompanion(owner: PaixFile, kind: "frame" | "style" | "actions"): PaixFile {
  const path=owner.path.replace(/(?:\.page)?\.paix$/,`.${kind}.paix`);
  return {id:createFileId(kind==='frame'?'wireframe':kind==='style'?'style':'action'),path,name:path.split('/').at(-1)!,type:kind==='frame'?'wireframe':kind==='style'?'style':'action',content:'',enabled:true};
}
