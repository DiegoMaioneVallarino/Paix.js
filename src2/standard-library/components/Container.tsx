import type {
  ReactNode,
} from "react";

import type {
  PaixRuntimeProps,
} from "../../runtime/ComponentRegistry";

interface ContainerProps
  extends PaixRuntimeProps {
  children?: ReactNode;
}

export function Container(
  props: ContainerProps,
) {
  const children = props.children;

  const className =
    typeof props.className === "string"
      ? props.className
      : "";

  return (
    <div
      className={[
        "paix-container",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}