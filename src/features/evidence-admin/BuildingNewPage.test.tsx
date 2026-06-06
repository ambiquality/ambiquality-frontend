import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { BuildingNewPage } from './BuildingNewPage';

const mutateAsync = vi.fn();
vi.mock('./queries', () => ({
  useRegisterBuilding: () => ({ mutateAsync, isPending: false }),
}));

// Building type is a Public.Api SKOS codelist select; supply a ready scheme so its options exist.
vi.mock('@/api/public/hooks', () => ({
  useCodelistScheme: () => ({
    data: {
      office: { code: 'office', prefLabel: { en: 'Office building', cs: 'Administrativní budova' } },
      residential: { code: 'residential', prefLabel: { en: 'Residential', cs: 'Bytový dům' } },
    },
    isLoading: false,
  }),
}));

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/buildings/new" element={<BuildingNewPage />} />
      <Route path="/admin/buildings/:buildingId" element={<div>building-detail</div>} />
    </Routes>,
    { routerProps: { initialEntries: ['/admin/buildings/new'] } },
  );
}

/** Set a field by its accessible label via a single change event (fast + deterministic). */
function setField(labelRe: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(labelRe), { target: { value } });
}

function fillRequired() {
  setField(/^Name/, 'Main hall');
  setField(/^Street/, 'Náměstí 1');
  setField(/^City/, 'Praha');
  setField(/^Postcode/, '11000');
  setField(/^Country/, 'CZ');
  setField(/^Building type/, 'office');
  setField(/^Coordinate precision/, 'precise');
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Register building' }));
}

beforeEach(() => mutateAsync.mockReset());

describe('BuildingNewPage (F05 register)', () => {
  it('POSTs the building and navigates to its detail on success', async () => {
    mutateAsync.mockResolvedValue({ id: 'bld-1', uriSlug: 'bld-main' });
    renderPage();

    fillRequired();
    submit();

    await waitFor(() => expect(screen.getByText('building-detail')).toBeInTheDocument());
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    const body = mutateAsync.mock.calls[0][0];
    expect(body).toMatchObject({
      name: 'Main hall',
      street: 'Náměstí 1',
      city: 'Praha',
      postcode: '11000',
      country: 'CZ',
      buildingTypeCode: 'office',
      anonymizationLevel: 'precise',
    });
    // Optional numeric fields left blank serialize to null (not 0 / NaN).
    expect(body.latitude).toBeNull();
    expect(body.yearBuilt).toBeNull();
  });

  it('coerces filled optional numeric fields to numbers', async () => {
    mutateAsync.mockResolvedValue({ id: 'bld-2', uriSlug: 'bld-2' });
    renderPage();

    fillRequired();
    setField(/^Latitude/, '50.1');
    setField(/^Year built/, '1990');
    submit();

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    const body = mutateAsync.mock.calls[0][0];
    expect(body.latitude).toBe(50.1);
    expect(body.yearBuilt).toBe(1990);
  });
});
