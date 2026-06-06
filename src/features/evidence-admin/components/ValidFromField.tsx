import { Input } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FormField } from '@/components';

export interface ValidFromFieldProps {
  /** Controlled `datetime-local` value (`YYYY-MM-DDTHH:mm`). */
  value: string;
  onChange: (value: string) => void;
  /** Controlled error (e.g. the 409 overlapping-validity-range surfaced on this field). */
  error?: string | null;
}

/**
 * The `validFrom` control shared by every temporal-edit form (F07). Each attribute change
 * carries its own effective date; the server closes the open history row at this instant and
 * opens a new one. A `datetime-local` control keeps the operator in their own timezone; the
 * form converts to an ISO instant on submit. A `409 overlapping-validity-range` is surfaced
 * here via `error`.
 */
export function ValidFromField({ value, onChange, error }: ValidFromFieldProps) {
  const { t } = useTranslation('evidence');
  return (
    <FormField label={t('validFrom.label')} helperText={t('validFrom.hint')} error={error} required>
      <Input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t('validFrom.label')}
      />
    </FormField>
  );
}
