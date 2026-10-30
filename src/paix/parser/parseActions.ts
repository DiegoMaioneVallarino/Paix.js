import type { PaixActionsNode } from "../ast/ast.types";
import type { PaixDiagnostic } from "../diagnostics/diagnostic.types";
import { paixLexer } from "../lexer/tokens";
import { paixParser } from "./grammar";
import { paixAstVisitor } from "../ast/createAst";
import { validateCollectionDeclarations } from "../semantic/validateCollections";

export function parsePaixActions(source: string, filePath = ""): { ast: PaixActionsNode | null; diagnostics: PaixDiagnostic[] } {
  const lex = paixLexer.tokenize(source);
  paixParser.input = lex.tokens;
  const cst = paixParser.actions();
  const diagnostics: PaixDiagnostic[] = [
    ...lex.errors.map(error => ({ source: "lexer" as const, severity: "error" as const, message: error.message, line: error.line ?? 1, column: error.column ?? 1, length: error.length })),
    ...paixParser.errors.map(error => ({ source: "parser" as const, severity: "error" as const, message: error.message, line: error.token.startLine ?? 1, column: error.token.startColumn ?? 1, length: error.token.image.length || 1 })),
  ];
  if (diagnostics.length) return { ast: null, diagnostics };
  const ast = paixAstVisitor.visit(cst) as PaixActionsNode;
  ast.name = filePath.replace(/\\/g, "/").split("/").at(-1)?.replace(/\.actions\.paix$/, "") ?? "";
  const report = (message: string) => diagnostics.push({ source: "semantic", severity: "error", message, line: 1, column: 1, length: 1 });
  const states = new Set<string>();
  for (const state of ast.states) {
    if (states.has(state.name)) report(`State "states.${state.name.slice(1)}" is declared more than once.`);
    states.add(state.name);
  }
  const actions = new Map(ast.actions.map(action => [action.name, action]));
  if (actions.size !== ast.actions.length) report("Action names must be unique in the file.");
  const visited = new Set<string>();
  const visit = (name: string, chain: Set<string>) => {
    if (chain.has(name)) { report(`Recursive action: ${[...chain, name].join(" -> ")}.`); return; }
    if (visited.has(name)) return;
    const action = actions.get(name);
    if (!action) { report(`Unknown action "actions.${name}".`); return; }
    const next = new Set(chain).add(name);
    for (const step of action.steps) {
      if ("action" in step) visit(step.action, next);
      else if (!states.has(step.state)) report(`Unknown state "states.${step.state.slice(1)}".`);
    }
    visited.add(name);
  };
  for (const action of ast.actions) visit(action.name, new Set());
  diagnostics.push(...validateCollectionDeclarations(ast, source));
  return { ast: diagnostics.length ? null : ast, diagnostics };
}
