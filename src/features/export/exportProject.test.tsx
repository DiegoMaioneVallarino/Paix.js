/// <reference types="node" />
// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { counterProject } from "../../examples/counterProject";
import { buildExportFiles } from "./exportProject";
import { makeZip, textFile } from "./zip";

const bytes = (text: string) => new TextEncoder().encode(text).buffer;
function mockRuntime() {
  return vi.fn(async (url: string) => {
    if (url.endsWith('manifest.json')) return { ok: true, headers: new Headers(), json: async () => ({version:1,files:['runtime.js','runtime.css']}) };
    if (url.includes('/paix-export-runtime/')) return { ok:true,headers:new Headers(),arrayBuffer:async()=>bytes(url.endsWith('.js')?'// runtime':'body{}') };
    return {ok:true,headers:new Headers({'content-type':'image/png'}),arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};
  });
}
afterEach(() => vi.unstubAllGlobals());

test('exports current compiled project with relative assets and escaped JSON', async () => {
  vi.stubGlobal('fetch', mockRuntime());
  const project = structuredClone(counterProject); project.name = '</script><script>alert(1)</script>';
  const files = await buildExportFiles(project);
  const html = new TextDecoder().decode(files.find(f=>f.path==='index.html')!.data);
  expect(html).toContain('href="./assets/runtime.css"');
  expect(html).toContain('src="./assets/runtime.js"');
  expect(html).not.toContain('<script>alert(1)</script>');
  const data = JSON.parse(html.match(/type="application\/json">(.*?)<\/script>/s)![1]);
  expect(data.entryPage.name).toBe('home');
  expect(data.tags.Glass).toBeTruthy();
  expect(html).not.toContain('monaco');
});

test('copies and deduplicates local style images without mutating source', async () => {
  const fetcher = mockRuntime();vi.stubGlobal('fetch',fetcher);
  const project=structuredClone(counterProject);
  project.files['components/Counter/Counter.style.paix'].content='backgroundImage: url("/images/panel.png")\nwhen hover:\n    backgroundImage: url("/images/panel.png")';
  const before=JSON.stringify(project);
  const files=await buildExportFiles(project);
  expect(files.filter(f=>f.path.startsWith('assets/media/'))).toHaveLength(1);
  expect(new TextDecoder().decode(files[0].data)).toContain('./assets/media/resource-1.png');
  expect(JSON.stringify(project)).toBe(before);
});

test('rejects compilation errors before fetching runtime', async () => {
  const fetcher=mockRuntime();vi.stubGlobal('fetch',fetcher);
  await expect(buildExportFiles({...counterProject,entry:'missing.paix'})).rejects.toThrow('Corrige los errores');
  expect(fetcher).not.toHaveBeenCalled();
});

test('fails on a missing local asset rather than exporting a broken resource', async () => {
  const fetcher=mockRuntime(); vi.stubGlobal('fetch',async(url:string)=>url.includes('/images/')?{ok:false,headers:new Headers()}:fetcher(url));
  const project=structuredClone(counterProject);
  project.files['components/Counter/Counter.style.paix'].content='backgroundImage: url("/images/missing.png")';
  await expect(buildExportFiles(project)).rejects.toThrow('No se pudo incluir');
});

test('generated production runtime starts independently and its actions work', async () => {
  const fetcher=mockRuntime();vi.stubGlobal('fetch',fetcher);
  const files=await buildExportFiles(counterProject);
  const html=new TextDecoder().decode(files[0].data);
  const serialized=html.match(/type="application\/json">(.*?)<\/script>/s)![1];
  const { JSDOM } = await import('jsdom');
  const dom=new JSDOM(`<base href="./"><script src="https://export.test/subfolder/assets/runtime.js"></script><div id="root"></div><script type="application/json" id="paix-program">${serialized}</script>`,{runScripts:'outside-only',url:'https://export.test/subfolder/'});
  const runtime=readFileSync(resolve('public/paix-export-runtime/runtime.js'),'utf8');
  expect(runtime).not.toContain('monaco-editor');
  expect(runtime).not.toContain('Expecting token of type');
  dom.window.eval(runtime);
  await vi.waitFor(()=>expect(dom.window.document.querySelector('[data-paix-component="Counter"]')).not.toBeNull());
  const first=dom.window.document.querySelector('[data-paix-component="Counter"]')!;
  const button=[...first.querySelectorAll('button')].find(b=>b.textContent==='Add')!;
  button.click();
  await vi.waitFor(()=>expect(first.textContent).toContain('1'));
  expect(dom.window.document.querySelector('.workbench')).toBeNull();
  dom.window.close();
});

test('writes ZIP signatures and rejects unsafe or repeated paths', async () => {
  const zip=makeZip([textFile('index.html','hello')]);
  const buffer=await new Promise<ArrayBuffer>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result as ArrayBuffer);reader.onerror=reject;reader.readAsArrayBuffer(zip);});
  const view=new DataView(buffer);
  expect(view.getUint32(0,true)).toBe(0x04034b50);
  expect(view.getUint32(buffer.byteLength-22,true)).toBe(0x06054b50);
  expect(()=>makeZip([textFile('../bad','x')])).toThrow();
  expect(()=>makeZip([textFile('a','x'),textFile('a','y')])).toThrow();
});

test('keeps remote images explicit without downloading them', async () => {
  const fetcher=mockRuntime();vi.stubGlobal('fetch',fetcher);
  const project=structuredClone(counterProject);
  project.files['components/Counter/Counter.style.paix'].content='backgroundImage: url("https://example.org/panel.png")';
  const files=await buildExportFiles(project);
  expect(fetcher.mock.calls.some(([url])=>url.includes('example.org'))).toBe(false);
  expect(new TextDecoder().decode(files.find(f=>f.path==='README.txt')!.data)).toContain('https://example.org/panel.png');
});

test('exports route directories and opens nested routes directly under a hosting subfolder', async () => {
  vi.stubGlobal('fetch',mockRuntime());
  const project=structuredClone(counterProject);
  project.files['pages/Details/Details.paix']={id:'details',path:'pages/Details/Details.paix',name:'Details.paix',type:'page',content:'address: "/catalogue/details"\nframe: DetailFrame\nmain >\n    Button(label: "Return home", onClick: actions.home)'};
  project.files['pages/Details/Details.actions.paix']={id:'detail-actions',path:'pages/Details/Details.actions.paix',name:'Details.actions.paix',type:'action',content:'action home:\n    goTo: "/"'};
  project.files['wireframes/DetailFrame.paix']={id:'detail-frame',path:'wireframes/DetailFrame.paix',name:'DetailFrame.paix',type:'wireframe',content:'wireframe "DetailFrame"'};
  const files=await buildExportFiles(project);
  const html=new TextDecoder().decode(files.find(f=>f.path==='catalogue/details/index.html')!.data);
  expect(html).toContain('<base href="../../">');
  const {JSDOM}=await import('jsdom');
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://export.test/store/catalogue/details/'});
  try {
    dom.window.eval(readFileSync(resolve('public/paix-export-runtime/runtime.js'),'utf8'));
    await vi.waitFor(()=>expect(dom.window.document.querySelector('button')?.textContent).toBe('Return home'));
    dom.window.document.querySelector('button')!.click();
    await vi.waitFor(()=>expect(dom.window.location.pathname).toBe('/store/'));
    expect(dom.window.document.baseURI).toBe('https://export.test/store/');
    await vi.waitFor(()=>expect(dom.window.document.querySelector('[data-paix-component="Counter"]')).not.toBeNull());
  } finally {dom.window.close();}
});
