import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { counterProject } from "../examples/counterProject";
import { PAIX_PROJECT_STORAGE_KEY } from "./persistence";
import type { PaixProject } from "./project.types";

interface ProjectStore {
  project: PaixProject;
  activeFilePath: string;
  openFolders: string[];
  modifiedFiles: string[];

  openFile: (path: string) => void;
  updateFile: (path: string, content: string) => void;
  toggleFolder: (folder: string) => void;
  resetProject: () => void;
}

function createInitialProject(): PaixProject {
  return structuredClone(counterProject);
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      project: createInitialProject(),
      activeFilePath: counterProject.entry,
      openFolders: [
        "pages",
        "components",
        "wireframes",
        "styles",
      ],
      modifiedFiles: [],

      openFile: (path) => {
        const fileExists = Boolean(get().project.files[path]);

        if (!fileExists) {
          return;
        }

        set({
          activeFilePath: path,
        });
      },

      updateFile: (path, content) => {
        set((state) => {
          const currentFile = state.project.files[path];

          if (!currentFile || currentFile.content === content) {
            return state;
          }

          const originalContent =
            counterProject.files[path]?.content;

          const isDifferentFromOriginal =
            originalContent === undefined ||
            originalContent !== content;

          const isAlreadyModified =
            state.modifiedFiles.includes(path);

          let nextModifiedFiles = state.modifiedFiles;

          if (isDifferentFromOriginal && !isAlreadyModified) {
            nextModifiedFiles = [...state.modifiedFiles, path];
          }

          if (!isDifferentFromOriginal && isAlreadyModified) {
            nextModifiedFiles = state.modifiedFiles.filter(
              (filePath) => filePath !== path,
            );
          }

          return {
            project: {
              ...state.project,

              files: {
                ...state.project.files,

                [path]: {
                  ...currentFile,
                  content,
                },
              },
            },

            modifiedFiles: nextModifiedFiles,
          };
        });
      },

      toggleFolder: (folder) => {
        set((state) => {
          const isOpen = state.openFolders.includes(folder);

          return {
            openFolders: isOpen
              ? state.openFolders.filter(
                  (item) => item !== folder,
                )
              : [...state.openFolders, folder],
          };
        });
      },

      resetProject: () => {
        set({
          project: createInitialProject(),
          activeFilePath: counterProject.entry,
          openFolders: [
            "pages",
            "components",
            "wireframes",
            "styles",
          ],
          modifiedFiles: [],
        });
      },
    }),

    {
      name: PAIX_PROJECT_STORAGE_KEY,
      version: 1,

      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        project: state.project,
        activeFilePath: state.activeFilePath,
        openFolders: state.openFolders,
        modifiedFiles: state.modifiedFiles,
      }),
    },
  ),
);