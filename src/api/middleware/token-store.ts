/**
 * Token provider seam for the API layer.
 *
 * The real AuthProvider (in-memory access token, localStorage refresh token, login/logout
 * flows, 429/Retry-After handling) lands in **Phase 4**. The API middleware, however, needs
 * a way to read the current access token, trigger a refresh, and react to hard auth failure
 * NOW — without depending on any UI. This module defines that contract ({@link TokenStore})
 * plus a default in-memory placeholder implementation so the client is fully wired and
 * testable today.
 *
 * ## Token model (per the plan / pitfall #8)
 * - **Access token** — short-lived (15 min), kept **in memory only** (never localStorage),
 *   sent as `Authorization: Bearer <token>` on secured requests.
 * - **Refresh token** — long-lived (30 days), kept in **localStorage** so it survives reloads.
 *   Exchanged via `POST /auth/v1/refresh` by the refresh middleware on a 401.
 * - Keeping the access token out of storage limits the blast radius of XSS; the app stays
 *   XSS-clean (React escaping, no `dangerouslySetInnerHTML`).
 *
 * ## Phase 4 integration
 * The AuthProvider will implement {@link TokenStore} (backed by React state + localStorage and
 * the generated auth client's refresh call) and install it via {@link setTokenStore}. Until
 * then, the {@link InMemoryTokenStore} default is active and simply reports "no token".
 */

/** Result of a refresh attempt, surfaced to the single-flight refresh middleware. */
export interface RefreshResult {
  accessToken: string;
}

/**
 * The contract the API middleware depends on. Phase 4 supplies the real implementation;
 * keep this interface small and UI-free so it can be implemented and unit-tested in isolation.
 */
export interface TokenStore {
  /** Current access token, or `null` when unauthenticated / not yet loaded. */
  getAccessToken(): string | null;
  /** Persisted refresh token (localStorage in the real impl), or `null` if none. */
  getRefreshToken(): string | null;
  /**
   * Exchange the refresh token for a new access token. The middleware guarantees this is
   * called **single-flight** (one in-flight refresh at a time). Implementations should update
   * their own access/refresh token state and resolve with the new access token, or throw on
   * failure (expired/revoked refresh token).
   */
  refresh(): Promise<RefreshResult>;
  /**
   * Hard auth failure hook. Invoked when a refresh fails (or there is nothing to refresh with),
   * so the app can clear tokens and route to login. The default impl just clears memory.
   */
  onAuthFailure(): void;
}

/**
 * Default placeholder store: holds an access token in memory and a refresh token reference,
 * but cannot actually refresh (no auth client wired yet). Refreshing throws, which drives the
 * middleware straight to {@link TokenStore.onAuthFailure}. Phase 4 replaces this entirely.
 *
 * Exposed setters let tests (and any pre-Phase-4 manual wiring) seed tokens.
 */
export class InMemoryTokenStore implements TokenStore {
  #accessToken: string | null = null;
  #refreshToken: string | null = null;

  getAccessToken(): string | null {
    return this.#accessToken;
  }

  getRefreshToken(): string | null {
    return this.#refreshToken;
  }

  setTokens(tokens: { accessToken: string | null; refreshToken?: string | null }): void {
    this.#accessToken = tokens.accessToken;
    if (tokens.refreshToken !== undefined) this.#refreshToken = tokens.refreshToken;
  }

  refresh(): Promise<RefreshResult> {
    // No real auth client until Phase 4 — fail closed so the middleware logs the user out
    // rather than silently looping. Phase 4's TokenStore performs the real POST /v1/refresh.
    return Promise.reject(
      new Error('No refresh implementation installed (AuthProvider lands in Phase 4).'),
    );
  }

  onAuthFailure(): void {
    this.#accessToken = null;
    this.#refreshToken = null;
  }
}

let activeTokenStore: TokenStore = new InMemoryTokenStore();

/** Install the active {@link TokenStore}. Phase 4's AuthProvider calls this on mount. */
export function setTokenStore(store: TokenStore): void {
  activeTokenStore = store;
}

/** The {@link TokenStore} the API middleware currently reads from. */
export function getTokenStore(): TokenStore {
  return activeTokenStore;
}
