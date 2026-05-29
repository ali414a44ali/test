import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (roles && !roles.includes(role)) return <Navigate to="/" />;
  return children;
}
