import { useMemo, useState } from 'react';
import { useProjectStore } from '../../project/project.store';
import { compilePaixProject } from '../../paix/compiler/compile';
import { parsePaixStyle } from '../../paix/parser/parseStyle';
import { parsePaixWireframe } from '../../paix/parser/parseWireframe';
import { parsePaixActions } from '../../paix/parser/parseActions';
import { validatePaixStyle } from '../../paix/semantic/validateStyle';
import { isEmptyFile, isUnusedFrame } from '../../project/fileStatus';
import type { CreationOptions, CreatablePaixFileType } from '../../project/virtualFileSystem';
import type { PaixFile } from '../../project/project.types';
import { FileTreeItem } from './FileTreeItem';
import './fileStates.css';
const types:CreatablePaixFileType[]=['page','component','wireframe','style','action'];
export function FileExplorer() {
 const project=useProjectStore(s=>s.project), active=useProjectStore(s=>s.activeFilePath), folders=useProjectStore(s=>s.openFolders), modified=useProjectStore(s=>s.modifiedFiles);
 const open=useProjectStore(s=>s.openFile), toggleFolder=useProjectStore(s=>s.toggleFolder), create=useProjectStore(s=>s.createFile),toggleFile=useProjectStore(s=>s.toggleFile),addCompanion=useProjectStore(s=>s.addCompanion);
 const [menu,setMenu]=useState(false),[type,setType]=useState<CreatablePaixFileType|null>(null),[name,setName]=useState(''),[options,setOptions]=useState<CreationOptions>({}),[error,setError]=useState(''),[hide,setHide]=useState(false);
 const compiled=useMemo(()=>compilePaixProject(project),[project]);
 const groups=useMemo(()=>{
  const result:Record<string,PaixFile[]>={};
  for(const file of Object.values(project.files)) {const folder=file.path.slice(0,file.path.lastIndexOf('/'))||'other';(result[folder]??=[]).push(file);}
  for(const list of Object.values(result)) list.sort((a,b)=>Number(!['component','page'].includes(a.type))-Number(!['component','page'].includes(b.type))||a.name.localeCompare(b.name));
  return result;
 },[project]);
 const issues=useMemo(()=>{
  const paths=new Set(compiled.diagnostics.filter(d=>d.severity==='error').map(d=>d.filePath));
  for(const file of Object.values(project.files)) {
    const parsed=file.type==='style'?parsePaixStyle(file.content,file.path):file.type==='wireframe'?parsePaixWireframe(file.content,file.path):file.type==='action'?parsePaixActions(file.content,file.path,true):null;
    if(parsed?.diagnostics.some(d=>d.severity==='error')) paths.add(file.path);
    if(parsed?.ast?.type==='Style' && validatePaixStyle(parsed.ast,file.content).some(d=>d.severity==='error')) paths.add(file.path);
  }
  return paths;
 },[project,compiled]);
 const sharedFrames=Object.values(project.files).filter(f=>f.type==='wireframe'&&f.path.startsWith('wireframes/')&&f.enabled!==false).map(f=>parsePaixWireframe(f.content,f.path).ast?.name).filter((x):x is string=>!!x);
 const sharedActions=Object.values(project.files).filter(f=>f.type==='action'&&f.path.startsWith('actions/')&&f.enabled!==false).map(f=>f.name.replace(/\.paix$/,''));
 const sharedTags=Object.keys(compiled.tags??{});
 const owner=type==='component'||type==='page';
 return <aside className="file-panel panel">
  <div className="panel-header"><span>Project</span><div className="create-file-control"><button className="icon-button" aria-label="Create file" onClick={()=>setMenu(!menu)}>+</button>{menu&&<div className="create-file-menu">{types.map(t=><button key={t} onClick={()=>{setType(t);setName('');setOptions({});setError('');setMenu(false);}}>{t}</button>)}</div>}</div></div>
  <label className="file-filter"><input type="checkbox" checked={hide} onChange={e=>setHide(e.target.checked)}/> Ocultar vacíos y desactivados</label>
  <div className="file-tree"><div className="project-root">{project.name}</div>{Object.entries(groups).sort(([a],[b])=>a.localeCompare(b)).map(([folder,files])=><div className="tree-group" key={folder}>
   <button className="tree-folder" onClick={()=>toggleFolder(folder)}><span>{folders.includes(folder)?'⌄':'›'}</span><span>{folder}</span></button>
   {folders.includes(folder)&&files.filter(f=>!hide||issues.has(f.path)||(!isEmptyFile(f.content)&&f.enabled!==false)).map(file=><FileTreeItem key={file.path} file={file} selected={active===file.path} modified={modified.includes(file.path)} onOpen={open} onToggle={toggleFile} onCompanion={addCompanion} hasErrors={issues.has(file.path)} unused={isUnusedFrame(file,project)}/>)}
  </div>)}</div>
  {type&&<div className="create-file-overlay" onPointerDown={()=>setType(null)}><form className="create-file-dialog" onPointerDown={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();const message=create(type,name,options);if(message)setError(message);else setType(null);}}>
   <h3>Crear {type}</h3><label>Nombre<input autoFocus value={name} onChange={e=>setName(e.target.value)} required/></label>
   {owner&&<>
    {type==='page'&&<label>Dirección<input placeholder="/catalogue" value={options.address??''} onChange={e=>setOptions({...options,address:e.target.value})}/></label>}
    <label>Frame<select value={options.ownFrame?'own':options.frame??''} onChange={e=>setOptions({...options,ownFrame:e.target.value==='own',frame:e.target.value==='own'?undefined:e.target.value||undefined})}><option value="">Elegir después</option><option value="own">Crear frame propio</option>{sharedFrames.map(frame=><option key={frame} value={frame}>{frame}</option>)}</select></label>
    <label><input type="checkbox" checked={!!options.ownStyle} onChange={e=>setOptions({...options,ownStyle:e.target.checked})}/> Crear estilo propio</label>
    <fieldset><legend>Tags compartidos</legend>{sharedTags.map(tag=><label key={tag}><input type="checkbox" checked={options.styles?.includes(tag)??false} onChange={e=>setOptions({...options,styles:e.target.checked?[...options.styles??[],tag]:options.styles?.filter(x=>x!==tag)})}/>{tag}</label>)}</fieldset>
    <label><input type="checkbox" checked={!!options.ownActions} onChange={e=>setOptions({...options,ownActions:e.target.checked})}/> Crear acciones propias</label>
    <fieldset><legend>Acciones compartidas</legend>{sharedActions.map(sheet=><label key={sheet}><input type="checkbox" checked={options.actions?.includes(sheet)??false} onChange={e=>setOptions({...options,actions:e.target.checked?[...options.actions??[],sheet]:options.actions?.filter(x=>x!==sheet)})}/>{sheet}</label>)}</fieldset>
   </>}
   {error&&<p role="alert">{error}</p>}<div className="create-file-actions"><button type="button" onClick={()=>setType(null)}>Cancelar</button><button type="submit" className="primary">Crear</button></div>
  </form></div>}
 </aside>;
}
