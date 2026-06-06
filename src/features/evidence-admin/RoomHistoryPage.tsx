import { useState } from 'react';
import { Box, Button, Link as ChakraLink, Spinner, Stack } from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProblemError, Breadcrumb } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useRoom, type RoomSnapshot } from './queries';
import { AsOfViewer, SummaryCard } from './components';
import { useRoomSummaryRows } from './summaries';
import { publicEntityUri } from './entity-uri';

/**
 * F07 room history. Owns the `asOf` selector and re-reads the room as it looked at the chosen
 * instant (`null` = latest), rendering the projection as a read-only {@link SummaryCard}. Edits
 * live on the sibling `/edit` route.
 */
export function RoomHistoryPage() {
  const { t } = useTranslation('evidence');
  const { buildingId = '', roomId = '' } = useParams();
  const [asOf, setAsOf] = useState<string | null>(null);
  const room = useRoom(buildingId, roomId, asOf);

  return (
    <Box maxW="3xl" mx="auto">
      <Breadcrumb
        items={[
          { label: t('building.listTitle'), to: '/operator' },
          { label: t('building.detailTitle'), to: `/operator/buildings/${buildingId}` },
          {
            label: room.data?.name ?? t('room.detailTitle'),
            to: `/operator/buildings/${buildingId}/rooms/${roomId}`,
          },
          { label: t('nav.history') },
        ]}
      />

      <Stack gap="6" align="stretch" mt="2">
        <AsOfViewer value={asOf} onChange={setAsOf} />

        {room.isLoading && <Spinner aria-label={t('common.loading')} />}
        {room.error instanceof ProblemErrorObject && <ProblemError error={room.error} />}
        {room.data && <RoomHistoryCard snapshot={room.data} />}
      </Stack>

      <ChakraLink asChild mt="8" display="inline-block">
        <RouterLink to={`/operator/buildings/${buildingId}/rooms/${roomId}`}>
          <Button variant="ghost">{t('nav.back')}</Button>
        </RouterLink>
      </ChakraLink>
    </Box>
  );
}

function RoomHistoryCard({ snapshot }: { snapshot: RoomSnapshot }) {
  const { t } = useTranslation('evidence');
  const rows = useRoomSummaryRows(snapshot);
  return (
    <SummaryCard
      title={t('room.historyTitle')}
      uri={publicEntityUri('rooms', snapshot.uriSlug)}
      rows={rows}
    />
  );
}
