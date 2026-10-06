import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

export default function AuthRoute() {
  const { status, loading } = useAppSelector((s) => s.auth);

  if (loading) return null;

  // ❌ ยังไม่ login
  if (status !== "authenticated") {
    return <Outlet />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ ผ่าน
}
