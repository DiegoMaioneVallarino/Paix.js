import type {
  PaixFile,
} from "../../project/project.types";

import { FileTypeIcon } from "./FileTypeIcon";

interface FileTreeItemProps {
  file: PaixFile;
  selected: boolean;
  modified: boolean;
  onOpen: (path: string) => void;
}

export function FileTreeItem({
  file,
  selected,
  modified,
  onOpen,
}: FileTreeItemProps) {
  return (
    <button
      type="button"
      className={`tree-file ${
        selected ? "selected" : ""
      }`}
      title={file.path}
      onClick={() => onOpen(file.path)}
    >
      <FileTypeIcon type={file.type} />

      <span className="tree-file-name">
        {file.name}
      </span>

      {modified && (
        <span
          className="modified-dot"
          title="Modified from the original example"
        />
      )}
    </button>
  );
}