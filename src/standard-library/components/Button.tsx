import type {
  MouseEventHandler,
} from "react";

import type {
  PaixRuntimeProps,
} from "../../runtime/ComponentRegistry";

export function Button(
  props: PaixRuntimeProps,
) {
  const label =
    props.label ?? "Button";

  const disabled =
    props.disabled === true;

  const onClick =
    typeof props.onClick === "function"
      ? (
          props.onClick as
            MouseEventHandler<HTMLButtonElement>
        )
      : undefined;

  return (
    <button
      type="button"
      className="paix-button"
      disabled={disabled}
      onClick={onClick}
    >
      {String(label)}
    </button>
  );
}