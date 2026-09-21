export type PaixPrimitive =
  | string
  | number
  | boolean
  | null;

export interface PaixReferenceNode {
  type: "Reference";
  name: string;
  kind: "state" | "value";
}

export interface PaixCallExpressionNode {
  type: "CallExpression";
  callee: string;
  arguments: PaixExpressionNode[];
}

export interface PaixBinaryExpressionNode {
  type: "BinaryExpression";
  operator: "+" | "-";
  left: PaixExpressionNode;
  right: PaixExpressionNode;
}

export type PaixExpressionNode =
  | PaixPrimitive
  | PaixReferenceNode
  | PaixCallExpressionNode
  | PaixBinaryExpressionNode;

export type PaixDocumentNode =
  | PaixPageNode
  | PaixComponentDefinitionNode
  | PaixWireframeNode;
  
export interface PaixArgumentNode {
  type: "Argument";
  name: string;
  state: boolean;
  value: PaixExpressionNode;
}

export interface PaixComponentNode {
  type: "Component";
  name: string;
  arguments: PaixArgumentNode[];
}

export interface PaixAreaReferenceNode {
  type: "AreaReference";
  path: string;
  segments: string[];
  slots: boolean;
}

export interface PaixStackNode {
  type: "Stack";
  items: PaixComponentNode[];
}

export interface PaixSinglePlacementNode {
  type: "Placement";
  target: PaixAreaReferenceNode;
  component: PaixComponentNode;
}

export interface PaixStackPlacementNode {
  type: "StackPlacement";
  target: PaixAreaReferenceNode;
  stack: PaixStackNode;
}

export interface PaixAreaReferenceNode {
  type: "AreaReference";
  path: string;
  segments: string[];
  slots: boolean;
}

export interface PaixStackNode {
  type: "Stack";
  items: PaixComponentNode[];
}

export interface PaixSinglePlacementNode {
  type: "Placement";
  target: PaixAreaReferenceNode;
  component: PaixComponentNode;
}

export interface PaixStackPlacementNode {
  type: "StackPlacement";
  target: PaixAreaReferenceNode;
  stack: PaixStackNode;
}

export type PaixPlacementNode =
  | PaixSinglePlacementNode
  | PaixStackPlacementNode;

export interface PaixPageNode {
  type: "Page";
  name: string;
  wireframe: string;
  placements: PaixPlacementNode[];
}

export interface PaixParameterNode {
  type: "Parameter";
  name: string;
  defaultValue: PaixExpressionNode;
}

export interface PaixStateNode {
  type: "State";
  name: string;
  initialValue: PaixExpressionNode;
}

export interface PaixComponentDefinitionNode {
  type: "ComponentDefinition";
  name: string;
  wireframe: string;
  parameters: PaixParameterNode[];
  states: PaixStateNode[];
  placements: PaixPlacementNode[];
}

export interface PaixSizeNode {
  value: number;
  unit: "px" | "percent";
}

interface PaixSliceBaseNode {
  type: "Slice";
  target: PaixAreaReferenceNode;
  areas: string[];
}

export interface PaixSizedSliceNode
  extends PaixSliceBaseNode {
  mode:
    | "vertical"
    | "horizontal"
    | "vertical-centered"
    | "horizontal-centered"
    | "island";

  size: PaixSizeNode;
}

export interface PaixRepeatedSliceNode
  extends PaixSliceBaseNode {
  mode: "columns" | "rows" | "layer";
  count: number;
}

export interface PaixGridSliceNode
  extends PaixSliceBaseNode {
  mode: "grid";
  columns: number;
  rows: number;
}

export type PaixSliceNode =
  | PaixSizedSliceNode
  | PaixRepeatedSliceNode
  | PaixGridSliceNode;

export interface PaixWireframeNode {
  type: "Wireframe";
  name: string;
  slices: PaixSliceNode[];
}