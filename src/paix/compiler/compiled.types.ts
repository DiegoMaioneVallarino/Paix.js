import type {
  PaixComponentDefinitionNode,
  PaixPageNode,
  PaixStyleNode,
  PaixWireframeNode,
} from "../ast/ast.types";

import type {
  PaixDiagnostic,
} from "../diagnostics/diagnostic.types";

export interface PaixCompiledProject {
  pages?: Record<string, PaixPageNode>;
  entryPage: PaixPageNode | null;

  components: Record<
    string,
    PaixComponentDefinitionNode
  >;

  wireframes: Record<
    string,
    PaixWireframeNode
  >;

  styles: Record<
    string,
    PaixStyleNode
  >;

  tags?: Record<string, PaixStyleNode>;
  diagnostics: PaixDiagnostic[];
}