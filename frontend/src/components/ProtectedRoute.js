import { Navigate } from "react-router-dom";
import { getSession } from "../services/session";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { token, team } = getSession();

  if (!token || !team) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !team.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
