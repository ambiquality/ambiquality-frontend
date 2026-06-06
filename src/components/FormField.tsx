import { Field, HStack, Input, type InputProps } from '@chakra-ui/react';
import {
  cloneElement,
  isValidElement,
  useCallback,
  useId,
  useState,
  type FocusEvent,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import { InfoTip } from './InfoTip';

/**
 * A `validate` returns an error MESSAGE string when invalid, or `null`/`undefined` when valid.
 * Keep validators pure and synchronous — async/cross-field validation is a feature concern.
 */
export type FieldValidator = (value: string) => string | null | undefined;

export interface FormFieldProps {
  /** Visible label text (already localized by the caller). */
  label: string;
  /** Marks the field required: shows the consistent required marker + sets `aria-required`. */
  required?: boolean;
  /** Optional helper text rendered under the control and wired via `aria-describedby`. */
  helperText?: string;
  /**
   * Optional explanatory text revealed by an "ⓘ" tooltip next to the label — for a non-obvious
   * choice that doesn't warrant permanent helper text. Shown on hover and focus (keyboard-reachable).
   */
  labelHint?: string;
  /**
   * Server/controlled error message. When set it takes precedence over local blur-validation
   * (so RFC 9457 field errors from `ProblemError` can be surfaced on the matching field).
   */
  error?: string | null;
  /** Blur-time validator (KON: validate on blur). Runs on blur and re-runs on subsequent blurs. */
  validate?: FieldValidator;
  /**
   * The control. Defaults to a Chakra `Input` (forwarding `inputProps`). Pass a custom control
   * (textarea, select…) to reuse the same label/error/required wiring; it receives the field id
   * and `aria-invalid` automatically.
   */
  children?: ReactElement;
  /** Props forwarded to the default `Input` when no custom `children` control is provided. */
  inputProps?: InputProps;
}

/**
 * The single labeled-input primitive every later phase reuses, so form behaviour is uniform
 * (KON). It provides, in one place:
 *
 *  - **validate-on-blur** — runs `validate` when the control loses focus and shows the message.
 *  - **field-level error display** — local (blur) or controlled (`error`, e.g. server problem).
 *  - a **consistent required marker** and `aria-required`.
 *  - correct `label` association, `aria-describedby` (helper + error), and `aria-invalid` wiring,
 *    delegated to Chakra v3's `Field` so the accessibility plumbing is identical across forms.
 */
export function FormField({
  label,
  required = false,
  helperText,
  labelHint,
  error,
  validate,
  children,
  inputProps,
}: FormFieldProps) {
  const { t } = useTranslation('forms');
  const fieldId = useId();
  const [blurError, setBlurError] = useState<string | null>(null);

  // Controlled (server) error wins; otherwise show the latest blur-validation result.
  const message = error ?? blurError;
  const isInvalid = Boolean(message);

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (!validate) return;
      const result = validate(event.target.value);
      setBlurError(result ?? null);
    },
    [validate],
  );

  const control = isValidElement(children) ? (
    cloneElement(children as ReactElement<Record<string, unknown>>, {
      id: fieldId,
      onBlur: handleBlur,
    })
  ) : (
    <Input id={fieldId} onBlur={handleBlur} {...inputProps} />
  );

  return (
    <Field.Root id={fieldId} required={required} invalid={isInvalid}>
      {/* Keep the InfoTip a SIBLING of the <label> (not a child) — a button inside <label> is
          invalid and would proxy clicks to the control. */}
      <HStack gap="1.5" align="center">
        <Field.Label mb="0">
          {label}
          {required && (
            <Field.RequiredIndicator fallback={null} color="required.fg" aria-label={t('required')}>
              {t('requiredMarker')}
            </Field.RequiredIndicator>
          )}
        </Field.Label>
        {labelHint && <InfoTip content={labelHint} ariaLabel={t('moreInfo')} />}
      </HStack>
      {control}
      {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
      {isInvalid && <Field.ErrorText color="fieldError.fg">{message}</Field.ErrorText>}
    </Field.Root>
  );
}
