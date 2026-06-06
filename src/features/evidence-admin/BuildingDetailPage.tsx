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
import { useBuilding, useRooms, type BuildingSnapshot } from './queries';
import { SummaryCard, Pager, paginate, pageCountOf } from './components';
import { useBuildingSummaryRows } from './summaries';
import { publicEntityUri } from './entity-uri';

/**
 * F05 building detail — the read-only "what does this look like now" screen. Reads the latest
 * snapshot and renders it as a {@link SummaryCard} with Edit (F07 temporal attribute forms) and
 * History (the `asOf` projection) actions on their own sub-routes. Below the card, the rooms
 * (F06) are listed with client-side pagination and a Details button per row.
 */
export function BuildingDetailPage() {
  const { t } = useTranslation('evidence');
  const { buildingId = '' } = useParams();
  const building = useBuilding(buildingId);

  return (
    <Box maxW="3xl" mx="auto">
      <Breadcrumb
        items={[
          { label: t('building.listTitle'), to: '/operator' },
          { label: building.data?.name ?? t('building.detailTitle') },
        ]}
      />

      {building.isLoading && <Spinner aria-label={t('common.loading')} mt="6" />}
      {building.error instanceof ProblemErrorObject && (
        <Box mt="6">
          <ProblemError error={building.error} />
        </Box>
      )}

      {building.data && (
        <Stack gap="10" align="stretch" mt="2">
          <BuildingSummary buildingId={buildingId} snapshot={building.data} />
          <RoomsSection buildingId={buildingId} />
        </Stack>
      )}
    </Box>
  );
}

function BuildingSummary({
  buildingId,
  snapshot,
}: {
  buildingId: string;
  snapshot: BuildingSnapshot;
}) {
  const { t } = useTranslation('evidence');
  const rows = useBuildingSummaryRows(snapshot);

  return (
    <SummaryCard
      title={snapshot.name}
      uri={publicEntityUri('buildings', snapshot.uriSlug)}
      rows={rows}
      actions={
        <HStack gap="2">
          <ChakraLink asChild>
            <RouterLink to={`/operator/buildings/${buildingId}/history`}>
              <Button variant="outline" size="sm">
                {t('nav.history')}
              </Button>
            </RouterLink>
          </ChakraLink>
          <ChakraLink asChild>
            <RouterLink to={`/operator/buildings/${buildingId}/edit`}>
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

function RoomsSection({ buildingId }: { buildingId: string }) {
  const { t } = useTranslation('evidence');
  const rooms = useRooms(buildingId);
  const [page, setPage] = useState(1);

  const all = rooms.data ?? [];
  const pageCount = pageCountOf(all.length);
  const visible = paginate(all, page);

  return (
    <Box as="section" aria-labelledby="rooms-heading">
      <HStack justify="space-between" mb="4" align="center">
        <Text as="h2" id="rooms-heading" fontSize="xl" fontWeight="semibold">
          {t('room.listTitle')}
        </Text>
        <ChakraLink asChild>
          <RouterLink to={`/operator/buildings/${buildingId}/rooms/new`}>
            <Button colorPalette="brand">{t('nav.newRoom')}</Button>
          </RouterLink>
        </ChakraLink>
      </HStack>

      {rooms.isLoading && <Spinner aria-label={t('common.loading')} />}
      {all.length === 0 && !rooms.isLoading && <Text color="fg.muted">{t('common.empty')}</Text>}
      {all.length > 0 && (
        <>
          <Stack as="ul" gap="2" listStyleType="none">
            {visible.map((r) => (
              <HStack
                as="li"
                key={r.id}
                borderWidth="1px"
                borderColor="border"
                rounded="md"
                p="3"
                justify="space-between"
                align="center"
                gap="4"
              >
                <ChakraLink asChild fontWeight="medium">
                  <RouterLink to={`/operator/buildings/${buildingId}/rooms/${r.id}`}>
                    {r.name}
                  </RouterLink>
                </ChakraLink>
                <ChakraLink asChild>
                  <RouterLink to={`/operator/buildings/${buildingId}/rooms/${r.id}`}>
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
