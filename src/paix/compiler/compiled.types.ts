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

  diagnostics: PaixDiagnostic[];
}