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
    path: "components/NewsCard/NewsCard.paix",
    declaration:
      'main >',
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
      "components/ArticleCard/ArticleCard.paix",
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
test("creates a complete component bundle without overwriting existing companions", () => {
  const result = createPaixFile(counterProject, "component", "NewCard");
  if (!result.ok) throw new Error(result.error);
  expect(result.companions?.map(file => file.path)).toEqual([
    "components/NewCard/NewCard.frame.paix", "components/NewCard/NewCard.style.paix", "components/NewCard/NewCard.actions.paix",
  ]);
  const project = structuredClone(counterProject);
  const companion = result.companions![0];
  project.files[companion.path] = companion;
  expect(createPaixFile(project, "component", "NewCard").ok).toBe(false);
});
