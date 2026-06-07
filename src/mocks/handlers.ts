/**
 * MSW request handlers for the map's read endpoints. Two of these (`/v1/map/snapshot`,
 * `/v1/observations/aggregate`) are the not-yet-built Public.Api routes this mock stands in for;
 * `/v1/properties` is mocked too so the quantity filter populates without a live backend.
 *
 * URL patterns are base-agnostic (a leading wildcard before the version segment) so they match
 * regardless of `VITE_PUBLIC_API_BASE`. Anything not matched is bypassed (see `onUnhandledRequest`
 * where the worker/server is started), so a running backend still serves every other endpoint.
 */

import { http, HttpResponse } from 'msw';
import { mockAggregate, mockProperties, mockSnapshot } from './data';

function parseBbox(raw: string | null): [number, number, number, number] | undefined {
  if (!raw) return undefined;
  const parts = raw.split(',').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return undefined;
  return parts as [number, number, number, number];
}

export const handlers = [
  http.get('*/v1/properties', () => HttpResponse.json(mockProperties())),

  http.get('*/v1/map/snapshot', ({ request }) => {
    const url = new URL(request.url);
    const parameterCode = url.searchParams.get('parameterCode');
    if (!parameterCode) {
      return HttpResponse.json(
        { type: 'urn:ambiquality:public:invalid-request', title: 'parameterCode is required' },
        { status: 400 },
      );
    }
    return HttpResponse.json(mockSnapshot(parameterCode, parseBbox(url.searchParams.get('bbox'))));
  }),

  http.get('*/v1/observations/aggregate', ({ request }) => {
    const url = new URL(request.url);
    const parameterCode = url.searchParams.get('parameterCode');
    const entityId =
      url.searchParams.get('buildingId') ?? url.searchParams.get('sensorId') ?? undefined;
    if (!parameterCode || !entityId) {
      return HttpResponse.json(
        {
          type: 'urn:ambiquality:public:invalid-request',
          title: 'parameterCode and buildingId (or sensorId) are required',
        },
        { status: 400 },
      );
    }
    const now = Date.now();
    const toMs = url.searchParams.get('to') ? Date.parse(url.searchParams.get('to')!) : now;
    const fromMs = url.searchParams.get('from')
      ? Date.parse(url.searchParams.get('from')!)
      : toMs - 24 * 3_600_000;
    return HttpResponse.json(mockAggregate(entityId, parameterCode, fromMs, toMs));
  }),
];
