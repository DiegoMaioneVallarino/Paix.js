import type { PaixProject } from "../project/project.types";

export const counterProject: PaixProject = {
  id: "counter-project",
  name: "counter-app",
  entry: "pages/home.paix",

  files: {"wireframes/WireframeLab.paix": {
  id: "wireframe-lab",
  name: "WireframeLab.paix",
  path: "wireframes/WireframeLab.paix",
  type: "wireframe",

  content: `wireframe "WireframeLab"

main slice grid 2x2 >
    "gridArea"
    "islandArea"
    "verticalCenteredArea"
    "horizontalCenteredArea"

gridArea slice grid 3x2

islandArea slice island 14 >
    "islandContentArea"

islandContentArea slice layer 3 >
    "bottomLayer"
    "middleLayer"
    "topLayer"

verticalCenteredArea slice vertical centered 90 >
    "leftArea"
    "verticalCenterArea"
    "rightArea"

horizontalCenteredArea slice horizontal centered 54 >
    "topArea"
    "horizontalCenterArea"
    "bottomArea"`,
},
    "pages/home.paix": {
      id: "home-page",
      name: "home.paix",
      path: "pages/home.paix",
      type: "page",

      content: `page "home" MainFrame

headerArea >
    Text(value: "Hello Paix")

contentArea.slots > [
    Button(label: "Home"),
    Button(label: "Catalogue"),
    Button(label: "Contact")
]`,
    },

    "components/Counter.paix": {
      id: "counter-component",
      name: "Counter.paix",
      path: "components/Counter.paix",
      type: "component",

      content: `component "Counter" CounterFrame

state:
    _count: 0

valueArea >
    Text(value: _count)

actionsArea >
    Button(
        label: "Add",
        onClick: set_count(_count + 1)
    )

actionsArea >
    Button(
        label: "Reset",
        onClick: set_count(0)
    )`,
    },

    "components/Header.paix": {
      id: "header-component",
      name: "Header.paix",
      path: "components/Header.paix",
      type: "component",

      content: `component "Header" HeaderFrame

parameters:
    title: "Paix"

logoArea >
    Text(value: title)

actionsArea >
    Button(
        label: "Account",
        onClick: openAccount()
    )`,
    },

    "wireframes/MainFrame.paix": {
      id: "main-frame",
      name: "MainFrame.paix",
      path: "wireframes/MainFrame.paix",
      type: "wireframe",

      content: `wireframe "MainFrame"

main slice horizontal 72 >
    "headerArea"
    "contentArea"

contentArea slice columns 3`,
    },

    "styles/GlassPanel.paix": {
      id: "glass-style",
      name: "GlassPanel.paix",
      path: "styles/GlassPanel.paix",
      type: "style",

      content: `style "GlassPanel"

surface: glass
background: translucent
radius: medium
shadow: soft
border: subtle`,
    },
  },
};