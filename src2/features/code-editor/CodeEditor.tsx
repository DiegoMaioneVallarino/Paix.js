import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Editor, { type BeforeMount, type Monaco, type OnMount } from '@monaco-editor/react';
import type { PaixDiagnostic } from '../../paix/diagnostics/diagnostic.types';
import { registerPaixLanguage } from './paixLanguage';
import { registerPaixTheme } from './paixTheme';
import { installStyleNumberDrag } from './styleNumberDrag';
import { EditorColorPicker } from './EditorColorPicker';
import { findHexColor } from './colorValue';
import './editorInteractions.css';
import { EditorFontPicker, findFontValue } from './EditorFontPicker';

type EditorInstance = Parameters<OnMount>[0];
type Model = NonNullable<ReturnType<EditorInstance['getModel']>>;
interface CodeEditorProps { path: string; value: string; diagnostics: PaixDiagnostic[]; onChange: (value: string) => void }
interface Menu { x: number; y: number; color: boolean; font: boolean }
interface ColorSession { model: Model; line: number; column: number; text: string; changed: boolean }

export function CodeEditor({ path, value, diagnostics, onChange }: CodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<EditorInstance | null>(null);
  const pathRef = useRef(path);
  const cleanupRef = useRef<(() => void) | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<ColorSession | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [message, setMessage] = useState('');
  const [picker, setPicker] = useState<{ color: string; x: number; y: number } | null>(null);
  const [fontPicker, setFontPicker] = useState<{ font: string; x: number; y: number } | null>(null);
  pathRef.current = path;
  const isStyle = () => pathRef.current.replace(/\\/g, '/').startsWith('styles/');

  const closePicker = useCallback(() => {
    const session = colorRef.current;
    if (session?.changed && editorRef.current?.getModel() === session.model) editorRef.current.pushUndoStop();
    colorRef.current = null;
    setPicker(null);
    setFontPicker(null);
  }, []);

  const colorAtPoint = (x: number, y: number) => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    const position = editor?.getTargetAtClientPoint(x, y)?.position;
    if (!model || !position || !isStyle()) return null;
    const token = findHexColor(model.getLineContent(position.lineNumber), position.column);
    return token ? { model, position, token } : null;
  };

  const fontAtPoint = (x: number, y: number) => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    const position = editor?.getTargetAtClientPoint(x, y)?.position;
    if (!model || !position || !isStyle()) return null;
    const token = findFontValue(model.getLineContent(position.lineNumber), position.column);
    return token ? { model, position, token } : null;
  };
  const openFontPicker = (x: number, y: number) => {
    const found = fontAtPoint(x, y);
    if (!found) return;
    closePicker();
    colorRef.current = { model: found.model, line: found.position.lineNumber, column: found.token.startColumn, text: found.token.text, changed: false };
    setMenu(null);
    setFontPicker({ font: found.token.text, x, y });
  };

  const openMenu = (x: number, y: number) => {
    setMessage('');
    setMenu({ x, y, color: Boolean(colorAtPoint(x, y)), font: Boolean(fontAtPoint(x, y)) });
  };

  const openPicker = (x: number, y: number) => {
    const found = colorAtPoint(x, y);
    if (!found) return;
    closePicker();
    colorRef.current = { model: found.model, line: found.position.lineNumber, column: found.token.startColumn, text: found.token.text, changed: false };
    setMenu(null);
    setPicker({ color: found.token.text, x, y });
  };

  const applyColor = (next: string) => {
    const session = colorRef.current;
    const editor = editorRef.current;
    if (!session || !editor || editor.getModel() !== session.model) { closePicker(); return; }
    if (next === session.text) return;
    if (!session.changed) editor.pushUndoStop();
    if (editor.executeEdits('paix-color-picker', [{ range: { startLineNumber: session.line, endLineNumber: session.line, startColumn: session.column, endColumn: session.column + session.text.length }, text: next, forceMoveMarkers: true }])) {
      session.text = next; session.changed = true;
    }
  };

  const applyMarkers = (monaco: Monaco) => {
    const model = monaco.editor.getModel(monaco.Uri.parse(`file:///${path}`));
    if (!model) return;
    monaco.editor.setModelMarkers(model, 'paix-parser', diagnostics.map(diagnostic => ({
      severity: diagnostic.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
      message: diagnostic.message, startLineNumber: diagnostic.line, startColumn: diagnostic.column,
      endLineNumber: diagnostic.line, endColumn: diagnostic.column + Math.max(diagnostic.length, 1),
    })));
  };

  const handleBeforeMount: BeforeMount = monaco => { registerPaixLanguage(monaco); registerPaixTheme(monaco); };
  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor; monacoRef.current = monaco; applyMarkers(monaco);
    cleanupRef.current?.();
    const stopDrag = installStyleNumberDrag(editor, isStyle, openMenu);
    const stopModel = editor.onDidChangeModel(() => { setMenu(null); closePicker(); });
    cleanupRef.current = () => { stopDrag(); stopModel.dispose(); };
  };

  useEffect(() => { if (monacoRef.current) applyMarkers(monacoRef.current); }, [path, diagnostics]);
  useEffect(() => { setMenu(null); closePicker(); }, [path, closePicker]);
  useEffect(() => () => { cleanupRef.current?.(); }, []);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    const outside = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenu(null); };
    window.addEventListener('pointerdown', outside);
    return () => window.removeEventListener('pointerdown', outside);
  }, [menu]);

  const command = async (action: string) => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    const selection = editor?.getSelection();
    if (!editor || !model || !selection) return;
    try {
      if (action === 'copy' || action === 'cut') {
        if (selection.isEmpty()) { setMenu(null); return; }
        await navigator.clipboard.writeText(model.getValueInRange(selection));
        if (action === 'cut' && editor.getModel() === model) {
          editor.pushUndoStop(); editor.executeEdits('paix-cut', [{ range: selection, text: '' }]); editor.pushUndoStop();
        }
      } else if (action === 'paste') {
        const text = await navigator.clipboard.readText();
        if (editor.getModel() === model) {
          editor.pushUndoStop(); editor.executeEdits('paix-paste', [{ range: selection, text }]); editor.pushUndoStop();
        }
      } else editor.trigger('paix-menu', action, null);
      setMenu(null); editor.focus();
    } catch {
      setMessage('El navegador bloqueó el portapapeles. Usa Ctrl+C, Ctrl+X o Ctrl+V.');
    }
  };

  const actions = [['undo', 'Deshacer', 'Ctrl+Z'], ['redo', 'Rehacer', 'Ctrl+Y'], ['cut', 'Cortar', 'Ctrl+X'], ['copy', 'Copiar', 'Ctrl+C'], ['paste', 'Pegar', 'Ctrl+V'], ['editor.action.selectAll', 'Seleccionar todo', 'Ctrl+A']];
  return (
    <div className="code-editor"
      onContextMenu={event => { event.preventDefault(); openMenu(event.clientX, event.clientY); }}
      onDoubleClick={event => { if (colorAtPoint(event.clientX, event.clientY)) { event.preventDefault(); openPicker(event.clientX, event.clientY); } }}>
      <Editor height="100%" width="100%" path={`file:///${path}`} language="paix" theme="paix-blue" value={value}
        beforeMount={handleBeforeMount} onMount={handleMount} onChange={next => onChange(next ?? '')} saveViewState
        options={{
          contextmenu: false, colorDecorators: false, automaticLayout: true, minimap: { enabled: false },
          fontFamily: '"Cascadia Code", "SFMono-Regular", Consolas, monospace', fontSize: 13, lineHeight: 23, fontLigatures: true,
          padding: { top: 18, bottom: 18 }, scrollBeyondLastLine: false, smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on', cursorBlinking: 'smooth', renderLineHighlight: 'line',
          bracketPairColorization: { enabled: true }, guides: { bracketPairs: true, indentation: true },
          tabSize: 4, insertSpaces: true, wordWrap: 'on', overviewRulerBorder: false, hideCursorInOverviewRuler: true,
        }} />
      {menu && createPortal(
        <div ref={menuRef} className="paix-editor-menu" role="menu" aria-label="Acciones del editor"
          style={{ left: Math.max(8, Math.min(menu.x, window.innerWidth - 256)), top: Math.max(8, Math.min(menu.y, window.innerHeight - 300)) }}
          onContextMenu={event => event.preventDefault()}
          onKeyDown={event => {
            if (event.key === 'Escape') { setMenu(null); editorRef.current?.focus(); }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
              const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
              buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
            }
          }}>
          {menu.font && <button role="menuitem" onClick={() => openFontPicker(menu.x, menu.y)}><span>Cambiar fuente…</span><small>Font</small></button>}
          {menu.color && <button role="menuitem" onClick={() => openPicker(menu.x, menu.y)}><span>Editar color…</span><small>HEX</small></button>}
          {actions.map(([action, label, shortcut]) => <button role="menuitem" key={action} onClick={() => void command(action)}><span>{label}</span><small>{shortcut}</small></button>)}
          {message && <p role="alert">{message}</p>}
        </div>, document.body,
      )}
      {fontPicker && <EditorFontPicker {...fontPicker} onChange={applyColor} onClose={closePicker} />}
      {picker && <EditorColorPicker {...picker} onChange={applyColor} onClose={closePicker} />}
    </div>
  );
}
