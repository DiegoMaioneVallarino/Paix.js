import type {
  CSSProperties,
  ReactNode,
} from "react";

import type {
  PaixSliceNode,
  PaixWireframeNode,
} from "../paix/ast/ast.types";

interface WireframeRendererProps {
  wireframe: PaixWireframeNode;
  debug?: boolean;

  renderArea?: (
    areaName: string,
  ) => ReactNode;

  renderSlot?: (
    areaName: string,
    slotIndex: number,
  ) => ReactNode;
}

interface WireframeAreaProps {
  name: string;
  slices: Map<string, PaixSliceNode>;
  debug: boolean;
  ancestors: Set<string>;
  slot?: boolean;
  slotOwner?: string;
  slotIndex?: number;
  style?: CSSProperties;

  renderArea?: (
    areaName: string,
  ) => ReactNode;

  renderSlot?: (
    areaName: string,
    slotIndex: number,
  ) => ReactNode;
}

export function WireframeRenderer({
  wireframe,
  debug = false,
  renderArea,
  renderSlot,
}: WireframeRendererProps) {
  const slices = new Map(
    wireframe.slices.map((slice) => [
      slice.target.path,
      slice,
    ]),
  );

  return (
    <div
  className={`paix-wireframe ${
    debug
      ? "paix-wireframe-debug"
      : "paix-wireframe-runtime"
  }`}
  data-paix-wireframe={wireframe.name}
>
      <WireframeArea
        name="main"
        slices={slices}
        debug={debug}
        ancestors={new Set()}
        renderArea={renderArea}
        renderSlot={renderSlot}
      />
    </div>
  );
}

