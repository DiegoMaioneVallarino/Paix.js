import { createContext, useContext } from "react";
import type { PaixInteraction } from "./StyleRuntime";
import type { PaixStateSetter } from "./StateRuntime";

export interface PreviewSnapshot {
  values: Record<string, unknown>;
  setValue: PaixStateSetter;
}
export interface PreviewRuntimeValue {
  interaction?: PaixInteraction;
  publish: (snapshot: PreviewSnapshot | null) => void;
}
export const PreviewRuntimeContext = createContext<PreviewRuntimeValue | null>(null);
export function usePreviewRuntime() { return useContext(PreviewRuntimeContext); }
