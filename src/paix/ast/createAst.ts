import type {
  CstNode,
  IToken,
} from "chevrotain";

import { paixParser } from "../parser/grammar";

import type {
  PaixArgumentNode,
  PaixBinaryExpressionNode,
  PaixCallExpressionNode,
  PaixComponentNode,
  PaixExpressionNode,
  PaixPageNode,
  PaixPlacementNode,
  PaixReferenceNode,
  PaixComponentDefinitionNode,
PaixParameterNode,
PaixStateNode,
PaixAreaReferenceNode,
PaixStackNode,
PaixSizeNode,
PaixSliceNode,
PaixWireframeNode,
} from "./ast.types";

type CstChildren = CstNode["children"];

const BasePaixVisitor =
  paixParser.getBaseCstVisitorConstructor();

class PaixAstVisitor extends BasePaixVisitor {
  public constructor() {
    super();
    this.validateVisitor();
  }

  public page(ctx: CstChildren): PaixPageNode {
    const nameToken = ctx.StringLiteral?.[0] as IToken;
    const wireframeToken =
      ctx.wireframe?.[0] as IToken;

    const placements =
      (ctx.placement ?? []) as CstNode[];

    return {
      type: "Page",
      name: parseString(nameToken.image),
      wireframe: wireframeToken.image,

      placements: placements.map((node) =>
        this.visit(node),
      ),
    };
  }

public wireframe(
  ctx: CstChildren,
): PaixWireframeNode {
  const nameToken =
    ctx.StringLiteral?.[0] as IToken;

  const sliceNodes =
    (ctx.sliceDeclaration ?? []) as CstNode[];

  return {
    type: "Wireframe",
    name: parseString(nameToken.image),

    slices: sliceNodes.map(
      (node) => this.visit(node) as PaixSliceNode,
    ),
  };
}

public sliceDeclaration(
  ctx: CstChildren,
): PaixSliceNode {
  const targetNode =
    ctx.target?.[0] as CstNode;

  const target = this.visit(
    targetNode,
  ) as PaixAreaReferenceNode;

  const areas = (
    (ctx.areaName ?? []) as IToken[]
  ).map((token) => parseString(token.image));

  if (ctx.VerticalKeyword) {
    return {
      type: "Slice",
      target,

      mode: ctx.CenteredKeyword
        ? "vertical-centered"
        : "vertical",

      size: this.visit(
        ctx.sizeValue?.[0] as CstNode,
      ) as PaixSizeNode,

      areas,
    };
  }

  if (ctx.HorizontalKeyword) {
    return {
      type: "Slice",
      target,

      mode: ctx.CenteredKeyword
        ? "horizontal-centered"
        : "horizontal",

      size: this.visit(
        ctx.sizeValue?.[0] as CstNode,
      ) as PaixSizeNode,

      areas,
    };
  }

  if (ctx.ColumnsKeyword || ctx.RowsKeyword) {
    const countToken =
      ctx.count?.[0] as IToken;

    return {
      type: "Slice",
      target,

      mode: ctx.ColumnsKeyword
        ? "columns"
        : "rows",

      count: Number(countToken.image),
      areas,
    };
  }

  if (ctx.GridKeyword) {
    const gridToken =
      ctx.GridSizeLiteral?.[0] as IToken;

    const [columns, rows] = gridToken.image
      .split("x")
      .map(Number);

    return {
      type: "Slice",
      target,
      mode: "grid",
      columns,
      rows,
      areas,
    };
  }

  if (ctx.IslandKeyword) {
    return {
      type: "Slice",
      target,
      mode: "island",

      size: this.visit(
        ctx.sizeValue?.[0] as CstNode,
      ) as PaixSizeNode,

      areas,
    };
  }

  const countToken =
    ctx.count?.[0] as IToken;

  return {
    type: "Slice",
    target,
    mode: "layer",
    count: Number(countToken.image),
    areas,
  };
}

public sizeValue(
  ctx: CstChildren,
): PaixSizeNode {
  const token = (
    ctx.SizeLiteral?.[0] ??
    ctx.NumberLiteral?.[0]
  ) as IToken;

  if (token.image.endsWith("%")) {
    return {
      value: Number(token.image.slice(0, -1)),
      unit: "percent",
    };
  }

  const numericValue = token.image.endsWith("px")
    ? token.image.slice(0, -2)
    : token.image;

  return {
    value: Number(numericValue),
    unit: "px",
  };
}

public component(
  ctx: CstChildren,
): PaixComponentDefinitionNode {
  const nameToken =
    ctx.StringLiteral?.[0] as IToken;

  const wireframeToken =
    ctx.wireframe?.[0] as IToken;

  const parameterSection =
    ctx.parameterSection?.[0] as
      | CstNode
      | undefined;

  const stateSection =
    ctx.stateSection?.[0] as
      | CstNode
      | undefined;

  const placements =
    (ctx.placement ?? []) as CstNode[];

  const parameters = parameterSection
    ? (this.visit(
        parameterSection,
      ) as PaixParameterNode[])
    : [];

  const states = stateSection
    ? (this.visit(
        stateSection,
      ) as PaixStateNode[])
    : [];

  return {
    type: "ComponentDefinition",
    name: parseString(nameToken.image),
    wireframe: wireframeToken.image,
    parameters,
    states,

    placements: placements.map((node) =>
      this.visit(node),
    ),
  };
}

public parameterSection(
  ctx: CstChildren,
): PaixParameterNode[] {
  const declarations =
    (ctx.parameterDeclaration ?? []) as CstNode[];

  return declarations.map((node) =>
    this.visit(node),
  );
}

public parameterDeclaration(
  ctx: CstChildren,
): PaixParameterNode {
  const name =
    ctx.parameterName?.[0] as IToken;

  const expression =
    ctx.expression?.[0] as CstNode;

  return {
    type: "Parameter",
    name: name.image,
    defaultValue: this.visit(expression),
  };
}

public stateSection(
  ctx: CstChildren,
): PaixStateNode[] {
  const declarations =
    (ctx.stateDeclaration ?? []) as CstNode[];

  return declarations.map((node) =>
    this.visit(node),
  );
}

public stateDeclaration(
  ctx: CstChildren,
): PaixStateNode {
  const name =
    ctx.stateName?.[0] as IToken;

  const expression =
    ctx.expression?.[0] as CstNode;

  return {
    type: "State",
    name: name.image,
    initialValue: this.visit(expression),
  };
}

