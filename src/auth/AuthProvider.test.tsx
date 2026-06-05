import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ProblemError } from '@/api/middleware/problem-details';
import { getTokenStore, InMemoryTokenStore, setTokenStore } from '@/api/middleware/token-store';
import { REFRESH_TOKEN_STORAGE_KEY } from './storage';
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

const AUTH_RESPONSE = {
  accessToken: 'access-1',
  accessTokenExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  refreshToken: 'refresh-1',
  refreshTokenExpiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
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
  it('logs in, becomes authenticated, then logs out and clears storage', async () => {
    post.mockImplementation((path: string) => {
      if (path === '/v1/login') return Promise.resolve({ data: AUTH_RESPONSE });
      if (path === '/v1/account/logout') return Promise.resolve({ data: undefined });
      return Promise.resolve({ data: undefined });
    });
    get.mockResolvedValue({ data: ME });

    renderWithProviders(<Probe />, { withAuth: true });

    expect(screen.getByTestId('auth').textContent).toBe('false');

    await act(async () => {
      screen.getByText('login').click();
    });

    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));
    expect(screen.getByTestId('email').textContent).toBe('a@b.cz');
    // Refresh token persisted to localStorage; access token is NOT.
    expect(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toContain('refresh-1');
    // The installed TokenStore exposes the in-memory access token to the middleware.
    expect(getTokenStore().getAccessToken()).toBe('access-1');

    await act(async () => {
      screen.getByText('logout').click();
    });

    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('false'));
    expect(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
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

  it('restores the session on boot via a silent refresh when a refresh token is present', async () => {
    localStorage.setItem(
      REFRESH_TOKEN_STORAGE_KEY,
      JSON.stringify({
        refreshToken: 'refresh-boot',
        expiresAt: AUTH_RESPONSE.refreshTokenExpiresAt,
      }),
    );
    post.mockImplementation((path: string) => {
      if (path === '/v1/refresh') return Promise.resolve({ data: AUTH_RESPONSE });
      return Promise.resolve({ data: undefined });
    });
    get.mockResolvedValue({ data: ME });

    renderWithProviders(<Probe />, { withAuth: true });

    // Boot starts loading because a refresh token exists.
    expect(screen.getByTestId('loading').textContent).toBe('true');
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));
    expect(screen.getByTestId('email').textContent).toBe('a@b.cz');
    expect(post).toHaveBeenCalledWith('/v1/refresh', {
      body: { refreshToken: 'refresh-boot' },
    });
  });

  it('clears state on boot when the silent refresh fails', async () => {
    localStorage.setItem(
      REFRESH_TOKEN_STORAGE_KEY,
      JSON.stringify({ refreshToken: 'expired', expiresAt: AUTH_RESPONSE.refreshTokenExpiresAt }),
    );
    post.mockRejectedValue(problem(401, 'urn:ambiquality:auth:invalid-refresh-token'));

    renderWithProviders(<Probe />, { withAuth: true });

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('auth').textContent).toBe('false');
    expect(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
  });
});
