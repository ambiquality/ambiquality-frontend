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
  addressPointCode: 21794547,
  streetName: 'nám. W. Churchilla',
  houseNumber: 1938,
  houseNumberType: 'č.p.',
  orientationNumber: 4,
  orientationNumberLetter: null,
  municipalityName: 'Praha',
  municipalityPartName: 'Žižkov',
  psc: '13067',
  districtName: 'Hlavní město Praha',
  regionName: 'Hlavní město Praha',
  streetCode: 727059,
  municipalityCode: 554782,
  municipalityPartCode: 490067,
  districtCode: 3100,
  regionCode: 19,
  latitude: 50.0837,
  longitude: 14.4407,
  text: 'nám. W. Churchilla 1938/4, 130 67 Praha 3 - Žižkov',
};

beforeEach(() => {
  suggestState.data = [];
  suggestState.isFetching = false;
  suggestState.isError = false;
  resolveFn.mockReset();
});

describe('AddressAutocomplete', () => {
  it('resolves the picked suggestion and reports the full address', async () => {
    suggestState.data = [
      { text: 'nám. W. Churchilla 1938/4, 13067 Praha 3 - Žižkov', key: '1_21794547' },
    ];
    resolveFn.mockResolvedValue(RESOLVED);
    const onResolve = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<AddressAutocomplete onResolve={onResolve} />);

    await user.click(screen.getByRole('combobox', { name: /Find address in RÚIAN/i }));
    await user.click(await screen.findByRole('option', { name: /Churchilla/i }));

    await waitFor(() => expect(onResolve).toHaveBeenCalledWith(RESOLVED));
    expect(resolveFn).toHaveBeenCalledWith('1_21794547');
  });

  it('shows the manual-entry degradation message when suggest fails', () => {
    suggestState.isError = true;
    renderWithProviders(<AddressAutocomplete onResolve={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/unavailable/i);
  });

  it('surfaces degradation when resolving a pick fails', async () => {
    suggestState.data = [
      { text: 'nám. W. Churchilla 1938/4, 13067 Praha 3 - Žižkov', key: '1_21794547' },
    ];
    resolveFn.mockRejectedValue(new Error('502'));
    const onResolve = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<AddressAutocomplete onResolve={onResolve} />);

    await user.click(screen.getByRole('combobox', { name: /Find address in RÚIAN/i }));
    await user.click(await screen.findByRole('option', { name: /Churchilla/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/unavailable/i));
    expect(onResolve).not.toHaveBeenCalled();
  });

  it('credits ČÚZK / RÚIAN as the open-data source', () => {
    renderWithProviders(<AddressAutocomplete onResolve={vi.fn()} />);
    expect(screen.getByText(/ČÚZK \/ RÚIAN/)).toBeInTheDocument();
  });
});
