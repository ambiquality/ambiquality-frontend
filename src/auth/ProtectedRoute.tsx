import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Guards the operator (`/admin/*`) routes. In Phase 1 `useAuth` always reports
 * "not authenticated", so this currently redirects to `/login` and preserves the
 * attempted location for post-login return. Phase 4 wires the real auth state and
 * the login screen behind it.
 */
export function ProtectedRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
