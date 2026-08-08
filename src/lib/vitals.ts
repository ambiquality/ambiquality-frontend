import { onCLS, onINP, onLCP, onTTFB } from 'web-vitals';
import { env } from '@/lib/env';

/**
 * Anonymous Core Web Vitals / page-view reporting ("RUM") for the operator dashboards.
 *
 * web-vitals v6 no longer exposes `onFID` (First Input Delay was deprecated and replaced
 * by INP), so we report LCP, INP, TTFB and CLS. The backend's `/telemetry/vitals` endpoint
 * (Public.Api) buckets them into `ambiquality_web_vitals_*` histograms, from which the
 * Grafana Overview board's bar gauges are drawn.
 *
 * Reports are batched per page load and flushed on `pagehide`/`visibilitychange(hidden)`
 * with `sendBeacon` + a `text/plain` blob (a CORS-safelisted simple request against the
 * any-origin Public.Api — no preflight). Disabled when `VITE_RUM_ENDPOINT` is empty.
 */

export type RouteBucket =
  | 'map'
  | 'catalog'
  | 'detail'
  | 'archive'
  | 'account'
  | 'admin'
  | 'other';

/** Maps the router's top-level path segment onto a tiny bucket to bound card indexity. */
export function deriveRouteBucket(pathname: string): RouteBucket {
  if (pathname === '/' || pathname === '') return 'map';
  const [first] = pathname.replace(/^\//, '').split(/[\\/?#]/);
  switch (first) {
    case 'browse':
    case 'catalog':
      return 'catalog';
    case 'buildings':
    case 'rooms':
    case 'sensors':
      return 'detail';
    case 'archive':
      return 'archive';
    case 'login':
    case 'register':
    case 'confirm-email':
    case 'confirm-email-change':
      return 'account';
    case 'operator':
      return 'admin';
    default:
      return 'other';
  }
}

export function initVitals(): void {
  const endpoint = env.rumEndpoint;
  if (!endpoint) return;

  const report: Record<string, number> = {};
  let sent = false;

  const clampMs = (value: number) => Math.min(Math.max(0, value), 300_000);

  onLCP((metric) => {
    report.lcp = clampMs(metric.value);
  });
  onINP((metric) => {
    report.inp = clampMs(metric.value);
  });
  onTTFB((metric) => {
    report.ttfb = clampMs(metric.value);
  });
  onCLS((metric) => {
    // Raw CLS, clamped below at 0 only. The backend is authoritative and drops values > 1.0
    // (see RumVitalsEndpoint.MaxCls) — the asymmetry is intentional.
    report.cls = metric.value < 0 ? 0 : metric.value;
  });

  const flush = () => {
    // visibilitychange(hidden) and pagehide both fire on tab close / bfcache navigation;
    // only the first flush may send, otherwise the same payload is double-counted.
    if (sent) return;
    sent = true;
    // Recompute at flush time: in this SPA the user may have navigated client-side since
    // load, so report the route they ended on rather than the landing route.
    const bucket = deriveRouteBucket(window.location.pathname);
    const payload = JSON.stringify({ routeBucket: bucket, ...report });
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(endpoint, new Blob([payload], { type: 'text/plain' }))) {
      return;
    }
    // Fallback for browsers without sendBeacon (keepalive keeps the request alive on unload).
    void fetch(endpoint, { method: 'POST', body: payload, keepalive: true }).catch(() => {});
  };

  const onVisibilityHidden = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  document.addEventListener('visibilitychange', onVisibilityHidden);
  window.addEventListener('pagehide', flush);
}
