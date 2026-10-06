import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import type { PermissionType } from "../store/hooks/permission";

type Props = {
  /** ต้องมี permission อย่างน้อยหนึ่งตัวในรายการ (OR) ถึงจะเข้าถึงได้ */
  permissions?: PermissionType[];
};

/**
 * Guard ระดับ route — ตรวจทั้งการ login และ permission
 * ถ้าไม่ได้ login → ไป /login
 * ถ้า login แล้วแต่ไม่มีสิทธิ์ → ไป /unauthorized (403)
 */
export default function PermissionRoute({ permissions }: Props) {
  const { status, user } = useAppSelector((s) => s.auth);

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  if (permissions && permissions.length > 0) {
    const userPermissions = new Set(
      user?.permissions.map((p) => p.permission_name) ?? [],
    );
    const allowed = permissions.some((p) => userPermissions.has(p));

    if (!allowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
}
