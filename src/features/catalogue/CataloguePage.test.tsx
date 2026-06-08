import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';
import type { ParsedCatalog } from '@/api/public/catalog-types';
import { CataloguePage } from './CataloguePage';

/**
 * Component tests for the human-readable Catalogue (DCAT-AP) page. As with the Archive page, the
 * `/v1/catalog` openapi-fetch client binds `globalThis.fetch` at import and bypasses MSW; per the
 * project gotcha we drive the UI states by mocking the shared `useCatalog` hook directly rather
 * than mocking the network.
 */

const useCatalog = vi.fn();

vi.mock('@/api/public/catalog-hooks', () => ({
  useCatalog: () => useCatalog(),
}));

const PARSED: ParsedCatalog = {
  catalog: {
    title: 'Ambiquality open data catalogue',
    description: 'Indoor environmental quality observations published as open data.',
  },
  dataset: {
    title: 'Indoor environmental quality observations',
    description: 'Time-series readings from registered buildings.',
    publisher: 'Ambiquality project',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    themeUri: 'http://publications.europa.eu/resource/authority/data-theme/ENVI',
    keywords: ['IEQ', 'open data', 'sensors'],
    accrualPeriodicityUri: 'http://publications.europa.eu/resource/authority/frequency/CONT',
    contact: { name: 'Ambiquality team', email: 'info@ambiquality.org' },
    issued: '2025-01-01',
    temporal: { start: '2025-01-01T00:00:00Z', end: '2025-12-31T00:00:00Z' },
    spatialBboxWkt: 'POLYGON((14 50, 15 50, 15 51, 14 51, 14 50))',
  },
  liveDistributions: [
    {
      title: 'Observations as JSON-LD',
      url: 'https://api.example/v1/observations',
      mediaType: 'application/ld+json',
    },
    {
      title: 'Observations as CSV',
      url: 'https://api.example/v1/observations.csv',
      mediaType: 'text/csv',
    },
  ],
  archives: [],
};

const SPARSE: ParsedCatalog = {
  catalog: {},
  dataset: { keywords: [], contact: {} },
  liveDistributions: [],
  archives: [],
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

describe('CataloguePage', () => {
  it('shows a spinner while loading', () => {
    mockState({ isLoading: true });
    renderWithProviders(<CataloguePage />, { withRouter: true });
    expect(screen.getByLabelText('Loading catalogue…')).toBeInTheDocument();
  });

  it('renders an informative banner with retry on error', () => {
    const refetch = vi.fn();
    mockState({ isError: true, refetch });
    renderWithProviders(<CataloguePage />, { withRouter: true });
    expect(screen.getByText('Catalogue is unavailable')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: 'Try again' });
    retry.click();
    expect(refetch).toHaveBeenCalled();
  });

  it('renders the catalogue metadata in the populated state', () => {
    mockState({ data: PARSED });
    renderWithProviders(<CataloguePage />, { withRouter: true });

    // Page header (catalogue title) + dataset title.
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ambiquality open data catalogue' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Indoor environmental quality observations')).toBeInTheDocument();

    // Publisher.
    expect(screen.getByText('Ambiquality project')).toBeInTheDocument();

    // License rendered as a link (human label via DATA_LICENSE when URL matches).
    const license = screen.getByRole('link', { name: /CC BY 4.0/i });
    expect(license).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');

    // Keywords as tags.
    expect(screen.getByText('IEQ')).toBeInTheDocument();
    expect(screen.getByText('open data')).toBeInTheDocument();

    // Theme + periodicity friendly labels (linked to their URIs).
    const theme = screen.getByRole('link', { name: 'Environment' });
    expect(theme).toHaveAttribute(
      'href',
      'http://publications.europa.eu/resource/authority/data-theme/ENVI',
    );
    const freq = screen.getByRole('link', { name: 'Continuous' });
    expect(freq).toHaveAttribute(
      'href',
      'http://publications.europa.eu/resource/authority/frequency/CONT',
    );

    // Contact mailto.
    expect(screen.getByRole('link', { name: 'info@ambiquality.org' })).toHaveAttribute(
      'href',
      'mailto:info@ambiquality.org',
    );

    // Spatial bounding box parsed into readable min/max lon/lat.
    expect(screen.getByText(/14.*15/)).toBeInTheDocument();

    // Live distribution links open in a new tab.
    const jsonLd = screen.getByRole('link', { name: /Observations as JSON-LD/i });
    expect(jsonLd).toHaveAttribute('href', 'https://api.example/v1/observations');
    expect(jsonLd).toHaveAttribute('target', '_blank');
    expect(jsonLd).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('gracefully renders a sparse document without crashing', () => {
    mockState({ data: SPARSE });
    renderWithProviders(<CataloguePage />, { withRouter: true });
    // Falls back to the i18n page title; no metadata sections error out.
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    // No live-distribution links present.
    expect(screen.queryByRole('link', { name: /Observations/i })).not.toBeInTheDocument();
  });

  it('has no accessibility violations in the populated state', async () => {
    mockState({ data: PARSED });
    const { container } = renderWithProviders(<CataloguePage />, { withRouter: true });
    await expectNoA11yViolations(container);
  });
});
