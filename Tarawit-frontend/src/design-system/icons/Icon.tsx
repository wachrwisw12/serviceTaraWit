import type { ReactNode } from "react";

export interface IconDefinition {
  node: ReactNode;
  viewBox?: string;
}

export default function SvgIcon({
  icon,
  className = "w-5 h-5",
}: {
  icon?: IconDefinition;
  className?: string;
}) {
  if (!icon) {
    return null;
  }

  return (
    <svg
      viewBox={icon.viewBox ?? "0 0 24 24"}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {icon.node}
    </svg>
  );
}
