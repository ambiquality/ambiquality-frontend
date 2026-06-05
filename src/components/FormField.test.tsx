import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { FormField } from './FormField';

describe('FormField', () => {
  it('associates the label with the input and marks required', () => {
    renderWithProviders(<FormField label="Building name" required />);
    const input = screen.getByLabelText(/building name/i);
    expect(input).toBeInTheDocument();
    // Chakra v3 Field.Root surfaces required via the native `required` attribute + data-required.
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('data-required');
    // The consistent required marker is rendered alongside the label.
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('validates on blur and shows a field-level error wired via aria-invalid', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormField
        label="Name"
        validate={(value) => (value.trim() === '' ? 'This field is required.' : null)}
      />,
    );
    const input = screen.getByLabelText('Name');

    // No error before interaction.
    expect(input).not.toHaveAttribute('aria-invalid', 'true');

    // Focus then blur an empty field -> error appears and aria-invalid flips.
    await user.click(input);
    await user.tab();

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('This field is required.')).toBeInTheDocument();
  });

  it('clears the blur error once the value becomes valid', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormField label="Name" validate={(value) => (value ? null : 'Required.')} />,
    );
    const input = screen.getByLabelText('Name');

    await user.click(input);
    await user.tab();
    expect(screen.getByText('Required.')).toBeInTheDocument();

    await user.type(input, 'Atrium');
    await user.tab();
    expect(screen.queryByText('Required.')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('prefers a controlled (server) error over local blur validation', () => {
    renderWithProviders(<FormField label="Email" error="Already in use." />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Already in use.')).toBeInTheDocument();
  });
});
