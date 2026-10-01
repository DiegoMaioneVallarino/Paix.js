export interface Hsva { h: number; s: number; v: number; a: number }
export interface HexToken { text: string; startColumn: number; endColumn: number }
export function findHexColor(line: string, column: number): HexToken | null {
  const pattern = /#[\da-fA-F]+\b/g;
  for (const match of line.matchAll(pattern)) {
    const text = match[0];
    if (![4, 5, 7, 9].includes(text.length)) continue;
    const startColumn = match.index + 1;
    const endColumn = startColumn + text.length;
    if (column >= startColumn && column <= endColumn) return { text, startColumn, endColumn };
  }
  return null;
}
export function parseHex(text: string): Hsva | null {
  if (!/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(text)) return null;
  let digits = text.slice(1);
  if (digits.length <= 4) digits = [...digits].map(c => c + c).join('');
  const r = parseInt(digits.slice(0, 2), 16) / 255;
  const g = parseInt(digits.slice(2, 4), 16) / 255;
  const b = parseInt(digits.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? delta / max : 0, v: max, a: digits.length === 8 ? parseInt(digits.slice(6), 16) / 255 : 1 };
}
export function toHex({ h, s, v, a }: Hsva): string {
  const chroma = v * s, x = chroma * (1 - Math.abs((h / 60) % 2 - 1)), m = v - chroma;
  const rgb = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  const byte = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0');
  return '#' + rgb.map(n => byte(n + m)).join('') + (a < 1 ? byte(a) : '');
}
