import type {
  PaixRuntimeProps,
} from "../../runtime/ComponentRegistry";

export function Text(
  props: PaixRuntimeProps,
) {
  const value = props.value ?? "";

  const className =
    typeof props.className === "string"
      ? props.className
      : "";

  return (
    <span
      className={[
        "paix-text",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {String(value)}
    </span>
  );
}