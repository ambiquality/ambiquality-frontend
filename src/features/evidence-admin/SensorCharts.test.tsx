import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/render';
import { server } from '@/mocks/server';
import { SensorCharts } from './SensorCharts';
import type { SensorSnapshot } from './queries';

// usePropertyOptions (the chart titles) reads the public properties catalogue; stub it with known
// labels. The aggregate fetch itself goes through the real hook → MSW handler.
vi.mock('@/api/public/hooks', () => ({
  usePublicProperties: () => ({
    data: [
      { code: 'co2', label: 'Carbon dioxide' },
      { code: 'pm25', label: 'PM2.5' },
    ],
    isLoading: false,
  }),
}));

const SENSOR_GUID = '99999999-9999-9999-9999-999999999999';

function snapshotWith(codes: string[]): SensorSnapshot {
  return {
    id: SENSOR_GUID,
    uriSlug: 'sns-1',
    buildingId: 'b1',
    roomId: 'r1',
    manufacturer: 'Acme',
    model: 'X100',
    serialNumber: 'SN-1',
    statusCode: 'active',
    measuredParameters: codes.map((code) => ({ code, quantityKindUri: null, unitUri: null })),
    asOf: '2026-06-06T00:00:00Z',
  };
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SensorCharts', () => {
  it('renders a last-24h trend + numeric summary per measured quantity', async () => {
    renderWithProviders(<SensorCharts sensorId={SENSOR_GUID} snapshot={snapshotWith(['co2', 'pm25'])} />);

    expect(screen.getByText('Recent measurements')).toBeInTheDocument();
    expect(await screen.findByText('Carbon dioxide')).toBeInTheDocument();
    expect(await screen.findByText('PM2.5')).toBeInTheDocument();

    // One trend chart (TimeSeriesChart exposes role="img") + one measurements summary per parameter.
    const charts = await screen.findAllByRole('img');
    expect(charts).toHaveLength(2);
    // The per-parameter numeric summary ("<n> measurements") — one per chart.
    expect(await screen.findAllByText(/\d+\s+measurements/i)).toHaveLength(2);
  });

  it('scopes the aggregate to the sensor GUID over a ~24h window', async () => {
    let captured: URL | undefined;
    server.use(
      http.get('*/v1/observations/aggregate', ({ request }) => {
        captured = new URL(request.url);
        return HttpResponse.json({
          parameterCode: 'co2',
          unit: 'ppm',
          from: '',
          to: '',
          bucket: '1h',
          buckets: [],
          stats: null,
          license: 'CC BY 4.0',
        });
      }),
    );

    renderWithProviders(<SensorCharts sensorId={SENSOR_GUID} snapshot={snapshotWith(['co2'])} />);
    await screen.findByText(/no measurements/i);

    expect(captured?.searchParams.get('sensorId')).toBe(SENSOR_GUID);
    expect(captured?.searchParams.get('buildingId')).toBeNull();
    const from = Date.parse(captured!.searchParams.get('from')!);
    const to = Date.parse(captured!.searchParams.get('to')!);
    expect(Math.round((to - from) / 3_600_000)).toBe(24);
  });

  it('shows an error state when the aggregate request fails', async () => {
    server.use(
      // 4xx is deterministic (never retried) so the error surfaces immediately.
      http.get('*/v1/observations/aggregate', () =>
        HttpResponse.json({ type: 'urn:ambiquality:public:boom', title: 'boom' }, { status: 400 }),
      ),
    );

    renderWithProviders(<SensorCharts sensorId={SENSOR_GUID} snapshot={snapshotWith(['co2'])} />);
    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument();
  });

  it('renders nothing when the sensor measures no quantities', () => {
    const { container } = renderWithProviders(
      <SensorCharts sensorId={SENSOR_GUID} snapshot={snapshotWith([])} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
