import type { PaixProject } from './project.types';
/** Rename virtual page files without changing page addresses or user code. */
export function normalizePageFiles(project: PaixProject) {
  const renamed: Record<string, string> = {};
  const files = { ...project.files };
  for (const file of Object.values(project.files)) {
    if (file.type !== 'page' || file.path.endsWith('.page.paix')) continue;
    const path = file.path.replace(/\.paix$/, '.page.paix');
    if (path === file.path || files[path]) continue; // Never overwrite a collision.
    renamed[file.path] = path;
    delete files[file.path];
    files[path] = { ...file, path, name: path.split('/').at(-1)! };
  }
  return { project: { ...project, files, entry: renamed[project.entry] ?? project.entry }, renamed };
}
