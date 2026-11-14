import type { PaixDiagnostic } from "../diagnostics/diagnostic.types";
export interface DocumentOptions { frame?: string; styleTags?: string[]; actionSheets?: string[]; address?: string }
/** Document directives are top-level only; blanking preserves diagnostic positions. */
export function readDocumentOptions(source: string) {
  const options: DocumentOptions = {}, diagnostics: PaixDiagnostic[] = [];
  const seen = new Set<string>();
  const body = source.split(/\r?\n/).map((line, index) => {
    const match = /^(frame|styles|actions|address)\s*:\s*(.*)$/.exec(line);
    if (!match) return line;
    const [, key, raw] = match;
    const error = (message: string) => diagnostics.push({ source: "parser", severity: "error", message, line: index + 1, column: 1, length: key.length });
    if (seen.has(key)) error(`Duplicate directive "${key}".`);
    seen.add(key);
    const value = raw.replace(/\s+\/\/.*$/, "").trim();
    if (key === "address") {
      try { const address: unknown = JSON.parse(value); if (typeof address !== "string" || !/^\/(?:[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*)?\/?$/.test(address)) throw Error(); options.address = address.replace(/\/+$/, "") || "/"; }
      catch { error('address expects a quoted local path such as "/catalogue".'); }
    } else if (!/^[A-Za-z][\w]*(?:\s*,\s*[A-Za-z][\w]*)*$/.test(value)) error(`${key} expects names separated by commas.`);
    else {
      const names = value.split(',').map(name => name.trim());
      if (key === "frame") { if (names.length !== 1) error("Choose one frame."); options.frame = names[0]; }
      else if (key === "styles") options.styleTags = names;
      else options.actionSheets = names;
    }
    return " ".repeat(line.length);
  }).join('\n');
  return { options, diagnostics, body };
}
