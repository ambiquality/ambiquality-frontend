import { useState } from 'react';
import { Alert, Box, EmptyState, Heading, HStack, Spinner, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { LuChartNoAxesColumn } from 'react-icons/lu';
import {
  useBuildingDetail,
  useRoomDetail,
  useSensorDetail,
  type PublicSensorDetail,
} from '@/api/public/entity-hooks';
import { useCodelistScheme } from '@/api/public/hooks';
import { useMapProperties, useObservationAggregate } from '@/api/public/map-hooks';
import type { TimeRange } from '@/api/public/map-types';
import { useCodelistLabel } from '@/i18n/codelist-labels';
import { useUnitPreference } from '@/units';
import { RangeSelector } from '@/features/public-map/RangeSelector';
import { TimeSeriesChart } from '@/features/public-map/charts/TimeSeriesChart';
import { AttributeList, DetailShell, DetailStatus } from './components';

/**
 * Public sensor detail (UC18 / ROZ-03): identity + declared quantities, and a time-series
 * chart per quantity over a selectable look-back window — the same four-range selector the
 * map dialog uses, here at sensor granularity.
 */
export function SensorDetail({ id }: { id: string | undefined }) {
  const { t } = useTranslation('entity');
  const sensor = useSensorDetail(id);
  const room = useRoomDetail(sensor.data?.roomId);
  const building = useBuildingDetail(sensor.data?.buildingId);
  const statusLabel = useCodelistLabel(useCodelistScheme('sensor-status').data);

  if (!sensor.data)
    return (
      <DetailShell breadcrumb={[{ label: t('common.map'), to: '/' }]} title={t('sensor.title')}>
        <DetailStatus isLoading={sensor.isLoading} isError={sensor.isError} />
      </DetailShell>
    );

  const data = sensor.data;
  const title = [data.manufacturer, data.model].filter(Boolean).join(' ') || t('sensor.title');

  return (
    <DetailShell
      breadcrumb={[
        { label: t('common.map'), to: '/' },
        {
          label: building.data?.name ?? t('building.title'),
          to: `/buildings/${data.buildingId}`,
        },
        {
          label: room.data?.name ?? t('room.fallbackName', { floor: String(room.data?.floor ?? '?') }),
          to: `/rooms/${data.roomId}`,
        },
        { label: title },
      ]}
      title={title}
      subtitle={statusLabel(data.statusCode)}
    >
      <AttributeList
        rows={[
          { label: t('sensor.manufacturer'), value: data.manufacturer },
          { label: t('sensor.model'), value: data.model },
          { label: t('sensor.serialNumber'), value: data.serialNumber },
          { label: t('sensor.status'), value: statusLabel(data.statusCode) },
          {
            label: t('sensor.parameters'),
            value: data.measuredParameters.map((p) => p.code).join(', ') || null,
          },
        ]}
      />

      <SensorHistoryCharts sensor={data} />
    </DetailShell>
  );
}

/** One chart per declared quantity, all driven by a single shared range selector. */
function SensorHistoryCharts({ sensor }: { sensor: PublicSensorDetail }) {
  const { t } = useTranslation('entity');
  const [range, setRange] = useState<TimeRange>('day');

  if (sensor.measuredParameters.length === 0) return null;

  return (
    <Box>
      <Heading size="md" mb="3">
        {t('sensor.chartsTitle')}
      </Heading>
      <Box mb="5">
        <RangeSelector value={range} onChange={setRange} />
      </Box>
      <Stack gap="8">
        {sensor.measuredParameters.map((parameter) => (
          <ParameterChart
            key={parameter.code}
            sensorId={sensor.id}
            parameterCode={parameter.code}
            range={range}
          />
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
  const { t } = useTranslation('entity');
  const properties = useMapProperties();
  const { displayUnitFor } = useUnitPreference();
  const { data, isLoading, isError } = useObservationAggregate({ sensorId, parameterCode, range });

  const label =
    properties.data?.find((p) => p.code === parameterCode)?.label ?? parameterCode;
  const canonicalUnit = data?.unit ?? '';

  return (
    <Box>
      <Text fontWeight="medium" mb="2">
        {label}
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
        <TimeSeriesChart
          buckets={data.buckets}
          unit={canonicalUnit}
          displayUnit={displayUnitFor(canonicalUnit)}
        />
      )}
    </Box>
  );
}
