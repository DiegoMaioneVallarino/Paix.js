import type { PaixFile } from '../../project/project.types';
import { FileTypeIcon } from './FileTypeIcon';
import { fileVisualState, isCompanion, isEmptyFile } from '../../project/fileStatus';
interface Props {file:PaixFile;selected:boolean;modified:boolean;onOpen:(path:string)=>void;onToggle?:(path:string)=>void;hasErrors?:boolean;unused?:boolean;onCompanion?:(path:string,kind:'frame'|'style'|'actions')=>void}
export function FileTreeItem({file,selected,modified,onOpen,onToggle,hasErrors=false,unused=false,onCompanion}:Props) {
 const dim=file.enabled===false || isEmptyFile(file.content) || unused;
 return <div className="file-entry" data-file-state={fileVisualState(file,hasErrors)}>
  <div className="file-entry-line">
   <button className={`tree-file ${selected?'selected':''} ${dim?'file-dim':''}`} title={`${file.path}${unused?' · Sin uso: frame compartido':''}`} onClick={()=>onOpen(file.path)}>
    <FileTypeIcon type={file.type}/><span className="tree-file-name">{file.name}</span>
    {hasErrors && <span className="file-error-badge" aria-label="Con errores">!</span>}
    {modified && <span className="modified-dot" title="Modificado"/>}
   </button>
   {isCompanion(file) && onToggle && <button className="file-toggle" aria-label={`${file.enabled===false?'Activar':'Desactivar'} ${file.name}`} aria-pressed={file.enabled!==false} title={unused?'Sin uso: utiliza un frame compartido':file.enabled===false?'Desactivado':'Activo'} onClick={()=>onToggle(file.path)}>{file.enabled===false?'○':'●'}</button>}
  </div>
  {unused && <small className="file-unused">Sin uso · frame compartido</small>}
  {['component','page'].includes(file.type) && onCompanion && <details className="file-companions"><summary>Hojas hermanas</summary>{(['frame','style','actions'] as const).map(kind=><button key={kind} onClick={()=>onCompanion(file.path,kind)}>Abrir / crear {kind}</button>)}</details>}
 </div>;
}
