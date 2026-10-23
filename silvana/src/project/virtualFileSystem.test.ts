import {
  describe,
  expect,
  test,
} from "vitest";

import { counterProject } from "../examples/counterProject";

import {
  createPaixFile,
  type CreatablePaixFileType,
} from "./virtualFileSystem";

const creationCases: Array<{
  type: CreatablePaixFileType;
  name: string;
  path: string;
  declaration: string;
}> = [
  {
    type: "page",
    name: "News",
    path: "pages/News.paix",
    declaration: 'page "News" MainFrame',
  },
  {
    type: "component",
    name: "NewsCard",
    path: "components/NewsCard.paix",
    declaration:
      'component "NewsCard" MainFrame',
  },
  {
    type: "wireframe",
    name: "NewsFrame",
    path: "wireframes/NewsFrame.paix",
    declaration:
      'wireframe "NewsFrame"',
  },
  {
    type: "style",
    name: "NewsStyle",
    path: "styles/NewsStyle.paix",
    declaration:
      'style "NewsStyle"',
  },
];

describe("Paix virtual file system", () => {
  test.each(creationCases)(
    "creates a $type file",
    ({
      type,
      name,
      path,
      declaration,
    }) => {
      const result = createPaixFile(
        counterProject,
        type,
        name,
      );

      expect(result.ok).toBe(true);

      if (!result.ok) {
        throw new Error(result.error);
      }

      expect(result.file.path).toBe(path);
      expect(result.file.name).toBe(
        `${name}.paix`,
      );

      expect(result.file.type).toBe(type);

      expect(result.file.content).toContain(
        declaration,
      );
    },
  );

  test("removes the .paix extension from input", () => {
    const result = createPaixFile(
      counterProject,
      "component",
      "ArticleCard.paix",
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.error);
    }

    expect(result.file.path).toBe(
      "components/ArticleCard.paix",
    );
  });

  test("rejects duplicate paths regardless of case", () => {
    const result = createPaixFile(
      counterProject,
      "page",
      "HOME",
    );

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error(
        "Expected duplicate creation to fail.",
      );
    }

    expect(result.error).toContain(
      "already exists",
    );
  });

  test("rejects invalid Paix identifiers", () => {
    const result = createPaixFile(
      counterProject,
      "component",
      "News Card",
    );

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error(
        "Expected invalid name to fail.",
      );
    }

    expect(result.error).toContain(
      "must start with a letter",
    );
  });
});