function WireframeArea({
  name,
  slices,
  debug,
  ancestors,
  slot = false,
  slotOwner,
  slotIndex,
  style,
  renderArea,
  renderSlot,
}: WireframeAreaProps) {
  if (ancestors.has(name)) {
    return (
      <div className="paix-wireframe-error">
        Circular slice: {name}
      </div>
    );
  }

  const slice = slices.get(name);

  if (!slice) {
    const content =
      slot && slotOwner
        ? renderSlot?.(
            slotOwner,
            slotIndex ?? 0,
          )
        : renderArea?.(name);

    return (
      <div
        className={`paix-wireframe-area ${
          slot ? "paix-wireframe-slot" : ""
        }`}
        style={style}
        data-paix-area={
          slot ? undefined : name
        }
        data-paix-slot={
          slot && slotOwner
            ? `${slotOwner}:${slotIndex ?? 0}`
            : undefined
        }
      >
        {debug && (
          <AreaLabel
            name={name}
            slot={slot}
            slotIndex={slotIndex}
          />
        )}

        <div className="paix-wireframe-content">
          {content}
        </div>
      </div>
    );
  }

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(name);

  if (slice.mode === "island") {
    const childName =
      slice.areas[0] ?? `${name}.island`;

    const childIsSlot =
      slice.areas.length === 0;

    return (
      <div
        className="paix-wireframe-area"
        style={style}
        data-paix-area={name}
      >
        {debug && <AreaLabel name={name} />}

        <WireframeArea
          name={childName}
          slices={slices}
          debug={debug}
          ancestors={nextAncestors}
          slot={childIsSlot}
          slotOwner={
            childIsSlot
              ? slice.target.path
              : undefined
          }
          slotIndex={0}
          renderArea={renderArea}
          renderSlot={renderSlot}
          style={{
            position: "absolute",
            inset: sizeToCss(slice.size),
          }}
        />
      </div>
    );
  }

  if (slice.mode === "layer") {
    const children = createChildNames(slice);

    return (
      <div
        className="paix-wireframe-area"
        style={style}
        data-paix-area={name}
      >
        {debug && <AreaLabel name={name} />}

        {debug && (
          <div className="paix-layer-legend">
            {children.map((child, index) => (
              <span key={child.name}>
                {index}: {child.name}
              </span>
            ))}
          </div>
        )}

        {children.map((child, index) => (
          <WireframeArea
            key={`${child.name}-${index}`}
            name={child.name}
            slices={slices}
            debug={debug}
            ancestors={nextAncestors}
            slot={child.slot}
            slotOwner={
              child.slot
                ? slice.target.path
                : undefined
            }
            slotIndex={index}
            renderArea={renderArea}
            renderSlot={renderSlot}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: index,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="paix-wireframe-area"
      style={{
        ...getSliceStyle(slice),
        ...style,
      }}
      data-paix-area={name}
    >
      {debug && <AreaLabel name={name} />}

      {createChildNames(slice).map(
        (child, index) => (
          <WireframeArea
            key={`${child.name}-${index}`}
            name={child.name}
            slices={slices}
            debug={debug}
            ancestors={nextAncestors}
            slot={child.slot}
            slotOwner={
              child.slot
                ? slice.target.path
                : undefined
            }
            slotIndex={index}
            renderArea={renderArea}
            renderSlot={renderSlot}
          />
        ),
      )}
    </div>
  );
}

function AreaLabel({
  name,
  slot = false,
  slotIndex,
}: {
  name: string;
  slot?: boolean;
  slotIndex?: number;
}) {
  return (
    <span className="paix-wireframe-label">
      {slot
        ? `slot ${(slotIndex ?? 0) + 1}`
        : name}
    </span>
  );
}

function createChildNames(
  slice: PaixSliceNode,
): Array<{
  name: string;
  slot: boolean;
}> {
  const count = getSliceChildCount(slice);

  return Array.from(
    { length: count },
    (_, index) => {
      const declaredName =
        slice.areas[index];

      return {
        name:
          declaredName ??
          `${slice.target.path}.slot-${
            index + 1
          }`,

        slot: !declaredName,
      };
    },
  );
}

function getSliceChildCount(
  slice: PaixSliceNode,
): number {
  switch (slice.mode) {
    case "vertical":
    case "horizontal":
      return 2;

    case "vertical-centered":
    case "horizontal-centered":
      return 3;

    case "island":
      return 1;

    case "columns":
    case "rows":
    case "layer":
      return slice.count;

    case "grid":
      return slice.columns * slice.rows;
  }
}

function getSliceStyle(
  slice: PaixSliceNode,
): CSSProperties {
  switch (slice.mode) {
    case "vertical":
      return {
        display: "grid",

        gridTemplateColumns: `${sizeToCss(
          slice.size,
        )} minmax(0, 1fr)`,
      };

    case "horizontal":
      return {
        display: "grid",

        gridTemplateRows: `${sizeToCss(
          slice.size,
        )} minmax(0, 1fr)`,
      };

    case "vertical-centered":
      return {
        display: "grid",

        gridTemplateColumns:
          `minmax(0, 1fr) ` +
          `${sizeToCss(slice.size)} ` +
          `minmax(0, 1fr)`,
      };

    case "horizontal-centered":
      return {
        display: "grid",

        gridTemplateRows:
          `minmax(0, 1fr) ` +
          `${sizeToCss(slice.size)} ` +
          `minmax(0, 1fr)`,
      };

    case "columns":
      return {
        display: "grid",

        gridTemplateColumns:
          `repeat(${slice.count}, ` +
          `minmax(0, 1fr))`,
      };

    case "rows":
      return {
        display: "grid",

        gridTemplateRows:
          `repeat(${slice.count}, ` +
          `minmax(0, 1fr))`,
      };

    case "grid":
      return {
        display: "grid",

        gridTemplateColumns:
          `repeat(${slice.columns}, ` +
          `minmax(0, 1fr))`,

        gridTemplateRows:
          `repeat(${slice.rows}, ` +
          `minmax(0, 1fr))`,
      };

    case "island":
    case "layer":
      return {};
  }
}

function sizeToCss(
  size: {
    value: number;
    unit: "px" | "percent";
  },
): string {
  return size.unit === "percent"
    ? `${size.value}%`
    : `${size.value}px`;
}