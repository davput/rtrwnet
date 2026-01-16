import { Navigate } from 'react-router-dom';
import { authStore } from '@/features/auth/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Simple sync check - just check if token exists
  const isAuthenticated = authStore.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
