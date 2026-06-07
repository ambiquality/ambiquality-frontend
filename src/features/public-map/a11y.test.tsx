import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';
import { server } from '@/mocks/server';
import { MapPage } from './MapPage';
import { BuildingDialog } from './BuildingDialog';
import { TimeSeriesChart } from './charts/TimeSeriesChart';
import { BoxPlot } from './charts/BoxPlot';
import type { AggregateBucket, AggregateStats } from '@/api/public/map-types';

// MapLibre needs a real WebGL context jsdom lacks; mock it (the canvas marker layer is browser/E2E
// territory). The DOM around the map — heading, region, filter, legend, table — is what the
// structural axe pass scans here.
vi.mock('maplibre-gl', () => {
  class MockMap {
    addControl() {
      return this;
    }
    on() {
      return this;
    }
    remove() {}
  }
  class MockControl {}
  const exports = {
    Map: MockMap,
    NavigationControl: MockControl,
    AttributionControl: MockControl,
  };
  return { ...exports, default: exports };
});

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const stats: AggregateStats = {
  count: 288,
  min: 650,
  max: 1100,
  avg: 820,
  p05: 700,
  p25: 760,
  p50: 810,
  p75: 880,
  p95: 980,
};

const buckets: AggregateBucket[] = [
  { t: '2026-06-06T00:00:00Z', count: 12, min: 700, max: 950, avg: 812, p25: 760, p50: 805, p75: 870 },
  { t: '2026-06-06T06:00:00Z', count: 12, min: 720, max: 980, avg: 840, p25: 780, p50: 835, p75: 900 },
  { t: '2026-06-06T12:00:00Z', count: 12, min: 690, max: 1010, avg: 860, p25: 800, p50: 855, p75: 920 },
];

describe('public-map accessibility (axe structural pass)', () => {
  it('MapPage has no violations once markers + table have loaded', async () => {
    const { container } = renderWithProviders(<MapPage />, { withRouter: true });
    // The fallback renders an empty-state line until the snapshot loads, then swaps in the table.
    await screen.findByRole('table', undefined, { timeout: 5000 });
    await expectNoA11yViolations(container);
  });

  it('MapPage degraded state (snapshot fails) has no violations', async () => {
    server.use(
      http.get('*/v1/map/snapshot', () =>
        HttpResponse.json(
          { type: 'urn:ambiquality:public:unavailable', title: 'unavailable' },
          { status: 400 },
        ),
      ),
    );
    const { container } = renderWithProviders(<MapPage />, { withRouter: true });
    await screen.findByText(/live values are unavailable/i, undefined, { timeout: 5000 });
    await expectNoA11yViolations(container);
  });

  it('BuildingDialog (open, with charts) has no violations', async () => {
    renderWithProviders(
      <BuildingDialog
        selection={{ buildingId: 'b1', slug: 'bld-a', name: 'Building A' }}
        parameterCode="co2"
        unit="ppm"
        onClose={vi.fn()}
      />,
      { withRouter: true },
    );
    // The dialog portals into document.body and fetches the aggregate; wait for a chart to render.
    await waitFor(() => expect(screen.getAllByRole('img').length).toBeGreaterThan(0), {
      timeout: 5000,
    });
    await expectNoA11yViolations(document.body);
  });

  it('TimeSeriesChart has no violations', async () => {
    const { container } = renderWithProviders(<TimeSeriesChart buckets={buckets} unit="ppm" />);
    await expectNoA11yViolations(container);
  });

  it('BoxPlot has no violations', async () => {
    const { container } = renderWithProviders(<BoxPlot stats={stats} unit="ppm" />);
    await expectNoA11yViolations(container);
  });
});
