import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useProjectStore } from "../../project/project.store";

import type {
  PaixFile,
} from "../../project/project.types";

import type {
  CreatablePaixFileType,
} from "../../project/virtualFileSystem";

import { FileTreeItem } from "./FileTreeItem";
import { FileTypeIcon } from "./FileTypeIcon";

const folderOrder = [
  "pages",
  "components",
  "wireframes",
  "styles",
  "actions",
];

const creatableFileTypes: Array<{
  type: CreatablePaixFileType;
  label: string;
  description: string;
}> = [
  {
    type: "page",
    label: "Page",
    description: "Application route or screen",
  },
  {
    type: "component",
    label: "Component",
    description: "Reusable interface component",
  },
  {
    type: "wireframe",
    label: "Wireframe",
    description: "Spatial layout definition",
  },
  {
    type: "style",
    label: "Style",
    description: "Reusable visual definition",
  },
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

  const createFile = useProjectStore(
    (state) => state.createFile,
  );

  const toggleFolder = useProjectStore(
    (state) => state.toggleFolder,
  );

  const createControlRef =
    useRef<HTMLDivElement>(null);

  const [createMenuOpen, setCreateMenuOpen] =
    useState(false);

  const [selectedType, setSelectedType] =
    useState<CreatablePaixFileType | null>(
      null,
    );

  const [newFileName, setNewFileName] =
    useState("");

  const [creationError, setCreationError] =
    useState<string | null>(null);

  useEffect(() => {
    const handlePointerDown = (
      event: PointerEvent,
    ) => {
      if (
        createControlRef.current &&
        !createControlRef.current.contains(
          event.target as Node,
        )
      ) {
        setCreateMenuOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key !== "Escape") {
        return;
      }

      setCreateMenuOpen(false);
      closeCreateDialog();
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  const groupedFiles = useMemo(() => {
    const groups: Record<string, PaixFile[]> =
      {};

    for (const file of Object.values(
      project.files,
    )) {
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

  function openCreateDialog(
    type: CreatablePaixFileType,
  ) {
    setSelectedType(type);
    setNewFileName("");
    setCreationError(null);
    setCreateMenuOpen(false);
  }

  function closeCreateDialog() {
    setSelectedType(null);
    setNewFileName("");
    setCreationError(null);
  }

  function handleCreateFile(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedType) {
      return;
    }

    const error = createFile(
      selectedType,
      newFileName,
    );

    if (error) {
      setCreationError(error);
      return;
    }

    closeCreateDialog();
  }

  return (
    <aside className="file-panel panel">
      <div className="panel-header">
        <span>Project</span>

        <div
          className="create-file-control"
          ref={createControlRef}
        >
          <button
            type="button"
            className="icon-button"
            aria-label="Create file"
            title="Create file"
            aria-expanded={createMenuOpen}
            onClick={() =>
              setCreateMenuOpen(
                (isOpen) => !isOpen,
              )
            }
          >
            +
          </button>

          {createMenuOpen && (
            <div className="create-file-menu">
              {creatableFileTypes.map(
                (option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() =>
                      openCreateDialog(
                        option.type,
                      )
                    }
                  >
                    <FileTypeIcon
                      type={option.type}
                    />

                    <span>
                      <strong>
                        {option.label}
                      </strong>

                      <small>
                        {option.description}
                      </small>
                    </span>
                  </button>
                ),
              )}
            </div>
          )}
        </div>
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

      {selectedType && (
        <div
          className="create-file-overlay"
          role="presentation"
          onPointerDown={closeCreateDialog}
        >
          <form
            className="create-file-dialog"
            onSubmit={handleCreateFile}
            onPointerDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="create-file-dialog-header">
              <FileTypeIcon
                type={selectedType}
              />

              <div>
                <strong>
                  New {selectedType}
                </strong>

                <span>
                  Create a new Paix file
                </span>
              </div>
            </div>

            <label htmlFor="new-paix-file-name">
              Name
            </label>

            <div className="create-file-name-field">
              <input
                id="new-paix-file-name"
                autoFocus
                value={newFileName}
                placeholder="MyComponent"
                spellCheck={false}
                onChange={(event) => {
                  setNewFileName(
                    event.target.value,
                  );

                  setCreationError(null);
                }}
              />

              <span>.paix</span>
            </div>

            {creationError && (
              <p className="create-file-error">
                {creationError}
              </p>
            )}

            <div className="create-file-actions">
              <button
                type="button"
                onClick={closeCreateDialog}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
}