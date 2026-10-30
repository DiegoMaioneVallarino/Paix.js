import type { PaixFile, PaixFileType, PaixProject } from "../project/project.types";
const file = (path: string, type: PaixFileType, content: string): PaixFile => ({ id: `collections-${path}`, path, name: path.split("/").at(-1)!, type, content });
export const collectionExampleFiles: Record<string, PaixFile> = Object.fromEntries([
  file("pages/collections.paix", "page", `page "collections" CollectionPageFrame
main > CollectionDemo()`),
  file("wireframes/CollectionPageFrame.paix", "wireframe", `wireframe "CollectionPageFrame"`),
  file("components/CollectionDemo/CollectionDemo.frame.paix", "wireframe", `main slice grid 3x3`),
  file("components/CollectionDemo/CollectionDemo.actions.paix", "action", `states:
    PRODUCTS: [
        { id: 333, label: "Comprar Aurora", name: "Aurora", price: 120, category: "women", disabled: false },
        { id: 334, label: "Comprar Atlas", name: "Atlas", price: 180, category: "men", disabled: true },
        { id: 335, label: "Comprar Nova", name: "Nova", price: 90, category: "women", disabled: false }
    ]`),
  file("components/CollectionDemo/CollectionDemo.paix", "component", `main.spaces >
    Button(states.PRODUCTS{1})
    Button(states.PRODUCTS{id: 334})
    Button(states.PRODUCTS{3}, label: "Ver Nova")
    ProductCard(states.PRODUCTS{id: 333})
    ProductCard(states.PRODUCTS{id: 334})
    ProductCard(states.PRODUCTS{category: "women"}{2})
    ProductCard(name: "Orion", price: 100, category: "men")
    ProductCard(name: "Vega", price: 150, category: "women")
    ProductCard(name: "Luna", price: 80, category: "women")`),
  file("components/ProductCard/ProductCard.frame.paix", "wireframe", `main slice island 4 >
    "bodyArea"
bodyArea slice horizontal 48 >
    "nameArea"
    "priceArea"`),
  file("components/ProductCard/ProductCard.paix", "component", `nameArea > Text(value: inputs.name / "Sin nombre")
priceArea > Text(value: "Precio: " + inputs.price)`),
  file("components/ProductCard/ProductCard.style.paix", "style", `backgroundColor: navy
color: white
radius: 12
when inputs.category is "women":
    backgroundColor: purple
when inputs.category is "men":
    backgroundColor: teal`),
].map(item => [item.path, item]));

export const collectionProject: PaixProject = {
  id: "collection-example", name: "collections", entry: "pages/collections.paix", files: collectionExampleFiles,
};
