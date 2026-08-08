import type { ComponentType } from "react";

export type IconProps = {
  fontSize?: "small" | "medium" | "large";
  className?: string;
};

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  permission?: string;
  icon?: ComponentType<IconProps>;
  children?: MenuItem[];
}
