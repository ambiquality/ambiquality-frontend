import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { RoomNewPage } from './RoomNewPage';

const mutateAsync = vi.fn();
vi.mock('./queries', () => ({
  useRegisterRoom: () => ({ mutateAsync, isPending: false }),
}));

// function / exposure / ventilation are Public.Api SKOS codelist selects. One mock backs every
// `useCodelistScheme(scheme)` call — each scheme returns a small ready set so the options exist.
const SCHEMES: Record<string, Record<string, { code: string; prefLabel: { en: string; cs: string } }>> = {
  'room-function': { office: { code: 'office', prefLabel: { en: 'Office', cs: 'Kancelář' } } },
  exposure: { north: { code: 'north', prefLabel: { en: 'North', cs: 'Sever' } } },
  'ventilation-type': {
    natural: { code: 'natural', prefLabel: { en: 'Natural', cs: 'Přirozené' } },
  },
};
vi.mock('@/api/public/hooks', () => ({
  useCodelistScheme: (scheme: string) => ({ data: SCHEMES[scheme] ?? {}, isLoading: false }),
}));

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/operator/buildings/:buildingId/rooms/new" element={<RoomNewPage />} />
      <Route
        path="/operator/buildings/:buildingId/rooms/:roomId"
        element={<div>room-detail</div>}
      />
    </Routes>,
    { routerProps: { initialEntries: ['/operator/buildings/b1/rooms/new'] } },
  );
}

function setField(labelRe: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(labelRe), { target: { value } });
}

beforeEach(() => mutateAsync.mockReset());

describe('RoomNewPage (F06 register)', () => {
  it('POSTs picked codelist codes and leaves blank optional codes null', async () => {
    mutateAsync.mockResolvedValue({ id: 'rm-1' });
    renderPage();

    setField(/^Name/, 'Lab 1');
    setField(/^Floor/, '2');
    // Function is a select now; pick a real code, leave exposure + ventilation blank.
    setField(/^Function/, 'office');
    fireEvent.click(screen.getByRole('button', { name: 'Register room' }));

    await waitFor(() => expect(screen.getByText('room-detail')).toBeInTheDocument());
    const body = mutateAsync.mock.calls[0][0];
    expect(body).toMatchObject({ name: 'Lab 1', floor: 2, functionCode: 'office' });
    // Untouched optional selects submit as null (blank → null logic preserved).
    expect(body.exposureCode).toBeNull();
    expect(body.ventilationType).toBeNull();
  });

  it('renders codelist selects (not text inputs) for the optional fields', () => {
    renderPage();
    expect((screen.getByLabelText(/^Function/) as HTMLElement).tagName).toBe('SELECT');
    expect((screen.getByLabelText(/^Exposure/) as HTMLElement).tagName).toBe('SELECT');
    expect((screen.getByLabelText(/^Ventilation/) as HTMLElement).tagName).toBe('SELECT');
  });
});
