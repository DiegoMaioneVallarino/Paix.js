import type { ReactNode } from "react";
import type { PaixRuntimeProps } from "../../runtime/ComponentRegistry";

interface ContainerProps extends PaixRuntimeProps {
  children?: ReactNode;
}

export function Container({
  children,
}: ContainerProps) {
  return (
    <div className="paix-container">
      {children}
    </div>
  );
}