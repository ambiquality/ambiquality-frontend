import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';
import type { ParsedCatalog } from '@/api/public/catalog-types';
import { ArchivePage } from './ArchivePage';

/**
 * Component tests for the Archive page. `/v1/catalog`'s openapi-fetch client binds `globalThis.fetch`
 * at import and so bypasses MSW; per the project gotcha we drive the four UI states by mocking the
 * `useCatalog` hook directly instead of mocking the network.
 */

const useCatalog = vi.fn();

vi.mock('@/api/public/catalog-hooks', () => ({
  useCatalog: () => useCatalog(),
}));

const PARSED: ParsedCatalog = {
  catalog: {},
  dataset: { keywords: [], contact: {} },
  liveDistributions: [
    { title: 'Observations as CSV', url: 'https://api.example/v1/observations.csv', mediaType: 'text/csv' },
  ],
  archives: [
    {
      title: 'Measurements 2025-05',
      downloadUrl: 'https://storage.example/2025-05.csv.zip',
      mediaType: 'text/csv',
      compressFormat: 'application/zip',
      byteSize: 123456,
      period: { start: '2025-05-01T00:00:00Z', end: '2025-06-01T00:00:00Z' },
    },
    {
      title: 'Measurements 2025-03',
      downloadUrl: 'https://storage.example/2025-03.csv.zip',
      mediaType: 'text/csv',
      compressFormat: 'application/zip',
      // size deliberately absent → em-dash
      period: { start: '2025-03-01T00:00:00Z', end: '2025-04-01T00:00:00Z' },
    },
  ],
};

function mockState(overrides: Record<string, unknown>) {
  useCatalog.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  useCatalog.mockReset();
});

describe('ArchivePage', () => {
  it('shows a spinner while loading', () => {
    mockState({ isLoading: true });
    renderWithProviders(<ArchivePage />, { withRouter: true });
    expect(screen.getByLabelText('Loading archives…')).toBeInTheDocument();
  });

  it('renders an informative banner (with the live fallback) on error', () => {
    mockState({ isError: true, data: PARSED });
    renderWithProviders(<ArchivePage />, { withRouter: true });
    expect(screen.getByText('Archives are unavailable')).toBeInTheDocument();
    // The live full-export download stays available as a fallback.
    expect(
      screen.getByRole('link', { name: 'Download all observations (CSV)' }),
    ).toHaveAttribute('href', 'https://api.example/v1/observations.csv');
  });

  it('shows a friendly empty state (not an error) when no archives are published', () => {
    mockState({ data: { ...PARSED, archives: [] } });
    renderWithProviders(<ArchivePage />, { withRouter: true });
    expect(screen.getByText('No archives published yet')).toBeInTheDocument();
    // No table is rendered.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders the archive table newest-first with size and download links', () => {
    mockState({ data: PARSED });
    renderWithProviders(<ArchivePage />, { withRouter: true });

    const rows = screen.getAllByRole('row');
    // header + 2 data rows
    expect(rows).toHaveLength(3);

    // Size: present for May, em-dash for March.
    expect(screen.getByText('120.6 KB')).toBeInTheDocument();

    // Format label.
    expect(screen.getAllByText('CSV · ZIP')).toHaveLength(2);

    // Download links carry the `download` attribute and point at the archive URLs.
    const mayLink = screen.getByRole('link', { name: /May 2025/i });
    expect(mayLink).toHaveAttribute('href', 'https://storage.example/2025-05.csv.zip');
    expect(mayLink).toHaveAttribute('download');
  });

  it('has no accessibility violations in the populated state', async () => {
    mockState({ data: PARSED });
    const { container } = renderWithProviders(<ArchivePage />, { withRouter: true });
    await expectNoA11yViolations(container);
  });
});
