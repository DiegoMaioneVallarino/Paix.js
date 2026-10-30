import type {
  PaixFile,
  PaixFileType,
  PaixProject,
} from "./project.types";

export type CreatablePaixFileType = Extract<
  PaixFileType,
  "page" | "component" | "wireframe" | "style"
>;

interface CreateFileSuccess {
  ok: true;
  file: PaixFile;
  folder: string;
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

  const folder = folderByType[type];
  const path = `${folder}/${name}.paix`;

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

    file: {
      id: createFileId(type),
      name: `${name}.paix`,
      path,
      type,
      content: createInitialContent(type, name),
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
      return `component "${name}" MainFrame
`;

    case "wireframe":
      return `wireframe "${name}"

main slice horizontal 80 >
    "headerArea"
    "contentArea"
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