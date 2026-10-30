import type { PaixRuntimeProps } from "../../runtime/ComponentRegistry";

export function Text(props: PaixRuntimeProps) {
  const value = props.value ?? "";

  return (
    <span className={["paix-text", typeof props.className === "string" ? props.className : ""].filter(Boolean).join(" ")}>
      <span className="paix-text-content">
        {String(value)}
      </span>
    </span>
  );
}
