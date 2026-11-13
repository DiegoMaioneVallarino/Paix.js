import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { readdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'public/paix-export-runtime');
await build({
  configFile: false, root, publicDir: false, plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: { outDir: output, emptyOutDir: true, minify: true,
    lib: { entry: resolve(root, 'src/export-runtime/main.tsx'), name: 'PaixSite', formats: ['iife'], fileName: () => 'runtime.js', cssFileName: 'runtime' },
  },
});
const files = (await readdir(output)).filter(name => /\.(js|css)$/.test(name));
await writeFile(resolve(output, 'manifest.json'), JSON.stringify({ version: 1, files }));
