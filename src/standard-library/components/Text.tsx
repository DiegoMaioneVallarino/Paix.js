import type { PaixRuntimeProps } from "../../runtime/ComponentRegistry";

export function Text(props: PaixRuntimeProps) {
  const value = props.value ?? "";

  return (
    <span className="paix-text">
      <span className="paix-text-content">
        {String(value)}
      </span>
    </span>
  );
}
