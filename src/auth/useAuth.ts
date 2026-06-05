/**
 * Auth stub for Phase 1.
 *
 * Real auth (AuthProvider, in-memory access token, localStorage refresh token with
 * single-flight silent refresh, 429/Retry-After handling) lands in Phase 4. For now
 * this is a hard-coded "not authenticated" hook so `ProtectedRoute` can scaffold the
 * operator boundary without pulling in token logic yet.
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  // Phase 4 will replace this with real context-backed state.
  return { isAuthenticated: false, isLoading: false };
}
