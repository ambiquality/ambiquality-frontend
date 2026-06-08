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

vi.mock('./queries', () => ({
  useSensor: () => ({ data: sensorSnapshot, isLoading: false, error: null }),
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
  const base = '/operator/buildings/:buildingId/rooms/:roomId/sensors/:sensorId';
  return renderWithProviders(
    <Routes>
      <Route path={base} element={<SensorDetailPage />} />
      <Route path={`${base}/edit`} element={<div>sensor-edit</div>} />
      <Route path={`${base}/history`} element={<div>sensor-history</div>} />
    </Routes>,
    { routerProps: { initialEntries: ['/operator/buildings/b1/rooms/r1/sensors/sns-1'] } },
  );
}

describe('SensorDetailPage (read-only card)', () => {
  it('shows identity, status label, and measured quantities on the card', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Acme X100' })).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    // Measured quantities are listed on the card (resolved to their property label). The label also
    // titles the charts section below, so it may appear more than once.
    expect(screen.getAllByText('Carbon dioxide').length).toBeGreaterThanOrEqual(1);
    // No inline edit/collection controls on the read-only screen.
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Move to room/)).toBeNull();
  });

  it('shows the GUID id as a copyable ingestion identifier', () => {
    renderPage();
    const idField = screen.getByText('Sensor ID (for ingestion)');
    expect(idField).toBeInTheDocument();
    // The raw GUID (the sensor id, not the uriSlug-based public URI) is rendered for copying.
    expect(screen.getByText('sns-1', { selector: 'code' })).toBeInTheDocument();
  });

  it('links to the Edit and History sub-routes', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/operator/buildings/b1/rooms/r1/sensors/sns-1/edit',
    );
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute(
      'href',
      '/operator/buildings/b1/rooms/r1/sensors/sns-1/history',
    );
  });
});
