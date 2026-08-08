import type { ReactNode } from "react";
import type { PermissionType } from "./permission";
import { usePermission } from "./usePermission";

interface Props {
  permission: PermissionType;
  children: ReactNode;
}

export default function Can({ permission, children }: Props) {
  const { hasPermission } = usePermission();

  if (!hasPermission(permission)) {
    return null;
  }

  return <>{children}</>;
}
