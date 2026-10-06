import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

type Props = {
  /** ถ้ากำหนด ผู้ใช้ต้องมี role ใด role หนึ่งในรายการ (OR) ถึงจะผ่าน */
  allowRoles?: string[];
};

export default function ProtectedRoute({ allowRoles }: Props) {
  const { status, user } = useAppSelector((s) => s.auth);

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  if (allowRoles && user) {
    const userRoles = new Set(user.roles.map((r) => r.role_name));
    const allowed = allowRoles.some((r) => userRoles.has(r));

    if (!allowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
}
