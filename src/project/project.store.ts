import { normalizePageFiles } from "./pageFileNames";
import { create } from "zustand";

import {
  createJSONStorage,
  persist,
} from "zustand/middleware";

import { counterProject } from "../examples/counterProject";

import { PAIX_PROJECT_STORAGE_KEY } from "./persistence";

import type {
  PaixProject,
} from "./project.types";

import {
  createPaixFile, makeCompanion, type CreationOptions,
  type CreatablePaixFileType,
} from "./virtualFileSystem";

export interface ProjectStore {
  project: PaixProject;
  activeFilePath: string;
  openFolders: string[];
  modifiedFiles: string[];

  toggleFile: (path: string) => void;
  addCompanion: (ownerPath: string, kind: "frame" | "style" | "actions") => void;
  openFile: (path: string) => void;

  updateFile: (
    path: string,
    content: string,
  ) => void;

  createFile: (
    type: CreatablePaixFileType,
    name: string,
    options?: CreationOptions,
  ) => string | null;

  toggleFolder: (folder: string) => void;
  resetProject: () => void;
}

function createInitialProject(): PaixProject {
  return normalizePageFiles(structuredClone(counterProject)).project;
}

export const useProjectStore =
  create<ProjectStore>()(
    persist(
      (set, get) => ({
        project: createInitialProject(),
        activeFilePath: createInitialProject().entry,

        openFolders: [
          "pages",
          "components",
          ...Object.keys(counterProject.files).filter(path => path.startsWith("components/")).map(path => path.slice(0, path.lastIndexOf("/"))),
          "wireframes",
          "styles",
        ],

        modifiedFiles: [],

        toggleFile: (path) => set(state => {
          const file=state.project.files[path]; if(!file) return state;
          return {project:{...state.project,files:{...state.project.files,[path]:{...file,enabled:file.enabled===false}}},modifiedFiles:[...new Set([...state.modifiedFiles,path])]};
        }),
        addCompanion: (ownerPath,kind) => {
          const owner=get().project.files[ownerPath]; if(!owner || !['component','page'].includes(owner.type)) return;
          const file=makeCompanion(owner,kind);
          if(get().project.files[file.path]) { get().openFile(file.path); return; }
          set(state=>({project:{...state.project,files:{...state.project.files,[file.path]:file}},activeFilePath:file.path,modifiedFiles:[...state.modifiedFiles,file.path]}));
        },
        openFile: (path) => {
          const fileExists = Boolean(
            get().project.files[path],
          );

          if (!fileExists) {
            return;
          }

          set({
            activeFilePath: path,
          });
        },

        updateFile: (path, content) => {
          set((state) => {
            const currentFile =
              state.project.files[path];

            if (
              !currentFile ||
              currentFile.content === content
            ) {
              return state;
            }

            const originalContent =
              counterProject.files[path]?.content;

            const isDifferentFromOriginal =
              originalContent === undefined ||
              originalContent !== content ||
              (currentFile.enabled !== false) !== (counterProject.files[path]?.enabled !== false);

            const isAlreadyModified =
              state.modifiedFiles.includes(path);

            let nextModifiedFiles =
              state.modifiedFiles;

            if (
              isDifferentFromOriginal &&
              !isAlreadyModified
            ) {
              nextModifiedFiles = [
                ...state.modifiedFiles,
                path,
              ];
            }

            if (
              !isDifferentFromOriginal &&
              isAlreadyModified
            ) {
              nextModifiedFiles =
                state.modifiedFiles.filter(
                  (filePath) =>
                    filePath !== path,
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

              modifiedFiles:
                nextModifiedFiles,
            };
          });
        },

        createFile: (type, name, options) => {
          const result = createPaixFile(
            get().project,
            type,
            name,
            options,
          );

          if (!result.ok) {
            return result.error;
          }

          const { file, folder, companions = [] } = result;

          set((state) => ({
            project: {
              ...state.project,

              files: {
                ...state.project.files,
                [file.path]: file,
                ...Object.fromEntries(companions.map(companion => [companion.path, companion])),
              },
            },

            activeFilePath: file.path,

            openFolders:
              state.openFolders.includes(folder)
                ? state.openFolders
                : [
                    ...state.openFolders,
                    folder,
                  ],

            modifiedFiles:
              state.modifiedFiles.includes(
                file.path,
              )
                ? state.modifiedFiles
                : [
                    ...state.modifiedFiles,
                    file.path,
                    ...companions.map(companion => companion.path),
                  ],
          }));

          return null;
        },

        toggleFolder: (folder) => {
          set((state) => {
            const isOpen =
              state.openFolders.includes(folder);

            return {
              openFolders: isOpen
                ? state.openFolders.filter(
                    (item) => item !== folder,
                  )
                : [
                    ...state.openFolders,
                    folder,
                  ],
            };
          });
        },

        resetProject: () => {
          set({
            project: createInitialProject(),
            activeFilePath:
              createInitialProject().entry,

            openFolders: [
              "pages",
              "components",
          ...Object.keys(counterProject.files).filter(path => path.startsWith("components/")).map(path => path.slice(0, path.lastIndexOf("/"))),
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
        merge: (persisted, current) => {
          const saved = persisted as Partial<ProjectStore> | undefined;
          if (!saved?.project) return current;
          const { project, renamed } = normalizePageFiles(saved.project);
          return { ...current, ...saved, project,
            activeFilePath: renamed[saved.activeFilePath ?? ""] ?? saved.activeFilePath ?? project.entry,
            modifiedFiles: (saved.modifiedFiles ?? []).map(path => renamed[path] ?? path),
          };
        },

        storage: createJSONStorage(
          () => localStorage,
        ),

        partialize: (
          state: ProjectStore,
        ) => ({
          project: state.project,
          activeFilePath:
            state.activeFilePath,
          openFolders: state.openFolders,
          modifiedFiles:
            state.modifiedFiles,
        }),
      },
    ),
  );