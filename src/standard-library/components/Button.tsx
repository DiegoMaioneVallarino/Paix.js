import type { PaixRuntimeProps } from "../../runtime/ComponentRegistry";

export function Button(props: PaixRuntimeProps) {
  const label = props.label ?? "Button";
  const disabled = props.disabled === true;

  return (
    <button
      type="button"
      className="paix-button"
      disabled={disabled}
    >
      {String(label)}
    </button>
  );
}