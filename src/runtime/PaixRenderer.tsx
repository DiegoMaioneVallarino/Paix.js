import type {
  CSSProperties,
} from "react";

import type {
  PaixComponentDefinitionNode,
  PaixComponentNode,
  PaixPlacementNode,
  PaixWireframeNode,
} from "../paix/ast/ast.types";

import type {
  PaixCompiledProject,
} from "../paix/compiler/compiled.types";

import {
  registerStandardLibrary,
} from "../standard-library/registerStandardLibrary";

import {
  componentRegistry,
  type PaixRuntimeProps,
} from "./ComponentRegistry";

import {
  evaluateExpression,
  PAIX_INPUTS_SCOPE_KEY,
  type PaixScope,
} from "./evaluateExpression";

import {
  isPaixEventArgument,
  resolvePaixEvent,
} from "./EventRuntime";

import {
  usePaixState,
  type PaixStateSetter,
} from "./StateRuntime";

import {
  WireframeRenderer,
} from "./WireframeRenderer";

registerStandardLibrary();

interface PaixRendererProps {
  program: PaixCompiledProject;
}

export function PaixRenderer({
  program,
}: PaixRendererProps) {
  if (!program.entryPage) {
    return (
      <div className="paix-runtime-empty">
        The project could not be compiled.
      </div>
    );
  }

  const page = program.entryPage;

  const wireframe =
    program.wireframes[page.wireframe];

  if (wireframe) {
    return (
      <div className="paix-page">
        <ScopedWireframe
          wireframe={wireframe}
          placements={page.placements}
          program={program}
          scope={{}}
          stack={[]}
        />
      </div>
    );
  }

  return (
    <div className="paix-page">
      {page.placements.map(
        (placement, index) => (
          <PagePlacement
            key={`${placement.target.path}-${index}`}
            placement={placement}
            program={program}
          />
        ),
      )}
    </div>
  );
}

interface PagePlacementProps {
  placement: PaixPlacementNode;
  program: PaixCompiledProject;
}

function PagePlacement({
  placement,
  program,
}: PagePlacementProps) {
  const areaName = getTargetAreaName(
    placement.target,
  );

  return (
    <section
      className={`paix-area paix-area-${normalizeAreaName(
        areaName,
      )}`}
      data-paix-area={placement.target.path}
    >
      <PlacementContent
        placement={placement}
        program={program}
        scope={{}}
        stack={[]}
      />
    </section>
  );
}

interface ScopedWireframeProps {
  wireframe: PaixWireframeNode;
  placements: PaixPlacementNode[];
  program: PaixCompiledProject;
  scope: PaixScope;
  stack: string[];
  setState?: PaixStateSetter;
}

function ScopedWireframe({
  wireframe,
  placements,
  program,
  scope,
  stack,
  setState,
}: ScopedWireframeProps) {
  const renderArea = (
    areaName: string,
  ) => {
    const areaPlacements = placements.filter(
      (placement) =>
        !placement.target.slots &&
        getTargetAreaName(
          placement.target,
        ) === areaName,
    );

    return areaPlacements.map(
      (placement, index) => (
        <PlacementContent
          key={`${placement.target.path}-${index}`}
          placement={placement}
          program={program}
          scope={scope}
          stack={stack}
          setState={setState}
        />
      ),
    );
  };

  const renderSlot = (
    areaName: string,
    slotIndex: number,
  ) => {
    const placement = placements.find(
      (candidate) =>
        candidate.type ===
          "StackPlacement" &&
        candidate.target.slots &&
        getTargetAreaName(
          candidate.target,
        ) === areaName,
    );

    if (
      !placement ||
      placement.type !== "StackPlacement"
    ) {
      return null;
    }

    const component =
      placement.stack.items[slotIndex];

    if (!component) {
      return null;
    }

    return (
      <RuntimeComponent
        component={component}
        program={program}
        scope={scope}
        stack={stack}
        setState={setState}
      />
    );
  };

  return (
    <WireframeRenderer
      wireframe={wireframe}
      renderArea={renderArea}
      renderSlot={renderSlot}
    />
  );
}

interface PlacementContentProps {
  placement: PaixPlacementNode;
  program: PaixCompiledProject;
  scope: PaixScope;
  stack: string[];
  setState?: PaixStateSetter;
}

function PlacementContent({
  placement,
  program,
  scope,
  stack,
  setState,
}: PlacementContentProps) {
  if (placement.type === "Placement") {
    return (
      <RuntimeComponent
        component={placement.component}
        program={program}
        scope={scope}
        stack={stack}
        setState={setState}
      />
    );
  }

  const slotCount = Math.max(
    placement.stack.items.length,
    1,
  );

  const style = {
    "--paix-slot-count": slotCount,
  } as CSSProperties;

  return (
    <div
      className={`paix-stack ${
        placement.target.slots
          ? "paix-slots-stack"
          : ""
      }`}
      style={style}
      data-paix-stack-target={
        placement.target.path
      }
    >
      {placement.stack.items.map(
        (component, index) => (
          <div
            className="paix-stack-item"
            key={`${component.name}-${index}`}
          >
            <RuntimeComponent
              component={component}
              program={program}
              scope={scope}
              stack={stack}
              setState={setState}
            />
          </div>
        ),
      )}
    </div>
  );
}

