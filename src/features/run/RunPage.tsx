import { useEffect, useState } from "react";
import { compilePaixProject } from "../../paix/compiler/compile";
import { PaixRenderer } from "../../runtime/PaixRenderer";
import { readRunProject } from "./runProject";
import "./RunPage.css";

function loadRun() {
  try {
    const project = readRunProject();
    if (!project) return { message: "Abre un proyecto en el editor y pulsa Run para ejecutarlo.", program: null, name: "Paix" };
    return { message: "", program: compilePaixProject(project), name: project.name };
  } catch {
    return { message: "No se pudo cargar esta ejecución. Vuelve al editor y pulsa Run de nuevo.", program: null, name: "Paix" };
  }
}

export function RunPage() {
  const [run] = useState(loadRun);
  useEffect(() => { document.title = `${run.name} · Paix Run`; }, [run.name]);
  const errors = run.program?.diagnostics.filter(d => d.severity === "error") ?? [];
  if (!run.program || errors.length > 0) return <main className="paix-run-message">
    <h1>{errors.length ? "El proyecto tiene errores" : "Paix Run"}</h1>
    <p>{run.message || "Corrige estos errores en el editor y pulsa Run de nuevo."}</p>
    {errors.length > 0 && <ul>{errors.map((error, index) => <li key={index}>{error.filePath}:{error.line}:{error.column} — {error.message}</li>)}</ul>}
  </main>;
  return <main className="paix-run-page"><PaixRenderer program={run.program} navigation="hash" /></main>;
}
