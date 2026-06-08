import { Box, Button, HStack, Link as ChakraLink, Spinner, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProblemError, Breadcrumb } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useSensor, type SensorSnapshot } from './queries';
import { SummaryCard, CopyField } from './components';
import { useSensorSummaryRows } from './summaries';
import { publicEntityUri } from './entity-uri';

/**
 * F08 sensor detail — the read-only screen. Reads the latest sensor snapshot (NO `apiKey` — that
 * is shown once at registration and is unrecoverable) and renders it as a {@link SummaryCard} with
 * the measured quantities listed on the card, plus Edit (F08/F09 temporal attribute forms +
 * measured-parameter collection) and History (the `asOf` projection) actions on their own routes.
 */
export function SensorDetailPage() {
  const { t } = useTranslation('evidence');
  const { buildingId = '', roomId = '', sensorId = '' } = useParams();
  const sensor = useSensor(buildingId, roomId, sensorId);

  const title = sensor.data
    ? `${sensor.data.manufacturer} ${sensor.data.model}`
    : t('sensor.detailTitle');

  return (
    <Box maxW="3xl" mx="auto">
      <Breadcrumb
        items={[
          { label: t('building.listTitle'), to: '/operator' },
          { label: t('building.detailTitle'), to: `/operator/buildings/${buildingId}` },
          { label: t('room.detailTitle'), to: `/operator/buildings/${buildingId}/rooms/${roomId}` },
          { label: title },
        ]}
      />

      {sensor.isLoading && <Spinner aria-label={t('common.loading')} mt="6" />}
      {sensor.error instanceof ProblemErrorObject && (
        <Box mt="6">
          <ProblemError error={sensor.error} />
        </Box>
      )}

      {sensor.data && (
        <Stack gap="10" align="stretch" mt="2">
          <SensorSummary
            buildingId={buildingId}
            roomId={roomId}
            sensorId={sensorId}
            snapshot={sensor.data}
            title={title}
          />
        </Stack>
      )}
    </Box>
  );
}

function SensorSummary({
  buildingId,
  roomId,
  sensorId,
  snapshot,
  title,
}: {
  buildingId: string;
  roomId: string;
  sensorId: string;
  snapshot: SensorSnapshot;
  title: string;
}) {
  const { t } = useTranslation('evidence');
  const rows = useSensorSummaryRows(snapshot);
  const base = `/operator/buildings/${buildingId}/rooms/${roomId}/sensors/${sensorId}`;

  return (
    <SummaryCard
      title={title}
      uri={publicEntityUri('sensors', snapshot.uriSlug)}
      headerExtra={
        <Stack gap="1">
          <CopyField label={t('sensor.ingestionId')} value={snapshot.id} />
          <Text fontSize="xs" color="fg.muted" maxW="md">
            {t('sensor.ingestionIdHint')}
          </Text>
        </Stack>
      }
      rows={rows}
      actions={
        <HStack gap="2">
          <ChakraLink asChild>
            <RouterLink to={`${base}/history`}>
              <Button variant="outline" size="sm">
                {t('nav.history')}
              </Button>
            </RouterLink>
          </ChakraLink>
          <ChakraLink asChild>
            <RouterLink to={`${base}/edit`}>
              <Button colorPalette="brand" size="sm">
                {t('nav.edit')}
              </Button>
            </RouterLink>
          </ChakraLink>
        </HStack>
      }
    />
  );
}
