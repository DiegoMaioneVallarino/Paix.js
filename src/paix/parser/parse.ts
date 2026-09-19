import type { IToken } from "chevrotain";
import type { PaixPageNode } from "../ast/ast.types";
import { paixAstVisitor } from "../ast/createAst";
import type { PaixDiagnostic } from "../diagnostics/diagnostic.types";
import { paixLexer } from "../lexer/tokens";
import { paixParser } from "./grammar";

export interface PaixPageParseResult {
  ast: PaixPageNode | null;
  diagnostics: PaixDiagnostic[];
}

export function parsePaixPage(
  source: string,
): PaixPageParseResult {
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

  const cst = paixParser.page();

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

  return {
    ast: paixAstVisitor.visit(cst) as PaixPageNode,
    diagnostics: [],
  };
}