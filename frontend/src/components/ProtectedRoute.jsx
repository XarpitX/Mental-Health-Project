import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function ProtectedRoute({ children, roles }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mc-bg text-mc-muted">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
