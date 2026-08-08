import type { Permission } from "../features/auth/authType";
import type { MenuItem } from "../types/menu";

export function filterPagesByPermission(
  pages: MenuItem[],
  permissions: Permission[] = [],
): MenuItem[] {
  const permissionList = permissions.map((p) => p.permission_name);

  return pages
    .map((page) => {
      const children = page.children?.filter(
        (child) =>
          !child.permission || permissionList.includes(child.permission),
      );

      return {
        ...page,
        children,
      };
    })
    .filter((page) => {
      if (!page.permission) {
        return true;
      }

      return (
        permissionList.includes(page.permission) ||
        (page.children && page.children.length > 0)
      );
    });
}
