import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
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
  anonymizationLevel: 'exact',
  yearBuilt: 1990,
  yearRenovated: null,
  asOf: '2026-06-06T00:00:00Z',
};

const useBuilding = vi.fn();
const changeName = vi.fn().mockResolvedValue(undefined);

vi.mock('./queries', () => ({
  useBuilding: (...args: unknown[]) => useBuilding(...args),
  useRooms: () => ({ isLoading: false, data: [] }),
}));

vi.mock('./attribute-mutations', () => ({
  useChangeBuildingName: () => ({ mutateAsync: changeName }),
  useChangeBuildingAddress: () => ({ mutateAsync: vi.fn() }),
  useChangeBuildingType: () => ({ mutateAsync: vi.fn() }),
  useChangeBuildingLocation: () => ({ mutateAsync: vi.fn() }),
  useChangeBuildingYears: () => ({ mutateAsync: vi.fn() }),
}));

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/buildings/:buildingId" element={<BuildingDetailPage />} />
    </Routes>,
    { routerProps: { initialEntries: ['/admin/buildings/b1'] } },
  );
}

beforeEach(() => {
  useBuilding.mockReset();
  useBuilding.mockReturnValue({ isLoading: false, data: SNAPSHOT });
  changeName.mockClear();
});

describe('BuildingDetailPage (F07 temporal edit + asOf viewer)', () => {
  it('renders one attribute edit form per attribute (no single save-object form)', () => {
    renderPage();
    // Distinct attribute sections each have their own Save button.
    expect(screen.getByRole('heading', { name: 'Address' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Construction years' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Location' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Save' }).length).toBeGreaterThanOrEqual(5);
  });

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
