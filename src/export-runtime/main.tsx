import { createRoot } from "react-dom/client";
import { PaixRenderer } from "../runtime/PaixRenderer";
import type { PaixCompiledProject } from "../paix/compiler/compiled.types";
import "../index.css";
import "../runtime/Runtime.css";

const root = document.getElementById("root");
const data = document.getElementById("paix-program");
if (root && data) {
  try {
    const program = JSON.parse(data.textContent ?? "") as PaixCompiledProject;
    createRoot(root).render(<PaixRenderer program={program} />);
  } catch {
    root.textContent = "No se pudo cargar el proyecto exportado.";
  }
}
