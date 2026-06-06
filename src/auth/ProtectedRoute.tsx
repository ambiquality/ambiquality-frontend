import type { PropsWithChildren } from 'react';
import { Center, Spinner } from '@chakra-ui/react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';

/**
 * Guards the operator (`/operator/*`) routes. Phase 4 wires the real auth state:
 *  - while the session is being restored on boot (`isLoading`) we show a centered spinner so the
 *    user isn't bounced to `/login` before the silent refresh resolves,
 *  - when unauthenticated we redirect to `/login`, preserving the attempted location in router
 *    state (`from`) so the login screen can return the user there post-login.
 *
 * Works both as a wrapper (`<ProtectedRoute><Page/></ProtectedRoute>`) and as a layout route
 * (`<ProtectedRoute/>` with nested `children`) — in the latter case it renders an `<Outlet/>`.
 */
export function ProtectedRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation('account');

  if (isLoading) {
    return (
      <Center py="16">
        <Spinner aria-label={t('loading')} />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children ?? <Outlet />}</>;
}
