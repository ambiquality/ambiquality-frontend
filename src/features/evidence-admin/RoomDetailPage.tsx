import { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Link as ChakraLink,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProblemError, Breadcrumb } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useRoom, useSensors, type RoomSnapshot } from './queries';
import { SummaryCard, Pager, paginate, pageCountOf } from './components';
import { useRoomSummaryRows } from './summaries';
import { publicEntityUri } from './entity-uri';

/**
 * F06 room detail — the read-only screen. Reads the latest room snapshot and renders it as a
 * {@link SummaryCard} (with Edit and History actions on their own sub-routes; pollution sources
 * shown read-only). Below the card, the sensors (F08/F09) are listed with client-side pagination
 * and a Details button per row.
 */
export function RoomDetailPage() {
  const { t } = useTranslation('evidence');
  const { buildingId = '', roomId = '' } = useParams();
  const room = useRoom(buildingId, roomId);

  return (
    <Box maxW="3xl" mx="auto">
      <Breadcrumb
        items={[
          { label: t('building.listTitle'), to: '/operator' },
          { label: t('building.detailTitle'), to: `/operator/buildings/${buildingId}` },
          { label: room.data?.name ?? t('room.detailTitle') },
        ]}
      />

      {room.isLoading && <Spinner aria-label={t('common.loading')} mt="6" />}
      {room.error instanceof ProblemErrorObject && (
        <Box mt="6">
          <ProblemError error={room.error} />
        </Box>
      )}

      {room.data && (
        <Stack gap="10" align="stretch" mt="2">
          <RoomSummary buildingId={buildingId} roomId={roomId} snapshot={room.data} />
          <SensorsSection buildingId={buildingId} roomId={roomId} />
        </Stack>
      )}
    </Box>
  );
}

function RoomSummary({
  buildingId,
  roomId,
  snapshot,
}: {
  buildingId: string;
  roomId: string;
  snapshot: RoomSnapshot;
}) {
  const { t } = useTranslation('evidence');
  const rows = useRoomSummaryRows(snapshot);

  return (
    <SummaryCard
      title={snapshot.name}
      uri={publicEntityUri('rooms', snapshot.uriSlug)}
      rows={rows}
      actions={
        <HStack gap="2">
          <ChakraLink asChild>
            <RouterLink to={`/operator/buildings/${buildingId}/rooms/${roomId}/history`}>
              <Button variant="outline" size="sm">
                {t('nav.history')}
              </Button>
            </RouterLink>
          </ChakraLink>
          <ChakraLink asChild>
            <RouterLink to={`/operator/buildings/${buildingId}/rooms/${roomId}/edit`}>
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

function SensorsSection({ buildingId, roomId }: { buildingId: string; roomId: string }) {
  const { t } = useTranslation('evidence');
  const sensors = useSensors(buildingId, roomId);
  const [page, setPage] = useState(1);

  const all = sensors.data ?? [];
  const pageCount = pageCountOf(all.length);
  const visible = paginate(all, page);

  return (
    <Box as="section" aria-labelledby="sensors-heading">
      <HStack justify="space-between" mb="4" align="center">
        <Text as="h2" id="sensors-heading" fontSize="xl" fontWeight="semibold">
          {t('sensor.listTitle')}
        </Text>
        <ChakraLink asChild>
          <RouterLink to={`/operator/buildings/${buildingId}/rooms/${roomId}/sensors/new`}>
            <Button colorPalette="brand">{t('nav.newSensor')}</Button>
          </RouterLink>
        </ChakraLink>
      </HStack>

      {sensors.isLoading && <Spinner aria-label={t('common.loading')} />}
      {all.length === 0 && !sensors.isLoading && (
        <Text color="fg.muted">{t('common.empty')}</Text>
      )}
      {all.length > 0 && (
        <>
          <Stack as="ul" gap="2" listStyleType="none">
            {visible.map((s) => (
              <HStack
                as="li"
                key={s.id}
                borderWidth="1px"
                borderColor="border"
                rounded="md"
                p="3"
                justify="space-between"
                align="center"
                gap="4"
              >
                <Box>
                  <ChakraLink asChild fontWeight="medium">
                    <RouterLink
                      to={`/operator/buildings/${buildingId}/rooms/${roomId}/sensors/${s.id}`}
                    >
                      {s.manufacturer} {s.model}
                    </RouterLink>
                  </ChakraLink>
                  <Text color="fg.muted" fontSize="sm">
                    {s.serialNumber}
                  </Text>
                </Box>
                <ChakraLink asChild>
                  <RouterLink
                    to={`/operator/buildings/${buildingId}/rooms/${roomId}/sensors/${s.id}`}
                  >
                    <Button variant="outline" size="sm">
                      {t('nav.details')}
                    </Button>
                  </RouterLink>
                </ChakraLink>
              </HStack>
            ))}
          </Stack>
          <Pager page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </Box>
  );
}
