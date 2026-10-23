import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function findFontValue(line: string, column: number) {
  const match = /^\s*font\s*:\s*(.+?)(?:\s*\/\/.*)?$/.exec(line);
  if (!match) return null;
  const text = match[1].trim();
  const startColumn = line.indexOf(text, line.indexOf(":") + 1) + 1;
  return column >= startColumn && column < startColumn + text.length
    ? { text, startColumn } : null;
}

const families = ["system-ui", "sans-serif", "serif", "monospace", "Arial", "Verdana", "Georgia", "Tahoma", "Trebuchet MS", "Times New Roman", "Courier New", "Segoe UI", "Consolas"];
interface Props { font: string; x: number; y: number; onChange: (font: string) => void; onClose: () => void }
export function EditorFontPicker({ font, x, y, onChange, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(font);
  const [custom, setCustom] = useState(font);
  useEffect(() => {
    root.current?.querySelector<HTMLInputElement>("input")?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) onClose(); };
    window.addEventListener("pointerdown", outside);
    return () => window.removeEventListener("pointerdown", outside);
  }, [onClose]);
  const apply = (value: string) => {
    const cleaned = value.trim();
    if (!cleaned || /[;{}\n\r]/.test(cleaned)) return;
    setSelected(cleaned); setCustom(cleaned); onChange(cleaned);
  };
  return createPortal(
    <div ref={root} className="paix-font-picker" role="dialog" aria-label="Cambiar fuente"
      style={{ left: Math.max(8, Math.min(x, window.innerWidth - 336)), top: Math.max(8, Math.min(y, window.innerHeight - 440)) }}
      onContextMenu={event => event.preventDefault()}
      onKeyDown={event => { if (event.key === "Escape") onClose(); }}>
      <header><strong>Fuente</strong><button type="button" aria-label="Cerrar selector de fuente" onClick={onClose}>×</button></header>
      <input aria-label="Buscar fuente" placeholder="Buscar fuente…" value={query} onChange={event => setQuery(event.target.value)} />
      <div className="paix-font-sample" style={{ fontFamily: selected }}>Preview text · Aa 0123</div>
      <div className="paix-font-list" role="group" aria-label="Fuentes">
        {families.filter(name => name.toLowerCase().includes(query.toLowerCase())).map(name => {
          const value = /\s/.test(name) ? `"${name}"` : name;
          return <button type="button" key={name} aria-pressed={selected === value}
            style={{ fontFamily: name }} onClick={() => apply(value)}>{name}</button>;
        })}
      </div>
      <label>Familia o lista personalizada<input aria-label="Fuente personalizada" value={custom} onChange={event => setCustom(event.target.value)} onKeyDown={event => { if (event.key === "Enter") apply(custom); }} /></label>
      <button type="button" className="paix-font-apply" onClick={() => apply(custom)}>Aplicar fuente</button>
      <small>Usa fuentes disponibles en el equipo o cargadas por tu aplicación.</small>
    </div>, document.body,
  );
}
