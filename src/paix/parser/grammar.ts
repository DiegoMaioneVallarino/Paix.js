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
RightBracket,
WireframeKeyword,
SliceKeyword,
VerticalKeyword,
HorizontalKeyword,
ColumnsKeyword,
RowsKeyword,
GridKeyword,
CenteredKeyword,
IslandKeyword,
LayerKeyword,
GridSizeLiteral,
SizeLiteral,
ThisKeyword,
OtherwiseKeyword,
StyleKeyword,
WhenKeyword,
HexColorLiteral,
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

public wireframe = this.RULE("wireframe", () => {
  this.CONSUME(WireframeKeyword);
  this.CONSUME(StringLiteral);

  this.MANY(() => {
    this.SUBRULE(this.sliceDeclaration);
  });

  this.CONSUME(EOF);
});
private componentStyleSection = this.RULE(
  "componentStyleSection",
  () => {
    this.CONSUME(StyleKeyword);
    this.CONSUME(Colon);

    this.CONSUME(Identifier, {
      LABEL: "styleName",
    });
  },
);
private isStyleDeclarationAhead(): boolean {
  const currentType =
    this.LA(1).tokenType;

  const nextType =
    this.LA(2).tokenType;

  const isPropertyName =
    currentType === Identifier ||
    currentType === GridKeyword;

  return (
    isPropertyName &&
    nextType === Colon
  );
}

private isStyleValueAhead(): boolean {
  const currentType =
    this.LA(1).tokenType;

  if (
    currentType === EOF ||
    currentType === WhenKeyword
  ) {
    return false;
  }

  return !this.isStyleDeclarationAhead();
}

private styleDeclaration = this.RULE(
  "styleDeclaration",
  () => {
    this.OR([
      {
        ALT: () =>
          this.CONSUME(Identifier, {
            LABEL: "propertyName",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(GridKeyword, {
            LABEL: "propertyName",
          }),
      },
    ]);

    this.CONSUME(Colon);

    this.AT_LEAST_ONE({
      GATE: () =>
        this.isStyleValueAhead(),

      DEF: () => {
        this.SUBRULE(this.styleValueAtom);
      },
    });
  },
);

private styleCondition = this.RULE(
  "styleCondition",
  () => {
    this.CONSUME(WhenKeyword);

    this.SUBRULE(this.expression, {
      LABEL: "condition",
    });

    this.CONSUME(Colon);

    this.AT_LEAST_ONE({
      GATE: () =>
        this.isStyleDeclarationAhead(),

      DEF: () => {
        this.SUBRULE(this.styleDeclaration);
      },
    });
  },
);

private styleValueAtom = this.RULE(
  "styleValueAtom",
  () => {
    this.OR([
      {
        ALT: () =>
          this.CONSUME(Identifier, {
            LABEL: "valueToken",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(StringLiteral, {
            LABEL: "valueToken",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(HexColorLiteral, {
            LABEL: "valueToken",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(SizeLiteral, {
            LABEL: "valueToken",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(NumberLiteral, {
            LABEL: "valueToken",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(TrueKeyword, {
            LABEL: "valueToken",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(FalseKeyword, {
            LABEL: "valueToken",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(NoneKeyword, {
            LABEL: "valueToken",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(Minus, {
            LABEL: "valueToken",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(Comma, {
            LABEL: "valueToken",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(LeftParenthesis, {
            LABEL: "valueToken",
          }),
      },
      {
        ALT: () =>
          this.CONSUME(RightParenthesis, {
            LABEL: "valueToken",
          }),
      },
    ]);
  },
);

public component = this.RULE("component", () => {
  this.CONSUME(ComponentKeyword);
  this.CONSUME(StringLiteral);

  this.CONSUME(Identifier, {
    LABEL: "wireframe",
  });

  this.OPTION(() => {
    this.SUBRULE(this.componentStyleSection);
  });

  this.OPTION2(() => {
    this.SUBRULE(this.parameterSection);
  });

  this.OPTION3(() => {
    this.SUBRULE(this.stateSection);
  });

  this.MANY(() => {
    this.SUBRULE(this.placement);
  });

  this.CONSUME(EOF);
});

public style = this.RULE("style", () => {
  this.CONSUME(StyleKeyword);
  this.CONSUME(StringLiteral);

  this.MANY(() => {
    this.SUBRULE(this.styleDeclaration);
  });

  this.MANY2(() => {
    this.SUBRULE(this.styleCondition);
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
private inputReference = this.RULE(
  "inputReference",
  () => {
    this.CONSUME(ThisKeyword);
    this.CONSUME(Dot);

    this.CONSUME(Identifier, {
      LABEL: "inputName",
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

private sliceDeclaration = this.RULE(
  "sliceDeclaration",
  () => {
    this.SUBRULE(this.areaReference, {
      LABEL: "target",
    });

    this.CONSUME(SliceKeyword);

    this.OR([
      {
        ALT: () => {
          this.CONSUME(VerticalKeyword);

          this.OPTION(() => {
            this.CONSUME(CenteredKeyword);
          });

          this.SUBRULE(this.sizeValue);
        },
      },
      {
        ALT: () => {
          this.CONSUME(HorizontalKeyword);

          this.OPTION2(() => {
            this.CONSUME2(CenteredKeyword);
          });

          this.SUBRULE2(this.sizeValue);
        },
      },
      {
        ALT: () => {
          this.CONSUME(ColumnsKeyword);

          this.CONSUME(NumberLiteral, {
            LABEL: "count",
          });
        },
      },
      {
        ALT: () => {
          this.CONSUME(RowsKeyword);

          this.CONSUME2(NumberLiteral, {
            LABEL: "count",
          });
        },
      },
      {
        ALT: () => {
          this.CONSUME(GridKeyword);
          this.CONSUME(GridSizeLiteral);
        },
      },
      {
        ALT: () => {
          this.CONSUME(IslandKeyword);
          this.SUBRULE3(this.sizeValue);
        },
      },
      {
        ALT: () => {
          this.CONSUME(LayerKeyword);

          this.CONSUME3(NumberLiteral, {
            LABEL: "count",
          });
        },
      },
    ]);

    this.OPTION3(() => {
      this.CONSUME(GreaterThan);

      this.AT_LEAST_ONE(() => {
        this.CONSUME(StringLiteral, {
          LABEL: "areaName",
        });
      });
    });
  },
);



private sizeValue = this.RULE("sizeValue", () => {
  this.OR([
    {
      ALT: () => this.CONSUME(SizeLiteral),
    },
    {
      ALT: () => this.CONSUME(NumberLiteral),
    },
  ]);
});
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

    this.OPTION(() => {
      this.CONSUME(OtherwiseKeyword);

      this.SUBRULE(this.expression, {
        LABEL: "fallback",
      });
    });
  },
);


private primary = this.RULE("primary", () => {
  this.OR([
    {
      ALT: () =>
        this.SUBRULE(this.inputReference),
    },
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