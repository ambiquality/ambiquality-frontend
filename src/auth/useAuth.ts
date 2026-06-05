/**
 * Phase 4: real, context-backed auth. The hook and context contract live in `auth-context.ts`
 * (kept JSX-free for React-Refresh); `AuthProvider.tsx` supplies the value. This module re-exports
 * the public surface so existing imports of `@/auth/useAuth` keep working.
 */
export { useAuth, AuthContext } from './auth-context';
export type { AuthContextValue, AuthUser, LoginOutcome, RegisterOutcome } from './auth-context';
