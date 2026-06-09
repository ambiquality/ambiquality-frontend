import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { BuildingHistoryPage } from './BuildingHistoryPage';

const SNAPSHOT = {
  id: 'b1',
  uriSlug: 'bld-x',
  ownerId: 'o1',
  name: 'Main hall',
  addressPointCode: 21794547,
  streetName: 'Náměstí Winstona Churchilla',
  houseNumber: 1938,
  houseNumberType: 'č.p.',
  orientationNumber: 4,
  orientationNumberLetter: null,
  municipalityName: 'Praha',
  municipalityPartName: 'Žižkov',
  psc: '13067',
  districtName: 'Hlavní město Praha',
  regionName: 'Hlavní město Praha',
  streetCode: 466123,
  municipalityCode: 554782,
  municipalityPartCode: 490067,
  districtCode: 1100,
  regionCode: 19,
  buildingTypeCode: 'office',
  latitude: 50,
  longitude: 14,
  yearBuilt: 1990,
  yearRenovated: null,
  asOf: '2026-06-06T00:00:00Z',
};

const useBuilding = vi.fn();

vi.mock('./queries', () => ({
  useBuilding: (...args: unknown[]) => useBuilding(...args),
}));

vi.mock('@/api/public/hooks', () => ({
  useCodelistScheme: () => ({
    data: { office: { code: 'office', prefLabel: { en: 'Office building', cs: 'Administrativní budova' } } },
    isLoading: false,
  }),
}));

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/operator/buildings/:buildingId/history" element={<BuildingHistoryPage />} />
    </Routes>,
    { routerProps: { initialEntries: ['/operator/buildings/b1/history'] } },
  );
}

beforeEach(() => {
  useBuilding.mockReset();
  useBuilding.mockReturnValue({ isLoading: false, data: SNAPSHOT });
});

describe('BuildingHistoryPage (F07 asOf projection)', () => {
  it('re-reads the building at the chosen asOf when the history viewer is applied', async () => {
    renderPage();

    // Initially latest (asOf null).
    expect(useBuilding).toHaveBeenCalledWith('b1', null);

    fireEvent.change(screen.getByLabelText('Show state as of'), {
      target: { value: '2025-03-01T09:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'View' }));

    await waitFor(() => {
      const lastCall = useBuilding.mock.calls.at(-1);
      expect(lastCall?.[0]).toBe('b1');
      expect(String(lastCall?.[1])).toMatch(/^2025-03-01T/);
    });
  });
});
