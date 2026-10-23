# Colecciones, objetos y atributos compatibles en Paix

## Instalar

1. Copia la carpeta `src` de este ZIP dentro de `C:\Users\diext\paix.js`, combinando carpetas y reemplazando los archivos incluidos. Se conserva todo el código recibido; `CHANGED_FILES.txt` enumera los archivos modificados o añadidos.
2. Conserva tus archivos de configuración actuales. El ZIP original no contenía `tsconfig.app.json`, `tsconfig.node.json`, `vitest.config.ts` ni `index.html`. Se incluyen los archivos mínimos usados para verificar esta entrega en `configuration-if-missing/`: cópialos a la raíz SOLO si te faltan. No hace falta reemplazar tus configuraciones existentes.
3. No se añadieron dependencias ni se modificaron `package.json` o `package-lock.json`. Conserva también tu carpeta `public`.
4. Ejecuta `npm run test:run` y `npm run build`.

## Qué funciona

```paix
state:
    _USERS: [
        { id: 333, name: "Aurora", friendNumber: 12, category: "women" },
        { id: 334, name: "Atlas", friendNumber: 8, category: "men" }
    ]
```

- `_USERS{1}`: primer objeto; posiciones desde 1.
- `_USERS{id: 333}.friendNumber`: 12, sin pedir otra posición.
- `_USERS{category: "women"}`: colección de coincidencias.
- `_USERS{category: "women", friendNumber: 12}{1}.name`: primera coincidencia que cumple ambos criterios.
- `this.user.location.city`: campos de objetos anidados.
- Posición/id inexistente o campo inexistente: valor ausente, compatible con `otherwise`.
- Filtro sin resultados: `[]`. Los filtros conservan el orden y comparan valores y tipos sin conversiones: `333` y `"333"` son diferentes.
- Las selecciones leen datos; no los modifican. Para actualizar la colección completa, usa su setter `set_USERS(...)`.

Los estados cuyo nombre cumple `_MAYUSCULAS` (se permiten números y guiones bajos después de la primera letra) se validan como colecciones. Deben ser arrays de objetos con un campo `id` propio, numérico o de texto y único. Una colección vacía es válida. Los valores estáticos inválidos aparecen como diagnósticos; los valores procedentes de atributos también se validan al inicializar el estado. Los setters rechazan cambios inválidos, conservan el valor anterior y muestran un error local.

## Pasar objetos a componentes

```paix
main.slots > [
    Button(_PRODUCTS{1}),
    Button(_PRODUCTS{id: 334}, label: "Ver producto")
]
```

Se pasan únicamente los campos compatibles con el componente. Si el objeto tiene `id`, `price`, `label` y `disabled`, Button recibe `label` y `disabled`, no `id` o `price`.

Los argumentos con nombre ganan sobre los objetos, incluso si aparecen antes. Se admiten varios objetos: entre ellos, el último valor definido compatible gana. `undefined` no sobrescribe un valor; `false`, `0`, `""` y `none` sí son valores definidos. Un objeto ausente no aporta atributos. Una colección completa no puede usarse como objeto sin nombre: selecciona primero una posición o un id.

Para componentes propios se infieren las entradas desde `this.nombre` en el cuerpo, las expresiones iniciales de estados y las condiciones del estilo. No vuelve a existir `parameters:`. Para entregar el objeto completo bajo un atributo concreto, escribe `Profile(user: _USERS{id: 333})`.

Los primitivos declaran su lista de entradas al registrarse, por ejemplo:

```ts
componentRegistry.register("Button", Button, ["label", "disabled", "onClick", "className"]);
```

El registro con dos argumentos sigue funcionando para llamadas con atributos nombrados; si añades un primitivo propio y quieres recibir atributos desde objetos, registra también sus nombres aceptados.

Los stacks siguen siendo explícitos. No se implementaron repeat, each, generación automática de componentes ni el resto de las features de actions/formularios/navegación.

## Probar inmediatamente en el Workbench sin borrar tu proyecto

Crea `wireframes/ProductsFrame.paix`:

```paix
wireframe "ProductsFrame"
main slice columns 3
```

Crea `components/Products.paix`:

```paix
component "Products" ProductsFrame

state:
    _PRODUCTS: [
        { id: 333, label: "Aurora", price: 120, disabled: false },
        { id: 334, label: "Atlas", price: 180, disabled: true },
        { id: 335, label: "Nova", price: 90, disabled: false }
    ]

main.slots > [
    Button(_PRODUCTS{1}),
    Button(_PRODUCTS{id: 334}),
    Button(_PRODUCTS{3}, label: "Ver Nova")
]
```

Abre Products.paix: su preview mostrará tres botones; Atlas estará desactivado y el tercero dirá Ver Nova. `price` no se pasa a Button.

También se añadió un ejemplo completo en `src/examples/collectionProject.ts` y una sección de documentación en `/doc`. Los archivos de ese ejemplo forman parte del proyecto inicial. Si ya tienes un proyecto guardado en el navegador, este se respeta y no recibe archivos nuevos automáticamente. No necesitas pulsar Reset: crea los dos archivos anteriores para probar. Reset cargaría los ejemplos nuevos, pero descartaría tu proyecto guardado.

## Verificación

- Suite completa: 75 tests pasaron en 21 archivos, usando Vitest y las dependencias del package-lock recibido.
- Incluye pruebas de parser, selectores, objetos anidados, IDs duplicados, prioridad de argumentos, inferencia de entradas, renderizado en slots y actualizaciones reactivas con setters.
- `npm run build`: comprobación TypeScript completa y build Vite correctos. Como el ZIP no traía el HTML ni los tsconfig referenciados, la comprobación utilizó los archivos de configuration-if-missing.
- Los recursos públicos originales no estaban en el ZIP. El build conservó la referencia a `/fonts/pair.otf`; conserva tu carpeta public para que se resuelva como antes.
