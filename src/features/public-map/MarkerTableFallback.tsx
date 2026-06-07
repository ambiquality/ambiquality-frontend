import { Box, Button, HStack, Table, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { UnitValue } from '@/components/UnitValue';
import type { MapSnapshotItem } from '@/api/public/map-types';
import type { MarkerSelection } from './MapView';
import { classify, hasBands } from './color-bands';

export interface MarkerTableFallbackProps {
  items: ReadonlyArray<MapSnapshotItem>;
  parameterCode: string | null;
  unit: string | null;
  onSelect: (selection: MarkerSelection) => void;
}

/**
 * Accessible, keyboard-operable equivalent of the map markers (WCAG): a table of the same
 * buildings and their latest values for the active quantity. Canvas markers aren't focusable, so
 * this is always rendered as the operable counterpart — each row's building name is a button that
 * opens the same detail dialog. It also covers the UC18 degraded path: when the snapshot fails the
 * map shows no markers, but this list still works (and shows its empty state).
 */
export function MarkerTableFallback({
  items,
  parameterCode,
  unit,
  onSelect,
}: MarkerTableFallbackProps) {
  const { t, i18n } = useTranslation('map');
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' });
  const banded = parameterCode ? hasBands(parameterCode) : false;

  if (items.length === 0) {
    return (
      <Text color="fg.muted" fontSize="sm">
        {t('fallback.empty')}
      </Text>
    );
  }

  return (
    <Table.ScrollArea borderWidth="1px" rounded="md" maxW="full">
      <Table.Root size="sm" interactive>
        <Table.Caption srOnly>{t('fallback.caption')}</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('fallback.colBuilding')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('fallback.colValue')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('fallback.colObserved')}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map((item) => {
            const unknown = item.stale || item.latestValue == null;
            const status = unknown ? 'unknown' : classify(parameterCode ?? '', item.latestValue);
            // `name` is nullable in the snapshot schema; fall back to the (always-present) slug.
            const name = item.name ?? item.slug;
            return (
              <Table.Row key={item.buildingId}>
                <Table.Cell>
                  <Button
                    variant="plain"
                    height="auto"
                    p="0"
                    color="brand.fg"
                    textDecoration="underline"
                    fontWeight="medium"
                    onClick={() => onSelect({ buildingId: item.buildingId, slug: item.slug, name })}
                  >
                    {name}
                  </Button>
                </Table.Cell>
                <Table.Cell>
                  {unknown ? (
                    <Text color="fg.muted">{t('value.stale')}</Text>
                  ) : (
                    <HStack gap="2">
                      {banded && (
                        <Box boxSize="2.5" rounded="full" bg={`ieq.${status}`} aria-hidden />
                      )}
                      <UnitValue value={item.latestValue} unit={unit ?? ''} fractionDigits={1} />
                      {banded && (
                        <Text color="fg.muted" fontSize="xs">
                          {t(`legend.${status}`)}
                        </Text>
                      )}
                    </HStack>
                  )}
                </Table.Cell>
                <Table.Cell color="fg.muted">
                  {item.observedAt ? dateFmt.format(new Date(item.observedAt)) : '—'}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
