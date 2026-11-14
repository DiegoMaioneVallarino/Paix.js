import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import type { PaixCompiledProject } from "../paix/compiler/compiled.types";
export type NavigationMode = "memory" | "hash" | "path";
const NavigationContext = createContext<(address: string) => void>(() => {});
export const usePaixNavigation = () => useContext(NavigationContext);
export function NavigationRuntime({program,mode="memory",children}:{program:PaixCompiledProject;mode?:NavigationMode;children:(program:PaixCompiledProject)=>ReactNode}) {
  const root=useRef<HTMLDivElement>(null);
  const base = mode==='path' ? new URL('../', document.querySelector<HTMLScriptElement>('script[src$="runtime.js"]')?.src ?? window.location.href).pathname.replace(/\/$/,'') : '';
  const read = () => mode==='hash' ? decodeURI(window.location.hash.slice(1)) || program.entryPage?.address || '/' : mode==='path' ? (window.location.pathname.slice(base.length).replace(/\/index\.html$/,'').replace(/\/+$/,'') || '/') + window.location.hash : program.entryPage?.address || '/';
  const [address,setAddress]=useState(read);
  useEffect(()=>{const update=()=>setAddress(read()); window.addEventListener('popstate',update);window.addEventListener('hashchange',update);return()=>{window.removeEventListener('popstate',update);window.removeEventListener('hashchange',update);};},[mode,base,program.entryPage?.address]);
  const [path,area]=address.split('#');
  const page=program.pages?.[path] ?? (!program.pages || path==='/' ? program.entryPage : null);
  useEffect(()=>{if(area) requestAnimationFrame(()=>{const element=[...root.current?.querySelectorAll<HTMLElement>('[data-paix-area]') ?? []].find(node=>node.dataset.paixArea===area); element?.scrollIntoView?.({block:'start'});});},[address,program]);
  const navigate=(next:string)=>{
    if(mode==='hash') window.history.pushState(null,'','#'+next);
    else if(mode==='path') window.history.pushState(null,'',base+next);
    setAddress(next);
  };
  return <NavigationContext.Provider value={navigate}><div ref={root} style={{width:'100%',height:'100%'}}>
    {page ? children({...program,entryPage:page}) : <div className="paix-runtime-error">Página no encontrada: {path}</div>}
  </div></NavigationContext.Provider>;
}
