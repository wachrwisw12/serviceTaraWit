import type { Permission } from "../features/auth/authType";
import type { MenuItem } from "../types/menu";

export function filterPagesByPermission(
  pages: MenuItem[],
  permissions: Permission[] = [],
): MenuItem[] {
  const permissionSet = new Set(permissions.map((p) => p.permission_name));

  const filter = (items: MenuItem[]): MenuItem[] => {
    return items
      .map((item) => {
        const children = item.children ? filter(item.children) : undefined;

        const hasPermission =
          !item.permission || permissionSet.has(item.permission);

        // มีลูกที่ผ่าน
        if (children && children.length > 0) {
          return {
            ...item,
            children,
          };
        }

        // เมนูเดี่ยว
        if (hasPermission) {
          return {
            ...item,
            children,
          };
        }

        return null;
      })
      .filter(Boolean) as MenuItem[];
  };

  return filter(pages);
}
