import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { parseHex, toHex, type Hsva } from './colorValue';

interface Props { color: string; x: number; y: number; onChange: (color: string) => void; onClose: () => void }
export function EditorColorPicker({ color, x, y, onChange, onClose }: Props) {
  const [hsva, setHsva] = useState<Hsva>(() => parseHex(color) ?? { h: 0, s: 0, v: 1, a: 1 });
  const [draft, setDraft] = useState(color);
  const [error, setError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef(hsva);
  const update = (next: Hsva) => {
    latest.current = next;
    setHsva(next);
    const hex = toHex(next);
    setDraft(hex); setError(''); onChange(hex);
  };
  useEffect(() => {
    root.current?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) onClose(); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } };
    window.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', key); };
  }, [onClose]);
  const setSv = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    update({ ...latest.current, s: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), v: 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) });
  };
  const commitDraft = () => {
    const parsed = parseHex(draft.trim());
    if (parsed) update(parsed); else setError('Usa HEX de 3, 4, 6 u 8 dígitos.');
  };
  const left = Math.max(8, Math.min(x, window.innerWidth - 300));
  const top = Math.max(8, Math.min(y, window.innerHeight - 360));
  return createPortal(
    <div ref={root} tabIndex={-1} role="dialog" aria-label="Selector de color" className="paix-color-picker" style={{ left, top }}>
      <header><strong>Color</strong><button onClick={onClose} aria-label="Cerrar selector">×</button></header>
      <div className="paix-color-sv" style={{ backgroundColor: `hsl(${hsva.h} 100% 50%)` }}
        onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setSv(event); }}
        onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) setSv(event); }}
        onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}>
        <span style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%` }} />
      </div>
      <label>Tono<input aria-label="Tono" className="paix-hue-slider" type="range" min="0" max="359" value={hsva.h} onChange={e => update({ ...latest.current, h: Number(e.target.value) })} /></label>
      <label>Transparencia <small>{Math.round(hsva.a * 100)}%</small><input aria-label="Transparencia" className="paix-alpha-slider" type="range" min="0" max="1" step="0.01" value={hsva.a} onChange={e => update({ ...latest.current, a: Number(e.target.value) })} /></label>
      <div className="paix-color-fields"><span className="paix-color-sample" style={{ backgroundColor: toHex(hsva) }} /><input aria-label="Color HEX" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commitDraft} onKeyDown={e => { if (e.key === 'Enter') commitDraft(); }} /></div>
      {error && <p role="alert">{error}</p>}
    </div>, document.body,
  );
}
