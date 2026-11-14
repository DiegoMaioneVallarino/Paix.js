import { compilePaixProject } from "../../paix/compiler/compile";
import type { PaixProject } from "../../project/project.types";
import { makeZip, textFile, type ExportFile } from "./zip";

const encodeHtml = (text: string) => text.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
const encodeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

async function download(url: string): Promise<Response> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok || response.headers.get("content-type")?.includes("text/html")) throw new Error(`No se pudo incluir el recurso: ${url}`);
  return response;
}

export async function buildExportFiles(project: PaixProject): Promise<ExportFile[]> {
  const program = compilePaixProject(project);
  const errors = program.diagnostics.filter(d => d.severity === "error");
  if (!program.entryPage || errors.length) throw new Error("Corrige los errores antes de exportar. " + errors.slice(0, 3).map(d => `${d.filePath}:${d.line} ${d.message}`).join("\n"));
  const base = new URL(`${import.meta.env.BASE_URL}paix-export-runtime/`, window.location.origin);
  const manifest = await (await download(new URL("manifest.json", base).href)).json() as { version: number; files: string[] };
  if (manifest.version !== 1 || !Array.isArray(manifest.files) || !manifest.files.includes("runtime.js") || !manifest.files.includes("runtime.css") || manifest.files.some(name => !/^[\w.-]+\.(js|css)$/.test(name))) throw new Error("El runtime de exportación no está preparado. Ejecuta npm run build:runtime y vuelve a intentarlo.");
  const files: ExportFile[] = [];
  for (const name of manifest.files) files.push({ path: `assets/${name}`, data: new Uint8Array(await (await download(new URL(name, base).href)).arrayBuffer()) });

  // Rewrite CSS image URLs in all visual definitions, including conditional tags.
  const copied = new Map<string, string>();
  const external = new Set<string>();
  const rewrite = async (value: string): Promise<string> => {
    const pattern = /url\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/gi;
    let result = "", last = 0;
    for (const match of value.matchAll(pattern)) {
      const raw = match[1] ?? match[2] ?? match[3];
      let replacement = match[0];
      if (raw && !raw.startsWith("data:") && !raw.startsWith("#")) {
        const url = new URL(raw, window.location.href);
        if (url.protocol !== "blob:" && url.origin !== window.location.origin) external.add(url.href);
        else {
          let path = copied.get(url.href);
          if (!path) {
            const response = await download(url.href);
            const extension = /\.[a-zA-Z0-9]{1,8}$/.exec(url.pathname)?.[0] ?? ".bin";
            path = `assets/media/resource-${copied.size + 1}${extension}`;
            files.push({ path, data: new Uint8Array(await response.arrayBuffer()) });
            copied.set(url.href, path);
          }
          replacement = `url("./${path}")`;
        }
      }
      result += value.slice(last, match.index) + replacement;
      last = match.index + match[0].length;
    }
    return result + value.slice(last);
  };
  const rewritten = new WeakSet<object>();
  for (const style of [...Object.values(program.styles), ...Object.values(program.tags ?? {})]) {
    for (const property of [...style.properties, ...style.conditions.flatMap(condition => condition.properties)]) {
      if (rewritten.has(property)) continue;
      rewritten.add(property);
      property.value = await rewrite(property.value);
    }
  }
  const links = manifest.files.filter(name => name.endsWith(".css")).map(name => `<link rel="stylesheet" href="./assets/${name}">`).join("\n");
  const scripts = manifest.files.filter(name => name.endsWith(".js")).map(name => `<script defer src="./assets/${name}"></script>`).join("\n");
  files.unshift(textFile("index.html", `<!doctype html>\n<html lang="es"><head><base href="./"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${encodeHtml(project.name)}</title>\n${links}\n</head><body><div id="root"></div><script id="paix-program" type="application/json">${encodeJson(program)}</script>\n${scripts}\n</body></html>`));
  const rootHtml = new TextDecoder().decode(files.find(file=>file.path==="index.html")!.data);
  for(const address of Object.keys(program.pages ?? {})) {
    if(address==="/") continue;
    const segments=address.slice(1).split('/');
    const prefix='../'.repeat(segments.length);
    files.push(textFile(`${segments.join('/')}/index.html`,rootHtml.replace('<base href="./">',`<base href="${prefix}">`)));
  }
  files.push(textFile("README.txt", `Web exportada con Paix.\nPublica TODO el contenido del ZIP, incluidos los directorios de páginas, en un servidor estático.\nNo requiere npm, React instalado ni el editor.\nLos estados se reinician al recargar.\nRecursos locales utilizados en url(): incluidos.\nLas fuentes personalizadas requieren su propia declaración @font-face y archivos; no se empaquetan por nombre de familia.\n${external.size ? "Recursos externos (requieren conexión):\n" + [...external].join("\n") : "Sin imágenes externas en los estilos."}\n`));
  return files;
}

export async function exportProject(project: PaixProject): Promise<void> {
  // Freeze the editor contents before the asynchronous download starts.
  const files = await buildExportFiles(structuredClone(project));
  const url = URL.createObjectURL(makeZip(files));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${project.name.replace(/[^a-zA-Z0-9_-]/g, "-") || "paix-site"}-dist.zip`;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
