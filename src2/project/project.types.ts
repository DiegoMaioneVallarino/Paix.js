export type PaixFileType =
  | "page"
  | "component"
  | "wireframe"
  | "style"
  | "action";

export interface PaixFile {
  id: string;
  name: string;
  path: string;
  type: PaixFileType;
  content: string;
}

export interface PaixProject {
  id: string;
  name: string;
  entry: string;
  files: Record<string, PaixFile>;
}