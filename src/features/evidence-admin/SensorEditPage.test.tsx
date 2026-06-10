import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { SensorEditPage } from './SensorEditPage';

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
  installation: {
    positionNote: 'wall opposite the window',
    distanceWindowM: 2.5,
    distanceDoorM: null,
    distanceSourceM: null,
    measurementFrequencySeconds: 300,
    installedOn: '2026-01-15',
    lastCalibratedOn: null,
  },
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
const installationMutateAsync = vi.fn().mockResolvedValue(undefined);
vi.mock('./attribute-mutations', () => ({
  useChangeSensorIdentity: () => noopMutation,
  useChangeSensorStatus: () => noopMutation,
  useChangeSensorPlacement: () => noopMutation,
  useChangeSensorInstallation: () => ({ mutateAsync: installationMutateAsync }),
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
        path="/operator/buildings/:buildingId/rooms/:roomId/sensors/:sensorId/edit"
        element={<SensorEditPage />}
      />
    </Routes>,
    { routerProps: { initialEntries: ['/operator/buildings/b1/rooms/r1/sensors/sns-1/edit'] } },
  );
}

describe('SensorEditPage (F09 relocate + collections)', () => {
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

  it('prefills the F08 installation form and PUTs the full composite with validFrom', async () => {
    renderPage();

    // Prefilled from the snapshot's installation projection.
    expect(screen.getByLabelText(/^Position in the room/)).toHaveValue(
      'wall opposite the window',
    );
    expect(screen.getByLabelText(/^Distance to window/)).toHaveValue('2.5');

    // Change one field; the PUT carries the COMPLETE new composite value.
    fireEvent.change(screen.getByLabelText(/^Distance to door/), { target: { value: '1.2' } });
    const installationHeading = screen.getByRole('heading', { name: 'Installation details' });
    const section = installationHeading.closest('section')!;
    fireEvent.click(within(section).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(installationMutateAsync).toHaveBeenCalledTimes(1));
    expect(installationMutateAsync.mock.calls[0][0]).toMatchObject({
      positionNote: 'wall opposite the window',
      distanceWindowM: 2.5,
      distanceDoorM: 1.2,
      distanceSourceM: null,
      measurementFrequencySeconds: 300,
      installedOn: '2026-01-15',
      lastCalibratedOn: null,
    });
    expect(installationMutateAsync.mock.calls[0][0].validFrom).toMatch(/Z$/);
  });
});
