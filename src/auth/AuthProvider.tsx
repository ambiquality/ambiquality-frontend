/**
 * The real AuthProvider (Phase 4) — owns the session and plugs the live {@link TokenStore} into
 * the Phase-2 API middleware.
 *
 * ## Token model (pitfall #8 / the plan)
 * - **Access token + its expiry + the `MeResponse` user** live in memory (React state, mirrored
 *   into a ref so the synchronous `TokenStore.getAccessToken()` always reads the latest value).
 * - **Refresh token + its expiry** live in `localStorage` (see `storage.ts`) so the session
 *   survives reloads; never the access token.
 *
 * ## Middleware seam
 * On mount we `setTokenStore(...)` with an implementation that closes over the live refs:
 *   - `getAccessToken()`   → in-memory access token,
 *   - `getRefreshToken()`  → persisted refresh token,
 *   - `refresh()`          → `authClient POST /v1/refresh` **directly** (not through
 *                            `refreshMiddleware`), so a refresh can never recurse into another
 *                            refresh; on success it updates memory + storage,
 *   - `onAuthFailure()`    → clear memory + storage (→ `isAuthenticated` false → `ProtectedRoute`
 *                            redirects to `/login`).
 *
 * ## Session restore on boot
 * If a non-expired refresh token is in `localStorage` at start, we attempt one silent refresh and
 * then `GET /v1/account/me`; `isLoading` is true until that resolves. On any failure we clear and
 * treat the user as anonymous.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { authClient } from '@/api/auth/client';
import { setTokenStore, type RefreshResult, type TokenStore } from '@/api/middleware/token-store';
import { ProblemError } from '@/api/middleware/problem-details';
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
  type LoginOutcome,
  type RegisterOutcome,
} from './auth-context';
import {
  clearRefreshToken,
  loadRefreshToken,
  saveRefreshToken,
  type StoredRefreshToken,
} from './storage';

/** The in-memory access token + its expiry. */
interface AccessSession {
  accessToken: string;
  accessTokenExpiresAt: string;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Boot starts in a loading state ONLY if there is a refresh token to try; resolved in the effect.
  const [isLoading, setIsLoading] = useState<boolean>(() => loadRefreshToken() !== null);
  // Render-safe mirror of "is an access token held": the ref is the synchronous source of truth
  // for the middleware, while this state drives `isAuthenticated` without reading the ref in render.
  const [hasAccess, setHasAccess] = useState(false);

  // Synchronous mirror of the access token so `TokenStore.getAccessToken()` (called from
  // middleware, outside React's render cycle) always sees the freshest value.
  const accessRef = useRef<AccessSession | null>(null);

  /** Set the in-memory access session (ref is the source of truth for the middleware). */
  const setAccess = useCallback((session: AccessSession | null) => {
    accessRef.current = session;
    setHasAccess(session !== null);
  }, []);

  /** Apply a full auth response: access in memory, refresh in storage. */
  const applyAuthResponse = useCallback(
    (res: {
      accessToken: string;
      accessTokenExpiresAt: string;
      refreshToken: string;
      refreshTokenExpiresAt: string;
    }) => {
      setAccess({ accessToken: res.accessToken, accessTokenExpiresAt: res.accessTokenExpiresAt });
      const stored: StoredRefreshToken = {
        refreshToken: res.refreshToken,
        expiresAt: res.refreshTokenExpiresAt,
      };
      saveRefreshToken(stored);
    },
    [setAccess],
  );

  /** Clear ALL session state (memory + storage). Drives `isAuthenticated` → false. */
  const clearSession = useCallback(() => {
    setAccess(null);
    clearRefreshToken();
    setUser(null);
  }, [setAccess]);

  /**
   * Fetch `GET /v1/account/me` into context. Throws on failure.
   *
   * NB: `problemDetailsMiddleware` THROWS a {@link ProblemError} on any non-ok response, so the
   * non-error path here always has `data`. The throw propagates to the caller's try/catch.
   */
  const fetchMe = useCallback(async (): Promise<AuthUser> => {
    const { data } = await authClient.GET('/v1/account/me');
    if (!data) throw new Error('Failed to load account.');
    setUser(data);
    return data;
  }, []);

