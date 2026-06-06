import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { AsOfViewer } from './AsOfViewer';

describe('AsOfViewer (F07 history viewer)', () => {
  it('applies a chosen past instant as an ISO asOf', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<AsOfViewer value={null} onChange={onChange} />);

    const input = screen.getByLabelText('Show state as of');
    await user.type(input, '2025-01-15T08:30');
    await user.click(screen.getByRole('button', { name: 'View' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0][0] as string;
    expect(arg).toMatch(/^2025-01-15T/);
    expect(arg.endsWith('Z')).toBe(true);
  });

  it('clears asOf back to latest', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<AsOfViewer value="2025-01-15T08:30:00.000Z" onChange={onChange} />);

    // When an asOf is applied, the "viewing as of" status is announced.
    expect(screen.getByRole('status')).toHaveTextContent(/Viewing the state as of/);
    await user.click(screen.getByRole('button', { name: 'Latest' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
