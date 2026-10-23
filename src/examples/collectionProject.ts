import type { PaixFile, PaixFileType, PaixProject } from "../project/project.types";
const file = (path: string, type: PaixFileType, content: string): PaixFile => ({ id: `collections-${path}`, path, name: path.split("/").at(-1)!, type, content });
export const collectionExampleFiles: Record<string, PaixFile> = Object.fromEntries([
  file("pages/collections.paix", "page", `page "collections" CollectionPageFrame
main > CollectionDemo()`),
  file("wireframes/CollectionPageFrame.paix", "wireframe", `wireframe "CollectionPageFrame"`),
  file("wireframes/CollectionFrame.paix", "wireframe", `wireframe "CollectionFrame"
main slice grid 3x2`),
  file("wireframes/ProductCardFrame.paix", "wireframe", `wireframe "ProductCardFrame"
main slice horizontal 48 >
    "nameArea"
    "priceArea"`),
  file("components/CollectionDemo.paix", "component", `component "CollectionDemo" CollectionFrame
state:
    _PRODUCTS: [
        { id: 333, label: "Comprar Aurora", name: "Aurora", price: 120, category: "women", disabled: false },
        { id: 334, label: "Comprar Atlas", name: "Atlas", price: 180, category: "men", disabled: true },
        { id: 335, label: "Comprar Nova", name: "Nova", price: 90, category: "women", disabled: false }
    ]
main.slots > [
    Button(_PRODUCTS{1}),
    Button(_PRODUCTS{id: 334}),
    Button(_PRODUCTS{3}, label: "Ver Nova"),
    ProductCard(_PRODUCTS{id: 333}),
    ProductCard(_PRODUCTS{id: 334}),
    ProductCard(_PRODUCTS{category: "women"}{2})
]`),
  file("components/ProductCard.paix", "component", `component "ProductCard" ProductCardFrame
style: CollectionCardSurface
nameArea > Text(value: this.name otherwise "Sin nombre")
priceArea > Text(value: "Precio: " + this.price)`),
  file("styles/CollectionCardSurface.paix", "style", `style "CollectionCardSurface"
backgroundColor: navy
color: white
radius: 12
when this.category is "women":
    backgroundColor: purple
when this.category is "men":
    backgroundColor: teal`),
].map(item => [item.path, item]));

export const collectionProject: PaixProject = {
  id: "collection-example", name: "collections", entry: "pages/collections.paix", files: collectionExampleFiles,
};
