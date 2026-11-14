import { expect, test } from 'vitest';
import { normalizePageFiles } from './pageFileNames';
import { counterProject } from '../examples/counterProject';
test('migrates page names and entry without changing source or overwriting collisions',()=>{
 const before=JSON.stringify(counterProject);
 const result=normalizePageFiles(counterProject);
 expect(result.project.entry.endsWith('.page.paix')).toBe(true);
 expect(result.project.files[result.project.entry].content).toBe(counterProject.files[counterProject.entry].content);
 expect(JSON.stringify(counterProject)).toBe(before);
 expect(normalizePageFiles(result.project).renamed).toEqual({});
 const conflict={...counterProject,files:{...counterProject.files,[result.project.entry]:result.project.files[result.project.entry]}};
 expect(normalizePageFiles(conflict).project.files[counterProject.entry]).toBeTruthy();
});