  /**
   * Exchange the persisted refresh token for a new token pair — calling the auth client's
   * `POST /v1/refresh` **directly**. The refresh middleware only triggers on 401 of a *secured*
   * request; `/v1/refresh` is anonymous and carries the refresh token in its body, so it never
   * loops back through the refresh latch.
   */
  const doRefresh = useCallback(async (): Promise<RefreshResult> => {
    const stored = loadRefreshToken();
    if (!stored) throw new Error('No refresh token to exchange.');

    // `problemDetailsMiddleware` throws on a non-ok refresh (e.g. 401 expired/revoked), which
    // propagates to the caller / the middleware's single-flight latch as a hard failure.
    const { data } = await authClient.POST('/v1/refresh', {
      body: { refreshToken: stored.refreshToken },
    });
    if (!data) throw new Error('Refresh failed.');
    applyAuthResponse(data);
    return { accessToken: data.accessToken };
  }, [applyAuthResponse]);

  // --- Install the live TokenStore into the middleware (once, with stable closures). ---
  // "Latest ref" pattern: keep refs pointing at the freshest callbacks (updated in an effect, not
  // during render) so the installed store stays stable while always reaching current behaviour.
  const doRefreshRef = useRef(doRefresh);
  const clearSessionRef = useRef(clearSession);
  useEffect(() => {
    doRefreshRef.current = doRefresh;
    clearSessionRef.current = clearSession;
  }, [doRefresh, clearSession]);

  useEffect(() => {
    const store: TokenStore = {
      getAccessToken: () => accessRef.current?.accessToken ?? null,
      getRefreshToken: () => loadRefreshToken()?.refreshToken ?? null,
      refresh: () => doRefreshRef.current(),
      onAuthFailure: () => clearSessionRef.current(),
    };
    setTokenStore(store);
  }, []);

  // --- Session restore on boot. ---
  useEffect(() => {
    let cancelled = false;
    const stored = loadRefreshToken();
    if (!stored) {
      // Nothing to restore; effect's initial isLoading was already false.
      return;
    }
    (async () => {
      try {
        await doRefresh();
        await fetchMe();
      } catch {
        clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Run once on mount; doRefresh/fetchMe/clearSession are stable for this purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginOutcome> => {
      setIsLoading(true);
      try {
        // On success openapi-fetch resolves with `{ data }`; on any non-ok status
        // `problemDetailsMiddleware` THROWS a ProblemError (caught below).
        const { data } = await authClient.POST('/v1/login', { body: { email, password } });
        if (!data) return { ok: false, reason: 'error', error: null };
        applyAuthResponse(data);
        await fetchMe();
        return { ok: true };
      } catch (error) {
        if (error instanceof ProblemError) {
          // 429 rate-limit: surface Retry-After so the screen can show "try again in N".
          if (error.httpStatus === 429) {
            return {
              ok: false,
              reason: 'rate-limited',
              retryAfterSeconds: error.retryAfterSeconds,
            };
          }
          // 401 (anti-enumeration): generic invalid-credentials; never reveal email existence.
          if (error.httpStatus === 401) {
            return { ok: false, reason: 'invalid-credentials' };
          }
        }
        return { ok: false, reason: 'error', error };
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuthResponse, fetchMe],
  );

  const register = useCallback(
    async (email: string, password: string): Promise<RegisterOutcome> => {
      try {
        // 201 Created resolves with no body; non-ok throws a ProblemError below. No auto-login —
        // the account is unconfirmed until the user follows the emailed confirmation link.
        await authClient.POST('/v1/register', { body: { email, password } });
        return { ok: true };
      } catch (error) {
        if (error instanceof ProblemError) {
          // 409 email-exists is reported generically by the screen (anti-enumeration).
          if (error.httpStatus === 409) return { ok: false, reason: 'conflict', error };
          if (error.httpStatus === 400) return { ok: false, reason: 'validation', error };
        }
        return { ok: false, reason: 'error', error };
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      // Best-effort server-side revoke; ignore failures — we clear locally regardless.
      await authClient.POST('/v1/account/logout');
    } catch {
      // ignore
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshUser = useCallback(async (): Promise<void> => {
    await fetchMe();
  }, [fetchMe]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null && hasAccess,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, hasAccess, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
