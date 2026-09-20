export interface PaixDiagnostic {
  source: "lexer" | "parser" | "semantic";
  severity: "error" | "warning";
  message: string;
  line: number;
  column: number;
  length: number;
  filePath?: string;
}