export const PAIX_STYLE_PROPERTIES = [
  "color",
  "background",
  "opacity",
  "border",
  "radius",
  "shadow",
  "outline",

  "font",
  "textSize",
  "textWeight",
  "textAlign",
  "lineHeight",
  "letterSpacing",

  "blur",
  "backdropBlur",
  "transform",
  "transition",
] as const;

export type PaixStylePropertyName =
  (typeof PAIX_STYLE_PROPERTIES)[number];

export const PAIX_GEOMETRY_PROPERTIES = [
  "display",
  "position",

  "width",
  "height",

  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",

  "grid",
  "gridArea",
  "gridColumn",
  "gridRow",

  "flex",
  "flexBasis",
  "flexDirection",
  "flexGrow",
  "flexShrink",

  "zIndex",

  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",

  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "contentPadding",

  "gap",
  "rowGap",
  "columnGap",

  "top",
  "right",
  "bottom",
  "left",
] as const;

const allowedPropertySet = new Set<string>(
  PAIX_STYLE_PROPERTIES,
);

const geometryPropertySet = new Set<string>(
  PAIX_GEOMETRY_PROPERTIES,
);

export function isPaixStyleProperty(
  property: string,
): property is PaixStylePropertyName {
  return allowedPropertySet.has(property);
}

export function isPaixGeometryProperty(
  property: string,
): boolean {
  return geometryPropertySet.has(property);
}