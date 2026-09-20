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
  ParametersKeyword,
  StateKeyword,
  PageKeyword,

  TrueKeyword,
  FalseKeyword,
  NoneKeyword,

  StringLiteral,
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

