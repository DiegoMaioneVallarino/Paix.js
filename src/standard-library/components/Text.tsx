import type { PaixRuntimeProps } from "../../runtime/ComponentRegistry";

export function Text(props: PaixRuntimeProps) {
  const value = props.value ?? "";

  return (
    <span className="paix-text">
      {String(value)}
    </span>
  );
}