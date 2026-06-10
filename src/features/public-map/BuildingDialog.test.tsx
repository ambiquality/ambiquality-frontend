import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { server } from '@/mocks/server';
import { BuildingDialog } from './BuildingDialog';
import type { MarkerSelection } from './MapView';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const selection: MarkerSelection = {
  buildingId: '11111111-1111-1111-1111-111111111111',
  slug: 'bld-rajska-budova',
  name: 'Rajská budova (VŠE)',
};

describe('BuildingDialog', () => {
  it('opens for a selection and loads the day summary on demand', async () => {
    renderWithProviders(
      <BuildingDialog selection={selection} parameterCode="co2" unit="ppm" onClose={vi.fn()} />,
      { withRouter: true },
    );

    // The dialog shows the building name and the four range options.
    expect(await screen.findByText(/Rajská budova/, undefined, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText(/last day/i)).toBeInTheDocument();
    expect(screen.getByText(/last year/i)).toBeInTheDocument();

    // The aggregate fetch (only now, only for "day") resolves into the distribution summary.
    expect(await screen.findByText(/^summary$/i, undefined, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText(/measurements/i)).toBeInTheDocument();
  });

  it('fetches a different range when the range changes', async () => {
    renderWithProviders(
      <BuildingDialog selection={selection} parameterCode="co2" unit="ppm" onClose={vi.fn()} />,
      { withRouter: true },
    );
    await screen.findByText(/^summary$/i, undefined, { timeout: 5000 });

    await userEvent.click(screen.getByText(/last week/i));

    // The summary re-renders for the new range without error.
    await waitFor(() => expect(screen.getByText(/^summary$/i)).toBeInTheDocument(), {
      timeout: 5000,
    });
  });

  it('does not render dialog content when there is no selection', () => {
    renderWithProviders(
      <BuildingDialog selection={null} parameterCode="co2" unit="ppm" onClose={vi.fn()} />,
      { withRouter: true },
    );
    expect(screen.queryByText(/^summary$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/last day/i)).not.toBeInTheDocument();
  });

  it('links through to the public building detail route', async () => {
    renderWithProviders(
      <BuildingDialog selection={selection} parameterCode="co2" unit="ppm" onClose={vi.fn()} />,
      { withRouter: true },
    );
    const link = await screen.findByRole(
      'link',
      { name: /view building detail/i },
      { timeout: 5000 },
    );
    // Detail routes resolve by the persistent GUID (the id the Public.Api catalog serves).
    expect(link).toHaveAttribute('href', '/buildings/11111111-1111-1111-1111-111111111111');
  });
});
