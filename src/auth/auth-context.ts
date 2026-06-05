/**
 * Auth context contract + the `useAuth` hook.
 *
 * Kept JSX-free (separate from `AuthProvider.tsx`) so the provider file can own React-Refresh's
 * "only export components" rule while this module exports the context and hook. The provider
 * supplies the value; every screen consumes it through {@link useAuth}.
 */

import { createContext, useContext } from 'react';
import type { components } from '@/api/auth/client';

/** The authenticated user profile (`GET /v1/account/me`). */
export type AuthUser = components['schemas']['MeResponse'];

/** Result of a login attempt the UI can branch on without catching raw errors. */
export type LoginOutcome =
  | { ok: true }
  | { ok: false; reason: 'invalid-credentials' }
  /** Rate-limited (`429`); `retryAfterSeconds` from the `Retry-After` header when present. */
  | { ok: false; reason: 'rate-limited'; retryAfterSeconds: number | null }
  | { ok: false; reason: 'error'; error: unknown };

/** Result of a registration attempt. `201` is success (no auto-login; confirm via email). */
export type RegisterOutcome =
  | { ok: true }
  | { ok: false; reason: 'conflict'; error: unknown }
  | { ok: false; reason: 'validation'; error: unknown }
  | { ok: false; reason: 'error'; error: unknown };

export interface AuthContextValue {
  /** The signed-in user, or `null` when anonymous / not yet resolved. */
  user: AuthUser | null;
  /** True once an access token + user are held in memory. */
  isAuthenticated: boolean;
  /** True during boot session-restore and during in-flight login. */
  isLoading: boolean;
  /** Email/password login. Resolves to a discriminated {@link LoginOutcome} (never throws). */
  login(email: string, password: string): Promise<LoginOutcome>;
  /** Register a new account (`POST /v1/register`). Does NOT log in (account is unconfirmed). */
  register(email: string, password: string): Promise<RegisterOutcome>;
  /** Best-effort server logout (`POST /v1/account/logout`) then clear local state regardless. */
  logout(): Promise<void>;
  /** Re-fetch `GET /v1/account/me` into context (e.g. after an email change confirmation). */
  refreshUser(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Access the auth context. Throws when used outside `AuthProvider` so a missing provider is a
 * loud developer error rather than a silent anonymous state.
 */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return value;
}
