/**
 * Typed Public.Api client (openapi-fetch), bound to `VITE_PUBLIC_API_BASE`.
 *
 * Public.Api is the anonymous, CORS-open open-data read API consumed by the visitor interface.
 * It gets the ProblemDetails middleware (it still returns RFC 9457 on error) but **no auth
 * header and no refresh** — there is nothing to authenticate.
 *
 * Note on typing: the Public.Api spec declares no component schemas and no query params /
 * response bodies (it documents these in prose only — see `openapi/public.json`). So the
 * generated `paths` give correct URLs/methods but `unknown` responses; the example hooks in
 * `./hooks.ts` layer hand-written response types on top. That is an accepted, documented
 * limitation, not a bug.
 */

import createClient from 'openapi-fetch';
import { env } from '@/lib/env';
import { problemDetailsMiddleware } from '@/api/middleware';
import type { paths } from './schema';

export const publicClient = createClient<paths>({ baseUrl: env.publicApiBase });

publicClient.use(problemDetailsMiddleware);

export type { paths, components, operations } from './schema';
