import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div style={{ height: '100vh', background: 'var(--bg-base)' }}></div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}
