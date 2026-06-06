import { useState } from 'react';
import { Box, Button, HStack, Input, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { datetimeLocalToIso } from '../validation';

export interface AsOfViewerProps {
  /** The currently-applied `asOf` instant (ISO), or `null` for the latest state. */
  value: string | null;
  /** Apply a new `asOf` (ISO) or `null` to return to latest. */
  onChange: (asOf: string | null) => void;
}

/**
 * The `asOf` history viewer (F07). Reads accept an `asOf` query param to project a past state;
 * this control lets the operator pick a past date/time and re-read the entity as it looked then.
 * "Latest" clears `asOf`. Purely a read concern — it never mutates anything; the parent re-runs
 * its `useBuilding/useRoom/useSensor(..., asOf)` query against the new selector.
 */
export function AsOfViewer({ value, onChange }: AsOfViewerProps) {
  const { t } = useTranslation('evidence');
  const [draft, setDraft] = useState('');

  function apply() {
    const iso = datetimeLocalToIso(draft);
    if (iso) onChange(iso);
  }

  return (
    <Box as="section" aria-labelledby="asof-heading" borderWidth="1px" rounded="md" p="4">
      <Text id="asof-heading" fontWeight="medium" mb="1">
        {t('asOf.title')}
      </Text>
      <Text color="fg.muted" mb="3" fontSize="sm">
        {t('asOf.hint')}
      </Text>
      <HStack gap="2" wrap="wrap" align="end">
        <Input
          type="datetime-local"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={t('asOf.label')}
          maxW="xs"
        />
        <Button variant="outline" onClick={apply}>
          {t('asOf.apply')}
        </Button>
        <Button variant="ghost" onClick={() => onChange(null)} disabled={value === null}>
          {t('asOf.reset')}
        </Button>
      </HStack>
      {value && (
        <Text mt="3" color="fg.muted" role="status">
          {t('asOf.viewing', { date: new Date(value).toLocaleString() })}
        </Text>
      )}
    </Box>
  );
}
