import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { BuildingEditPage } from './BuildingEditPage';

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
const changeName = vi.fn().mockResolvedValue(undefined);

vi.mock('./queries', () => ({
  useBuilding: (...args: unknown[]) => useBuilding(...args),
}));

vi.mock('./attribute-mutations', () => ({
  useChangeBuildingName: () => ({ mutateAsync: changeName }),
  useChangeBuildingAddress: () => ({ mutateAsync: vi.fn() }),
  useChangeBuildingType: () => ({ mutateAsync: vi.fn() }),
  useChangeBuildingLocation: () => ({ mutateAsync: vi.fn() }),
  useChangeBuildingYears: () => ({ mutateAsync: vi.fn() }),
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
      <Route path="/operator/buildings/:buildingId/edit" element={<BuildingEditPage />} />
    </Routes>,
    { routerProps: { initialEntries: ['/operator/buildings/b1/edit'] } },
  );
}

beforeEach(() => {
  useBuilding.mockReset();
  useBuilding.mockReturnValue({ isLoading: false, data: SNAPSHOT });
  changeName.mockClear();
});

describe('BuildingEditPage (F07 temporal edit)', () => {
  it('renders one attribute edit form per attribute (no single save-object form)', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Address' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Construction years' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Location' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Save' }).length).toBeGreaterThanOrEqual(5);
  });

  it('fires the per-attribute name PUT carrying validFrom', async () => {
    renderPage();

    // The first Save button belongs to the Name attribute form.
    const saveButtons = screen.getAllByRole('button', { name: 'Save' });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => expect(changeName).toHaveBeenCalledTimes(1));
    const body = changeName.mock.calls[0][0] as { newName: string; validFrom: string };
    expect(body.newName).toBe('Main hall');
    expect(body.validFrom).toMatch(/Z$/);
  });
});
