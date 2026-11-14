import type { PaixComponentDefinitionNode, PaixPageNode, PaixStyleNode, PaixWireframeNode, PaixActionsNode } from "../ast/ast.types";
import type { PaixProject } from "../../project/project.types";
import type { PaixDiagnostic } from "../diagnostics/diagnostic.types";
import { parsePaixWireframe } from "../parser/parseWireframe";
import { parsePaixStyle } from "../parser/parseStyle";
import { parsePaixActions } from "../parser/parseActions";
import { expandStyleProperties, mergeStyleProperties } from "./styleTags";

export function bindCompanions(document: PaixComponentDefinitionNode | PaixPageNode, path: string, project: PaixProject,
  wireframes: Record<string, PaixWireframeNode>, styles: Record<string, PaixStyleNode>, tags: Record<string, PaixStyleNode>, diagnostics: PaixDiagnostic[]) {
  const basename = path.split('/').at(-1)!.replace(/(?:\.page)?\.paix$/, '');
  const stem = path.replace(/(?:\.page)?\.paix$/, '');
  const modern = path.slice(0, path.lastIndexOf('/')).endsWith('/' + basename);
  const report = (message: string) => diagnostics.push({source:'semantic',severity:'error',message,filePath:path,line:1,column:1,length:1});
  if (document.frame) document.wireframe = document.frame;
  else if (modern) {
    const file = project.files[stem + '.frame.paix'];
    document.wireframe = file ? parsePaixWireframe(file.content,file.path).ast?.name ?? '' : '';
    if (!file) report(`Component "${basename}" requires sibling "${basename}.frame.paix" or frame: SharedName.`);
  }
  if (document.wireframe && !wireframes[document.wireframe]) report(`Unknown wireframe "${document.wireframe}".`);
  if (modern) {
    const file = project.files[stem + '.style.paix'];
    document.style = file ? parsePaixStyle(file.content,file.path).ast?.name ?? null : null;
  }
  if (document.styleTags?.length) {
    try {
      const inherited = expandStyleProperties([{type:'StyleProperty',name:'styles',value:document.styleTags.join(',')}],tags);
      const local = document.style ? styles[document.style] : undefined;
      const name = `document-${path}`;
      styles[name] = {type:'Style',name,properties:mergeStyleProperties(inherited,local?.properties ?? []),conditions:local?.conditions ?? []};
      document.style = name;
    } catch (error) { report(error instanceof Error ? error.message : String(error)); }
  }
  const sheets: PaixActionsNode[] = [];
  for (const name of document.actionSheets ?? []) {
    const file = project.files[`actions/${name}.paix`];
    if (!file || file.type !== 'action') { report(`Unknown actions sheet "${name}".`); continue; }
    const parsed = parsePaixActions(file.content,file.path,true);
    if (parsed.ast) sheets.push(parsed.ast);
  }
  const local = modern ? project.files[stem + '.actions.paix'] : undefined;
  if (local) { const parsed = parsePaixActions(local.content,local.path,true); if (parsed.ast) sheets.push(parsed.ast); }
  if (modern && document.states?.length) report('Move component states to its .actions.paix file.');
  document.states = [...(modern ? [] : document.states ?? []), ...sheets.flatMap(sheet=>sheet.states)];
  document.actions = [...(modern ? [] : document.actions ?? []), ...sheets.flatMap(sheet=>sheet.actions)];
  const states = new Set<string>(), actions = new Map(document.actions.map(action=>[action.name,action]));
  for (const state of document.states) { if(states.has(state.name)) report(`Duplicate state "states.${state.name.slice(1)}" in associated actions.`); states.add(state.name); }
  if (actions.size !== document.actions.length) report('Duplicate action in associated actions sheets.');
  const visitAction = (name: string, chain: string[]) => {
    if (chain.includes(name)) { report(`Recursive action: ${[...chain,name].join(' -> ')}`); return; }
    const action=actions.get(name); if(!action) { report(`Unknown action "actions.${name}".`); return; }
    for(const step of action.steps) {
      if('action' in step) visitAction(step.action,[...chain,name]);
      else if('state' in step && !states.has(step.state)) report(`Unknown state "states.${step.state.slice(1)}".`);
    }
  };
  document.actions.forEach(action=>visitAction(action.name,[]));
  const walk = (node: unknown) => {
    if(!node || typeof node!=='object') return;
    if(Array.isArray(node)) { node.forEach(walk);return; }
    const value=node as Record<string,unknown>;
    if(value.type==='Reference' && value.kind==='state' && !states.has(String(value.name))) report(`Unknown state "states.${String(value.name).slice(1)}".`);
    if(value.type==='MemberExpression' && value.object && typeof value.object==='object' && (value.object as {name?:string}).name==='actions' && !actions.has(String(value.property))) report(`Unknown action "actions.${String(value.property)}" in component "${document.name}".`);
    Object.values(value).forEach(walk);
  };
  walk(document.placements); walk(document.states); walk(document.actions);
  if(document.style) walk(styles[document.style]?.conditions);
}
