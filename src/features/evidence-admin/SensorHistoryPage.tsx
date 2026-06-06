import { useState } from 'react';
import { Box, Button, Link as ChakraLink, Spinner, Stack } from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProblemError, Breadcrumb } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useSensor, type SensorSnapshot } from './queries';
import { AsOfViewer, SummaryCard } from './components';
import { useSensorSummaryRows } from './summaries';
import { publicEntityUri } from './entity-uri';

/**
 * F08 sensor history. Owns the `asOf` selector and re-reads the sensor as it looked at the chosen
 * instant (`null` = latest), rendering the projection as a read-only {@link SummaryCard}. Edits
 * live on the sibling `/edit` route.
 */
export function SensorHistoryPage() {
  const { t } = useTranslation('evidence');
  const { buildingId = '', roomId = '', sensorId = '' } = useParams();
  const [asOf, setAsOf] = useState<string | null>(null);
  const sensor = useSensor(buildingId, roomId, sensorId, asOf);

  const title = sensor.data
    ? `${sensor.data.manufacturer} ${sensor.data.model}`
    : t('sensor.detailTitle');
  const base = `/operator/buildings/${buildingId}/rooms/${roomId}/sensors/${sensorId}`;

  return (
    <Box maxW="3xl" mx="auto">
      <Breadcrumb
        items={[
          { label: t('building.listTitle'), to: '/operator' },
          { label: t('building.detailTitle'), to: `/operator/buildings/${buildingId}` },
          { label: t('room.detailTitle'), to: `/operator/buildings/${buildingId}/rooms/${roomId}` },
          { label: title, to: base },
          { label: t('nav.history') },
        ]}
      />

      <Stack gap="6" align="stretch" mt="2">
        <AsOfViewer value={asOf} onChange={setAsOf} />

        {sensor.isLoading && <Spinner aria-label={t('common.loading')} />}
        {sensor.error instanceof ProblemErrorObject && <ProblemError error={sensor.error} />}
        {sensor.data && <SensorHistoryCard snapshot={sensor.data} />}
      </Stack>

      <ChakraLink asChild mt="8" display="inline-block">
        <RouterLink to={base}>
          <Button variant="ghost">{t('nav.back')}</Button>
        </RouterLink>
      </ChakraLink>
    </Box>
  );
}

function SensorHistoryCard({ snapshot }: { snapshot: SensorSnapshot }) {
  const { t } = useTranslation('evidence');
  const rows = useSensorSummaryRows(snapshot);
  return (
    <SummaryCard
      title={t('sensor.historyTitle')}
      uri={publicEntityUri('sensors', snapshot.uriSlug)}
      rows={rows}
    />
  );
}
