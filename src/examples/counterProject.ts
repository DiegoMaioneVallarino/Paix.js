import { collectionExampleFiles } from "./collectionProject";
import type { PaixFile, PaixFileType, PaixProject } from "../project/project.types";
const file = (path: string, type: PaixFileType, content: string): PaixFile => ({ id: path, name: path.split("/").at(-1)!, path, type, content });

export const counterProject: PaixProject = {
  id: "counter-project", name: "paix-components", entry: "pages/home.paix",
  files: { ...collectionExampleFiles, ...Object.fromEntries([
    file("pages/home.paix", "page", `page "home" MainFrame
headerArea >
    Text(value: "Paix · componentes independientes")
contentArea.spaces >
    Counter(label: "Primer contador")
    Counter(label: "Segundo contador")
    CollectionDemo()`),
    file("wireframes/MainFrame.paix", "wireframe", `wireframe "MainFrame"
main slice horizontal 48 >
    "headerArea"
    "contentArea"
contentArea slice columns 3`),
    file("components/Counter/Counter.paix", "component", `labelArea >
    Text(value: inputs.label / "Count")
valueArea >
    Text(value: states.count)
actionsArea.spaces >
    Button(
        label: "Add"
        onClick: actions.add
    )
    Button(
        label: "Reset"
        onClick: actions.reset
    )`),
    file("components/Counter/Counter.frame.paix", "wireframe", `main slice island 12 >
    "bodyArea"
bodyArea slice horizontal 44 >
    "labelArea"
    "counterBodyArea"
counterBodyArea slice horizontal 68 >
    "valueArea"
    "actionsArea"
actionsArea slice columns 2`),
    file("components/Counter/Counter.actions.paix", "action", `states:
    count: inputs.start / 0

action add:
    states.count: states.count + 1

action reset:
    states.count: 0

action addTwice:
    actions.add
    actions.add`),
    file("components/Counter/Counter.style.paix", "style", `backgroundColor: #071b2b
backgroundImage: gradient down from #0d3a5c to #071b2b
color: white
radius: 16
outlineSpread: 1
outlineColor: gradient right from cyan to blue
textSize: 18
transitionTime: 180
when hover:
    outlineSpread: 2
when states.count is 3:
    backgroundImage: none
    backgroundColor: teal`),
  ].map(item => [item.path, item])) },
};
