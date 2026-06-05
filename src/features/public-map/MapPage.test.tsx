import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { MapPage } from './MapPage';

describe('MapPage', () => {
  it('renders the map heading within the UI provider', () => {
    renderWithProviders(<MapPage />);
    expect(screen.getByRole('heading', { name: /interactive map/i })).toBeInTheDocument();
  });
});
