// @vitest-environment jsdom

import {
  afterEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import {
  cleanup,
  render,
} from "@testing-library/react";

import type {
  PaixProject,
} from "../project/project.types";

import {
  Workbench,
} from "./Workbench";

const mockSelection = vi.hoisted(() => ({
  activeFilePath: "components/Counter.paix",
}));

vi.mock("../project/project.store", () => ({
  useProjectStore: (
    selector: (state: {
      project: PaixProject;
      activeFilePath: string;
      modifiedFiles: string[];
      updateFile: () => void;
      resetProject: () => void;
    }) => unknown,
  ) =>
    selector({
      project: testProject,
      activeFilePath:
        mockSelection.activeFilePath,
      modifiedFiles: [],
      updateFile: () => {},
      resetProject: () => {},
    }),
}));

vi.mock(
  "../features/code-editor/CodeEditor",
  () => ({
    CodeEditor: () => (
      <div data-testid="code-editor" />
    ),
  }),
);

vi.mock(
  "../features/file-explorer/FileExplorer",
  () => ({
    FileExplorer: () => (
      <div data-testid="file-explorer" />
    ),
  }),
);

vi.mock(
  "../features/diagnostics/DiagnosticsPanel",
  () => ({
    DiagnosticsPanel: () => (
      <div data-testid="diagnostics" />
    ),
  }),
);

const testProject: PaixProject = {
  id: "preview-test",
  name: "preview-test",
  entry: "pages/home.paix",

  files: {
    "pages/home.paix": {
      id: "home",
      name: "home.paix",
      path: "pages/home.paix",
      type: "page",
      content: `page "home" MainFrame

main >
    Text(value: "HOME_VISIBLE")`,
    },

    "components/Counter.paix": {
      id: "counter",
      name: "Counter.paix",
      path: "components/Counter.paix",
      type: "component",
      content: `component "Counter" CounterFrame

main >
    Text(value: "COUNTER_VISIBLE")`,
    },

    "wireframes/MainFrame.paix": {
      id: "main-frame",
      name: "MainFrame.paix",
      path: "wireframes/MainFrame.paix",
      type: "wireframe",
      content: `wireframe "MainFrame"`,
    },

    "wireframes/CounterFrame.paix": {
      id: "counter-frame",
      name: "CounterFrame.paix",
      path: "wireframes/CounterFrame.paix",
      type: "wireframe",
      content: `wireframe "CounterFrame"`,
    },
  },
};

afterEach(() => {
  cleanup();
  mockSelection.activeFilePath =
    "components/Counter.paix";
});

describe("Workbench preview", () => {
  test(
    "shows the open component and its wireframe",
    () => {
      const { container } = render(
        <Workbench />,
      );

      const preview =
        container.querySelector(
          ".preview-canvas",
        );

      expect(preview).not.toBeNull();

      if (
  !preview?.querySelector(
    '[data-paix-component="Counter"]',
  )
) {
  throw new Error(
    `Preview actual:\n${preview?.innerHTML ?? "No existe .preview-canvas"}`,
  );
}

      expect(
        preview?.querySelector(
          '[data-paix-wireframe="CounterFrame"]',
        ),
      ).not.toBeNull();

      expect(
        preview?.textContent,
      ).toContain("COUNTER_VISIBLE");

      expect(
        preview?.textContent,
      ).not.toContain("HOME_VISIBLE");
    },
  );

  test(
    "returns to the page when the page is opened",
    () => {
      const view = render(<Workbench />);

      mockSelection.activeFilePath =
        "pages/home.paix";

      view.rerender(<Workbench />);

      const preview =
        view.container.querySelector(
          ".preview-canvas",
        );

      expect(
        preview?.textContent,
      ).toContain("HOME_VISIBLE");

      expect(
        preview?.querySelector(
          '[data-paix-component="Counter"]',
        ),
      ).toBeNull();
    },
  );
});