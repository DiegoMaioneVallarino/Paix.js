import { useEffect, useState } from "react";
import "./DocumentationPage.css";

interface Example { title: string; file?: string; code: string }
interface Section { id: string; label: string; title: string; description: string; paragraphs: string[]; examples?: Example[]; rows?: [string, string][] }

const sections: Section[] = [
  {
    id: "introduction", label: "Introducción", title: "Una interfaz, tres responsabilidades.",
    description: "Paix describe dónde vive cada componente, qué hace y cómo se ve.",
    paragraphs: [
      "El wireframe divide el espacio en áreas rectangulares. Los componentes ocupan esas áreas y conectan contenido, atributos y eventos. Los estilos definen su apariencia y sus variantes.",
      "Cada archivo comienza con su tipo y un nombre. Una página o un componente también indica qué wireframe utiliza. El proyecto reúne archivos en pages, components, wireframes y styles.",
      "Los ejemplos usan atributos recibidos mediante this.nombre. No necesitas volver a declarar esos atributos en un bloque parameters. Ese bloque continúa como compatibilidad en las versiones anteriores del runtime; retirarlo es un cambio independiente de esta documentación.",
    ],
    rows: [["Wireframe", "Geometría: áreas, divisiones y distribución."], ["Component", "Contenido, composición, estado y eventos."], ["Style", "Color, tipografía y efectos visuales."], ["Page", "Punto de entrada: coloca componentes en un wireframe."]],
  },
  {
    id: "pages", label: "Pages", title: "Coloca componentes en una página.",
    description: "El operador > conecta un área con el componente que la ocupa.",
    paragraphs: [
      "Después del nombre de la página, escribe el nombre de su wireframe. Usa nombres de áreas declarados por ese wireframe para colocar contenido.",
      "Un stack es una lista de componentes entre corchetes. Usa area.slots para distribuir sus elementos en los espacios generados por un slice sin nombres de áreas. Para una cuadrícula 3x3, la lista puede contener nueve componentes.",
    ],
    examples: [{ title: "Una página con tres cards", file: "pages/home.paix", code: `page "home" MainFrame

headerArea >
    Text(value: "Mi colección")

contentArea.slots > [
    Card(title: "Aurora", category: "women"),
    Card(title: "Atlas", category: "men"),
    Card(title: "Nova", category: "women")
]` }],
  },
  {
    id: "wireframes", label: "Wireframes", title: "Divide el espacio, conserva el encuadre.",
    description: "Las dimensiones y la distribución pertenecen al wireframe.",
    paragraphs: [
      "main es el área raíz. Un slice crea áreas hijas; puedes volver a dividir una de ellas usando su nombre como destino. Los números de tamaño sin unidad se interpretan como píxeles. También puedes usar px o %.",
      "vertical crea columnas: una sección izquierda del tamaño indicado y el espacio restante a la derecha. horizontal crea filas: una sección superior del tamaño indicado y el espacio restante abajo.",
      "En los modos centered, el tamaño corresponde a la sección central; las dos secciones exteriores comparten el resto. island aplica una separación en los cuatro lados dentro del área, sin modificar el espacio de sus vecinos.",
      "Una lista de tres cards necesita tres slots. Si cambias el ejemplo a grid 3x3, añade nueve cards para llenar la cuadrícula.",
    ],
    rows: [["vertical / horizontal", "Dos áreas con una división de tamaño definido."], ["vertical centered / horizontal centered", "Tres áreas; la central tiene un tamaño definido."], ["columns / rows", "Un número de columnas o filas iguales."], ["grid", "Cuadrícula: columnas x filas, por ejemplo 3x3."], ["island", "Una zona interior con separación en sus cuatro lados."], ["layer", "Varias áreas superpuestas."]],
    examples: [
      { title: "Wireframe de la página", file: "wireframes/MainFrame.paix", code: `wireframe "MainFrame"

main slice horizontal 72 >
    "headerArea"
    "contentArea"

contentArea slice columns 3` },
      { title: "Wireframe de una card", file: "wireframes/CardWire.paix", code: `wireframe "CardWire"

main slice horizontal 48 >
    "titleArea"
    "categoryArea"` },
      { title: "Zona interior", file: "wireframes/IslandFrame.paix", code: `wireframe "IslandFrame"

main slice island 12 >
    "sliceArea"` },
    ],
  },
  {
    id: "components", label: "Components y atributos", title: "Recibe atributos donde los necesitas.",
    description: "Card(title: \"Aurora\") ya identifica el atributo por su nombre.",
    paragraphs: [
      "Dentro del componente, this.title lee el atributo recibido. No hace falta copiarlo a un estado ni declarar su nombre otra vez. Un estado solo es necesario cuando el componente debe mantener un valor interno que puede cambiar.",
      "otherwise proporciona un valor alternativo cuando la expresión de la izquierda devuelve undefined. En el runtime actual, false, 0, una cadena vacía y none no activan ese valor alternativo.",
      "Los atributos no se reenvían automáticamente a componentes hijos. Si una envoltura recibe title y category y contiene una Card, pásalos explícitamente: Card(title: this.title, category: this.category).",
    ],
    examples: [{ title: "Componente Card", file: "components/Card.paix", code: `component "Card" CardWire

style: CardSurface

titleArea >
    Text(value: this.title otherwise "Sin título")

categoryArea >
    Text(value: this.category otherwise "General")` }],
  },
  {
    id: "styles", label: "Styles", title: "Diseño visual sin mover la geometría.",
    description: "Aplica un estilo a un componente o directamente a un primitivo.",
    paragraphs: [
      "Un componente puede declarar style: CardSurface. Para un primitivo usa, por ejemplo, Text(value: this.title, style: CardSurface). El nombre del estilo se refiere a un archivo style del proyecto.",
      "Los estilos no aceptan padding, contentPadding, margin, width, height, display, position, grid, flex, zIndex ni border. La geometría la controla el wireframe.",
      "color controla el texto y también puede contener un degradado. backgroundColor recibe un color sólido; backgroundImage recibe un degradado o una imagen CSS. Usa nombres de propiedades con su capitalización exacta: textSize, no textsize.",
      "Cada capa tiene tres propiedades: Weight es el desenfoque, Spread es el grosor del anillo o la expansión de la sombra, y Color es su pintura. Usa Weight: 0 para líneas nítidas. outlineColor e inlineColor aceptan degradados; shadowColor usa un color sólido.",
      "Las propiedades antiguas shadow, shadowBlur, outline e inline se sustituyen por las propiedades separadas. Para ocultar un anillo usa Spread: 0; para ocultar la sombra usa shadowColor: transparent.",
    ],
    rows: [["Superficie", "color, backgroundColor, backgroundImage, opacity, radius"], ["Capas", "shadowWeight / shadowSpread / shadowColor; outlineWeight / outlineSpread / outlineColor; inlineWeight / inlineSpread / inlineColor"], ["Texto", "font, textSize, textWeight, textStyle, textShadow, textAlign, lineHeight, letterSpacing"], ["Efectos", "backdropBlur, blur, scale, transitionTime"]],
    examples: [
      { title: "Estilo de las cards", file: "styles/CardSurface.paix", code: `style "CardSurface"

backgroundColor: navy
color: white
font: "Segoe UI", sans-serif
textSize: 18
radius: 12

outlineWeight: 0
outlineSpread: 2
outlineColor: gradient right from cyan to blue

inlineWeight: 0
inlineSpread: 1
inlineColor: white

shadowWeight: 18
shadowSpread: 2
shadowColor: black

when this.category is "women":
    backgroundColor: purple

when this.category is "men":
    backgroundColor: teal` },
      { title: "Degradado hacia la derecha", code: `backgroundImage: gradient right from blue to white` },
      { title: "Degradado hacia abajo", code: `backgroundImage: gradient down from blue to white` },
      { title: "Degradado radial", code: `backgroundImage: radial gradient from white to blue` },
      { title: "Degradado de texto", code: `color: gradient right from cyan to purple` },
    ],
  },
  {
    id: "states", label: "Estados y eventos", title: "Cambia el estado, actualiza la apariencia.",
    description: "Los estados llevan _ y sus setters se generan con set_.",
    paragraphs: [
      "state: declara valores internos. Un estado llamado _selected dispone del setter set_selected. Un evento como onClick recibe la llamada al setter, que se ejecuta al producirse la interacción.",
      "Puedes inicializar un estado con un atributo: _selected: this.selected otherwise false. Esa expresión da su valor inicial; no establece una sincronización continua con el atributo recibido.",
      "Un estilo puede leer el estado local usando when _selected:. El runtime evalúa esa condición y activa su clase visual. Cada instancia del componente conserva su propio estado.",
      "Las acciones personalizadas requieren su implementación y conexión al runtime. Escribir el nombre de una función no crea automáticamente esa acción.",
    ],
    examples: [
      { title: "Seleccionar y limpiar", file: "components/Selectable.paix", code: `component "Selectable" SelectableFrame

style: SelectableSurface

state:
    _selected: this.selected otherwise false

labelArea >
    Text(value: this.label otherwise "Elemento")

actionsArea.slots > [
    Button(label: "Seleccionar", onClick: set_selected(true)),
    Button(label: "Limpiar", onClick: set_selected(false))
]` },
      { title: "Wireframe del ejemplo", file: "wireframes/SelectableFrame.paix", code: `wireframe "SelectableFrame"

main slice horizontal 48 >
    "labelArea"
    "actionsArea"

actionsArea slice columns 2` },
      { title: "Variante según el estado", file: "styles/SelectableSurface.paix", code: `style "SelectableSurface"

backgroundColor: navy
color: white

when _selected:
    backgroundColor: teal
    outlineSpread: 2
    outlineColor: cyan` },
    ],
  },
  {
    id: "interactions", label: "Hover, focus y active", title: "Responde a la interacción.",
    description: "Declara variantes visuales dentro del mismo estilo.",
    paragraphs: [
      "when hover: se activa al pasar el cursor. when active: se activa mientras se presiona el elemento. when focus: usa focus-within, por lo que también se activa cuando recibe foco un control dentro del componente.",
      "transitionTime acepta una duración en milisegundos sin unidad, o los presets fast, smooth, slow y none. Añádelo al bloque base para animar las transiciones visuales.",
      "hover, focus y active son nombres reservados de interacción en estas condiciones. Para un estado interno usa su nombre con _, por ejemplo _active.",
    ],
    examples: [{ title: "Botón interactivo", file: "styles/ActionSurface.paix", code: `style "ActionSurface"

backgroundColor: navy
color: white
radius: 10
outlineSpread: 1
outlineColor: cyan
transitionTime: smooth

when hover:
    backgroundColor: teal

when focus:
    outlineSpread: 3

when active:
    scale: 0.98` }],
  },
  {
    id: "preview", label: "Editor y preview", title: "Prueba cada pieza en su contexto.",
    description: "El archivo abierto determina qué muestra el preview.",
    paragraphs: [
      "Una página muestra la interfaz completa. Un componente muestra su propia instancia y su wireframe. Un wireframe muestra las áreas en modo de inspección. Un estilo muestra una superficie de prueba con el texto provisional Preview text.",
      "Junto a Desktop/Mobile, Modo visual permite simular Hover, Focus y Active. En Normal siguen funcionando las interacciones naturales. Estados muestra los valores reales del componente raíz del preview: modificarlos cambia la instancia de prueba, sin escribir en el archivo.",
      "Al abrir un estilo, Valores de prueba permite introducir estados y atributos usados por sus condiciones. Esos valores son muestras: no pertenecen a una instancia real de un componente.",
      "En un archivo de estilo, arrastra un número con el clic derecho para cambiarlo. Un clic derecho sin arrastrar abre el menú propio. Sobre un color HEX puedes abrir Editar color; sobre el valor de font, Cambiar fuente. El selector de fuentes utiliza fuentes instaladas o cargadas por la aplicación.",
    ],
  },
];

