import {
  createToken,
  Lexer,
  type TokenType,
} from "chevrotain";

export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

export const Comment = createToken({
  name: "Comment",
  pattern: /\/\/[^\n\r]*/,
  group: Lexer.SKIPPED,
});

export const PageKeyword = createToken({
  name: "PageKeyword",
  pattern: /page\b/,
});

export const TrueKeyword = createToken({
  name: "TrueKeyword",
  pattern: /true\b/,
});

export const FalseKeyword = createToken({
  name: "FalseKeyword",
  pattern: /false\b/,
});

export const NoneKeyword = createToken({
  name: "NoneKeyword",
  pattern: /none\b/,
});

export const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /"(?:\\.|[^"\\])*"/,
});
export const GridSizeLiteral = createToken({
  name: "GridSizeLiteral",
  pattern: /\d+x\d+/,
});

export const SizeLiteral = createToken({
  name: "SizeLiteral",
  pattern: /\d+(?:\.\d+)?(?:px|%)/,
});
export const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /\d+(?:\.\d+)?/,
});

export const StateIdentifier = createToken({
  name: "StateIdentifier",
  pattern: /_[a-zA-Z][a-zA-Z0-9_]*/,
});

export const SetterIdentifier = createToken({
  name: "SetterIdentifier",
  pattern: /set_[a-zA-Z][a-zA-Z0-9_]*/,
});

export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z][a-zA-Z0-9_]*/,
});

export const GreaterThan = createToken({
  name: "GreaterThan",
  pattern: />/,
});

export const Colon = createToken({
  name: "Colon",
  pattern: /:/,
});

export const Comma = createToken({
  name: "Comma",
  pattern: /,/,
});

export const LeftParenthesis = createToken({
  name: "LeftParenthesis",
  pattern: /\(/,
});

export const RightParenthesis = createToken({
  name: "RightParenthesis",
  pattern: /\)/,
});
export const Plus = createToken({
  name: "Plus",
  pattern: /\+/,
});

export const Minus = createToken({
  name: "Minus",
  pattern: /-/,
});

export const ComponentKeyword = createToken({
  name: "ComponentKeyword",
  pattern: /component\b/,
});
export const WireframeKeyword = createToken({
  name: "WireframeKeyword",
  pattern: /wireframe\b/,
});

export const SliceKeyword = createToken({
  name: "SliceKeyword",
  pattern: /slice\b/,
});

export const VerticalKeyword = createToken({
  name: "VerticalKeyword",
  pattern: /vertical\b/,
});

export const HorizontalKeyword = createToken({
  name: "HorizontalKeyword",
  pattern: /horizontal\b/,
});

export const ColumnsKeyword = createToken({
  name: "ColumnsKeyword",
  pattern: /columns\b/,
});

export const RowsKeyword = createToken({
  name: "RowsKeyword",
  pattern: /rows\b/,
});

export const GridKeyword = createToken({
  name: "GridKeyword",
  pattern: /grid\b/,
});

export const CenteredKeyword = createToken({
  name: "CenteredKeyword",
  pattern: /centered\b/,
});

export const IslandKeyword = createToken({
  name: "IslandKeyword",
  pattern: /island\b/,
});

export const LayerKeyword = createToken({
  name: "LayerKeyword",
  pattern: /layer\b/,
});
export const ParametersKeyword = createToken({
  name: "ParametersKeyword",
  pattern: /parameters\b/,
});

export const StateKeyword = createToken({
  name: "StateKeyword",
  pattern: /state\b/,
});

export const Dot = createToken({
  name: "Dot",
  pattern: /\./,
});

export const LeftBracket = createToken({
  name: "LeftBracket",
  pattern: /\[/,
});

export const RightBracket = createToken({
  name: "RightBracket",
  pattern: /\]/,
});

export const allTokens: TokenType[] = [
  WhiteSpace,
  Comment,

  ComponentKeyword,
  WireframeKeyword,
  ParametersKeyword,
  StateKeyword,
  PageKeyword,

  SliceKeyword,
  VerticalKeyword,
  HorizontalKeyword,
  ColumnsKeyword,
  RowsKeyword,
  GridKeyword,
  CenteredKeyword,
  IslandKeyword,
  LayerKeyword,

  TrueKeyword,
  FalseKeyword,
  NoneKeyword,

  StringLiteral,

  GridSizeLiteral,
  SizeLiteral,
  NumberLiteral,

  StateIdentifier,
  SetterIdentifier,
  Identifier,

  GreaterThan,
  Colon,
  Comma,
  Dot,
  Plus,
  Minus,

  LeftParenthesis,
  RightParenthesis,
  LeftBracket,
  RightBracket,
];

export const paixLexer = new Lexer(allTokens);


