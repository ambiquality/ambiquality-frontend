import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { AddressAutocomplete } from './AddressAutocomplete';
import type { AddressSuggestion, ResolvedAddress } from '../ruian/useAddressLookup';

// Control the RÚIAN hooks directly so the component test is deterministic and offline (the hooks
// themselves are thin typed wrappers over evidenceClient, exercised end-to-end elsewhere).
const suggestState: { data: AddressSuggestion[]; isFetching: boolean; isError: boolean } = {
  data: [],
  isFetching: false,
  isError: false,
};
const resolveFn = vi.fn<(key: string) => Promise<ResolvedAddress>>();

vi.mock('../ruian/useAddressLookup', () => ({
  MIN_SUGGEST_LENGTH: 2,
  useAddressSuggest: () => suggestState,
  useResolveAddress: () => resolveFn,
}));

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

beforeEach(() => {
  suggestState.data = [];
  suggestState.isFetching = false;
  suggestState.isError = false;
  resolveFn.mockReset();
});

describe('AddressAutocomplete', () => {
  it('resolves the picked suggestion and reports the full address', async () => {
    suggestState.data = [{ text: 'Revoluční 93, 25261 Dobrovíz', key: '1_555742' }];
    resolveFn.mockResolvedValue(RESOLVED);
    const onResolve = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<AddressAutocomplete onResolve={onResolve} />);

    await user.click(screen.getByRole('combobox', { name: /Find address in RÚIAN/i }));
    await user.click(await screen.findByRole('option', { name: /Revoluční 93/i }));

    await waitFor(() => expect(onResolve).toHaveBeenCalledWith(RESOLVED));
    expect(resolveFn).toHaveBeenCalledWith('1_555742');
  });

  it('shows the manual-entry degradation message when suggest fails', () => {
    suggestState.isError = true;
    renderWithProviders(<AddressAutocomplete onResolve={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/unavailable/i);
  });

  it('surfaces degradation when resolving a pick fails', async () => {
    suggestState.data = [{ text: 'Revoluční 93, 25261 Dobrovíz', key: '1_555742' }];
    resolveFn.mockRejectedValue(new Error('502'));
    const onResolve = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<AddressAutocomplete onResolve={onResolve} />);

    await user.click(screen.getByRole('combobox', { name: /Find address in RÚIAN/i }));
    await user.click(await screen.findByRole('option', { name: /Revoluční 93/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/unavailable/i));
    expect(onResolve).not.toHaveBeenCalled();
  });

  it('credits ČÚZK / RÚIAN as the open-data source', () => {
    renderWithProviders(<AddressAutocomplete onResolve={vi.fn()} />);
    expect(screen.getByText(/ČÚZK \/ RÚIAN/)).toBeInTheDocument();
  });
});
