import { useState, type FormEvent } from 'react';
import { Box, Button, Input, Tag, Text, Wrap } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FormField, FormActions, ProblemError } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { nowIso } from '../validation';
import { SelectField, type SelectOption } from './SelectField';

export interface CollectionEditorProps {
  /** Section heading (already localized). */
  title: string;
  /** Codes currently present on the entity. */
  codes: string[];
  /** Resolve a code to a display label (codelist prefLabel; falls back to the code). */
  renderLabel?: (code: string) => string;
  /**
   * When supplied, the "add" control becomes a `<SelectField>` driven by these options (a
   * codelist / property catalogue), filtered to exclude codes already present — so operators
   * pick valid values. When omitted, the control stays a free-text `<Input>` (backward-compat).
   */
  options?: ReadonlyArray<SelectOption>;
  /** Add a code (POST, `validFrom` = now). Rejects with `ProblemError` on failure. */
  onAdd: (code: string, validFromIso: string) => Promise<unknown>;
  /** Remove (soft-close) a code (PUT, `validTo` = now). Rejects with `ProblemError`. */
  onRemove: (code: string, validToIso: string) => Promise<unknown>;
  /** Disable the controls while a parent read is loading. */
  disabled?: boolean;
}

/**
 * Editor for a code collection on an entity (room pollution sources, sensor measured
 * parameters). Membership is NOT a temporal attribute: a code is ADDED via `POST` (carrying a
 * `validFrom`) and "removed" via a soft-close `PUT .../{code}` carrying `validTo` (NOT a DELETE
 * verb). This component owns only the UI + the add/remove plumbing; the parent supplies the
 * actual mutations and label resolution (codelist prefLabels).
 */
export function CollectionEditor({
  title,
  codes,
  renderLabel,
  options,
  onAdd,
  onRemove,
  disabled,
}: CollectionEditorProps) {
  const { t } = useTranslation('evidence');
  const [newCode, setNewCode] = useState('');
  // In options (picker) mode, only offer codes not already present on the entity.
  const availableOptions = options?.filter((option) => !codes.includes(option.value));
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<ProblemErrorObject | null>(null);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setProblem(null);
    const code = newCode.trim();
    if (code === '') return;
    setBusy(true);
    try {
      await onAdd(code, nowIso());
      setNewCode('');
    } catch (error) {
      if (error instanceof ProblemErrorObject) setProblem(error);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(code: string) {
    setProblem(null);
    setBusy(true);
    try {
      await onRemove(code, nowIso());
    } catch (error) {
      if (error instanceof ProblemErrorObject) setProblem(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box as="section" aria-labelledby={`coll-${title}`}>
      <Text id={`coll-${title}`} fontWeight="medium" mb="3">
        {title}
      </Text>

      <ProblemError error={problem} />

      {codes.length === 0 ? (
        <Text color="fg.muted">{t('collection.emptyList')}</Text>
      ) : (
        <Wrap gap="2" mb="3">
          {codes.map((code) => (
            <Tag.Root key={code} size="lg">
              <Tag.Label>{renderLabel ? renderLabel(code) : code}</Tag.Label>
              <Tag.EndElement>
                <Tag.CloseTrigger
                  aria-label={t('collection.removeLabel', { code })}
                  disabled={disabled || busy}
                  onClick={() => handleRemove(code)}
                />
              </Tag.EndElement>
            </Tag.Root>
          ))}
        </Wrap>
      )}

      <form onSubmit={handleAdd} noValidate>
        <FormField label={t('collection.addLabel')}>
          {availableOptions ? (
            <SelectField
              value={newCode}
              onChange={setNewCode}
              options={availableOptions}
              placeholder={t('select.placeholder')}
              disabled={disabled || busy}
            />
          ) : (
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder={t('collection.addPlaceholder')}
              disabled={disabled || busy}
            />
          )}
        </FormField>
        <FormActions>
          <Button type="submit" colorPalette="brand" loading={busy} disabled={disabled}>
            {t('common.add')}
          </Button>
        </FormActions>
      </form>
    </Box>
  );
}
