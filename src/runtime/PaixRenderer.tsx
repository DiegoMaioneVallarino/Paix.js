import type {
  PaixComponentNode,
  PaixPageNode,
} from "../paix/ast/ast.types";

import { registerStandardLibrary } from "../standard-library/registerStandardLibrary";
import {
  componentRegistry,
  type PaixRuntimeProps,
} from "./ComponentRegistry";

registerStandardLibrary();

interface PaixRendererProps {
  ast: PaixPageNode | null;
}

export function PaixRenderer({
  ast,
}: PaixRendererProps) {
  if (!ast) {
    return (
      <div className="paix-runtime-empty">
        The preview is unavailable because the page contains
        errors.
      </div>
    );
  }

  return (
    <div className="paix-page">
      {ast.placements.map((placement, index) => (
        <section
          className={`paix-area paix-area-${normalizeAreaName(
            placement.area,
          )}`}
          data-paix-area={placement.area}
          key={`${placement.area}-${index}`}
        >
          <RuntimeComponent
            component={placement.component}
          />
        </section>
      ))}
    </div>
  );
}

interface RuntimeComponentProps {
  component: PaixComponentNode;
}

function RuntimeComponent({
  component,
}: RuntimeComponentProps) {
  const Component = componentRegistry.get(component.name);

  const props = Object.fromEntries(
    component.arguments.map((argument) => [
      argument.name,
      argument.value,
    ]),
  ) as PaixRuntimeProps;

  if (!Component) {
    return (
      <div className="paix-unknown-component">
        <strong>{component.name}</strong>
        <span>Unknown component</span>
      </div>
    );
  }

  return <Component {...props} />;
}

function normalizeAreaName(area: string): string {
  return area
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
}