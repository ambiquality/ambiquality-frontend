import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { SensorDetailPage } from './SensorDetailPage';

const sensorSnapshot = {
  id: 'sns-1',
  uriSlug: 'sns-1',
  buildingId: 'b1',
  roomId: 'r1',
  manufacturer: 'Acme',
  model: 'X100',
  serialNumber: 'SN-1',
  statusCode: 'active',
  measuredParameters: [{ code: 'co2' }],
  asOf: '2026-06-06T00:00:00Z',
};

const rooms = [
  { id: 'r1', name: 'Room One' },
  { id: 'r2', name: 'Room Two' },
  { id: 'r3', name: 'Room Three' },
];

vi.mock('./queries', () => ({
  useSensor: () => ({ data: sensorSnapshot, isLoading: false, error: null }),
  useRooms: () => ({ data: rooms, isLoading: false }),
}));

const noopMutation = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
vi.mock('./attribute-mutations', () => ({
  useChangeSensorIdentity: () => noopMutation,
  useChangeSensorStatus: () => noopMutation,
  useChangeSensorPlacement: () => noopMutation,
  useAddMeasuredParameter: () => noopMutation,
  useRemoveMeasuredParameter: () => noopMutation,
}));

vi.mock('@/api/public/hooks', () => ({
  useCodelistScheme: () => ({
    data: { active: { code: 'active', prefLabel: { en: 'Active', cs: 'Aktivní' } } },
    isLoading: false,
  }),
  usePublicProperties: () => ({
    data: [
      { code: 'co2', label: 'Carbon dioxide' },
      { code: 'pm25', label: 'PM2.5' },
    ],
    isLoading: false,
  }),
}));

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/admin/buildings/:buildingId/rooms/:roomId/sensors/:sensorId"
        element={<SensorDetailPage />}
      />
    </Routes>,
    { routerProps: { initialEntries: ['/admin/buildings/b1/rooms/r1/sensors/sns-1'] } },
  );
}

describe('SensorDetailPage (F09 relocate + collections)', () => {
  it('offers sibling rooms in the relocate picker but excludes the current room', () => {
    renderPage();
    const select = screen.getByLabelText(/Move to room/) as HTMLSelectElement;
    expect(select.tagName).toBe('SELECT');
    // Current room (r1 / "Room One") is not a relocation target.
    expect(screen.queryByRole('option', { name: 'Room One' })).toBeNull();
    expect(screen.getByRole('option', { name: 'Room Two' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Room Three' })).toBeInTheDocument();
  });

  it('drives measured parameters from the property catalogue, excluding present codes', () => {
    renderPage();
    // Already-present 'co2' renders as a labeled tag, and is excluded from the add picker.
    expect(screen.getByText('Carbon dioxide')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Carbon dioxide' })).toBeNull();
    expect(screen.getByRole('option', { name: 'PM2.5' })).toBeInTheDocument();
  });
});
