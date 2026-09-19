export interface PaixDiagnostic {
  source: "lexer" | "parser";
  severity: "error" | "warning";
  message: string;
  line: number;
  column: number;
  length: number;
}