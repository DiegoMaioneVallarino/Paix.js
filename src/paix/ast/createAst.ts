import type {
  CstNode,
  IToken,
} from "chevrotain";

type CstChildren = CstNode["children"];

import { paixParser } from "../parser/grammar";

import type {
  PaixArgumentNode,
  PaixComponentNode,
  PaixPageNode,
  PaixPlacementNode,
  PaixPrimitive,
} from "./ast.types";

const BasePaixVisitor =
  paixParser.getBaseCstVisitorConstructor();

class PaixAstVisitor extends BasePaixVisitor {
  public constructor() {
    super();
    this.validateVisitor();
  }

  public page(ctx: CstChildren): PaixPageNode {
    const nameToken = ctx.StringLiteral?.[0] as IToken;
    const wireframeToken = ctx.wireframe?.[0] as IToken;

    const placementNodes =
      (ctx.placement ?? []) as CstNode[];

    return {
      type: "Page",
      name: parseString(nameToken.image),
      wireframe: wireframeToken.image,

      placements: placementNodes.map((node) =>
        this.visit(node),
      ),
    };
  }

  public placement(
    ctx: CstChildren,
  ): PaixPlacementNode {
    const areaToken = ctx.area?.[0] as IToken;
    const componentNode =
      ctx.componentCall?.[0] as CstNode;

    return {
      type: "Placement",
      area: areaToken.image,
      component: this.visit(componentNode),
    };
  }

  public componentCall(
    ctx: CstChildren,
  ): PaixComponentNode {
    const nameToken =
      ctx.componentName?.[0] as IToken;

    const argumentNodes =
      (ctx.argument ?? []) as CstNode[];

    return {
      type: "Component",
      name: nameToken.image,

      arguments: argumentNodes.map((node) =>
        this.visit(node),
      ),
    };
  }

  public argument(
    ctx: CstChildren,
  ): PaixArgumentNode {
    const nameToken =
      ctx.argumentName?.[0] as IToken;

    const valueNode = ctx.value?.[0] as CstNode;

    return {
      type: "Argument",
      name: nameToken.image,
      state: nameToken.image.startsWith("_"),
      value: this.visit(valueNode),
    };
  }

  public value(ctx: CstChildren): PaixPrimitive {
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
      const token = ctx.StateIdentifier[0] as IToken;
      return token.image;
    }

    const identifier = ctx.Identifier?.[0] as IToken;
    return identifier.image;
  }
}

function parseString(value: string): string {
  return JSON.parse(value) as string;
}

export const paixAstVisitor = new PaixAstVisitor();