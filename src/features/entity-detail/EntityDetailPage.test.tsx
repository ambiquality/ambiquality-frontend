import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/render';
import { server } from '@/mocks/server';
import { EntityDetailPage } from './EntityDetailPage';

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
const BUILDING_ID = '11111111-1111-1111-1111-111111111111';
const ROOM_ID = '33333333-3333-3333-3333-333333333333';
const SENSOR_ID = '44444444-4444-4444-4444-444444444444';

const building = {
  id: BUILDING_ID,
  iri: `${API}/v1/buildings/${BUILDING_ID}`,
  name: 'Rajská budova',
  address: { streetName: 'nám. W. Churchilla', houseNumber: 1938, municipalityName: 'Praha' },
  buildingTypeCode: 'educational',
  latitude: 50.0844,
  longitude: 14.4416,
  yearBuilt: 2009,
  license: 'CC-BY',
};

const room = {
  id: ROOM_ID,
  iri: `${API}/v1/rooms/${ROOM_ID}`,
  buildingId: BUILDING_ID,
  name: 'NB 471',
  floor: 4,
  functionCode: 'classroom',
  exposureCode: 'medium',
  pollutionSources: [],
  license: 'CC-BY',
};

const sensor = {
  id: SENSOR_ID,
  iri: `${API}/v1/sensors/${SENSOR_ID}`,
  buildingId: BUILDING_ID,
  roomId: ROOM_ID,
  manufacturer: 'Sensirion',
  model: 'SCD41',
  serialNumber: 'SN-001',
  statusCode: 'active',
  measuredParameters: [{ code: 'co2', quantityKindUri: null, unitUri: null }],
  license: 'CC-BY',
};

function stubCatalog() {
  server.use(
    http.get(`${API}/v1/buildings/${BUILDING_ID}`, () => HttpResponse.json(building)),
    http.get(`${API}/v1/buildings/${BUILDING_ID}/rooms`, () =>
      HttpResponse.json({ items: [room], page: 1, pageSize: 20, total: 1, next: null, license: 'CC-BY' }),
    ),
    http.get(`${API}/v1/rooms/${ROOM_ID}`, () => HttpResponse.json(room)),
    http.get(`${API}/v1/rooms/${ROOM_ID}/sensors`, () =>
      HttpResponse.json({ items: [sensor], page: 1, pageSize: 20, total: 1, next: null, license: 'CC-BY' }),
    ),
    http.get(`${API}/v1/sensors/${SENSOR_ID}`, () => HttpResponse.json(sensor)),
    http.get(`${API}/v1/properties`, () => HttpResponse.json({ items: [] })),
    http.get(`${API}/v1/observations/aggregate`, () =>
      HttpResponse.json({ unit: 'ppm', stats: null, buckets: [] }),
    ),
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('EntityDetailPage', () => {
  it('renders the building detail with attributes and its rooms (UC18 click-through)', async () => {
    stubCatalog();

    renderWithProviders(
      <Routes>
        <Route path="/buildings/:id" element={<EntityDetailPage kind="building" />} />
      </Routes>,
      { withRouter: true, routerProps: { initialEntries: [`/buildings/${BUILDING_ID}`] } },
    );

    expect(await screen.findByRole('heading', { name: 'Rajská budova' })).toBeInTheDocument();
    expect(screen.getByText(/nám\. W\. Churchilla 1938, Praha/)).toBeInTheDocument();
    expect(screen.getByText('2009')).toBeInTheDocument();
    // The room drill-down link.
    expect(await screen.findByRole('link', { name: 'NB 471' })).toHaveAttribute(
      'href',
      `/rooms/${ROOM_ID}`,
    );
  });

  it('renders the room detail with a breadcrumb back to the building', async () => {
    stubCatalog();

    renderWithProviders(
      <Routes>
        <Route path="/rooms/:id" element={<EntityDetailPage kind="room" />} />
      </Routes>,
      { withRouter: true, routerProps: { initialEntries: [`/rooms/${ROOM_ID}`] } },
    );

    expect(await screen.findByRole('heading', { name: 'NB 471' })).toBeInTheDocument();
    const breadcrumb = await screen.findByRole('navigation', { name: /breadcrumb/i });
    expect(breadcrumb).toHaveTextContent('Rajská budova');
    expect(await screen.findByRole('link', { name: /Sensirion SCD41/ })).toHaveAttribute(
      'href',
      `/sensors/${SENSOR_ID}`,
    );
  });

  it('renders the sensor detail with the range selector for its history charts (ROZ-03)', async () => {
    stubCatalog();

    renderWithProviders(
      <Routes>
        <Route path="/sensors/:id" element={<EntityDetailPage kind="sensor" />} />
      </Routes>,
      { withRouter: true, routerProps: { initialEntries: [`/sensors/${SENSOR_ID}`] } },
    );

    expect(await screen.findByRole('heading', { name: 'Sensirion SCD41' })).toBeInTheDocument();
    expect(screen.getByText('SN-001')).toBeInTheDocument();
    // The shared four-window look-back selector.
    expect(await screen.findByRole('radio', { name: /last day/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /last year/i })).toBeInTheDocument();
  });
});
