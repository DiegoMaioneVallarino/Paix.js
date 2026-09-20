import type {
  PaixComponentDefinitionNode,
  PaixPageNode,
} from "../ast/ast.types";

import type { PaixDiagnostic } from "../diagnostics/diagnostic.types";

export interface PaixCompiledProject {
  entryPage: PaixPageNode | null;

  components: Record<
    string,
    PaixComponentDefinitionNode
  >;

  diagnostics: PaixDiagnostic[];
}