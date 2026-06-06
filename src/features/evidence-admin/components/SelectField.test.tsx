import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { FormField } from '@/components';
import { SelectField } from './SelectField';

const options = [
  { value: 'office', label: 'Office building' },
  { value: 'residential', label: 'Residential' },
];

describe('SelectField', () => {
  it('renders the placeholder plus the provided options and reports the chosen value', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <FormField label="Building type">
        <SelectField value="" onChange={onChange} options={options} placeholder="Select…" />
      </FormField>,
    );

    const select = screen.getByLabelText('Building type') as HTMLSelectElement;
    // Placeholder + 2 options.
    expect(select.querySelectorAll('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: 'Office building' })).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'residential' } });
    expect(onChange).toHaveBeenCalledWith('residential');
  });

  it('is disabled when asked', () => {
    renderWithProviders(
      <FormField label="Building type">
        <SelectField value="" onChange={() => {}} options={options} disabled placeholder="Select…" />
      </FormField>,
    );
    expect(screen.getByLabelText('Building type')).toBeDisabled();
  });
});
