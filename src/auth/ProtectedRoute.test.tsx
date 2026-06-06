import { describe, expect, it, vi, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import type { AuthContextValue } from './auth-context';
import { ProtectedRoute } from './ProtectedRoute';

// Mock the hook so each test pins a precise auth state without standing up AuthProvider/network.
const useAuthMock = vi.fn<() => Partial<AuthContextValue>>();
vi.mock('./useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

/** Reads the location the login screen received so we can assert the preserved `from`. */
function LoginProbe() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  return <div>login-screen:{from ?? 'none'}</div>;
}

function renderGuarded(initialPath: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginProbe />} />
      <Route path="/operator" element={<ProtectedRoute />}>
        <Route index element={<div>admin-home</div>} />
      </Route>
    </Routes>,
    { routerProps: { initialEntries: [initialPath] } },
  );
}

afterEach(() => {
  useAuthMock.mockReset();
});

describe('ProtectedRoute', () => {
  it('renders the guarded outlet when authenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, isLoading: false });
    renderGuarded('/operator');
    expect(screen.getByText('admin-home')).toBeInTheDocument();
  });

  it('redirects to /login and preserves the attempted location when unauthenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, isLoading: false });
    renderGuarded('/operator');
    expect(screen.getByText('login-screen:/operator')).toBeInTheDocument();
  });

  it('shows a spinner (no redirect) while the boot session restore is loading', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, isLoading: true });
    renderGuarded('/operator');
    expect(screen.queryByText(/login-screen/)).not.toBeInTheDocument();
    expect(screen.queryByText('admin-home')).not.toBeInTheDocument();
    // The spinner carries the localized loading label.
    expect(screen.getByLabelText('Loading…')).toBeInTheDocument();
  });
});
