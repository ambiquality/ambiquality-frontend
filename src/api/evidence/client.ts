/**
 * Typed Evidence.Api client (openapi-fetch), bound to `VITE_EVIDENCE_API_BASE`.
 *
 * Evidence.Api mutations are Bearer-secured; reads are anonymous (owner recognised on read for
 * precise coords). The operator interface uses this client for the full evidence lifecycle and
 * `asOf` history reads. Full secured stack: header injection + single-flight refresh +
 * ProblemDetails. (See the "two read sources" rule — the visitor interface reads Public.Api,
 * not this client.)
 */

import createClient from 'openapi-fetch';
import { env } from '@/lib/env';
import {
  authHeaderMiddleware,
  refreshMiddleware,
  problemDetailsMiddleware,
} from '@/api/middleware';
import type { paths } from './schema';

export const evidenceClient = createClient<paths>({ baseUrl: env.evidenceApiBase });

evidenceClient.use(authHeaderMiddleware, refreshMiddleware, problemDetailsMiddleware);

export type { paths, components, operations } from './schema';
