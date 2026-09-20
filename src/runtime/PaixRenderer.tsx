import type { CSSProperties } from "react";

import type {
  PaixComponentDefinitionNode,
  PaixComponentNode,
  PaixPlacementNode,
} from "../paix/ast/ast.types";

import type { PaixCompiledProject } from "../paix/compiler/compiled.types";

import { registerStandardLibrary } from "../standard-library/registerStandardLibrary";

import {
  componentRegistry,
  type PaixRuntimeProps,
} from "./ComponentRegistry";

import {
  evaluateExpression,
  type PaixScope,
} from "./evaluateExpression";

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

  return (
    <div className="paix-page">
      {program.entryPage.placements.map(
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

interface PlacementContentProps {
  placement: PaixPlacementNode;
  program: PaixCompiledProject;
  scope: PaixScope;
  stack: string[];
}

function PlacementContent({
  placement,
  program,
  scope,
  stack,
}: PlacementContentProps) {
  if (placement.type === "Placement") {
    return (
      <RuntimeComponent
        component={placement.component}
        program={program}
        scope={scope}
        stack={stack}
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
}

function RuntimeComponent({
  component,
  program,
  scope,
  stack,
}: RuntimeComponentProps) {
  const NativeComponent =
    componentRegistry.get(component.name);

  const invocationValues = evaluateArguments(
    component,
    scope,
  );

  if (NativeComponent) {
    return (
      <NativeComponent
        {...(invocationValues as PaixRuntimeProps)}
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
      stack={[...stack, component.name]}
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
  const localScope: PaixScope = {};

  for (const parameter of definition.parameters) {
    localScope[parameter.name] = Object.hasOwn(
      suppliedValues,
      parameter.name,
    )
      ? suppliedValues[parameter.name]
      : evaluateExpression(
          parameter.defaultValue,
          localScope,
        );
  }

  for (const state of definition.states) {
    localScope[state.name] = Object.hasOwn(
      suppliedValues,
      state.name,
    )
      ? suppliedValues[state.name]
      : evaluateExpression(
          state.initialValue,
          localScope,
        );
  }

  return (
    <div
      className="paix-user-component"
      data-paix-component={definition.name}
      data-paix-wireframe={definition.wireframe}
    >
      {definition.placements.map(
        (placement, index) => {
          const areaName = getTargetAreaName(
            placement.target,
          );

          return (
            <div
              className={`paix-component-area paix-component-area-${normalizeAreaName(
                areaName,
              )}`}
              data-paix-area={
                placement.target.path
              }
              key={`${placement.target.path}-${index}`}
            >
              <PlacementContent
                placement={placement}
                program={program}
                scope={localScope}
                stack={stack}
              />
            </div>
          );
        },
      )}
    </div>
  );
}

function evaluateArguments(
  component: PaixComponentNode,
  scope: PaixScope,
): PaixScope {
  return Object.fromEntries(
    component.arguments.map((argument) => [
      argument.name,
      evaluateExpression(argument.value, scope),
    ]),
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