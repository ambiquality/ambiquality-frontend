import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { BuildingNewPage } from './BuildingNewPage';
import type { AddressSuggestion, ResolvedAddress } from './ruian/useAddressLookup';

const mutateAsync = vi.fn();
vi.mock('./queries', () => ({
  useRegisterBuilding: () => ({ mutateAsync, isPending: false }),
}));

// Control the RÚIAN address autocomplete so the registration form's lookup path is deterministic.
const ruianSuggest: { data: AddressSuggestion[]; isFetching: boolean; isError: boolean } = {
  data: [],
  isFetching: false,
  isError: false,
};
const resolveFn = vi.fn<(key: string) => Promise<ResolvedAddress>>();
vi.mock('./ruian/useAddressLookup', () => ({
  MIN_SUGGEST_LENGTH: 2,
  useAddressSuggest: () => ruianSuggest,
  useResolveAddress: () => resolveFn,
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
      <Route path="/operator/buildings/new" element={<BuildingNewPage />} />
      <Route path="/operator/buildings/:buildingId" element={<div>building-detail</div>} />
    </Routes>,
    { routerProps: { initialEntries: ['/operator/buildings/new'] } },
  );
}

/** Set a field by its accessible label via a single change event (fast + deterministic). */
function setField(labelRe: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(labelRe), { target: { value } });
}

function fillRequired() {
  setField(/^Name/, 'Main hall');
  setField(/^Address point code/, '21794547');
  setField(/^House number/, '1938');
  setField(/^House-number type/, 'č.p.');
  setField(/^Municipality(?![ -](part|code))/, 'Praha');
  setField(/^Postal code/, '13067');
  setField(/^Building type/, 'office');
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Register building' }));
}

beforeEach(() => {
  mutateAsync.mockReset();
  ruianSuggest.data = [];
  ruianSuggest.isFetching = false;
  ruianSuggest.isError = false;
  resolveFn.mockReset();
});

const RESOLVED: ResolvedAddress = {
  addressPointCode: 6265154,
  streetName: 'Revoluční',
  houseNumber: 93,
  houseNumberType: 'č.p.',
  orientationNumber: null,
  orientationNumberLetter: null,
  municipalityName: 'Dobrovíz',
  municipalityPartName: null,
  psc: '25261',
  districtName: 'Praha-západ',
  regionName: 'Středočeský kraj',
  streetCode: 428582,
  municipalityCode: 539171,
  municipalityPartCode: null,
  districtCode: 3210,
  regionCode: 27,
  latitude: 50.1166,
  longitude: 14.2181,
  text: 'Revoluční 93, 252 61 Dobrovíz',
};

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
      addressPointCode: 21794547,
      houseNumber: 1938,
      houseNumberType: 'č.p.',
      municipalityName: 'Praha',
      psc: '13067',
      buildingTypeCode: 'office',
    });
    // Optional fields left blank serialize to null (not '' / 0 / NaN) — incl. the RÚIAN codes.
    expect(body.streetName).toBeNull();
    expect(body.streetCode).toBeNull();
    expect(body.municipalityCode).toBeNull();
    expect(body.regionCode).toBeNull();
    expect(body.latitude).toBeNull();
    expect(body.yearBuilt).toBeNull();
  });

  it('fills the address fields from a RÚIAN autocomplete pick', async () => {
    ruianSuggest.data = [{ text: 'Revoluční 93, 25261 Dobrovíz', key: '1_555742' }];
    resolveFn.mockResolvedValue(RESOLVED);
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('combobox', { name: /Find address in RÚIAN/i }));
    await user.click(await screen.findByRole('option', { name: /Revoluční 93/i }));

    // The resolved RÚIAN address populates the required + optional fields (still editable).
    await waitFor(() =>
      expect(screen.getByLabelText(/^Address point code/)).toHaveValue('6265154'),
    );
    expect(screen.getByLabelText(/^Municipality(?![ -](part|code))/)).toHaveValue('Dobrovíz');
    expect(screen.getByLabelText(/^Postal code/)).toHaveValue('25261');
    expect(screen.getByLabelText('Street name')).toHaveValue('Revoluční');
    expect(screen.getByLabelText('Region')).toHaveValue('Středočeský kraj');
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
