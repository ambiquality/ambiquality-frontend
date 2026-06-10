import { useState } from 'react';
import { Alert, Box, EmptyState, Flex, Heading, HStack, Spinner, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { LuChartNoAxesColumn } from 'react-icons/lu';
import { UnitValue } from '@/components/UnitValue';
import { useUnitPreference } from '@/units';
import { useObservationAggregate } from '@/api/public/map-hooks';
import type { AggregateStats, TimeRange } from '@/api/public/map-types';
import { RangeSelector } from '@/features/public-map/RangeSelector';
import { TimeSeriesChart } from '@/features/public-map/charts/TimeSeriesChart';
import { usePropertyOptions } from './codelists';
import type { SensorSnapshot } from './queries';

/**
 * Trend charts for an operator's sensor — one {@link TimeSeriesChart} per measured
 * quantity, each with a compact numeric summary beneath it, over a selectable look-back
 * window (ROZ-03: day / week / month / year, shared {@link RangeSelector}). One selector
 * drives every chart so the quantities stay comparable.
 *
 * Data source note (the "two read sources" rule): observations live ONLY on Public.Api (they are
 * not dual-sourced catalog data), so the series come from `/v1/observations/aggregate` keyed by the
 * sensor's GUID (`snapshot.id` — the same id ingestion uses). Each quantity is fetched on its own
 * (one hook per {@link ParameterChart}) so a missing/erroring series degrades in isolation.
 */
export function SensorCharts({ sensorId, snapshot }: { sensorId: string; snapshot: SensorSnapshot }) {
  const { t } = useTranslation('evidence');
  const [range, setRange] = useState<TimeRange>('day');
  const parameters = snapshot.measuredParameters ?? [];

  if (parameters.length === 0) return null;

  return (
    <Box borderWidth="1px" borderColor="border" rounded="md" p="6">
      <Heading size="md" mb="1">
        {t('sensor.chartsTitle')}
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb="4">
        {t('sensor.chartsSubtitle')}
      </Text>
      <Box mb="6">
        <RangeSelector value={range} onChange={setRange} />
      </Box>
      <Stack gap="8">
        {parameters.map((p) => (
          <ParameterChart key={p.code} sensorId={sensorId} parameterCode={p.code} range={range} />
        ))}
      </Stack>
    </Box>
  );
}

function ParameterChart({
  sensorId,
  parameterCode,
  range,
}: {
  sensorId: string;
  parameterCode: string;
  range: TimeRange;
}) {
  const { t } = useTranslation('evidence');
  const properties = usePropertyOptions();
  const { displayUnitFor } = useUnitPreference();
  const { data, isLoading, isError } = useObservationAggregate({
    sensorId,
    parameterCode,
    range,
  });

  const canonicalUnit = data?.unit ?? '';
  const displayUnit = displayUnitFor(canonicalUnit);

  return (
    <Box>
      <Text fontWeight="medium" mb="2">
        {properties.label(parameterCode)}
      </Text>

      {isLoading && (
        <HStack gap="3" color="fg.muted" py="4">
          <Spinner size="sm" />
          <Text>{t('common.loading')}</Text>
        </HStack>
      )}

      {isError && (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>{t('sensor.chartError')}</Alert.Title>
        </Alert.Root>
      )}

      {!isLoading && !isError && (!data || !data.stats) && (
        <EmptyState.Root size="sm">
          <EmptyState.Content>
            <EmptyState.Indicator>
              <LuChartNoAxesColumn />
            </EmptyState.Indicator>
            <EmptyState.Description>{t('sensor.chartNoData')}</EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      )}

      {!isLoading && !isError && data?.stats && (
        <Stack gap="3">
          <TimeSeriesChart buckets={data.buckets} unit={canonicalUnit} displayUnit={displayUnit} />
          <CompactStats stats={data.stats} unit={canonicalUnit} />
        </Stack>
      )}
    </Box>
  );
}

/**
 * One-line median / range / sample-count summary — the accessible textual companion to the trend
 * line. Labels reuse the shared chart vocabulary (the `map` namespace) so the two surfaces stay
 * consistent. Values render in the user's preferred display unit (PER) via {@link UnitValue}.
 */
function CompactStats({ stats, unit }: { stats: AggregateStats; unit: string }) {
  const { t } = useTranslation('map');
  return (
    <Flex wrap="wrap" gapX="6" gapY="1" color="fg.muted" fontSize="sm">
      <HStack gap="1">
        <Text as="span">{t('boxplot.median')}:</Text>
        <UnitValue value={stats.p50} unit={unit} fractionDigits={1} fontWeight="medium" color="fg" />
      </HStack>
      <HStack gap="1">
        <Text as="span">
          {t('boxplot.min')}–{t('boxplot.max')}:
        </Text>
        <UnitValue value={stats.min} unit={unit} fractionDigits={1} fontWeight="medium" color="fg" />
        <Text as="span">–</Text>
        <UnitValue value={stats.max} unit={unit} fractionDigits={1} fontWeight="medium" color="fg" />
      </HStack>
      <Text as="span">{t('dialog.measurements', { count: stats.count })}</Text>
    </Flex>
  );
}
