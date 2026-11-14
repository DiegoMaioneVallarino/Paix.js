import type { PaixFile, PaixProject } from './project.types';
import { readDocumentOptions } from '../paix/parser/documentOptions';
export const isCompanion = (file:PaixFile) => /\.(frame|style|actions)\.paix$/.test(file.path);
export function isEmptyFile(content:string) {
  // Preserve comment markers inside strings (URLs are not comments).
  return content.split(/\r?\n/).every(line=>!line.trim() || line.trimStart().startsWith('//'));
}
export function isUnusedFrame(file:PaixFile,project:PaixProject) {
  if(!file.path.endsWith('.frame.paix')) return false;
  const owner=project.files[file.path.replace(/\.frame\.paix$/,'.paix')] ?? project.files[file.path.replace(/\.frame\.paix$/,'.page.paix')];
  return Boolean(owner && readDocumentOptions(owner.content).options.frame);
}
export function fileVisualState(file:PaixFile,hasErrors=false) {
  if(hasErrors) return 'error';
  if(file.enabled===false) return 'disabled';
  return isEmptyFile(file.content)?'empty':'active';
}