function CodeExample({ title, file, code }: Example) {
  const [status, setStatus] = useState("Copiar");
  useEffect(() => {
    if (status === "Copiar") return;
    const timer = window.setTimeout(() => setStatus("Copiar"), 2500);
    return () => window.clearTimeout(timer);
  }, [status]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setStatus("Copiado"); }
    catch { setStatus("Selecciona y copia el código"); }
  };
  return <figure className="paix-doc-example">
    <figcaption><span><strong>{title}</strong>{file && <small>{file}</small>}</span>
      <button type="button" onClick={() => void copy()} aria-label={`Copiar ${title}`}><span aria-live="polite">{status}</span></button>
    </figcaption>
    <pre><code>{code}</code></pre>
  </figure>;
}

export function DocumentationPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(() => window.location.hash.slice(1) || "introduction");
  const matches = sections.filter(section => `${section.label} ${section.title} ${section.description} ${section.paragraphs.join(" ")} ${section.rows?.flat().join(" ") ?? ""} ${section.examples?.map(example => example.code).join(" ") ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  useEffect(() => {
    const onHash = () => setActive(window.location.hash.slice(1) || "introduction");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    document.title = "Documentación · Paix.js";
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);
  return <div className="paix-doc-page">
    <a className="paix-doc-skip" href="#doc-content">Saltar al contenido</a>
    <header className="paix-doc-topbar">
      <a className="paix-doc-brand" href="/" aria-label="Volver al editor Paix"><img src="/images/logo.png" alt="" /><span>paix<span className="paix-doc-js">.js</span><small>Documentación</small></span></a>
      <a className="paix-doc-back" href="/">← Volver al editor</a>
    </header>
    <div className="paix-doc-layout">
      <aside className="paix-doc-sidebar">
        <label className="paix-doc-search"><span>Buscar en la documentación</span><input type="search" placeholder="Ej. gradient, this, island…" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <nav aria-label="Temas de documentación">
          <p>GUÍA DE PAIX</p>
          {matches.map((section, index) => <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? "location" : undefined} onClick={() => setActive(section.id)}><span>{String(index + 1).padStart(2, "0")}</span>{section.label}</a>)}
        </nav>
        <div className="paix-doc-note"><strong>La geometría vive en el wireframe.</strong><p>Los estilos describen apariencia. Los componentes conectan comportamiento.</p></div>
      </aside>
      <main id="doc-content" className="paix-doc-content">
        {!query && <div className="paix-doc-hero"><span className="paix-doc-eyebrow">LENGUAJE + EDITOR</span><h1>Construye por partes.<br /><span>Entiende cada capa.</span></h1><p>Una guía de la sintaxis y las herramientas que usamos para crear interfaces con Paix.</p><a href="#pages" onClick={() => setActive("pages")}>Crear mi primera página ↓</a></div>}
        {query && <p className="paix-doc-results" role="status">{matches.length} tema{matches.length === 1 ? "" : "s"} para «{query}»</p>}
        {matches.length === 0 && <div className="paix-doc-empty"><h2>No encontramos ese término.</h2><p>Prueba con un nombre de propiedad o un concepto como wireframe, state o font.</p><button type="button" onClick={() => setQuery("")}>Limpiar búsqueda</button></div>}
        {matches.map(section => <section key={section.id} id={section.id} className="paix-doc-section" aria-labelledby={`${section.id}-title`}>
          <span className="paix-doc-eyebrow">{section.label}</span><h2 id={`${section.id}-title`}>{section.title}</h2><p className="paix-doc-lead">{section.description}</p>
          {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          {section.rows && <div className="paix-doc-table-wrap"><table><thead><tr><th scope="col">Concepto</th><th scope="col">Uso</th></tr></thead><tbody>{section.rows.map(([name, detail]) => <tr key={name}><th scope="row">{name}</th><td>{detail}</td></tr>)}</tbody></table></div>}
          {section.examples?.map(example => <CodeExample key={example.title} {...example} />)}
        </section>)}
        <footer className="paix-doc-footer"><span>Paix.js · Guía del proyecto</span><a href="/">Volver al editor ↗</a></footer>
      </main>
    </div>
  </div>;
}
