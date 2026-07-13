import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Redirects unauthenticated users to /login */
export function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/** Redirects already-authenticated users away from auth pages */
export function PublicRoute({ children }) {
  const { isAuthenticated, isDuenio } = useAuth();
  if (!isAuthenticated) return children;
  return <Navigate to={isDuenio ? '/mi-complejo' : '/'} replace />;
}
