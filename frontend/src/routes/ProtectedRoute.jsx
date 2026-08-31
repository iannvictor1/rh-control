import { Navigate } from "react-router-dom";
import { clearSession, isTokenValid } from "../services/utils/auth";

export default function ProtectedRoute({ children }) {
  if (!isTokenValid()) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  return children;
}
