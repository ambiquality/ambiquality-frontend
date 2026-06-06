import type { ReactNode, FormEvent } from 'react';
import { Alert, Box, Button, Heading, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FormActions, ProblemError } from '@/components';
import { ValidFromField } from './ValidFromField';
import { useTemporalEdit } from '../useTemporalEdit';

export interface AttributeEditFormProps {
  /** Section heading (already localized). */
  title: string;
  /** The attribute's value field(s) — caller renders its own `FormField`s here. */
  children: ReactNode;
  /** Produce the attribute-specific request body folding in the resolved ISO `validFrom`. */
  buildBody: (validFromIso: string) => unknown;
  /** Perform the PUT (rejects with a `ProblemError` on failure). */
  mutateAsync: (body: never) => Promise<unknown>;
  /** Optional: clear the value field(s) after a successful save. */
  onSaved?: () => void;
}

/**
 * One self-contained temporal-attribute edit form (F07). It is intentionally NOT a "save the
 * whole object" form: each instance owns ONE attribute's value field(s) + its `validFrom`, and
 * fires that attribute's own `PUT` (which the server answers with `204`, closing the open
 * history row and opening a new one). A `409 overlapping-validity-range` is surfaced on the
 * `validFrom` field; any other problem renders in the `ProblemError` banner. All wiring lives
 * in {@link useTemporalEdit} so every attribute form behaves identically.
 */
export function AttributeEditForm({
  title,
  children,
  buildBody,
  mutateAsync,
  onSaved,
}: AttributeEditFormProps) {
  const { t } = useTranslation('evidence');
  const edit = useTemporalEdit();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await edit.submit(buildBody, mutateAsync, onSaved);
  }

  return (
    <Box as="section" aria-labelledby={`attr-${title}`}>
      <Heading id={`attr-${title}`} size="md" mb="4">
        {title}
      </Heading>
      <form onSubmit={handleSubmit} noValidate>
        <VStack gap="4" align="stretch">
          {edit.saved && (
            <Alert.Root status="success" role="status">
              <Alert.Indicator />
              <Alert.Title>{t('common.saved')}</Alert.Title>
            </Alert.Root>
          )}
          <ProblemError error={edit.problem} />

          {children}

          <ValidFromField
            value={edit.validFrom}
            onChange={edit.setValidFrom}
            error={edit.validFromError}
          />

          <FormActions>
            <Button type="submit" colorPalette="brand" loading={edit.submitting}>
              {t('common.save')}
            </Button>
          </FormActions>
        </VStack>
      </form>
    </Box>
  );
}
