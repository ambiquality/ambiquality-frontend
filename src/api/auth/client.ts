/**
 * Typed Auth.Api client (openapi-fetch), bound to `VITE_AUTH_API_BASE`.
 *
 * Auth.Api hosts register/login/refresh (anonymous) plus account management endpoints that
 * ARE Bearer-secured (`/v1/account/*`). We therefore install the full secured stack: header
 * injection + single-flight refresh + ProblemDetails. The refresh endpoint itself
 * (`POST /v1/refresh`) is called by the Phase 4 TokenStore, not through the refresh middleware,
 * so there is no risk of a refresh request recursing into another refresh.
 */

import createClient from 'openapi-fetch';
import { env } from '@/lib/env';
import {
  authHeaderMiddleware,
  refreshMiddleware,
  problemDetailsMiddleware,
} from '@/api/middleware';
import type { paths } from './schema';

export const authClient = createClient<paths>({ baseUrl: env.authApiBase });

// Order matters: inject token → (on 401) refresh+replay → finally normalize errors.
authClient.use(authHeaderMiddleware, refreshMiddleware, problemDetailsMiddleware);

export type { paths, components, operations } from './schema';
