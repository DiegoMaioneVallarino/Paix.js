import type {
  PaixFileType,
} from "../../project/project.types";

interface FileTypeIconProps {
  type: PaixFileType;
}

const iconByType: Partial<
  Record<PaixFileType, string>
> = {
  page: "/icons/page.png",
  component: "/icons/component.png",
  wireframe: "/icons/wireframe.png",
  style: "/icons/style.png",
};

export function FileTypeIcon({
  type,
}: FileTypeIconProps) {
  const icon = iconByType[type];

  if (!icon) {
    return (
      <span className="paix-file-icon">
        P
      </span>
    );
  }

  return (
    <img
      className="paix-file-type-icon"
      src={icon}
      alt=""
      draggable={false}
    />
  );
}