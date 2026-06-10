import { useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  CloseButton,
  Dialog,
  EmptyState,
  Flex,
  HStack,
  Link as ChakraLink,
  Portal,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuChartNoAxesColumn } from 'react-icons/lu';
import { UnitValue } from '@/components/UnitValue';
import { useUnitPreference } from '@/units';
import { useObservationAggregate } from '@/api/public/map-hooks';
import type { AggregateStats, TimeRange } from '@/api/public/map-types';
import type { MarkerSelection } from './MapView';
import { RangeSelector } from './RangeSelector';
import { TimeSeriesChart } from './charts/TimeSeriesChart';
import { BoxPlot } from './charts/BoxPlot';

export interface BuildingDialogProps {
  /** The clicked building, or `null` when the dialog is closed. */
  selection: MarkerSelection | null;
  /** The currently-filtered quantity (drives which series is charted). */
  parameterCode: string | null;
  /** Canonical unit symbol for the quantity, for value formatting. */
  unit: string | null;
  onClose: () => void;
}

/**
 * Building detail dialog (UC18): opens on a marker click and shows the selected building's
 * measurements for the active quantity over a chosen look-back window. Only the dialog drives the
 * aggregate fetch — and only for the selected range — so the heavy time-series data loads on demand
 * (the "no lag" contract), one range at a time, each cached by TanStack Query.
 *
 * The d3 trend line + boxplot land in the next phase; this phase establishes the dialog, the range
 * selector, the on-demand fetch, the loading/empty/error states, and a numeric distribution summary
 * (which also serves as the accessible text alternative to the forthcoming boxplot).
 */
export function BuildingDialog({ selection, parameterCode, unit, onClose }: BuildingDialogProps) {
  return (
    <Dialog.Root
      open={!!selection}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      size="xl"
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {selection && (
              // Remount per building so the range resets to "day" for each newly opened building.
              <DialogBody
                key={selection.buildingId}
                selection={selection}
                parameterCode={parameterCode}
                unit={unit}
              />
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function DialogBody({
  selection,
  parameterCode,
  unit,
}: {
  selection: MarkerSelection;
  parameterCode: string | null;
  unit: string | null;
}) {
  const { t } = useTranslation('map');
  const { displayUnitFor } = useUnitPreference();
  const [range, setRange] = useState<TimeRange>('day');

  const { data, isLoading, isError } = useObservationAggregate({
    buildingId: selection.buildingId,
    parameterCode,
    range,
  });

  // Canonical unit for the quantity (prop wins, else the response's), and the user's display choice.
  const canonicalUnit = unit ?? data?.unit ?? '';
  const displayUnit = displayUnitFor(canonicalUnit);

  return (
    <>
      <Dialog.Header>
        <Dialog.Title>{selection.name}</Dialog.Title>
        <Dialog.CloseTrigger asChild>
          <CloseButton size="sm" aria-label={t('dialog.close')} />
        </Dialog.CloseTrigger>
      </Dialog.Header>

      <Dialog.Body>
        <Stack gap="5">
          <RangeSelector value={range} onChange={setRange} />

          {isLoading && (
            <HStack gap="3" color="fg.muted" py="6" justify="center">
              <Spinner size="sm" />
              <Text>{t('dialog.loading')}</Text>
            </HStack>
          )}

          {isError && (
            <Alert.Root status="error">
              <Alert.Indicator />
              <Alert.Title>{t('dialog.error')}</Alert.Title>
            </Alert.Root>
          )}

          {!isLoading && !isError && (!data || !data.stats) && (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <LuChartNoAxesColumn />
                </EmptyState.Indicator>
                <EmptyState.Description>{t('dialog.noData')}</EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}

          {!isLoading && !isError && data?.stats && (
            <Stack gap="6">
              <Box>
                <Text fontWeight="medium" mb="2">
                  {t('chart.timeSeriesTitle')}
                </Text>
                <TimeSeriesChart
                  buckets={data.buckets}
                  unit={canonicalUnit}
                  displayUnit={displayUnit}
                />
              </Box>
              <Stack direction={{ base: 'column', md: 'row' }} gap="6" align="start">
                <Box>
                  <Text fontWeight="medium" mb="2">
                    {t('chart.boxplotTitle')}
                  </Text>
                  <BoxPlot stats={data.stats} unit={canonicalUnit} displayUnit={displayUnit} />
                </Box>
                <Box flex="1" w="full">
                  <StatsSummary stats={data.stats} unit={canonicalUnit} />
                </Box>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Dialog.Body>

      <Dialog.Footer>
        <ChakraLink asChild color="brand.fg">
          <RouterLink to={`/buildings/${selection.slug}`}>{t('dialog.viewDetail')}</RouterLink>
        </ChakraLink>
      </Dialog.Footer>
    </>
  );
}

/**
 * Numeric distribution summary for a range: median, inter-quartile range, full range and sample
 * size. This is rendered as a definition list so it stands alone as the accessible equivalent of
 * the boxplot (added next phase), which visualises the same five-number summary.
 */
function StatsSummary({ stats, unit }: { stats: AggregateStats; unit: string }) {
  const { t } = useTranslation('map');

  const rows: Array<{ label: string; node: ReactNode }> = [
    { label: t('boxplot.median'), node: <UnitValue value={stats.p50} unit={unit} fractionDigits={1} /> },
    {
      label: `${t('boxplot.p25')} – ${t('boxplot.p75')}`,
      node: (
        <HStack gap="1">
          <UnitValue value={stats.p25} unit={unit} fractionDigits={1} />
          <Text as="span" color="fg.muted">
            –
          </Text>
          <UnitValue value={stats.p75} unit={unit} fractionDigits={1} />
        </HStack>
      ),
    },
    {
      label: `${t('boxplot.min')} – ${t('boxplot.max')}`,
      node: (
        <HStack gap="1">
          <UnitValue value={stats.min} unit={unit} fractionDigits={1} />
          <Text as="span" color="fg.muted">
            –
          </Text>
          <UnitValue value={stats.max} unit={unit} fractionDigits={1} />
        </HStack>
      ),
    },
  ];

  return (
    <Box>
      <Text fontWeight="medium" mb="2">
        {t('dialog.summaryTitle')}
      </Text>
      <Box as="dl">
        {rows.map((row) => (
          <Flex key={row.label} justify="space-between" gap="4" py="1.5" borderBottomWidth="1px">
            <Text as="dt" color="fg.muted">
              {row.label}
            </Text>
            <Box as="dd" fontWeight="medium">
              {row.node}
            </Box>
          </Flex>
        ))}
      </Box>
      <Text color="fg.muted" fontSize="sm" mt="2">
        {t('dialog.measurements', { count: stats.count })}
      </Text>
    </Box>
  );
}
