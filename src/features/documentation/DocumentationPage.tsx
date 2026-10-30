import { useEffect, useState } from "react";
import "./DocumentationPage.css";

interface Example { title: string; file?: string; code: string }
interface Section { id: string; label: string; title: string; description: string; paragraphs: string[]; examples?: Example[]; rows?: [string, string][] }

const sections: Section[] = [
  {
    "id": "introduction",
    "label": "Introducción",
    "title": "Una carpeta, un componente.",
    "description": "La estructura muestra contenido; actions concentra el comportamiento.",
    "paragraphs": [
      "Cada componente tiene un nombre único en el proyecto. Crear Counter desde el editor genera Counter.paix, Counter.frame.paix, Counter.style.paix y Counter.actions.paix dentro de components/Counter/.",
      "El compilador asocia los derivados por su ruta y nombre. El componente no declara frame, style ni actions. Su frame es obligatorio; style y actions son opcionales. Los archivos derivados tampoco necesitan cabecera.",
      "Los proyectos antiguos siguen siendo compatibles: this, otherwise, state:, .slots, listas entre corchetes y asociaciones explícitas siguen funcionando en archivos antiguos. Los ejemplos nuevos usan la sintaxis por carpeta. No se modifican automáticamente los proyectos guardados en el navegador."
    ],
    "examples": [
      {
        "title": "Archivos asociados",
        "file": "components/Counter/",
        "code": "Counter.paix\nCounter.frame.paix\nCounter.style.paix\nCounter.actions.paix"
      }
    ],
    "rows": [
      [
        "Component",
        "Contenido, atributos y conexiones de eventos."
      ],
      [
        "Frame",
        "Áreas y distribución."
      ],
      [
        "Style",
        "Apariencia y variantes."
      ],
      [
        "Actions",
        "Estados por instancia, cambios y composición de acciones."
      ]
    ]
  },
  {
    "id": "pages",
    "label": "Pages y espacios",
    "title": "Coloca contenido con >.",
    "description": "La página conserva su cabecera y el nombre de su frame.",
    "paragraphs": [
      "area > coloca contenido en el área. area.spaces > distribuye los componentes entre los espacios que crea el frame, en orden. Se conserva la distinción entre área y espacios.",
      "Un stack es una lista explícita de componentes indentados. Ya no necesita [] ni comas entre hermanos. Cada nuevo componente comienza en otra línea y con la misma indentación. Los atributos pueden separarse por líneas dentro de los paréntesis; en una misma línea se separan con comas.",
      "Una cuadrícula 3x3 admite nueve espacios. Esta versión no crea filas adicionales ni genera componentes automáticamente a partir de colecciones. Los elementos que exceden los espacios no se muestran."
    ],
    "examples": [
      {
        "title": "Página",
        "file": "pages/home.paix",
        "code": "page \"home\" MainFrame\nmain.spaces >\n    Counter(label: \"Primero\")\n    Counter(label: \"Segundo\")"
      },
      {
        "title": "Frame de la página",
        "file": "wireframes/MainFrame.paix",
        "code": "wireframe \"MainFrame\"\nmain slice columns 2"
      }
    ]
  },
  {
    "id": "components",
    "label": "Componentes e inputs",
    "title": "Lee los atributos donde se usan.",
    "description": "inputs.nombre recibe el valor suministrado por quien invoca el componente.",
    "paragraphs": [
      "Counter(label: \"Primero\") entrega label. Se consume como inputs.label, sin declarar parameters ni copiarlo a un estado. Los objetos recibidos permiten acceso encadenado: inputs.user.location.city.",
      "El símbolo / proporciona una alternativa solo cuando falta el valor (undefined). Conserva false, 0, \"\" y none. No es división ni un separador entre ramas de contenido.",
      "Los atributos no se reenvían solos a hijos: Card(title: inputs.title) hace esa conexión explícita."
    ],
    "examples": [
      {
        "title": "Counter completo",
        "file": "components/Counter/Counter.paix",
        "code": "labelArea >\n    Text(value: inputs.label / \"Count\")\nvalueArea >\n    Text(value: states.count)\nactionsArea.spaces >\n    Button(\n        label: \"Add\"\n        onClick: actions.add\n    )\n    Button(\n        label: \"Reset\"\n        onClick: actions.reset\n    )"
      }
    ]
  },
  {
    "id": "states",
    "label": "Estados y actions",
    "title": "El comportamiento vive en actions.",
    "description": "Cada instancia mantiene sus propios estados aunque comparte el archivo de definición.",
    "paragraphs": [
      "El bloque states: vive en Counter.actions.paix. Declara nombres sin el prefijo _: count, selected o PRODUCTS. Se leen como states.count, states.selected o states.PRODUCTS. El formato interno del AST conserva el prefijo _ por compatibilidad.",
      "Una acción se declara con action nombre:. Cada línea states.nombre: expresión asigna un valor. Una línea actions.otra ejecuta otra acción del mismo archivo. Los pasos se ejecutan en orden y leen los cambios de pasos anteriores.",
      "onClick: actions.add conecta el evento sin invocar una función durante el render. La acción se ejecuta al hacer clic. Las acciones no reciben argumentos en esta primera sintaxis; sus expresiones pueden leer inputs y states.",
      "Los nombres duplicados, las escrituras a estados inexistentes, las acciones inexistentes y los ciclos entre acciones producen diagnósticos. Una colección inválida aborta los cambios de la acción.",
      "inputs.start / 0 se evalúa al inicializar la instancia. No sincroniza continuamente el estado con ese atributo. No hay peticiones HTTP, navegación ni acciones asíncronas nuevas en esta actualización."
    ],
    "examples": [
      {
        "title": "Estados y acciones del contador",
        "file": "components/Counter/Counter.actions.paix",
        "code": "states:\n    count: inputs.start / 0\n\naction add:\n    states.count: states.count + 1\n\naction reset:\n    states.count: 0\n\naction addTwice:\n    actions.add\n    actions.add"
      },
      {
        "title": "Frame del contador",
        "file": "components/Counter/Counter.frame.paix",
        "code": "main slice horizontal 44 >\n    \"labelArea\"\n    \"bodyArea\"\nbodyArea slice horizontal 68 >\n    \"valueArea\"\n    \"actionsArea\"\nactionsArea slice columns 2"
      }
    ]
  },
  {
    "id": "collections",
    "label": "Colecciones y objetos",
    "title": "Selecciona objetos, conecta sus atributos.",
    "description": "Los nombres de estado en MAYÚSCULAS identifican colecciones con ids únicos.",
    "paragraphs": [
      "Declara PRODUCTS en el bloque states: de actions. La colección debe ser una lista de objetos con id numérico o de texto único. Conservamos [] y comas en datos: su eliminación corresponde a las listas visuales de componentes.",
      "states.PRODUCTS{1} selecciona el primer objeto. states.PRODUCTS{id: 333} selecciona un objeto único. states.PRODUCTS{category: \"women\"} devuelve una colección filtrada; añade {1} para seleccionar su primer objeto.",
      "Los filtros comparan por valor y tipo, exigen todas las coincidencias y conservan el orden. Una posición o id ausente devuelve undefined; / puede ofrecer una alternativa. Un filtro sin resultados devuelve [].",
      "Button(states.PRODUCTS{1}) transmite solo los atributos que acepta Button. Para componentes propios se infieren de inputs en el componente, sus acciones y condiciones de estilo. Los atributos nombrados explícitamente tienen prioridad.",
      "Las listas visuales siguen siendo explícitas: esta versión no introduce repeat ni generación automática. Puedes pasar un objeto completo con Profile(user: states.USERS{id: 333}) y leer inputs.user.name."
    ],
    "examples": [
      {
        "title": "Datos",
        "file": "components/Products/Products.actions.paix",
        "code": "states:\n    PRODUCTS: [\n        { id: 333, label: \"Aurora\", disabled: false },\n        { id: 334, label: \"Atlas\", disabled: true }\n    ]"
      },
      {
        "title": "Componentes",
        "file": "components/Products/Products.paix",
        "code": "main.spaces >\n    Button(states.PRODUCTS{1})\n    Button(states.PRODUCTS{id: 334}, label: \"Ver Atlas\")"
      },
      {
        "title": "Frame",
        "file": "components/Products/Products.frame.paix",
        "code": "main slice columns 2"
      }
    ]
  },
  {
    "id": "wireframes",
    "label": "Wireframes",
    "title": "La geometría pertenece al frame.",
    "description": "main es el área raíz; cada slice divide su espacio.",
    "paragraphs": [
      "Los tamaños sin unidad son píxeles; también se admite px y %. vertical crea columnas y horizontal crea filas. centered reserva el tamaño para el centro y reparte el resto entre los dos lados.",
      "island separa el área interior por sus cuatro lados sin añadir padding al estilo. layer superpone áreas. columns, rows y grid crean espacios que se llenan con .spaces.",
      "Las reglas condicionales de tamaño comparan dimensiones del área: main when width less than height slice rows 2. La selección se actualiza cuando cambia el tamaño del área."
    ],
    "examples": [
      {
        "title": "Cuadrícula",
        "file": "components/Catalogue/Catalogue.frame.paix",
        "code": "main slice grid 3x3"
      },
      {
        "title": "Island",
        "file": "components/Panel/Panel.frame.paix",
        "code": "main slice island 12 >\n    \"contentArea\""
      }
    ],
    "rows": [
      [
        "vertical / horizontal",
        "Dos áreas; tamaño de la primera."
      ],
      [
        "vertical centered / horizontal centered",
        "Tres áreas; tamaño del centro."
      ],
      [
        "columns / rows",
        "Cantidad de columnas o filas iguales."
      ],
      [
        "grid",
        "Columnas x filas, como 3x3."
      ],
      [
        "island",
        "Una zona interior."
      ],
      [
        "layer",
        "Áreas superpuestas."
      ]
    ]
  },
  {
    "id": "styles",
    "label": "Styles",
    "title": "Apariencia sin modificar el encuadre.",
    "description": "El archivo hermano .style.paix se aplica automáticamente al componente.",
    "paragraphs": [
      "No uses style: en el componente asociado por carpeta. Para un primitivo puedes indicar un estilo compartido: Text(value: inputs.title, style: TextSurface). Los estilos compartidos pueden seguir en styles/.",
      "No se permite padding, contentPadding, margin, width, height, display, position, grid, flex, zIndex ni border en estilos.",
      "color controla el texto, incluido degradado. backgroundColor admite color sólido; backgroundImage admite degradados. Usa textSize con esa capitalización exacta.",
      "Cada capa dispone de Weight (desenfoque), Spread (grosor o expansión) y Color. outlineColor e inlineColor aceptan degradados; shadowColor usa color sólido. Spread: 0 oculta un anillo; shadowColor: transparent oculta la sombra.",
      "when states.count is 3: consulta el estado de la instancia. when inputs.category is \"women\": consulta un atributo. Las condiciones de estilo cambian apariencia, no contenido."
    ],
    "examples": [
      {
        "title": "Estilo asociado",
        "file": "components/Counter/Counter.style.paix",
        "code": "backgroundColor: navy\ncolor: white\nradius: 12\ntextSize: 18\noutlineWeight: 0\noutlineSpread: 2\noutlineColor: gradient right from cyan to blue\nshadowWeight: 18\nshadowSpread: 2\nshadowColor: black\ntransitionTime: 180\nwhen states.count is 3:\n    backgroundColor: teal"
      }
    ],
    "rows": [
      [
        "Superficie",
        "color, backgroundColor, backgroundImage, opacity, radius"
      ],
      [
        "Capas",
        "shadowWeight / shadowSpread / shadowColor; outlineWeight / outlineSpread / outlineColor; inlineWeight / inlineSpread / inlineColor"
      ],
      [
        "Texto",
        "font, textSize, textWeight, textStyle, textShadow, textAlign, lineHeight, letterSpacing"
      ],
      [
        "Efectos",
        "backdropBlur, blur, scale, transitionTime"
      ]
    ]
  },
  {
    "id": "interactions",
    "label": "Hover, focus y active",
    "title": "Variantes de interacción.",
    "description": "Los estilos reconocen las interacciones naturales y el preview permite simularlas.",
    "paragraphs": [
      "when hover: se activa al pasar el cursor; when active: mientras se presiona; when focus: cuando el elemento o un descendiente recibe foco.",
      "Los estados internos se leen con states: states.active es distinto del nombre de interacción active. transitionTime acepta milisegundos sin unidad, fast, smooth, slow o none."
    ],
    "examples": [
      {
        "title": "Interacciones",
        "file": "components/Counter/Counter.style.paix",
        "code": "backgroundColor: navy\ntransitionTime: smooth\nwhen hover:\n    backgroundColor: teal\nwhen focus:\n    outlineSpread: 3\nwhen active:\n    scale: 0.98"
      }
    ]
  },
  {
    "id": "preview",
    "label": "Editor y preview",
    "title": "Inspecciona cada pieza.",
    "description": "El archivo abierto determina el preview.",
    "paragraphs": [
      "Un componente muestra su instancia con frame, estilo y acciones asociados. Al abrir su archivo actions también puedes inspeccionar esa instancia. Un frame muestra sus áreas; un estilo muestra una superficie con Preview text.",
      "Junto a Desktop/Mobile puedes simular Hover, Focus y Active y consultar los estados. Modificarlos cambia la instancia de prueba sin editar el código. Los valores del preview de estilo son muestras.",
      "En estilos, arrastra un número con clic derecho. Un clic derecho sin arrastrar abre el menú. Sobre HEX usa Editar color y sobre font, Cambiar fuente. Funciona también en archivos .style.paix dentro de componentes.",
      "Crear un componente genera sus cuatro archivos. Los ejemplos actualizados se cargan en un proyecto nuevo. Reset descarta el proyecto local y carga los ejemplos: exporta o copia tus cambios antes de usarlo."
    ]
  }
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
        <label className="paix-doc-search"><span>Buscar en la documentación</span><input type="search" placeholder="Ej. inputs, actions, island…" value={query} onChange={event => setQuery(event.target.value)} /></label>
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
