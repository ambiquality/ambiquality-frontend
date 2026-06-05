import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { i18n, LANGUAGE_STORAGE_KEY } from '@/i18n';
import { LanguageSwitch } from './LanguageSwitch';

describe('LanguageSwitch', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('marks the current language with aria-pressed', () => {
    renderWithProviders(<LanguageSwitch />);
    const en = screen.getByRole('button', { name: /switch language to english/i });
    const cs = screen.getByRole('button', { name: /switch language to čeština/i });
    expect(en).toHaveAttribute('aria-pressed', 'true');
    expect(cs).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches language live and persists the choice to localStorage', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitch />);

    await user.click(screen.getByRole('button', { name: /switch language to čeština/i }));

    expect(i18n.resolvedLanguage).toBe('cs');
    // aria-pressed now reflects Czech as active.
    expect(screen.getByRole('button', { name: /přepnout jazyk na english/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    // Persisted for the next session (POU).
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('cs');
  });

  it('exposes an accessible group label that is itself translated', async () => {
    renderWithProviders(<LanguageSwitch />);
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();

    await i18n.changeLanguage('cs');
    expect(screen.getByRole('group', { name: 'Jazyk' })).toBeInTheDocument();
  });
});
