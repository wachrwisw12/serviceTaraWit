import { useMemo } from "react";
import { useAppSelector } from "../hooks";
import type { PermissionType } from "./permission";
export function usePermission() {
  const user = useAppSelector((state) => state.auth.user);

  const roleSet = useMemo(
    () => new Set(user?.roles.map((r) => r.role_name) ?? []),
    [user],
  );

  const permissionSet = useMemo(
    () => new Set(user?.permissions.map((p) => p.permission_name) ?? []),
    [user],
  );

  const hasRole = (role: string) => roleSet.has(role);

  const hasPermission = (permission: PermissionType) =>
    permissionSet.has(permission);

  const hasAnyPermission = (...permissions: PermissionType[]) =>
    permissions.some((p) => permissionSet.has(p));

  const hasAllPermission = (...permissions: PermissionType[]) =>
    permissions.every((p) => permissionSet.has(p));

  return {
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermission,
  };
}
