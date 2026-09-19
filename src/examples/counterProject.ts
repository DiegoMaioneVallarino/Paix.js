import type { PaixProject } from "../project/project.types";

export const counterProject: PaixProject = {
  id: "counter-project",
  name: "counter-app",
  entry: "pages/home.paix",

  files: {
    "pages/home.paix": {
      id: "home-page",
      name: "home.paix",
      path: "pages/home.paix",
      type: "page",
      content: `page "home" MainFrame

header >
    Text(value: "Hello Paix")

content >
    Button(label: "Continue")`,
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

main when width greater than height
    splitRows 15% >
        "header" &
        "content"

main when height greater than width
    splitRows 12% >
        "header" &
        "content"`,
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