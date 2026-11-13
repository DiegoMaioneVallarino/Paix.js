// @vitest-environment jsdom
import { counterProject } from "../examples/counterProject";

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
  fireEvent,
  within,
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
      project: currentProject,
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

let currentProject = testProject;

afterEach(() => {
  currentProject = testProject;
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

test("opens a headerless component with its companions and switches to actions and style previews", () => {
  currentProject = counterProject;
  mockSelection.activeFilePath = "components/Counter/Counter.paix";
  const view = render(<Workbench />);
  const canvas = () => view.container.querySelector<HTMLElement>(".preview-canvas")!;
  expect(canvas().querySelector('[data-paix-style="Counter.style"]')).not.toBeNull();
  fireEvent.click(within(canvas()).getByRole("button", { name: "Add" }));
  expect(within(canvas()).getByText("1")).toBeTruthy();
  mockSelection.activeFilePath = "components/Counter/Counter.actions.paix";
  view.rerender(<Workbench />);
  expect(canvas().querySelector('[data-paix-component="Counter"]')).not.toBeNull();
  fireEvent.click(within(canvas()).getByRole("button", { name: "Add" }));
  expect(within(canvas()).getByText("1")).toBeTruthy();
  mockSelection.activeFilePath = "components/Counter/Counter.style.paix";
  view.rerender(<Workbench />);
  expect(within(canvas()).getByText("Preview text")).toBeTruthy();
  expect(canvas().querySelector('[data-paix-style-preview="Counter.style"]')).not.toBeNull();
});

test("previews each shared tag independently", () => {
  currentProject = counterProject;
  mockSelection.activeFilePath = "styles/surfaces.paix";
  const view = render(<Workbench />);
  const canvas = view.container.querySelector<HTMLElement>(".preview-canvas")!;
  const selector = within(canvas).getByRole("combobox", { name: "Style tag" });
  expect(canvas.querySelector('[data-paix-style-preview="Rounded"]')).not.toBeNull();
  fireEvent.change(selector, { target: { value: "Glass" } });
  expect(canvas.querySelector('[data-paix-style-preview="Glass"]')).not.toBeNull();
  expect(canvas.querySelector("style")?.textContent).toContain("linear-gradient(180deg, #0d3a5c, #071b2b)");
  expect(within(canvas).getByText("Preview text")).toBeTruthy();
});

test("Run launches the complete current project while a style is open", () => {
  currentProject = counterProject;
  mockSelection.activeFilePath = "styles/surfaces.paix";
  const setItem = vi.fn();
  const popup = { sessionStorage: { setItem }, location: { replace: vi.fn() }, focus: vi.fn(), close: vi.fn(), opener: window };
  const open = vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
  try {
    const view = render(<Workbench />);
    fireEvent.click(view.getByRole("button", { name: "Run" }));
    expect(JSON.parse(setItem.mock.calls[0][1])).toEqual(counterProject);
    expect(popup.location.replace).toHaveBeenCalledWith(new URL("/run", location.origin).href);
    open.mockReturnValue(null);
    fireEvent.click(view.getByRole("button", { name: "Run" }));
    expect(view.getByRole("alert").textContent).toContain("bloqueó");
  } finally { open.mockRestore(); }
});
