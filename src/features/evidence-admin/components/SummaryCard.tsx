import type { ReactNode } from 'react';
import { Box, DataList, Heading, HStack, Stack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { CopyField } from './CopyField';

export interface SummaryRow {
  /** The localized field label. */
  label: string;
  /** The display value; nullish/empty renders as an em-dash. */
  value: ReactNode;
}

export interface SummaryCardProps {
  /** Card heading (typically the entity name). */
  title: string;
  /** Read-only key/value rows. */
  rows: SummaryRow[];
  /** Optional action group rendered in the header (e.g. Edit / History buttons). */
  actions?: ReactNode;
  /** Optional stable `uriSlug` shown as a copyable identifier above the rows. */
  uri?: string;
}

/** Empty when null/undefined or a blank/whitespace-only string. */
function isEmpty(value: ReactNode): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

/**
 * Read-only summary of an entity snapshot, rendered as a semantic {@link DataList}. Used by the
 * building/room detail screens (latest state, with Edit/History `actions`) and the history
 * screens (a past `asOf` projection, no actions). Coded fields should be resolved to their
 * codelist label by the caller before being passed in as a row value.
 */
export function SummaryCard({ title, rows, actions, uri }: SummaryCardProps) {
  const { t } = useTranslation('evidence');
  return (
    <Box borderWidth="1px" borderColor="border" rounded="md" p="6">
      <HStack justify="space-between" align="start" mb="6" gap="4" wrap="wrap">
        <Stack gap="3">
          <Heading size="lg">{title}</Heading>
          {uri && <CopyField label={t('common.uri')} value={uri} />}
        </Stack>
        {actions}
      </HStack>
      <DataList.Root orientation="horizontal">
        {rows.map((row) => (
          <DataList.Item key={row.label}>
            <DataList.ItemLabel>{row.label}</DataList.ItemLabel>
            <DataList.ItemValue color={isEmpty(row.value) ? 'fg.muted' : undefined}>
              {isEmpty(row.value) ? '—' : row.value}
            </DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList.Root>
    </Box>
  );
}
