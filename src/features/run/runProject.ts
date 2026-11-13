import type { PaixProject } from "../../project/project.types";

export const RUN_PROJECT_KEY = "paix.run.project.v1";

/** Open synchronously from the click so browsers can allow the popup. */
export function runProject(project: PaixProject): string | null {
  let popup: Window | null = null;
  try {
    const snapshot = JSON.stringify(project);
    popup = window.open("about:blank", "_blank", "popup=yes,width=1100,height=760,resizable=yes,scrollbars=yes");
    if (!popup) return "El navegador bloqueó la ventana. Permite ventanas emergentes para este sitio y vuelve a pulsar Run.";
    // Each new window keeps its own snapshot, including when it is reloaded.
    popup.sessionStorage.setItem(RUN_PROJECT_KEY, snapshot);
    popup.opener = null;
    popup.location.replace(new URL("/run", window.location.origin).href);
    popup.focus();
    return null;
  } catch {
    popup?.close();
    return "No se pudo abrir la ejecución del proyecto. Comprueba que el navegador permita ventanas y almacenamiento para este sitio.";
  }
}

export function readRunProject(): PaixProject | null {
  const raw = window.sessionStorage.getItem(RUN_PROJECT_KEY);
  if (!raw) return null;
  const value = JSON.parse(raw) as PaixProject;
  if (!value || typeof value !== "object" || typeof value.entry !== "string" || !value.files || typeof value.files !== "object" || Array.isArray(value.files)) throw new Error("Invalid project");
  return value;
}
