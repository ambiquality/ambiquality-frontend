import { Alert, List, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';

export interface ProblemErrorProps {
  /** The parsed RFC 9457 error (Phase 2 `ProblemError`) to render. `null` renders nothing. */
  error: ProblemErrorObject | null | undefined;
  /** Optional override title; defaults to the localized errors title. */
  title?: string;
}

/**
 * Renders a Phase-2 {@link ProblemErrorObject} as a localized, field-aware, accessible alert.
 *
 * Message resolution order (pitfall #9):
 *   1. the stable `type` URN mapped through the `errors:urn.*` i18n namespace,
 *   2. else the server-provided `detail`, then `title`,
 *   3. else a localized generic fallback.
 *
 * Field-level validation errors (ASP.NET `ValidationProblemDetails.errors`) are surfaced as a
 * list beneath the message so the user sees exactly what to fix. The alert uses `role="alert"`
 * so assistive tech announces it when it appears. No raw HTML is injected (XSS-clean).
 */
export function ProblemError({ error, title }: ProblemErrorProps) {
  const { t } = useTranslation('errors');
  if (!error) return null;

  const { problem } = error;
  const urn = problem.type;

  // 1) URN → localized message (only when a mapping exists), else 2) server text, else 3) generic.
  // The URN itself contains ':' / '.' which i18next would treat as ns/key separators, so we
  // disable both separators for this lookup and key the map by the raw URN string.
  const mapped = urn
    ? t(urn, { ns: 'errors', nsSeparator: false, keySeparator: false, defaultValue: '' })
    : '';
  const message = mapped || problem.detail || problem.title || t('generic');

  const fieldEntries = Object.entries(problem.errors);
  const hasFieldErrors = fieldEntries.length > 0;

  return (
    <Alert.Root status="error" role="alert">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title ?? t('title')}</Alert.Title>
        <Alert.Description>
          <Text>{message}</Text>
          {hasFieldErrors && (
            <>
              <Text mt="2" fontWeight="medium">
                {t('fieldErrorsLabel')}
              </Text>
              <List.Root>
                {fieldEntries.map(([field, messages]) => (
                  <List.Item key={field}>
                    <Text as="span" fontWeight="medium">
                      {field}
                    </Text>
                    {`: ${messages.join(' ')}`}
                  </List.Item>
                ))}
              </List.Root>
            </>
          )}
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}