  public placement(
  ctx: CstChildren,
): PaixPlacementNode {
  const targetNode =
    ctx.areaReference?.[0] as CstNode;

  const target = this.visit(
    targetNode,
  ) as PaixAreaReferenceNode;

  if (ctx.stack) {
    return {
      type: "StackPlacement",
      target,
      stack: this.visit(
        ctx.stack[0] as CstNode,
      ),
    };
  }

  return {
    type: "Placement",
    target,
    component: this.visit(
      ctx.componentCall?.[0] as CstNode,
    ),
  };
}

public areaReference(
  ctx: CstChildren,
): PaixAreaReferenceNode {
  const segmentTokens =
    (ctx.segment ?? []) as IToken[];

  const segments = segmentTokens.map(
    (token) => token.image,
  );

  return {
    type: "AreaReference",
    path: segments.join("."),
    segments,
    slots:
      segments[segments.length - 1] === "slots",
  };
}

public stack(ctx: CstChildren): PaixStackNode {
  const componentNodes =
    (ctx.componentCall ?? []) as CstNode[];

  return {
    type: "Stack",

    items: componentNodes.map((node) =>
      this.visit(node),
    ),
  };
}

  public componentCall(
    ctx: CstChildren,
  ): PaixComponentNode {
    const nameToken =
      ctx.componentName?.[0] as IToken;

    const argumentsList =
      (ctx.argument ?? []) as CstNode[];

    return {
      type: "Component",
      name: nameToken.image,

      arguments: argumentsList.map((node) =>
        this.visit(node),
      ),
    };
  }

  public argument(
    ctx: CstChildren,
  ): PaixArgumentNode {
    const nameToken =
      ctx.argumentName?.[0] as IToken;

    const expression =
      ctx.expression?.[0] as CstNode;

    return {
      type: "Argument",
      name: nameToken.image,
      state: nameToken.image.startsWith("_"),
      value: this.visit(expression),
    };
  }

  public expression(
    ctx: CstChildren,
  ): PaixExpressionNode {
    const operands =
      (ctx.operand ?? []) as CstNode[];

    const operators =
      (ctx.operator ?? []) as IToken[];

    let result = this.visit(
      operands[0],
    ) as PaixExpressionNode;

    for (
      let index = 0;
      index < operators.length;
      index += 1
    ) {
      const operator = operators[index].image as
        | "+"
        | "-";

      const right = this.visit(
        operands[index + 1],
      ) as PaixExpressionNode;

      const binaryExpression: PaixBinaryExpressionNode = {
        type: "BinaryExpression",
        operator,
        left: result,
        right,
      };

      result = binaryExpression;
    }

    return result;
  }

  public primary(
    ctx: CstChildren,
  ): PaixExpressionNode {
    if (ctx.functionCall) {
      return this.visit(
        ctx.functionCall[0] as CstNode,
      );
    }

    if (ctx.StringLiteral) {
      const token = ctx.StringLiteral[0] as IToken;
      return parseString(token.image);
    }

    if (ctx.NumberLiteral) {
      const token = ctx.NumberLiteral[0] as IToken;
      return Number(token.image);
    }

    if (ctx.TrueKeyword) {
      return true;
    }

    if (ctx.FalseKeyword) {
      return false;
    }

    if (ctx.NoneKeyword) {
      return null;
    }

    if (ctx.StateIdentifier) {
      const token =
        ctx.StateIdentifier[0] as IToken;

      const reference: PaixReferenceNode = {
        type: "Reference",
        name: token.image,
        kind: "state",
      };

      return reference;
    }

    const token = ctx.Identifier?.[0] as IToken;

    const reference: PaixReferenceNode = {
      type: "Reference",
      name: token.image,
      kind: "value",
    };

    return reference;
  }

  public functionCall(
    ctx: CstChildren,
  ): PaixCallExpressionNode {
    const callee = ctx.callee?.[0] as IToken;

    const argumentsList =
      (ctx.expression ?? []) as CstNode[];

    return {
      type: "CallExpression",
      callee: callee.image,

      arguments: argumentsList.map((node) =>
        this.visit(node),
      ),
    };
  }
}

function parseString(value: string): string {
  return JSON.parse(value) as string;
}

export const paixAstVisitor =
  new PaixAstVisitor();