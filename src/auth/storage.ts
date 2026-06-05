/**
 * Refresh-token persistence (pitfall #8 / the plan's token model).
 *
 * The **refresh token** (long-lived, 30 days) is the only credential persisted across reloads;
 * it lives in `localStorage` so a returning user can be silently re-authenticated on boot. The
 * **access token** is deliberately NEVER persisted (memory only, in `AuthProvider` state) to
 * limit the blast radius of XSS. The app stays XSS-clean (React escaping, no
 * `dangerouslySetInnerHTML`), so localStorage is an acceptable home for the refresh token.
 *
 * We store the token together with its expiry so boot can skip a doomed refresh once the token
 * is past its `refreshTokenExpiresAt`.
 */

/** localStorage key the persisted refresh token + expiry live under. */
export const REFRESH_TOKEN_STORAGE_KEY = 'amq.auth.refresh';

export interface StoredRefreshToken {
  refreshToken: string;
  /** ISO-8601 `refreshTokenExpiresAt` from the auth response. */
  expiresAt: string;
}

/** Read the persisted refresh token, or `null` when absent/expired/malformed. */
export function loadRefreshToken(now: Date = new Date()): StoredRefreshToken | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    // localStorage can throw (private mode, disabled). Treat as "no token".
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof (parsed as StoredRefreshToken).refreshToken !== 'string' ||
    typeof (parsed as StoredRefreshToken).expiresAt !== 'string'
  ) {
    return null;
  }

  const stored = parsed as StoredRefreshToken;
  const expiryMs = Date.parse(stored.expiresAt);
  // A past (or unparseable) expiry means the refresh token is useless — clear and report none.
  if (!Number.isFinite(expiryMs) || expiryMs <= now.getTime()) {
    clearRefreshToken();
    return null;
  }
  return stored;
}

/** Persist the refresh token + its expiry. */
export function saveRefreshToken(token: StoredRefreshToken): void {
  try {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, JSON.stringify(token));
  } catch {
    // Best-effort: if storage is unavailable the session simply won't survive a reload.
  }
}

/** Remove the persisted refresh token (logout / hard auth failure). */
export function clearRefreshToken(): void {
  try {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}
