import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { MarkerTableFallback } from './MarkerTableFallback';
import type { MapSnapshotItem } from '@/api/public/map-types';

const items: MapSnapshotItem[] = [
  {
    buildingId: 'b1',
    slug: 'bld-a',
    name: 'Building A',
    lat: 50,
    lon: 14,
    latestValue: 700,
    observedAt: '2026-06-07T10:00:00Z',
    stale: false,
    sensorCount: 2,
  },
  {
    buildingId: 'b2',
    slug: 'bld-b',
    name: 'Building B',
    lat: 50,
    lon: 14,
    latestValue: null,
    observedAt: null,
    stale: true,
    sensorCount: 1,
  },
];

describe('MarkerTableFallback', () => {
  it('lists buildings, with a status for live values and a stale marker otherwise', () => {
    renderWithProviders(
      <MarkerTableFallback items={items} parameterCode="co2" unit="ppm" onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Building A' })).toBeInTheDocument();
    // CO₂ 700 ppm → good band label; the stale building shows "no recent data".
    expect(screen.getByText(/^good$/i)).toBeInTheDocument();
    expect(screen.getByText(/no recent data/i)).toBeInTheDocument();
  });

  it('activates a building (keyboard-operable button) to open its dialog selection', async () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <MarkerTableFallback items={items} parameterCode="co2" unit="ppm" onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Building A' }));
    expect(onSelect).toHaveBeenCalledWith({ buildingId: 'b1', slug: 'bld-a', name: 'Building A' });
  });

  it('shows an empty state when there are no buildings', () => {
    renderWithProviders(
      <MarkerTableFallback items={[]} parameterCode="co2" unit="ppm" onSelect={vi.fn()} />,
    );
    expect(screen.getByText(/no buildings to show/i)).toBeInTheDocument();
  });
});
