export interface ExportFile { path: string; data: Uint8Array<ArrayBuffer> }
const encoder = new TextEncoder();
export const textFile = (path: string, text: string): ExportFile => ({ path, data: encoder.encode(text) });
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
/** ZIP STORE: standard archive, UTF-8 names, no dependency or server required. */
export function makeZip(files: ExportFile[]): Blob {
  if (files.length > 65535) throw new Error("Demasiados archivos para exportar.");
  const chunks: BlobPart[] = [], directory: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;
  const names = new Set<string>();
  for (const file of files) {
    if (!file.path || /(^\/|\\|(^|\/)\.\.(\/|$))/.test(file.path) || names.has(file.path)) throw new Error("Ruta duplicada o inválida en el ZIP.");
    names.add(file.path);
    const name = encoder.encode(file.path), crc = crc32(file.data);
    if (name.length > 65535 || offset + file.data.length > 0xffffffff) throw new Error("El proyecto excede el límite del ZIP.");
    const local = new Uint8Array(30 + name.length), l = new DataView(local.buffer);
    l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true);
    l.setUint16(12, 33, true); l.setUint32(14, crc, true);
    l.setUint32(18, file.data.length, true); l.setUint32(22, file.data.length, true); l.setUint16(26, name.length, true); local.set(name, 30);
    const central = new Uint8Array(46 + name.length), c = new DataView(central.buffer);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x800, true);
    c.setUint16(14, 33, true); c.setUint32(16, crc, true); c.setUint32(20, file.data.length, true); c.setUint32(24, file.data.length, true);
    c.setUint16(28, name.length, true); c.setUint32(42, offset, true); central.set(name, 46);
    chunks.push(local, file.data); directory.push(central); offset += local.length + file.data.length;
  }
  const size = directory.reduce((sum, entry) => sum + entry.length, 0);
  const end = new Uint8Array(22), e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, size, true); e.setUint32(16, offset, true);
  return new Blob([...chunks, ...directory, end], { type: "application/zip" });
}
