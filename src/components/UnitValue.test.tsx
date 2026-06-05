import { afterEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { i18n } from '@/i18n';
import { UnitValue } from './UnitValue';

const NBSP = ' ';

describe('UnitValue', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('formats value and unit, joined by a non-breaking space (en locale uses a dot decimal)', async () => {
    await i18n.changeLanguage('en');
    const { container } = renderWithProviders(<UnitValue value={21.5} unit="°C" />);
    // Testing Library's default matcher normalizes NBSP -> space.
    expect(screen.getByText('21.5 °C')).toBeInTheDocument();
    // The literal joiner is an NBSP, not a plain space.
    expect(container.querySelector('span')?.textContent).toBe(`21.5${NBSP}°C`);
  });

  it('uses locale-aware number formatting (cs uses a comma decimal)', async () => {
    await i18n.changeLanguage('cs');
    renderWithProviders(<UnitValue value={21.5} unit="°C" />);
    expect(screen.getByText('21,5 °C')).toBeInTheDocument();
  });

  it('respects fractionDigits', async () => {
    await i18n.changeLanguage('en');
    renderWithProviders(<UnitValue value={3} unit="ppm" fractionDigits={2} />);
    expect(screen.getByText('3.00 ppm')).toBeInTheDocument();
  });

  it('renders a dash for nullish values', () => {
    renderWithProviders(<UnitValue value={null} unit="°C" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('ignores the Phase-8 displayUnit seam in Phase 3 (still shows canonical unit)', async () => {
    await i18n.changeLanguage('en');
    renderWithProviders(<UnitValue value={20} unit="°C" displayUnit="°F" />);
    expect(screen.getByText('20 °C')).toBeInTheDocument();
  });
});
