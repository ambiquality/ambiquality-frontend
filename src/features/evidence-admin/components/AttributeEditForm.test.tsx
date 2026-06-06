import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { Input } from '@chakra-ui/react';
import { renderWithProviders } from '@/test/render';
import { FormField } from '@/components';
import { ProblemError } from '@/api/middleware/problem-details';
import { AttributeEditForm } from './AttributeEditForm';

function problem(type: string, status: number, detail: string | null = null): ProblemError {
  return new ProblemError(
    { type, title: null, status, detail, instance: null, errors: {}, extensions: {} },
    status,
    null,
  );
}

function Harness({ mutateAsync }: { mutateAsync: (body: never) => Promise<unknown> }) {
  return (
    <AttributeEditForm
      title="Name"
      buildBody={(validFromIso) => ({ newName: 'New', validFrom: validFromIso })}
      mutateAsync={mutateAsync}
    >
      <FormField label="Name">
        <Input defaultValue="New" />
      </FormField>
    </AttributeEditForm>
  );
}

describe('AttributeEditForm (F07 per-attribute temporal edit)', () => {
  it('submits the attribute PUT with the resolved ISO validFrom and shows a saved note', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<Harness mutateAsync={mutateAsync} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByText('Saved.')).toBeInTheDocument());
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    const body = mutateAsync.mock.calls[0][0] as { newName: string; validFrom: string };
    expect(body.newName).toBe('New');
    // validFrom is folded in as a full ISO instant.
    expect(body.validFrom).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  it('surfaces 409 overlapping-validity-range on the validFrom field, not the generic banner', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi
      .fn()
      .mockRejectedValue(problem('urn:ambiquality:evidence:overlapping-validity-range', 409));
    renderWithProviders(<Harness mutateAsync={mutateAsync} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    // The overlap message appears as a field error (no generic error alert banner).
    await waitFor(() =>
      expect(screen.getByText(/valid-from date overlaps an existing version/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders a non-409 problem in the generic banner', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi
      .fn()
      .mockRejectedValue(problem('urn:ambiquality:evidence:unknown-codelist-code', 400));
    renderWithProviders(<Harness mutateAsync={mutateAsync} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.getByText('An unknown code was supplied.')).toBeInTheDocument(),
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('routes a validFrom-related 400 domain-rule-violation onto the validFrom field', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockRejectedValue(
      // The server enforces forward monotonicity at the app layer (400), not the DB 409.
      problem(
        'urn:ambiquality:evidence:domain-rule-violation',
        400,
        'New name valid-from 2026-06-06T13:59Z must be strictly after the current value’s start.',
      ),
    );
    renderWithProviders(<Harness mutateAsync={mutateAsync} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Lands as a field error, not the generic banner.
    await waitFor(() =>
      expect(screen.getByText(/valid-from date must be later/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('keeps a non-validFrom domain-rule-violation in the generic banner', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockRejectedValue(
      problem(
        'urn:ambiquality:evidence:domain-rule-violation',
        400,
        'Year renovated must be greater than or equal to year built.',
      ),
    );
    renderWithProviders(<Harness mutateAsync={mutateAsync} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.getByText('This change breaks a domain rule.')).toBeInTheDocument(),
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
