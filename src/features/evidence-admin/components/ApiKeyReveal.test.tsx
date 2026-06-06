import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ApiKeyReveal } from './ApiKeyReveal';

describe('ApiKeyReveal (F08 one-time API key)', () => {
  it('shows the key prominently with the unrecoverable warning and a copy button', () => {
    renderWithProviders(<ApiKeyReveal apiKey="amq_sk_abc123" />);

    expect(screen.getByText('Save the API key now')).toBeInTheDocument();
    expect(screen.getByTestId('api-key-value')).toHaveTextContent('amq_sk_abc123');
    // The warning must communicate it is shown only once and cannot be retrieved.
    expect(screen.getByText(/only time this key is shown/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be retrieved/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy API key' })).toBeInTheDocument();
  });

  it('calls onAcknowledge when the operator confirms they saved it', async () => {
    const user = userEvent.setup();
    const onAcknowledge = vi.fn();
    renderWithProviders(<ApiKeyReveal apiKey="amq_sk_xyz" onAcknowledge={onAcknowledge} />);

    await user.click(screen.getByRole('button', { name: "I've saved it" }));
    expect(onAcknowledge).toHaveBeenCalled();
  });
});
