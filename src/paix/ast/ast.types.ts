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

