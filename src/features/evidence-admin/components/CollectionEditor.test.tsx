import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { CollectionEditor } from './CollectionEditor';

describe('CollectionEditor (pollution sources / measured parameters)', () => {
  it('adds a code via POST (validFrom now) and clears the input', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <CollectionEditor title="Sources" codes={[]} onAdd={onAdd} onRemove={vi.fn()} />,
    );

    await user.type(screen.getByLabelText('Add to list'), 'cooking');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toBe('cooking');
    // Second arg is a full ISO validFrom instant.
    expect(onAdd.mock.calls[0][1]).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  it('removes an existing code via soft-close (validTo now), using labels for display', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <CollectionEditor
        title="Sources"
        codes={['cooking']}
        renderLabel={(c) => (c === 'cooking' ? 'Cooking' : c)}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText('Cooking')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove cooking' }));

    await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
    expect(onRemove.mock.calls[0][0]).toBe('cooking');
    expect(onRemove.mock.calls[0][1]).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  it('in options mode renders a select, excludes existing codes, and adds the chosen one', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <CollectionEditor
        title="Sources"
        codes={['cooking']}
        options={[
          { value: 'cooking', label: 'Cooking' },
          { value: 'printer', label: 'Printer' },
          { value: 'smoking', label: 'Smoking' },
        ]}
        renderLabel={(c) => ({ cooking: 'Cooking', printer: 'Printer', smoking: 'Smoking' })[c] ?? c}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />,
    );

    const select = screen.getByLabelText('Add to list') as HTMLSelectElement;
    // It's a real <select>, not a text input.
    expect(select.tagName).toBe('SELECT');
    // The already-present 'cooking' code is filtered out of the choices.
    expect(screen.queryByRole('option', { name: 'Cooking' })).toBeNull();
    expect(screen.getByRole('option', { name: 'Printer' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Smoking' })).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'printer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toBe('printer');
    expect(onAdd.mock.calls[0][1]).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });
});
