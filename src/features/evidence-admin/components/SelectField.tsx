import { NativeSelect } from '@chakra-ui/react';
import type { ChangeEvent, ComponentProps } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps
  extends Omit<ComponentProps<typeof NativeSelect.Field>, 'onChange' | 'children' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<SelectOption>;
  /** Shown as the empty `value=''` option so "nothing chosen" stays distinct (required-validatable). */
  placeholder?: string;
  /** Disables the control (Chakra v3 takes `disabled` on `NativeSelect.Root`, not the field). */
  disabled?: boolean;
}

/**
 * A native `<select>` shaped to drop straight into `FormField` (which clones its control with
 * `id` + `onBlur`). Native = full keyboard / assistive-tech support (WCAG) with no extra wiring.
 * The empty `value=''` maps to the disabled placeholder option, so an unmade choice is distinct
 * from a real value and the shared `requiredValidator` can flag it on blur.
 */
export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  ...rest
}: SelectFieldProps) {
  // Chakra's NativeSelect.Field reads `disabled` from the surrounding Ark Field context, which —
  // inside our (non-disabled) FormField Field.Root — overrides NativeSelect.Root's own prop. But
  // Chakra spreads field props *after* that context value, so passing `disabled` straight to the
  // field wins. Cast because Chakra omits `disabled` from the field's public prop type.
  const fieldProps = {
    value,
    disabled,
    onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange(event.currentTarget.value),
    ...rest,
  } as ComponentProps<typeof NativeSelect.Field>;

  return (
    <NativeSelect.Root disabled={disabled}>
      <NativeSelect.Field {...fieldProps}>
        <option value="" disabled>
          {placeholder ?? ''}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}
