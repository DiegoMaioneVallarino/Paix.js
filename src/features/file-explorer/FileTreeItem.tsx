import type { PaixFile } from "../../project/project.types";

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
      className={`tree-file ${selected ? "selected" : ""}`}
      title={file.path}
      onClick={() => onOpen(file.path)}
    >
      <span className="paix-file-icon">P</span>

      <span className="tree-file-name">{file.name}</span>

      {modified && (
        <span
          className="modified-dot"
          title="Modified from the original example"
        />
      )}
    </button>
  );
}