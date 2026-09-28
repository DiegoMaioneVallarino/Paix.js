import type { OnMount } from "@monaco-editor/react";

type PaixEditor = Parameters<OnMount>[0];

interface NumericValue {
  startColumn: number;
  endColumn: number;
  value: number;
  decimals: number;
  unit: string;
  property: string;
  text: string;
}

const numericProperties = new Set([
  "opacity", "inline", "outline", "radius", "shadowBlur",
  "textSize", "textWeight", "lineHeight", "letterSpacing",
  "backdropBlur", "blur", "scale", "transitionTime",
]);

export function getStyleNumberAtColumn(
  line: string,
  column: number,
): NumericValue | null {
  const match = /^(\s*)([a-zA-Z][\w]*)\s*:\s*(.*)$/.exec(line);
  if (!match || !numericProperties.has(match[2])) return null;

  const rawValue = match[3].split("//", 1)[0].trim();
  const number = /^(-?\d+(?:\.(\d+))?)(px|ms|%)?$/.exec(rawValue);
  if (!number) return null;

  const valueStart = line.indexOf(rawValue, match[1].length + match[2].length);
  const startColumn = valueStart + 1;
  const endColumn = startColumn + rawValue.length;

  if (column < startColumn || column > endColumn) return null;

  return {
    startColumn,
    endColumn,
    value: Number(number[1]),
    decimals: number[2]?.length ?? 0,
    unit: number[3] ?? "",
    property: match[2],
    text: rawValue,
  };
}

export function dragStyleNumber(
  original: NumericValue,
  horizontalPixels: number,
): string {
  const steps = Math.trunc(horizontalPixels / 6);
  const step = original.property === "opacity" || original.property === "scale"
    ? 0.01
    : original.property === "lineHeight"
      ? 0.1
      : original.decimals > 0
        ? 10 ** -Math.min(original.decimals, 4)
        : 1;

  let value = original.value + steps * step;
  if (original.property === "opacity") value = Math.min(1, Math.max(0, value));
  else if (original.property !== "letterSpacing") value = Math.max(0, value);

  const precision = Math.max(
    original.decimals,
    step.toString().split(".")[1]?.length ?? 0,
  );
  const rounded = Number(value.toFixed(Math.min(precision, 6)));
  return `${rounded}${original.unit}`;
}

export function installStyleNumberDrag(
  editor: PaixEditor,
  isStyleFile: () => boolean,
): () => void {
  const root = editor.getDomNode();
  if (!root) return () => {};

  const ownerWindow = root.ownerDocument.defaultView;
  if (!ownerWindow) return () => {};

  let cancelDrag: (() => void) | null = null;
  let hoveredElement: HTMLElement | null = null;
  let previousHoverCursor = "";
  let previousHoverPriority = "";

  const clearHover = () => {
    if (!hoveredElement) return;
    if (previousHoverCursor) {
      hoveredElement.style.setProperty(
        "cursor", previousHoverCursor, previousHoverPriority,
      );
    } else {
      hoveredElement.style.removeProperty("cursor");
    }
    hoveredElement = null;
  };

  const onHover = (event: PointerEvent) => {
    if (cancelDrag) return;

    const model = editor.getModel();
    const position = editor.getTargetAtClientPoint(
      event.clientX, event.clientY,
    )?.position;
    const candidate = event.target;
    const isDraggable = isStyleFile() && model && position &&
      getStyleNumberAtColumn(
        model.getLineContent(position.lineNumber),
        position.column,
      );

    const element = isDraggable && candidate instanceof HTMLElement
      ? candidate
      : null;
    if (hoveredElement === element) return;

    clearHover();
    if (!element) return;
    hoveredElement = element;
    previousHoverCursor = element.style.getPropertyValue("cursor");
    previousHoverPriority = element.style.getPropertyPriority("cursor");
    element.style.setProperty("cursor", "ew-resize", "important");
  };

  const onPointerDown = (event: PointerEvent) => {
    if (
      event.button !== 0 || event.shiftKey || event.altKey ||
      event.ctrlKey || event.metaKey || !isStyleFile()
    ) return;

    const model = editor.getModel();
    const target = editor.getTargetAtClientPoint(event.clientX, event.clientY);
    const position = target?.position;
    if (!model || !position) return;

    const original = getStyleNumberAtColumn(
      model.getLineContent(position.lineNumber),
      position.column,
    );
    if (!original) return;

    // Captura antes de que Monaco empiece a seleccionar texto.
    event.preventDefault();
    event.stopPropagation();
    cancelDrag?.();
    clearHover();

    const startX = event.clientX;
    const pointerId = event.pointerId;
    let currentText = original.text;
    let changed = false;

    editor.focus();
    editor.setPosition({ lineNumber: position.lineNumber, column: position.column });
    editor.pushUndoStop();

    const previousCursor = root.style.cursor;
    const previousUserSelect = root.ownerDocument.body.style.userSelect;
    root.style.cursor = "ew-resize";
    root.ownerDocument.body.style.userSelect = "none";

    const stop = () => {
      ownerWindow.removeEventListener("pointermove", onPointerMove, true);
      ownerWindow.removeEventListener("pointerup", onPointerUp, true);
      ownerWindow.removeEventListener("pointercancel", onPointerCancel, true);
      ownerWindow.removeEventListener("blur", stop);
      ownerWindow.removeEventListener("keydown", onKeyDown, true);
      root.style.cursor = previousCursor;
      root.ownerDocument.body.style.userSelect = previousUserSelect;
      if (changed && editor.getModel() === model) editor.pushUndoStop();
      if (cancelDrag === stop) cancelDrag = null;
    };

    const onPointerMove = (move: PointerEvent) => {
      if (move.pointerId !== pointerId) return;
      move.preventDefault();
      move.stopPropagation();

      if (!isStyleFile() || editor.getModel() !== model) {
        stop();
        return;
      }

      const next = dragStyleNumber(original, move.clientX - startX);
      if (next === currentText) return;

      const applied = editor.executeEdits("paix-style-number-drag", [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: original.startColumn,
          endLineNumber: position.lineNumber,
          endColumn: original.startColumn + currentText.length,
        },
        text: next,
        forceMoveMarkers: true,
      }]);
      if (!applied) {
        stop();
        return;
      }

      currentText = next;
      changed = true;
    };

    const onPointerUp = (up: PointerEvent) => {
      if (up.pointerId !== pointerId) return;
      up.preventDefault();
      stop();
    };

    const onPointerCancel = (cancel: PointerEvent) => {
      if (cancel.pointerId === pointerId) stop();
    };

    const onKeyDown = (key: KeyboardEvent) => {
      if (key.key === "Escape") stop();
    };

    cancelDrag = stop;
    ownerWindow.addEventListener("pointermove", onPointerMove, true);
    ownerWindow.addEventListener("pointerup", onPointerUp, true);
    ownerWindow.addEventListener("pointercancel", onPointerCancel, true);
    ownerWindow.addEventListener("blur", stop);
    ownerWindow.addEventListener("keydown", onKeyDown, true);
  };

  root.addEventListener("pointerdown", onPointerDown, true);
  root.addEventListener("pointermove", onHover, true);
  root.addEventListener("pointerleave", clearHover, true);
  return () => {
    cancelDrag?.();
    clearHover();
    root.removeEventListener("pointerdown", onPointerDown, true);
    root.removeEventListener("pointermove", onHover, true);
    root.removeEventListener("pointerleave", clearHover, true);
  };
}
