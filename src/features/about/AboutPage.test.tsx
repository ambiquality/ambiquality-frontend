import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';
import { AboutPage } from './AboutPage';
import { CONTACT_EMAIL, GITHUB_ORG_URL, DATA_LICENSE } from '@/lib/constants';

function renderPage() {
  return renderWithProviders(<AboutPage />);
}

describe('AboutPage', () => {
  it('renders a top-level heading naming the platform', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: /ambiquality/i }),
    ).toBeInTheDocument();
  });

  it('uses the contact email from constants and drops the personal address', () => {
    renderPage();
    const mailto = screen.getByRole('link', { name: new RegExp(CONTACT_EMAIL, 'i') });
    expect(mailto).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
    expect(screen.queryByText(/vilem\.charwot@proton\.me/i)).not.toBeInTheDocument();
    // Author name is still credited as attribution.
    expect(screen.getAllByText(/vilém charwot/i).length).toBeGreaterThan(0);
  });

  it('links to the source code on GitHub in a safe new tab', () => {
    renderPage();
    const repo = screen.getByRole('link', { name: /source|github|repozitář|kód/i });
    expect(repo).toHaveAttribute('href', GITHUB_ORG_URL);
    expect(repo).toHaveAttribute('target', '_blank');
    expect(repo.getAttribute('rel')).toContain('noopener');
  });

  it('lists open-source acknowledgements with license names and project links', () => {
    renderPage();
    // MapLibre + OpenStreetMap (ODbL) + the data license must be present.
    expect(screen.getByRole('link', { name: /maplibre/i })).toBeInTheDocument();
    expect(screen.getByText(/BSD-3-Clause/)).toBeInTheDocument();
    expect(screen.getByText(/ODbL/)).toBeInTheDocument();
    const dataLicense = screen.getByRole('link', { name: new RegExp(DATA_LICENSE.name, 'i') });
    expect(dataLicense).toHaveAttribute('href', DATA_LICENSE.url);
  });

  it('renders the acknowledgements as a semantic list', () => {
    renderPage();
    const lists = screen.getAllByRole('list');
    const hasMapLibre = lists.some((list) =>
      within(list).queryByRole('link', { name: /maplibre/i }),
    );
    expect(hasMapLibre).toBe(true);
  });

  it('has no axe accessibility violations', async () => {
    const { container } = renderPage();
    await expectNoA11yViolations(container);
  });
});
