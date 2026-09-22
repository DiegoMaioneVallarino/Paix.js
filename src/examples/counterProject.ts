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
},"wireframes/CounterFrame.paix": {
  id: "counter-frame",
  name: "CounterFrame.paix",
  path: "wireframes/CounterFrame.paix",
  type: "wireframe",

  content: `wireframe "CounterFrame"

main slice horizontal 44 >
    "labelArea"
    "counterBodyArea"

counterBodyArea slice horizontal 68 >
    "valueArea"
    "actionsArea"

actionsArea slice columns 2`,
},
    "pages/home.paix": {
      id: "home-page",
      name: "home.paix",
      path: "pages/home.paix",
      type: "page",

      content: `page "home" MainFrame

headerArea >
    Text(
        value: "Hello Paix",
        style: GlassPanel
    )

contentArea.slots > [
    Button(
        label: "Home",
        style: GlassPanel
    ),
    Button(
        label: "Catalogue",
        style: GlassPanel
    ),
    Button(
        label: "Contact",
        style: GlassPanel
    )
]`,
    },

    "components/Counter.paix": {
      id: "counter-component",
      name: "Counter.paix",
      path: "components/Counter.paix",
      type: "component",
content: `component "Counter" CounterFrame

parameters:
    label: "Count"

state:
    _count: 0

labelArea >
    Text(value: label)

valueArea >
    Text(value: _count)

actionsArea.slots > [
    Button(
        label: "Add",
        onClick: set_count(_count + 1)
    ),
    Button(
        label: "Reset",
        onClick: set_count(0)
    )
]`,
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

color: #f4fbff

backgroundColor: #071b2bcc
backgroundImage: gradient from #071b2bcc to #0d3a5ccc

opacity: 1

inline: 1
inlineColor: #ffffff33

outline: 1
outlineColor: #38bdf866

shadow: soft
shadowColor: #00101a99

radius: 18

font: Inter
textSize: 15
textWeight: 600
textStyle: normal
textShadow: soft #00101a99
textAlign: center
lineHeight: 1.4
letterSpacing: 0

backdropBlur: 18
blur: none
scale: 1
transitionTime: 180`,
},
  },
};