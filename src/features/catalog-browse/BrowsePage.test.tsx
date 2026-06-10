import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/render';
import { server } from '@/mocks/server';
import { BrowsePage } from './BrowsePage';

// `useCodelistScheme` goes through openapi-fetch, which captures `globalThis.fetch` before
// MSW patches it in node — so codelist schemes are module-mocked here (repo convention; see
// RoomNewPage.test). The entity/list endpoints use `publicGet` (late-bound fetch) and are
// served by MSW handlers below.
const SCHEMES: Record<string, Record<string, { code: string; prefLabel: { en: string; cs: string } }>> = {
  'building-type': {
    educational: { code: 'educational', prefLabel: { en: 'Educational building', cs: 'Školská budova' } },
    office: { code: 'office', prefLabel: { en: 'Office building', cs: 'Administrativní budova' } },
  },
  'room-function': {
    classroom: { code: 'classroom', prefLabel: { en: 'Classroom', cs: 'Učebna' } },
  },
  exposure: { medium: { code: 'medium', prefLabel: { en: 'Medium-term occupancy', cs: 'Střednědobý pobyt' } } },
  'ventilation-type': {},
  'pollution-source': {},
  'sensor-status': {
    active: { code: 'active', prefLabel: { en: 'Active', cs: 'Aktivní' } },
  },
};
vi.mock('@/api/public/hooks', () => ({
  useCodelistScheme: (scheme: string) => ({ data: SCHEMES[scheme] ?? {}, isLoading: false }),
}));

const API = 'http://public.test/public';

const buildingsPage = {
  items: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      iri: `${API}/v1/buildings/11111111-1111-1111-1111-111111111111`,
      name: 'Rajská budova',
      address: { streetName: 'nám. W. Churchilla', houseNumber: 1938, municipalityName: 'Praha' },
      buildingTypeCode: 'educational',
      license: 'CC-BY',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      iri: `${API}/v1/buildings/22222222-2222-2222-2222-222222222222`,
      name: null,
      address: {},
      buildingTypeCode: 'office',
      license: 'CC-BY',
    },
  ],
  page: 1,
  pageSize: 20,
  total: 2,
  next: null,
  license: 'CC-BY',
};

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('BrowsePage', () => {
  it('lists buildings with type labels and links to public detail pages', async () => {
    server.use(
      http.get(`${API}/v1/buildings/`, () => HttpResponse.json(buildingsPage)),
    );

    renderWithProviders(<BrowsePage />, { withRouter: true });

    const link = await screen.findByRole('link', { name: 'Rajská budova' });
    expect(link).toHaveAttribute('href', '/buildings/11111111-1111-1111-1111-111111111111');
    // Codelist label resolved from the SKOS scheme, address line formatted.
    expect((await screen.findAllByText('Educational building')).length).toBeGreaterThan(0);
    expect(screen.getByText(/nám\. W\. Churchilla 1938, Praha/)).toBeInTheDocument();
    // Unnamed buildings get the fallback label.
    expect(screen.getByRole('link', { name: 'Unnamed building' })).toBeInTheDocument();
  });

  it('offers the building-type filter (F14) populated from the codelist', async () => {
    server.use(
      http.get(`${API}/v1/buildings/`, () => HttpResponse.json(buildingsPage)),
    );

    renderWithProviders(<BrowsePage />, { withRouter: true });

    await screen.findByRole('link', { name: 'Rajská budova' });
    expect(
      await screen.findByRole('option', { name: 'Office building' }),
    ).toBeInTheDocument();
  });

  it('shows the empty state when no buildings match', async () => {
    server.use(
      http.get(`${API}/v1/buildings/`, () =>
        HttpResponse.json({ ...buildingsPage, items: [], total: 0 }),
      ),
    );

    renderWithProviders(<BrowsePage />, { withRouter: true });

    expect(
      await screen.findByText('No buildings match the selected filters.'),
    ).toBeInTheDocument();
  });
});
