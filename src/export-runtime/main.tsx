import { createRoot } from "react-dom/client";
import { PaixRenderer } from "../runtime/PaixRenderer";
import type { PaixCompiledProject } from "../paix/compiler/compiled.types";
import "../index.css";
import "../runtime/Runtime.css";

const script = document.querySelector<HTMLScriptElement>('script[src$="runtime.js"]');
const base = document.querySelector<HTMLBaseElement>('base');
if (base && script) base.href = new URL('../', script.src).href;
const root = document.getElementById("root");
const data = document.getElementById("paix-program");
if (root && data) {
  try {
    const program = JSON.parse(data.textContent ?? "") as PaixCompiledProject;
    createRoot(root).render(<PaixRenderer program={program} navigation="path" />);
  } catch {
    root.textContent = "No se pudo cargar el proyecto exportado.";
  }
}
