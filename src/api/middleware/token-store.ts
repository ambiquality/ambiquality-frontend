/**
 * Token provider seam for the API layer.
 *
 * ## Token model (per the plan / pitfall #8, hardened for WSTG-SESS-04)
 * - **Access token** — short-lived (15 min), kept **in memory only** (never
 *   localStorage), sent as `Authorization: Bearer <token>` on secured requests.
 * - **Refresh token** — long-lived (30 days), held by the server as an
 *   **HttpOnly + SameSite=Strict cookie** (set by `POST /login` / `/refresh`).
 *   Page JavaScript can never read it, so it is no longer persisted in
 *   localStorage. `/refresh` is called with `credentials: 'include'` and the
 *   cookie is sent automatically.
 *
 * ## Phase 4 integration
 * The AuthProvider implements {@link TokenStore} (backed by React state and the
 * generated auth client's refresh call) and installs it via {@link setTokenStore}.
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
  /**
   * Exchange the refresh-token cookie for a new access token. The middleware
   * guarantees this is called **single-flight** (one in-flight refresh at a
   * time). Implementations should update their own access-token state and
   * resolve with the new access token, or throw on failure (no/expired/revoked
   * refresh cookie).
   */
  refresh(): Promise<RefreshResult>;
  /**
   * Hard auth failure hook. Invoked when a refresh fails (or there is nothing to refresh with),
   * so the app can clear tokens and route to login. The default impl just clears memory.
   */
  onAuthFailure(): void;
}

/**
 * Default placeholder store: holds an access token in memory, but cannot actually
 * refresh (no auth client wired yet). Refreshing throws, which drives the
 * middleware straight to {@link TokenStore.onAuthFailure}. Phase 4 replaces this entirely.
 *
 * Exposed setters let tests (and any pre-Phase-4 manual wiring) seed tokens.
 */
export class InMemoryTokenStore implements TokenStore {
  #accessToken: string | null = null;

  getAccessToken(): string | null {
    return this.#accessToken;
  }

  setTokens(tokens: { accessToken: string | null }): void {
    this.#accessToken = tokens.accessToken;
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
