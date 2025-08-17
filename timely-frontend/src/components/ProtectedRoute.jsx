import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function ProtectedRoute() {
  const { authed, checking } = useAuth();
  const loc = useLocation();

  if (checking) return <div className="p-6">Checking auth…</div>;
  if (!authed) return <Navigate to="/login" replace state={{ from: loc }} />;

  return <Outlet />;
}
