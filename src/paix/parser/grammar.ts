import {
  CstParser,
  EOF,
} from "chevrotain";

import {
  allTokens,
  Colon,
  Comma,
  FalseKeyword,
  GreaterThan,
  Identifier,
  LeftParenthesis,
  NoneKeyword,
  NumberLiteral,
  PageKeyword,
  RightParenthesis,
  StateIdentifier,
  StringLiteral,
  TrueKeyword,
} from "../lexer/tokens";

export class PaixParser extends CstParser {
  public page = this.RULE("page", () => {
    this.CONSUME(PageKeyword);
    this.CONSUME(StringLiteral);
    this.CONSUME(Identifier, {
      LABEL: "wireframe",
    });

    this.MANY(() => {
      this.SUBRULE(this.placement);
    });

    this.CONSUME(EOF);
  });

  private placement = this.RULE("placement", () => {
    this.CONSUME(Identifier, {
      LABEL: "area",
    });

    this.CONSUME(GreaterThan);
    this.SUBRULE(this.componentCall);
  });

  private componentCall = this.RULE(
    "componentCall",
    () => {
      this.CONSUME(Identifier, {
        LABEL: "componentName",
      });

      this.CONSUME(LeftParenthesis);

      this.OPTION(() => {
        this.AT_LEAST_ONE_SEP({
          SEP: Comma,
          DEF: () => {
            this.SUBRULE(this.argument);
          },
        });
      });

      this.CONSUME(RightParenthesis);
    },
  );

  private argument = this.RULE("argument", () => {
    this.OR([
      {
        ALT: () =>
          this.CONSUME(StateIdentifier, {
            LABEL: "argumentName",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(Identifier, {
            LABEL: "argumentName",
          }),
      },
    ]);

    this.CONSUME(Colon);
    this.SUBRULE(this.value);
  });

  private value = this.RULE("value", () => {
    this.OR([
      {
        ALT: () => this.CONSUME(StringLiteral),
      },
      {
        ALT: () => this.CONSUME(NumberLiteral),
      },
      {
        ALT: () => this.CONSUME(TrueKeyword),
      },
      {
        ALT: () => this.CONSUME(FalseKeyword),
      },
      {
        ALT: () => this.CONSUME(NoneKeyword),
      },
      {
        ALT: () => this.CONSUME(StateIdentifier),
      },
      {
        ALT: () => this.CONSUME(Identifier),
      },
    ]);
  });

  public constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }
}

export const paixParser = new PaixParser();