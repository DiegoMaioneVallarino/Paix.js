// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { render, cleanup, fireEvent, within } from '@testing-library/react';
import { compilePaixProject } from '../paix/compiler/compile';
import { PaixRenderer } from '../runtime/PaixRenderer';
import { FileTreeItem } from '../features/file-explorer/FileTreeItem';
import { createPaixFile } from './virtualFileSystem';
import { fileVisualState, isEmptyFile, isUnusedFrame } from './fileStatus';
import type { PaixProject, PaixFile, PaixFileType } from './project.types';
const file=(path:string,type:PaixFileType,content:string,enabled=true):PaixFile=>({id:path,path,name:path.split('/').at(-1)!,type,content,enabled});
export function demo():PaixProject {
 const list=[
  file('pages/Home/Home.paix','page','address: "/"\nframe: Split\nleftArea >\n    Card()\nrightArea >\n    Card()'),
  file('pages/Catalogue/Catalogue.paix','page','address: "/catalogue"\nframe: Plain\nmain >\n    Text(value: "Catalogue visible")'),
  file('wireframes/CardFrame.paix','wireframe','wireframe "CardFrame"\nmain slice rows 3'),
  file('wireframes/Plain.paix','wireframe','wireframe "Plain"'),
  file('wireframes/Split.paix','wireframe','wireframe "Split"\nmain slice columns 2 >\n    "leftArea"\n    "rightArea"'),
  file('styles/Shared.paix','style','tag Glass:\n    color: cyan\n    radius: 10'),
  file('actions/Counter.paix','action','states:\n    count: 0\naction add:\n    states.count: states.count + 1\naction catalogue:\n    goTo: "/catalogue"'),
  file('components/Card/Card.paix','component','frame: CardFrame\nstyles: Glass\nactions: Counter\nmain.spaces >\n    Text(value: states.count)\n    Button(label: "Add", onClick: actions.add)\n    Button(label: "Catalogue", onClick: actions.catalogue)'),
 ];
 return {id:'demo',name:'demo',entry:'pages/Home/Home.paix',files:Object.fromEntries(list.map(f=>[f.path,f]))};
}
afterEach(()=>{cleanup();vi.restoreAllMocks();history.replaceState(null,'','/');});
test('links pages by address, shared frames, tags and reusable actions with isolated state',()=>{
 const program=compilePaixProject(demo());expect(program.diagnostics).toEqual([]);
 expect(Object.keys(program.pages!)).toEqual(['/','/catalogue']);
 const view=render(<PaixRenderer program={program}/>);
 const cards=view.container.querySelectorAll<HTMLElement>('[data-paix-component="Card"]');
 fireEvent.click(within(cards[0]).getByRole('button',{name:'Add'}));
 expect(within(cards[0]).getByText('1')).toBeTruthy();expect(within(cards[1]).getByText('0')).toBeTruthy();
 fireEvent.click(within(cards[0]).getByRole('button',{name:'Catalogue'}));
 expect(view.getByText('Catalogue visible')).toBeTruthy();
});
test('disabled sheets are preserved but ignored; broken overridden own frame is unused',()=>{
 const project=demo();
 project.files['components/Card/Card.style.paix']=file('components/Card/Card.style.paix','style','this is not a style',false);
 project.files['components/Card/Card.frame.paix']=file('components/Card/Card.frame.paix','wireframe','broken frame');
 const before=JSON.stringify(project);
 expect(compilePaixProject(project).diagnostics).toEqual([]);
 expect(isUnusedFrame(project.files['components/Card/Card.frame.paix'],project)).toBe(true);
 expect(JSON.stringify(project)).toBe(before);
 project.files['components/Card/Card.style.paix'].enabled=true;
 expect(compilePaixProject(project).diagnostics.some(d=>d.filePath?.endsWith('Card.style.paix'))).toBe(true);
});
test('own style overlays declared tags and disabling restores tags',()=>{
 const project=demo(),path='components/Card/Card.style.paix';
 project.files[path]=file(path,'style','color: red');
 let program=compilePaixProject(project);expect(program.diagnostics).toEqual([]);
 const color=()=>program.styles[program.components.Card.style!].properties.find(p=>p.name==='color')?.value;
 expect(color()).toBe('red');project.files[path].enabled=false;program=compilePaixProject(project);expect(color()).toBe('cyan');
});
test('rejects missing actions after disabling and duplicate route addresses',()=>{
 const project=demo();project.files['actions/Counter.paix'].enabled=false;
 expect(compilePaixProject(project).diagnostics.some(d=>d.message.includes('Unknown actions sheet'))).toBe(true);
 project.files['pages/Other/Other.paix']=file('pages/Other/Other.paix','page','address: "/catalogue"\nframe: Plain');
 expect(compilePaixProject(project).diagnostics.some(d=>d.message.includes('Duplicate page address'))).toBe(true);
});
test('creation defaults to a single file, with independent explicit companion choices',()=>{
 const one=createPaixFile(demo(),'component','New');if(!one.ok)throw Error(one.error);expect(one.companions).toEqual([]);
 const own=createPaixFile(demo(),'component','New',{ownFrame:true,ownActions:true,styles:['Glass']});if(!own.ok)throw Error(own.error);
 expect(own.companions?.map(f=>f.type)).toEqual(['wireframe','action']);expect(own.file.content).toContain('styles: Glass');
 const shared=createPaixFile(demo(),'component','New',{frame:'Plain',actions:['Counter']});if(!shared.ok)throw Error(shared.error);expect(shared.companions).toEqual([]);expect(shared.file.content).toContain('actions: Counter');
});
test('file state indicators distinguish content, empty, disabled and errors; toggle does not open file',()=>{
 const sheet=file('components/Card/Card.style.paix','style','color: red');
 expect(fileVisualState(sheet)).toBe('active');expect(fileVisualState({...sheet,content:' // note\n'})).toBe('empty');expect(fileVisualState({...sheet,enabled:false})).toBe('disabled');expect(fileVisualState(sheet,true)).toBe('error');
 expect(isEmptyFile('backgroundImage: url("https://a/b")')).toBe(false);
 const toggle=vi.fn(),open=vi.fn();const view=render(<FileTreeItem file={sheet} selected={false} modified={false} onOpen={open} onToggle={toggle}/>);
 fireEvent.click(view.getByRole('button',{name:'Desactivar Card.style.paix'}));expect(toggle).toHaveBeenCalledWith(sheet.path);expect(open).not.toHaveBeenCalled();
});
test('hash navigation restores destination on back/forward events',()=>{
 const program=compilePaixProject(demo());history.replaceState(null,'','/#/catalogue');
 const view=render(<PaixRenderer program={program} navigation="hash"/>);expect(view.getByText('Catalogue visible')).toBeTruthy();
 history.replaceState(null,'','/#/');fireEvent(window,new PopStateEvent('popstate'));
 expect(view.getAllByRole('button',{name:'Add'})).toHaveLength(2);
});

test('empty active companion files remain valid and do not add visual or action content',()=>{
 const project=demo();
 for(const [suffix,type] of [['style','style'],['actions','action']] as const) {
   const path=`components/Card/Card.${suffix}.paix`;project.files[path]=file(path,type,'');
 }
 expect(compilePaixProject(project).diagnostics).toEqual([]);
});
