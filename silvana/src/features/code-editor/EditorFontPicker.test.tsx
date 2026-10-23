// @vitest-environment jsdom
import { describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { EditorFontPicker, findFontValue } from "./EditorFontPicker";
afterEach(cleanup);
describe("Paix font picker", () => {
  test("detects the complete font value, including a quoted family list", () => {
    expect(findFontValue('font: "Segoe UI", sans-serif // comment', 10)?.text).toBe('"Segoe UI", sans-serif');
    expect(findFontValue("font: Arial", 2)).toBeNull();
    expect(findFontValue("color: red", 9)).toBeNull();
  });
  test("filters fonts and applies a family with spaces", () => {
    const onChange = vi.fn();
    render(<EditorFontPicker font="Arial" x={20} y={20} onChange={onChange} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText("Buscar fuente"), { target: { value: "Segoe" } });
    fireEvent.click(screen.getByRole("button", { name: "Segoe UI" }));
    expect(onChange).toHaveBeenCalledWith('"Segoe UI"');
  });
});
