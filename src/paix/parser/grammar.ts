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
  Minus,
  NoneKeyword,
  NumberLiteral,
  PageKeyword,
  Plus,
  RightParenthesis,
  SetterIdentifier,
  StateIdentifier,
  StringLiteral,
  TrueKeyword,
  ComponentKeyword,
ParametersKeyword,
StateKeyword,
Dot,
LeftBracket,
RightBracket
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
public component = this.RULE("component", () => {
  this.CONSUME(ComponentKeyword);
  this.CONSUME(StringLiteral);

  this.CONSUME(Identifier, {
    LABEL: "wireframe",
  });

  this.OPTION(() => {
    this.SUBRULE(this.parameterSection);
  });

  this.OPTION2(() => {
    this.SUBRULE(this.stateSection);
  });

  this.MANY(() => {
    this.SUBRULE(this.placement);
  });

  this.CONSUME(EOF);
});

private parameterSection = this.RULE(
  "parameterSection",
  () => {
    this.CONSUME(ParametersKeyword);
    this.CONSUME(Colon);

    this.MANY({
      GATE: () =>
        this.LA(1).tokenType === Identifier &&
        this.LA(2).tokenType === Colon,

      DEF: () => {
        this.SUBRULE(this.parameterDeclaration);
      },
    });
  },
);

private parameterDeclaration = this.RULE(
  "parameterDeclaration",
  () => {
    this.CONSUME(Identifier, {
      LABEL: "parameterName",
    });

    this.CONSUME(Colon);
    this.SUBRULE(this.expression);
  },
);

private stateSection = this.RULE(
  "stateSection",
  () => {
    this.CONSUME(StateKeyword);
    this.CONSUME(Colon);

    this.MANY({
      GATE: () =>
        this.LA(1).tokenType === StateIdentifier &&
        this.LA(2).tokenType === Colon,

      DEF: () => {
        this.SUBRULE(this.stateDeclaration);
      },
    });
  },
);

private stateDeclaration = this.RULE(
  "stateDeclaration",
  () => {
    this.CONSUME(StateIdentifier, {
      LABEL: "stateName",
    });

    this.CONSUME(Colon);
    this.SUBRULE(this.expression);
  },
);


private placement = this.RULE("placement", () => {
  this.SUBRULE(this.areaReference);
  this.CONSUME(GreaterThan);

  this.OR([
    {
      ALT: () => this.SUBRULE(this.componentCall),
    },
    {
      ALT: () => this.SUBRULE(this.stack),
    },
  ]);
});

private areaReference = this.RULE(
  "areaReference",
  () => {
    this.CONSUME(Identifier, {
      LABEL: "segment",
    });

    this.MANY(() => {
      this.CONSUME(Dot);

      this.CONSUME2(Identifier, {
        LABEL: "segment",
      });
    });
  },
);

private stack = this.RULE("stack", () => {
  this.CONSUME(LeftBracket);

  this.OPTION(() => {
    this.AT_LEAST_ONE_SEP({
      SEP: Comma,

      DEF: () => {
        this.SUBRULE(this.componentCall);
      },
    });
  });

  this.CONSUME(RightBracket);
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
    this.SUBRULE(this.expression);
  });

  private expression = this.RULE(
    "expression",
    () => {
      this.SUBRULE(this.primary, {
        LABEL: "operand",
      });

      this.MANY(() => {
        this.OR([
          {
            ALT: () =>
              this.CONSUME(Plus, {
                LABEL: "operator",
              }),
          },
          {
            ALT: () =>
              this.CONSUME(Minus, {
                LABEL: "operator",
              }),
          },
        ]);

        this.SUBRULE2(this.primary, {
          LABEL: "operand",
        });
      });
    },
  );

  private primary = this.RULE("primary", () => {
    this.OR([
      {
        GATE: () =>
          (this.LA(1).tokenType === Identifier ||
            this.LA(1).tokenType ===
              SetterIdentifier) &&
          this.LA(2).tokenType === LeftParenthesis,

        ALT: () => this.SUBRULE(this.functionCall),
      },
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

  private functionCall = this.RULE(
    "functionCall",
    () => {
      this.OR([
        {
          ALT: () =>
            this.CONSUME(SetterIdentifier, {
              LABEL: "callee",
            }),
        },
        {
          ALT: () =>
            this.CONSUME(Identifier, {
              LABEL: "callee",
            }),
        },
      ]);

      this.CONSUME(LeftParenthesis);

      this.OPTION(() => {
        this.AT_LEAST_ONE_SEP({
          SEP: Comma,

          DEF: () => {
            this.SUBRULE(this.expression);
          },
        });
      });

      this.CONSUME(RightParenthesis);
    },
  );

  public constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }
}

export const paixParser = new PaixParser();