import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { SensorNewPage } from './SensorNewPage';

const mutateAsync = vi.fn();
vi.mock('./queries', () => ({
  useRegisterSensor: () => ({ mutateAsync, isPending: false }),
}));

// Status is a Public.Api SKOS codelist (`sensor-status`) select; supply a ready scheme so its
// options exist without a network round-trip.
vi.mock('@/api/public/hooks', () => ({
  useCodelistScheme: () => ({
    data: {
      active: { code: 'active', prefLabel: { en: 'Active', cs: 'Aktivní' } },
      maintenance: { code: 'maintenance', prefLabel: { en: 'Maintenance', cs: 'Údržba' } },
    },
    isLoading: false,
  }),
}));

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/operator/buildings/:buildingId/rooms/:roomId/sensors/new"
        element={<SensorNewPage />}
      />
      <Route
        path="/operator/buildings/:buildingId/rooms/:roomId/sensors/:sensorId"
        element={<div>sensor-detail</div>}
      />
    </Routes>,
    { routerProps: { initialEntries: ['/operator/buildings/b1/rooms/r1/sensors/new'] } },
  );
}

function setField(labelRe: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(labelRe), { target: { value } });
}

function fill() {
  setField(/^Manufacturer/, 'Acme');
  setField(/^Model/, 'X100');
  setField(/^Serial number/, 'SN-1');
  setField(/^Status/, 'active');
}

beforeEach(() => mutateAsync.mockReset());

describe('SensorNewPage (F08 one-time API key)', () => {
  it('shows the one-time apiKey panel on success and does NOT navigate away yet', async () => {
    mutateAsync.mockResolvedValue({ id: 'sns-1', apiKey: 'amq_sk_secret', manufacturer: 'Acme' });
    renderPage();

    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Register sensor' }));

    await waitFor(() =>
      expect(screen.getByTestId('api-key-value')).toHaveTextContent('amq_sk_secret'),
    );
    // Status now comes from the `sensor-status` codelist select — the chosen code is POSTed.
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({
      manufacturer: 'Acme',
      model: 'X100',
      serialNumber: 'SN-1',
      statusCode: 'active',
    });
    // Must NOT auto-navigate to the detail screen — the key would be lost.
    expect(screen.queryByText('sensor-detail')).toBeNull();
    expect(screen.getByText(/only time this key is shown/i)).toBeInTheDocument();
  });

  it('sends installation: null when no F08 installation field is filled', async () => {
    mutateAsync.mockResolvedValue({ id: 'sns-1', apiKey: 'amq_sk_secret' });
    renderPage();

    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Register sensor' }));
    await screen.findByTestId('api-key-value');

    expect(mutateAsync.mock.calls[0][0].installation).toBeNull();
  });

  it('nests the F08 installation block when at least one field is filled', async () => {
    mutateAsync.mockResolvedValue({ id: 'sns-1', apiKey: 'amq_sk_secret' });
    renderPage();

    fill();
    setField(/^Position in the room/, 'wall opposite the window');
    setField(/^Distance to window/, '2.5');
    setField(/^Installed on/, '2026-01-15');
    fireEvent.click(screen.getByRole('button', { name: 'Register sensor' }));
    await screen.findByTestId('api-key-value');

    expect(mutateAsync.mock.calls[0][0].installation).toEqual({
      positionNote: 'wall opposite the window',
      distanceWindowM: 2.5,
      distanceDoorM: null,
      distanceSourceM: null,
      measurementFrequencySeconds: null,
      installedOn: '2026-01-15',
      lastCalibratedOn: null,
    });
  });

  it('navigates to the sensor detail only after the operator acknowledges the key', async () => {
    mutateAsync.mockResolvedValue({ id: 'sns-1', apiKey: 'amq_sk_secret' });
    renderPage();

    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Register sensor' }));
    await screen.findByTestId('api-key-value');

    fireEvent.click(screen.getByRole('button', { name: "I've saved it" }));
    await waitFor(() => expect(screen.getByText('sensor-detail')).toBeInTheDocument());
  });
});
