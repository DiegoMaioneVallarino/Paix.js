import { useMemo } from "react";

import { useProjectStore } from "../../project/project.store";
import type { PaixFile } from "../../project/project.types";

import { FileTreeItem } from "./FileTreeItem";

const folderOrder = [
  "pages",
  "components",
  "wireframes",
  "styles",
  "actions",
];

export function FileExplorer() {
  const project = useProjectStore(
    (state) => state.project,
  );

  const activeFilePath = useProjectStore(
    (state) => state.activeFilePath,
  );

  const openFolders = useProjectStore(
    (state) => state.openFolders,
  );

  const modifiedFiles = useProjectStore(
    (state) => state.modifiedFiles,
  );

  const openFile = useProjectStore(
    (state) => state.openFile,
  );

  const toggleFolder = useProjectStore(
    (state) => state.toggleFolder,
  );

  const groupedFiles = useMemo(() => {
    const groups: Record<string, PaixFile[]> = {};

    for (const file of Object.values(project.files)) {
      const folder =
        file.path.split("/")[0] ?? "other";

      if (!groups[folder]) {
        groups[folder] = [];
      }

      groups[folder].push(file);
    }

    for (const files of Object.values(groups)) {
      files.sort((firstFile, secondFile) =>
        firstFile.name.localeCompare(
          secondFile.name,
        ),
      );
    }

    return groups;
  }, [project.files]);

  const folders = Object.keys(groupedFiles).sort(
    (first, second) => {
      const firstIndex =
        folderOrder.indexOf(first);

      const secondIndex =
        folderOrder.indexOf(second);

      const normalizedFirst =
        firstIndex === -1
          ? Number.MAX_SAFE_INTEGER
          : firstIndex;

      const normalizedSecond =
        secondIndex === -1
          ? Number.MAX_SAFE_INTEGER
          : secondIndex;

      return normalizedFirst - normalizedSecond;
    },
  );

  return (
    <aside className="file-panel panel">
      <div className="panel-header">
        <span>Project</span>

        <button
          type="button"
          className="icon-button"
          aria-label="Create file"
          title="Create file"
        >
          +
        </button>
      </div>

      <div className="file-tree">
        <div className="project-root">
          <span className="tree-arrow">⌄</span>
          <span className="folder-icon" />
          <strong>{project.name}</strong>
        </div>

        {folders.map((folder) => {
          const isOpen =
            openFolders.includes(folder);

          return (
            <div
              className="tree-group"
              key={folder}
            >
              <button
                type="button"
                className="tree-folder"
                onClick={() =>
                  toggleFolder(folder)
                }
              >
                <span className="tree-arrow">
                  {isOpen ? "⌄" : "›"}
                </span>

                <span className="folder-icon" />
                <span>{folder}</span>
              </button>

              {isOpen &&
                groupedFiles[folder].map(
                  (file) => (
                    <FileTreeItem
                      key={file.id}
                      file={file}
                      selected={
                        file.path ===
                        activeFilePath
                      }
                      modified={modifiedFiles.includes(
                        file.path,
                      )}
                      onOpen={openFile}
                    />
                  ),
                )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}