interface RuntimeComponentProps {
  component: PaixComponentNode;
  program: PaixCompiledProject;
  scope: PaixScope;
  stack: string[];
  setState?: PaixStateSetter;
}

function RuntimeComponent({
  component,
  program,
  scope,
  stack,
  setState,
}: RuntimeComponentProps) {
  const NativeComponent =
    componentRegistry.get(component.name);

  const invocationValues = evaluateArguments(
    component,
    scope,
    setState,
  );

  if (NativeComponent) {
    return (
      <NativeComponent
        {...(
          invocationValues as PaixRuntimeProps
        )}
      />
    );
  }

  const definition =
    program.components[component.name];

  if (!definition) {
    return (
      <UnknownComponent
        name={component.name}
      />
    );
  }

  if (stack.includes(component.name)) {
    return (
      <div className="paix-runtime-error">
        Recursive component detected:{" "}
        {component.name}
      </div>
    );
  }

  return (
    <UserDefinedComponent
      definition={definition}
      suppliedValues={invocationValues}
      program={program}
      stack={[
        ...stack,
        component.name,
      ]}
    />
  );
}

interface UserDefinedComponentProps {
  definition: PaixComponentDefinitionNode;
  suppliedValues: PaixScope;
  program: PaixCompiledProject;
  stack: string[];
}

function UserDefinedComponent({
  definition,
  suppliedValues,
  program,
  stack,
}: UserDefinedComponentProps) {
  const resolvedInputs =
    resolveComponentInputs(
      definition,
      suppliedValues,
    );

  const initialScope: PaixScope = {
    ...resolvedInputs,

    [PAIX_INPUTS_SCOPE_KEY]:
      resolvedInputs,
  };

  const {
    values: stateValues,
    setValue: setState,
  } = usePaixState(
    definition.states,
    initialScope,
  );

  const localScope: PaixScope = {
    ...resolvedInputs,
    ...stateValues,

    [PAIX_INPUTS_SCOPE_KEY]:
      resolvedInputs,
  };

  const wireframe =
    program.wireframes[
      definition.wireframe
    ];

  if (!wireframe) {
    return (
      <div className="paix-runtime-error">
        Component {definition.name} requires
        unknown wireframe{" "}
        {definition.wireframe}.
      </div>
    );
  }

  return (
    <div
      className="paix-user-component"
      data-paix-component={
        definition.name
      }
      data-paix-wireframe={
        definition.wireframe
      }
    >
      <ScopedWireframe
        wireframe={wireframe}
        placements={
          definition.placements
        }
        program={program}
        scope={localScope}
        stack={stack}
        setState={setState}
      />
    </div>
  );
}

function resolveComponentInputs(
  definition: PaixComponentDefinitionNode,
  suppliedValues: PaixScope,
): PaixScope {
  const resolvedInputs: PaixScope = {
    ...suppliedValues,
  };

  const inputScope: PaixScope = {
    ...resolvedInputs,

    [PAIX_INPUTS_SCOPE_KEY]:
      resolvedInputs,
  };

  // Compatibilidad temporal con
  // el antiguo bloque parameters:
  for (
    const parameter of
    definition.parameters
  ) {
    if (
      !Object.hasOwn(
        resolvedInputs,
        parameter.name,
      )
    ) {
      resolvedInputs[parameter.name] =
        evaluateExpression(
          parameter.defaultValue,
          inputScope,
        );
    }

    inputScope[parameter.name] =
      resolvedInputs[parameter.name];
  }

  return resolvedInputs;
}

function evaluateArguments(
  component: PaixComponentNode,
  scope: PaixScope,
  setState?: PaixStateSetter,
): PaixScope {
  return Object.fromEntries(
    component.arguments.map((argument) => {
      if (
        isPaixEventArgument(
          argument.name,
        )
      ) {
        return [
          argument.name,

          resolvePaixEvent(
            argument.value,
            {
              scope,
              setState,
            },
          ),
        ];
      }

      return [
        argument.name,
        evaluateExpression(
          argument.value,
          scope,
        ),
      ];
    }),
  );
}

function getTargetAreaName(
  target: PaixPlacementNode["target"],
): string {
  const areaSegments = target.slots
    ? target.segments.slice(0, -1)
    : target.segments;

  return (
    areaSegments[
      areaSegments.length - 1
    ] ?? "area"
  );
}

function UnknownComponent({
  name,
}: {
  name: string;
}) {
  return (
    <div className="paix-unknown-component">
      <strong>{name}</strong>
      <span>Unknown component</span>
    </div>
  );
}

function normalizeAreaName(
  area: string,
): string {
  return area
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
}