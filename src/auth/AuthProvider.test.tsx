import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ProblemError } from '@/api/middleware/problem-details';
import { getTokenStore, InMemoryTokenStore, setTokenStore } from '@/api/middleware/token-store';
import { useAuth } from './useAuth';

// --- Mock the typed auth client so no real network happens. ---
const get = vi.fn();
const post = vi.fn();
const del = vi.fn();
vi.mock('@/api/auth/client', () => ({
  authClient: {
    GET: (...args: unknown[]) => get(...args),
    POST: (...args: unknown[]) => post(...args),
    DELETE: (...args: unknown[]) => del(...args),
  },
}));

// The refresh token is an HttpOnly cookie; the body only ever carries the access token.
const AUTH_RESPONSE = {
  accessToken: 'access-1',
  accessTokenExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
};
const ME = { id: 'user-1', email: 'a@b.cz', emailConfirmed: true };

/** A tiny probe component that surfaces the auth context to assertions + exposes actions. */
function Probe() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="email">{user?.email ?? '—'}</span>
      <button onClick={() => void login('a@b.cz', 'password1')}>login</button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}

function problem(status: number, type: string, retryAfter: number | null = null) {
  return new ProblemError(
    { type, title: null, status, detail: null, instance: null, errors: {}, extensions: {} },
    status,
    retryAfter,
  );
}

beforeEach(() => {
  localStorage.clear();
  setTokenStore(new InMemoryTokenStore());
  get.mockReset();
  post.mockReset();
  del.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AuthProvider', () => {
  it('logs in, becomes authenticated, then logs out and never persists the refresh token', async () => {
    post.mockImplementation((path: string) => {
      if (path === '/v1/login') return Promise.resolve({ data: AUTH_RESPONSE });
      if (path === '/v1/account/logout') return Promise.resolve({ data: undefined });
      // Boot-time silent refresh with no cookie → anonymous.
      return Promise.resolve({ data: undefined });
    });
    get.mockResolvedValue({ data: ME });

    renderWithProviders(<Probe />, { withAuth: true });

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('auth').textContent).toBe('false');

    await act(async () => {
      screen.getByText('login').click();
    });

    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));
    expect(screen.getByTestId('email').textContent).toBe('a@b.cz');
    // The refresh token is an HttpOnly cookie — nothing sensitive lands in localStorage.
    expect(localStorage.getItem('amq.auth.refresh')).toBeNull();
    // The installed TokenStore exposes the in-memory access token to the middleware.
    expect(getTokenStore().getAccessToken()).toBe('access-1');

    await act(async () => {
      screen.getByText('logout').click();
    });

    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('false'));
    expect(getTokenStore().getAccessToken()).toBeNull();
  });

  it('maps a 401 login to a generic invalid-credentials outcome (anti-enumeration)', async () => {
    post.mockRejectedValue(problem(401, 'urn:ambiquality:auth:invalid-credentials'));
    let outcome: unknown;
    function CaptureLogin() {
      const { login } = useAuth();
      return (
        <button
          onClick={async () => {
            outcome = await login('a@b.cz', 'wrongpass');
          }}
        >
          go
        </button>
      );
    }
    renderWithProviders(<CaptureLogin />, { withAuth: true });
    await act(async () => {
      screen.getByText('go').click();
    });
    await waitFor(() => expect(outcome).toEqual({ ok: false, reason: 'invalid-credentials' }));
  });

  it('maps a 429 login to a rate-limited outcome carrying Retry-After', async () => {
    post.mockRejectedValue(problem(429, 'urn:ambiquality:auth:too-many-login-attempts', 42));
    let outcome: unknown;
    function CaptureLogin() {
      const { login } = useAuth();
      return (
        <button
          onClick={async () => {
            outcome = await login('a@b.cz', 'password1');
          }}
        >
          go
        </button>
      );
    }
    renderWithProviders(<CaptureLogin />, { withAuth: true });
    await act(async () => {
      screen.getByText('go').click();
    });
    await waitFor(() =>
      expect(outcome).toEqual({ ok: false, reason: 'rate-limited', retryAfterSeconds: 42 }),
    );
  });

  it('restores the session on boot via a silent cookie-based refresh', async () => {
    post.mockImplementation((path: string) => {
      if (path === '/v1/refresh') return Promise.resolve({ data: AUTH_RESPONSE });
      return Promise.resolve({ data: undefined });
    });
    get.mockResolvedValue({ data: ME });

    renderWithProviders(<Probe />, { withAuth: true });

    // Boot always starts loading while it probes for a (possibly present) HttpOnly cookie.
    expect(screen.getByTestId('loading').textContent).toBe('true');
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));
    expect(screen.getByTestId('email').textContent).toBe('a@b.cz');
    // The refresh endpoint is called with NO body — the cookie is sent by the browser.
    expect(post).toHaveBeenCalledWith('/v1/refresh');
  });

  it('treats the user as anonymous on boot when the silent refresh fails', async () => {
    post.mockRejectedValue(problem(401, 'urn:ambiquality:auth:invalid-refresh-token'));

    renderWithProviders(<Probe />, { withAuth: true });

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('auth').textContent).toBe('false');
  });
});
