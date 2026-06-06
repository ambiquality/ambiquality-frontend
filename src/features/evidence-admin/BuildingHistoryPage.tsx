import { useState } from 'react';
import { Box, Button, Link as ChakraLink, Spinner, Stack } from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProblemError, Breadcrumb } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useBuilding, type BuildingSnapshot } from './queries';
import { AsOfViewer, SummaryCard } from './components';
import { useBuildingSummaryRows } from './summaries';
import { publicEntityUri } from './entity-uri';

/**
 * F07 building history. Owns the `asOf` selector and re-reads the building as it looked at the
 * chosen instant (`null` = latest), rendering the projection as a read-only {@link SummaryCard}.
 * Purely a read concern — edits live on the sibling `/edit` route.
 */
export function BuildingHistoryPage() {
  const { t } = useTranslation('evidence');
  const { buildingId = '' } = useParams();
  const [asOf, setAsOf] = useState<string | null>(null);
  const building = useBuilding(buildingId, asOf);

  return (
    <Box maxW="3xl" mx="auto">
      <Breadcrumb
        items={[
          { label: t('building.listTitle'), to: '/operator' },
          {
            label: building.data?.name ?? t('building.detailTitle'),
            to: `/operator/buildings/${buildingId}`,
          },
          { label: t('nav.history') },
        ]}
      />

      <Stack gap="6" align="stretch" mt="2">
        <AsOfViewer value={asOf} onChange={setAsOf} />

        {building.isLoading && <Spinner aria-label={t('common.loading')} />}
        {building.error instanceof ProblemErrorObject && <ProblemError error={building.error} />}
        {building.data && <BuildingHistoryCard snapshot={building.data} />}
      </Stack>

      <ChakraLink asChild mt="8" display="inline-block">
        <RouterLink to={`/operator/buildings/${buildingId}`}>
          <Button variant="ghost">{t('nav.back')}</Button>
        </RouterLink>
      </ChakraLink>
    </Box>
  );
}

function BuildingHistoryCard({ snapshot }: { snapshot: BuildingSnapshot }) {
  const { t } = useTranslation('evidence');
  const rows = useBuildingSummaryRows(snapshot);
  return (
    <SummaryCard
      title={t('building.historyTitle')}
      uri={publicEntityUri('buildings', snapshot.uriSlug)}
      rows={rows}
    />
  );
}
