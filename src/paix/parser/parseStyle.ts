import type { IToken } from "chevrotain";

import type {
  PaixStyleNode,
} from "../ast/ast.types";

import { paixAstVisitor } from "../ast/createAst";

import type {
  PaixDiagnostic,
} from "../diagnostics/diagnostic.types";

import { paixLexer } from "../lexer/tokens";
import { paixParser } from "./grammar";

export interface PaixStyleParseResult {
  ast: PaixStyleNode | null;
  diagnostics: PaixDiagnostic[];
}

export function parsePaixStyle(
  source: string,
  filePath?: string,
): PaixStyleParseResult {
  if (/^\s*tag\b/m.test(source)) return parseTags(source, filePath);
  const lexResult = paixLexer.tokenize(source);

  const lexerDiagnostics: PaixDiagnostic[] =
    lexResult.errors.map((error) => ({
      source: "lexer",
      severity: "error",
      message: error.message,
      line: error.line ?? 1,
      column: error.column ?? 1,
      length: error.length,
    }));

  paixParser.input = lexResult.tokens;

  const cst = paixParser.style();

  const parserDiagnostics: PaixDiagnostic[] =
    paixParser.errors.map((error) => {
      const token = error.token as IToken;

      return {
        source: "parser",
        severity: "error",
        message: error.message,
        line: token.startLine ?? 1,
        column: token.startColumn ?? 1,
        length: token.image.length || 1,
      };
    });

  const diagnostics = [
    ...lexerDiagnostics,
    ...parserDiagnostics,
  ];

  if (diagnostics.length > 0) {
    return {
      ast: null,
      diagnostics,
    };
  }

  const ast = paixAstVisitor.visit(cst) as PaixStyleNode;
  if (!ast.name && filePath) ast.name = filePath.replace(/\\/g, "/").split("/").at(-1)!.replace(/\.paix$/, "");
  return {
    ast,
    diagnostics: [],
  };
}
function parseTags(source: string, filePath?: string): PaixStyleParseResult {
  const lines = source.split(/\r?\n/);
  const tags: NonNullable<PaixStyleNode["tags"]> = [];
  const diagnostics: PaixDiagnostic[] = [];
  const report = (line: number, message: string) => diagnostics.push({ source: "parser", severity: "error", message, line, column: 1, length: Math.max(1, lines[line - 1]?.length ?? 1) });
  let index = 0;
  while (index < lines.length) {
    if (!lines[index].trim() || lines[index].trimStart().startsWith("//")) { index++; continue; }
    const header = /^tag\s+([A-Za-z][A-Za-z0-9_]*)\s*:\s*(?:\/\/.*)?$/.exec(lines[index]);
    if (!header) { report(index + 1, "Shared style sheets contain top-level tag Name: blocks only."); index++; continue; }
    const start = index++;
    const body: string[] = [];
    while (index < lines.length && (!lines[index].trim() || /^\s/.test(lines[index]) || lines[index].trimStart().startsWith("//"))) body.push(lines[index++]);
    if (body.some(line => /^\s*(?:when|tag|style)\b/.test(line))) {
      report(start + 1, "Tags contain visual properties and styles: references only; keep conditions in the component style."); continue;
    }
    const parsed = parsePaixStyle("\n".repeat(start + 1) + body.join("\n"));
    diagnostics.push(...parsed.diagnostics);
    if (parsed.ast) tags.push({ name: header[1], properties: parsed.ast.properties, line: start + 1 });
  }
  return { ast: diagnostics.length ? null : { type: "Style", name: filePath?.split("/").at(-1)?.replace(/\.paix$/, "") ?? "", properties: [], conditions: [], tags }, diagnostics };
}
