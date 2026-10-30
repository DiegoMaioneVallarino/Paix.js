// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { PaixRenderer, PaixComponentPreview } from "./PaixRenderer";
import { compilePaixProject } from "../paix/compiler/compile";
import { counterProject } from "../examples/counterProject";
afterEach(cleanup);

test("two instances keep independent states and conditional style variants", () => {
  const program = compilePaixProject(counterProject);
  const { container } = render(<PaixRenderer program={program} />);
  const counters = container.querySelectorAll<HTMLElement>('[data-paix-component="Counter"]');
  expect(counters.length).toBe(2);
  const first = within(counters[0]); const second = within(counters[1]);
  for (let index = 0; index < 3; index++) fireEvent.click(first.getByRole("button", { name: "Add" }));
  expect(first.getByText("3")).toBeTruthy();
  expect(second.getByText("0")).toBeTruthy();
  expect(counters[0].className).toContain("--when-1");
  expect(counters[1].className).not.toContain("--when-1");
  fireEvent.click(first.getByRole("button", { name: "Reset" }));
  expect(first.getByText("0")).toBeTruthy();
});

test("component preview resolves its associated frame, style and actions", () => {
  const program = compilePaixProject(counterProject);
  const { container, getByRole, getByText } = render(<PaixComponentPreview definition={program.components.Counter} program={program} />);
  expect(container.querySelector('[data-paix-style="Counter.style"]')).not.toBeNull();
  expect(container.querySelector('[data-paix-wireframe="Counter.frame"].paix-wireframe-debug')).not.toBeNull();
  fireEvent.click(getByRole("button", { name: "Add" }));
  expect(getByText("1")).toBeTruthy();
});
