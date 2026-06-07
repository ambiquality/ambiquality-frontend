import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/render';
import { server } from '@/mocks/server';
import { MapPage } from './MapPage';

// MapLibre needs a real WebGL context, which jsdom lacks. Mock the module so mounting `MapView`
// doesn't spin up a GL map. The marker layer / click behaviour is canvas-only and is covered by
// browser/E2E tests (Phase 8), not here; this suite drives the data flow (filter → snapshot →
// legend) through the MSW mock instead.
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

describe('MapPage', () => {
  it('renders the map heading and the map region', async () => {
    renderWithProviders(<MapPage />, { withRouter: true });
    expect(
      screen.getByRole('heading', { name: /indoor environmental quality map/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('application', { name: /interactive map of monitored buildings/i }),
    ).toBeInTheDocument();
  });

  it('populates the quantity filter from /v1/properties', async () => {
    renderWithProviders(<MapPage />, { withRouter: true });
    const select = await screen.findByRole('combobox', { name: /quantity/i }, { timeout: 5000 });
    await waitFor(() => expect(select).not.toBeDisabled(), { timeout: 5000 });
    expect(screen.getByRole('option', { name: /carbon dioxide/i })).toBeInTheDocument();
  });

  it('shows the banded legend for the default (CO₂) quantity', async () => {
    renderWithProviders(<MapPage />, { withRouter: true });
    // CO₂ is the first property and has discrete bands, so the status legend should appear.
    expect(await screen.findByText(/^good$/i, undefined, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText(/^moderate$/i)).toBeInTheDocument();
    expect(screen.getByText(/^poor$/i)).toBeInTheDocument();
  });

  it('shows the UC18 degradation banner when the snapshot fails', async () => {
    // A non-retryable client error makes the snapshot query fail fast (4xx isn't retried).
    server.use(
      http.get('*/v1/map/snapshot', () =>
        HttpResponse.json(
          { type: 'urn:ambiquality:public:unavailable', title: 'unavailable' },
          { status: 400 },
        ),
      ),
    );
    renderWithProviders(<MapPage />, { withRouter: true });
    expect(
      await screen.findByText(/live values are unavailable/i, undefined, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});
