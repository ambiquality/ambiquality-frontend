import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { SensorHistoryPage } from './SensorHistoryPage';

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

const useSensor = vi.fn();

vi.mock('./queries', () => ({
  useSensor: (...args: unknown[]) => useSensor(...args),
}));

vi.mock('@/api/public/hooks', () => ({
  useCodelistScheme: () => ({
    data: { active: { code: 'active', prefLabel: { en: 'Active', cs: 'Aktivní' } } },
    isLoading: false,
  }),
  usePublicProperties: () => ({
    data: [{ code: 'co2', label: 'Carbon dioxide' }],
    isLoading: false,
  }),
}));

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/operator/buildings/:buildingId/rooms/:roomId/sensors/:sensorId/history"
        element={<SensorHistoryPage />}
      />
    </Routes>,
    { routerProps: { initialEntries: ['/operator/buildings/b1/rooms/r1/sensors/sns-1/history'] } },
  );
}

beforeEach(() => {
  useSensor.mockReset();
  useSensor.mockReturnValue({ data: sensorSnapshot, isLoading: false, error: null });
});

describe('SensorHistoryPage (F08 asOf projection)', () => {
  it('re-reads the sensor at the chosen asOf when the history viewer is applied', async () => {
    renderPage();

    // Initially latest (asOf null).
    expect(useSensor).toHaveBeenCalledWith('b1', 'r1', 'sns-1', null);

    fireEvent.change(screen.getByLabelText('Show state as of'), {
      target: { value: '2025-03-01T09:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'View' }));

    await waitFor(() => {
      const lastCall = useSensor.mock.calls.at(-1);
      expect(lastCall?.[3]).toMatch(/^2025-03-01T/);
    });
  });
});
