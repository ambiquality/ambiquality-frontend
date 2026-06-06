import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { BuildingDetailPage } from './BuildingDetailPage';

const SNAPSHOT = {
  id: 'b1',
  uriSlug: 'bld-x',
  ownerId: 'o1',
  name: 'Main hall',
  street: 'Náměstí 1',
  city: 'Praha',
  postcode: '11000',
  country: 'CZ',
  buildingTypeCode: 'office',
  latitude: 50,
  longitude: 14,
  anonymizationLevel: 'precise',
  yearBuilt: 1990,
  yearRenovated: null,
  asOf: '2026-06-06T00:00:00Z',
};

const useBuilding = vi.fn();
const useRooms = vi.fn();

vi.mock('./queries', () => ({
  useBuilding: (...args: unknown[]) => useBuilding(...args),
  useRooms: (...args: unknown[]) => useRooms(...args),
}));

// Building type is resolved to its codelist label on the summary card.
vi.mock('@/api/public/hooks', () => ({
  useCodelistScheme: () => ({
    data: { office: { code: 'office', prefLabel: { en: 'Office building', cs: 'Administrativní budova' } } },
    isLoading: false,
  }),
}));

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/operator/buildings/:buildingId" element={<BuildingDetailPage />} />
      <Route path="/operator/buildings/:buildingId/edit" element={<div>building-edit</div>} />
      <Route path="/operator/buildings/:buildingId/history" element={<div>building-history</div>} />
      <Route path="/operator/buildings/:buildingId/rooms/:roomId" element={<div>room-detail</div>} />
    </Routes>,
    { routerProps: { initialEntries: ['/operator/buildings/b1'] } },
  );
}

beforeEach(() => {
  useBuilding.mockReset();
  useBuilding.mockReturnValue({ isLoading: false, data: SNAPSHOT });
  useRooms.mockReset();
  useRooms.mockReturnValue({ isLoading: false, data: [] });
});

describe('BuildingDetailPage (read-only card + nested rooms)', () => {
  it('reads the latest snapshot and shows it as a read-only summary card', () => {
    renderPage();
    expect(useBuilding).toHaveBeenCalledWith('b1');
    expect(screen.getByRole('heading', { name: 'Main hall' })).toBeInTheDocument();
    expect(screen.getByText('Office building')).toBeInTheDocument();
    expect(screen.getByText('Náměstí 1, 11000 Praha, CZ')).toBeInTheDocument();
    // The stable slug is surfaced as a copyable full public URI.
    expect(screen.getByText(/\/buildings\/bld-x$/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    // No inline edit forms on the detail screen.
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('links to the Edit and History sub-routes', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/operator/buildings/b1/edit',
    );
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute(
      'href',
      '/operator/buildings/b1/history',
    );
  });

  it('paginates rooms and gives each a Details link', () => {
    const rooms = Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, name: `Room ${i}` }));
    useRooms.mockReturnValue({ isLoading: false, data: rooms });
    renderPage();

    // 10 per page → first page shows Room 0..9, not Room 10/11; pager status visible.
    expect(screen.getByText('Room 0')).toBeInTheDocument();
    expect(screen.queryByText('Room 10')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Details' }).length).toBe(10);
  });
});
