import type { PaixPageNode } from "../../paix/ast/ast.types";

interface AstViewerProps {
  ast: PaixPageNode | null;
}

export function AstViewer({ ast }: AstViewerProps) {
  if (!ast) {
    return (
      <div className="diagnostic-placeholder">
        No AST is available for this file.
      </div>
    );
  }

  return (
    <pre className="ast-viewer">
      <code>{JSON.stringify(ast, null, 2)}</code>
    </pre>
  );
}