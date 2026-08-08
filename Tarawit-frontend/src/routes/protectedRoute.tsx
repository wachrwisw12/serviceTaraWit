import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

type Props = {
  allowRoles?: number[];
};

export default function ProtectedRoute({ allowRoles }: Props) {
  const { status, user } = useAppSelector((s) => s.auth);

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  if (allowRoles && user && !allowRoles.includes(user.id)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
