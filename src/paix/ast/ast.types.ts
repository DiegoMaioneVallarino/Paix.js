export type PaixPrimitive =
  | string
  | number
  | boolean
  | null;

export interface PaixArgumentNode {
  type: "Argument";
  name: string;
  state: boolean;
  value: PaixPrimitive;
}

export interface PaixComponentNode {
  type: "Component";
  name: string;
  arguments: PaixArgumentNode[];
}

export interface PaixPlacementNode {
  type: "Placement";
  area: string;
  component: PaixComponentNode;
}

export interface PaixPageNode {
  type: "Page";
  name: string;
  wireframe: string;
  placements: PaixPlacementNode[];
}