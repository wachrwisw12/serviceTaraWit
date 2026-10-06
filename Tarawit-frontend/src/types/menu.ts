import type { ComponentType } from "react";
import type { PermissionType } from "../store/hooks/permission";

export type IconProps = {
  fontSize?: "small" | "medium" | "large";
  className?: string;
};

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  permission?: PermissionType;
  module?: string;
  icon?: ComponentType<IconProps>;
  children?: MenuItem[];
}
