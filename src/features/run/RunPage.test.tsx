// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { counterProject } from "../../examples/counterProject";
import { RunPage } from "./RunPage";
import { RUN_PROJECT_KEY, runProject } from "./runProject";

afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); });

test("opens an independent window with a snapshot of the current project", () => {
  const storage = { setItem: vi.fn() };
  const popup = { sessionStorage: storage, opener: window, location: { replace: vi.fn() }, focus: vi.fn(), close: vi.fn() };
  const open = vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
  expect(runProject(counterProject)).toBeNull();
  expect(open).toHaveBeenCalledWith("about:blank", "_blank", expect.stringContaining("popup=yes"));
  expect(JSON.parse(storage.setItem.mock.calls[0][1])).toEqual(counterProject);
  expect(storage.setItem.mock.calls[0][0]).toBe(RUN_PROJECT_KEY);
  expect(popup.location.replace).toHaveBeenCalledWith(new URL("/run", location.origin).href);
  expect(popup.opener).toBeNull();
  expect(popup.focus).toHaveBeenCalled();
});

test("reports blocked popups and cleans up failed setup", () => {
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  expect(runProject(counterProject)).toContain("bloqueó");
  const popup = { sessionStorage: { setItem: () => { throw new Error("Storage denied"); } }, close: vi.fn() };
  open.mockReturnValue(popup as unknown as Window);
  expect(runProject(counterProject)).toContain("No se pudo");
  expect(popup.close).toHaveBeenCalled();
});

test("runs entry page without editor chrome and supports state actions", () => {
  sessionStorage.setItem(RUN_PROJECT_KEY, JSON.stringify(counterProject));
  const view = render(<RunPage />);
  expect(view.container.querySelector(".paix-page")).not.toBeNull();
  expect(view.container.querySelector(".workbench")).toBeNull();
  const first = view.container.querySelector('[data-paix-component="Counter"]')!;
  const button = [...first.querySelectorAll("button")].find(b => b.textContent === "Add")!;
  fireEvent.click(button);
  expect(first.textContent).toContain("1");
  expect(sessionStorage.getItem(RUN_PROJECT_KEY)).toBe(JSON.stringify(counterProject));
});

test("explains missing snapshots and malformed data", () => {
  const view = render(<RunPage />);
  expect(view.getByText(/Abre un proyecto/)).toBeTruthy();
  view.unmount();
  sessionStorage.setItem(RUN_PROJECT_KEY, "{");
  expect(render(<RunPage />).getByText(/No se pudo cargar/)).toBeTruthy();
});

test("reports compilation errors instead of running an invalid page", () => {
  sessionStorage.setItem(RUN_PROJECT_KEY, JSON.stringify({ ...counterProject, entry: "missing.paix" }));
  const view = render(<RunPage />);
  expect(view.getByText("El proyecto tiene errores")).toBeTruthy();
  expect(view.container.querySelector(".paix-page")).toBeNull();
});
