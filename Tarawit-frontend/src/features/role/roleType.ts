import type { ComponentType } from "react";

export type RoleDef = {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
};

export type SystemRoleDef = {
  color: any;
  id: number;
  code: string;
  name: string;
  description: string;
  permissionCount: number;
  icon: ComponentType<{ color: string }>; // tailwind text/bg accent
  is_active: boolean;
  permission_ids?: number[];
};

export type PermissionDef = {
  id: number;
  code: string;
  name: string;
  module: string;
  description?: string;
  is_active?: boolean;
};

export type PersonType = {
  id: number;
  code: string;
  name_th: string;
};
