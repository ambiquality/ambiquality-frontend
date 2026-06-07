import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { UnitValue } from '@/components/UnitValue';
import { DisplayUnitControl } from './DisplayUnitControl';
import { UNIT_PREFERENCE_STORAGE_KEY } from './unit-preference-context';

describe('DisplayUnitControl', () => {
  it('renders nothing for a unit with no display alternatives', () => {
    const { container } = renderWithProviders(<DisplayUnitControl canonicalUnit="ppm" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there is no active unit', () => {
    const { container } = renderWithProviders(<DisplayUnitControl canonicalUnit={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lets the user pick a display unit; the choice converts UnitValue and persists', async () => {
    renderWithProviders(
      <>
        <DisplayUnitControl canonicalUnit="°C" />
        <UnitValue value={20} unit="°C" />
      </>,
    );

    // Starts canonical.
    expect(screen.getByText('20 °C')).toBeInTheDocument();

    // Switch the preferred display unit to °F.
    await userEvent.click(screen.getByText('°F'));

    // The shared UnitValue now shows the converted reading, and canonical is gone.
    expect(screen.getByText('68 °F')).toBeInTheDocument();
    expect(screen.queryByText('20 °C')).not.toBeInTheDocument();

    // Persisted so the choice survives a reload.
    expect(globalThis.localStorage?.getItem(UNIT_PREFERENCE_STORAGE_KEY)).toContain('°F');
  });

  it('reads an existing preference from storage on mount', () => {
    globalThis.localStorage?.setItem(UNIT_PREFERENCE_STORAGE_KEY, JSON.stringify({ '°C': '°F' }));
    renderWithProviders(<UnitValue value={20} unit="°C" />);
    expect(screen.getByText('68 °F')).toBeInTheDocument();
  });
});
