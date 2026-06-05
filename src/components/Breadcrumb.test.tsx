import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/render';
import { Breadcrumb } from './Breadcrumb';

const trail = [
  { label: 'Faculty Building', to: '/buildings/bld-1' },
  { label: 'Room 101', to: '/rooms/rm-1' },
  { label: 'CO₂ Sensor', to: '/sensors/sns-1' },
  { label: 'Measurement' },
];

function renderTrail() {
  return renderWithProviders(
    <MemoryRouter>
      <Breadcrumb items={trail} />
    </MemoryRouter>,
  );
}

describe('Breadcrumb', () => {
  it('renders a labeled navigation landmark with links for non-final segments', () => {
    renderTrail();
    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', '/buildings/bld-1');
  });

  it('marks the last segment with aria-current="page" and does not link it', () => {
    renderTrail();
    const current = screen.getByText('Measurement');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.closest('a')).toBeNull();
  });
});
