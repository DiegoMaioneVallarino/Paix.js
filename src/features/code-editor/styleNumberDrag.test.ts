import { describe, expect, test } from "vitest";

import {
  dragStyleNumber,
  getStyleNumberAtColumn,
} from "./styleNumberDrag";

describe("Paix style number dragging", () => {
  test("changes numeric style values and preserves their units", () => {
    const value = getStyleNumberAtColumn("    radius: 12px", 16);
    expect(value).not.toBeNull();
    expect(dragStyleNumber(value!, 18)).toBe("15px");
    expect(dragStyleNumber(value!, -12)).toBe("10px");
  });

  test("limits opacity and supports decimal values", () => {
    const value = getStyleNumberAtColumn("opacity: 0.5", 11);
    expect(dragStyleNumber(value!, 12)).toBe("0.52");
    expect(dragStyleNumber(value!, 600)).toBe("1");
    expect(dragStyleNumber(value!, -600)).toBe("0");
  });

  test("ignores numbers in gradients and nonnumeric values", () => {
    expect(getStyleNumberAtColumn("color: rgb(10, 0, 0)", 12)).toBeNull();
    expect(getStyleNumberAtColumn("backgroundImage: gradient 90deg from red to blue", 27)).toBeNull();
    expect(getStyleNumberAtColumn("radius: medium", 10)).toBeNull();
  });

  test("does not activate when clicking the property name", () => {
    expect(getStyleNumberAtColumn("radius: 12", 2)).toBeNull();
  });
});
