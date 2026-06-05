/**
 * RFC 9457 (formerly 7807) ProblemDetails parsing — pitfall #9.
 *
 * All three Ambiquality services (Auth, Evidence, Public) return error bodies in the
 * `application/problem+json` shape with a stable `type` URN (`urn:ambiquality:<service>:<code>`),
 * plus `status`, `title`, `detail`, and — for validation failures — a field-keyed `errors`
 * map (ASP.NET `ValidationProblemDetails`). This is the ONE place that shape is parsed, so
 * the rest of the app works with a typed `ProblemError` instead of raw response bodies.
 *
 * Localization is intentionally NOT done here: Phase 3 owns the i18n dictionary. The parser
 * surfaces the stable `type` URN (the localization key the UI maps to a translated message)
 * and the server's `title`/`detail` as a fallback. Keep this module dependency-free so it can
 * be reused from React Query error boundaries, middleware, and tests alike.
 */

/** Per-field validation messages, keyed by the field name the server reported. */
export type FieldErrors = Record<string, string[]>;

/** The parsed, typed shape of an RFC 9457 problem response. */
export interface ProblemDetailsBody {
  /** Stable problem identifier, e.g. `urn:ambiquality:auth:invalid-credentials`. */
  type: string | null;
  title: string | null;
  status: number | null;
  detail: string | null;
  instance: string | null;
  /** Validation field errors (ASP.NET `ValidationProblemDetails.errors`), if present. */
  errors: FieldErrors;
  /** Any other extension members the server included, preserved verbatim. */
  extensions: Record<string, unknown>;
}

const KNOWN_KEYS = new Set(['type', 'title', 'status', 'detail', 'instance', 'errors']);

/** URN prefix every Ambiquality problem `type` shares. Used to recognise our own errors. */
export const AMBIQUALITY_PROBLEM_URN_PREFIX = 'urn:ambiquality:';

/**
 * A thrown error that carries the parsed ProblemDetails. Throw/catch this anywhere the
 * normalized error is more useful than a bare `Response` (React Query `onError`, mutations).
 */
export class ProblemError extends Error {
  readonly problem: ProblemDetailsBody;
  /** HTTP status of the response that produced this error (may differ from body `status`). */
  readonly httpStatus: number;
  /** `Retry-After` header in seconds, when the server sent one (e.g. 429 on `/login`). */
  readonly retryAfterSeconds: number | null;

  constructor(problem: ProblemDetailsBody, httpStatus: number, retryAfterSeconds: number | null) {
    super(problem.detail ?? problem.title ?? `Request failed with status ${httpStatus}`);
    this.name = 'ProblemError';
    this.problem = problem;
    this.httpStatus = httpStatus;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  /** The stable problem code URN, or `null` for non-Ambiquality / unstructured errors. */
  get code(): string | null {
    return this.problem.type;
  }

  /** True when this is one of our `urn:ambiquality:*` problems (vs. an opaque upstream error). */
  get isAmbiquality(): boolean {
    return (
      typeof this.problem.type === 'string' &&
      this.problem.type.startsWith(AMBIQUALITY_PROBLEM_URN_PREFIX)
    );
  }
}

function coerceStatus(raw: unknown): number | null {
  // ProblemDetails.status is typed as int | string | null in the specs; normalize to number.
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function coerceFieldErrors(raw: unknown): FieldErrors {
  if (!raw || typeof raw !== 'object') return {};
  const out: FieldErrors = {};
  for (const [field, messages] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(messages)) {
      out[field] = messages.map((m) => String(m));
    } else if (messages != null) {
      out[field] = [String(messages)];
    }
  }
  return out;
}

/**
 * Parse an already-decoded JSON body into a normalized {@link ProblemDetailsBody}. Tolerant
 * of partial/non-conforming bodies — every field defaults sensibly so callers never crash on
 * a malformed error response.
 */
export function parseProblemDetails(body: unknown): ProblemDetailsBody {
  const obj = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  const extensions: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!KNOWN_KEYS.has(key)) extensions[key] = value;
  }

  return {
    type: typeof obj.type === 'string' ? obj.type : null,
    title: typeof obj.title === 'string' ? obj.title : null,
    status: coerceStatus(obj.status),
    detail: typeof obj.detail === 'string' ? obj.detail : null,
    instance: typeof obj.instance === 'string' ? obj.instance : null,
    errors: coerceFieldErrors(obj.errors),
    extensions,
  };
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const asSeconds = Number(header);
  if (Number.isFinite(asSeconds)) return Math.max(0, asSeconds);
  // HTTP-date form: convert to a delta from now.
  const asDate = Date.parse(header);
  if (Number.isFinite(asDate)) return Math.max(0, Math.round((asDate - Date.now()) / 1000));
  return null;
}

/**
 * Read a failed `Response` and produce a {@link ProblemError}. Clones the response before
 * reading so the body stays consumable by other consumers (e.g. openapi-fetch). Falls back to
 * a minimal problem when the body isn't valid problem+json (network error pages, 5xx HTML…).
 */
export async function problemErrorFromResponse(response: Response): Promise<ProblemError> {
  const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
  let body: unknown;
  try {
    body = await response.clone().json();
  } catch {
    body = null;
  }
  const problem = parseProblemDetails(body);
  // If the body didn't carry a status, fall back to the HTTP status for a useful default.
  if (problem.status == null) problem.status = response.status;
  if (problem.title == null) problem.title = response.statusText || null;
  return new ProblemError(problem, response.status, retryAfter);
}
