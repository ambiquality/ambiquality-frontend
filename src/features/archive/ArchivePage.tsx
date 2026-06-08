import {
  Alert,
  Box,
  Button,
  Link as ChakraLink,
  Heading,
  HStack,
  Spinner,
  Stack,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useCatalog } from '@/api/public/catalog-hooks';
import {
  formatByteSize,
  type ArchiveDistribution,
  type LiveDistribution,
} from '@/api/public/catalog-types';
import { DATA_LICENSE } from '@/lib/constants';

/**
 * F17 — the visitor "data archive": a file-server-style list of downloadable monthly data archives
 * plus a link to the live full CSV export. It reads the single DCAT catalogue endpoint (Public.Api)
 * via {@link useCatalog} and renders the catalogue's `dcat:distribution` entries:
 *  - the CSV access point (`/v1/observations.csv`) as a prominent "download everything" link, so the
 *    page is useful even before any monthly archive exists;
 *  - the downloadable archives (entries with a `dcat:downloadURL`) as a responsive, horizontally
 *    scrollable table.
 *
 * States mirror the map's UC18 contract: a spinner while loading; a friendly empty state when no
 * archives are published yet (NOT an error); and a warning banner (with the live download as a
 * fallback) when the catalogue can't be loaded.
 */
export function ArchivePage() {
  const { t, i18n } = useTranslation('archive');
  const { data, isLoading, isError, refetch } = useCatalog();

  const locale = i18n.resolvedLanguage ?? i18n.language;
  const archives = data?.archives ?? [];
  // The live full-export CSV (`/v1/observations.csv`) — surfaced above the table so the page works
  // before any monthly archive exists, and as the fallback download in the error state.
  const liveCsv = data?.liveDistributions.find((d) => d.mediaType === 'text/csv');

  return (
    <VStack gap="8" align="start" maxW="4xl">
      <VStack gap="3" align="start">
        <Heading size="2xl" as="h1">
          {t('title')}
        </Heading>
        <Text color="fg.muted">{t('intro', { license: DATA_LICENSE.name })}</Text>
      </VStack>

      {liveCsv && <LiveExport distribution={liveCsv} />}

      <VStack gap="3" align="start" w="full">
        <Heading size="lg" as="h2">
          {t('table.heading')}
        </Heading>

        {isLoading && <Spinner aria-label={t('loading')} />}

        {!isLoading && isError && (
          <Alert.Root status="warning" maxW="2xl">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('error.title')}</Alert.Title>
              <Alert.Description>{t('error.body')}</Alert.Description>
            </Alert.Content>
            <Button size="sm" variant="outline" onClick={() => refetch()} alignSelf="center">
              {t('error.retry')}
            </Button>
          </Alert.Root>
        )}

        {!isLoading && !isError && archives.length === 0 && (
          <Alert.Root status="info" maxW="2xl">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('empty.title')}</Alert.Title>
              <Alert.Description>{t('empty.body')}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {!isLoading && !isError && archives.length > 0 && (
          <ArchiveTable archives={archives} locale={locale} />
        )}
      </VStack>
    </VStack>
  );
}

/** The prominent "download all current data (CSV)" link, separated from the monthly archive table. */
function LiveExport({ distribution }: { distribution: LiveDistribution }) {
  const { t } = useTranslation('archive');
  return (
    <Box borderWidth="1px" rounded="md" p="4" w="full" maxW="2xl" bg="bg.subtle">
      <Stack gap="2" align="start">
        <Heading size="md" as="h2">
          {t('live.heading')}
        </Heading>
        <Text color="fg.muted">{t('live.description')}</Text>
        <ChakraLink colorPalette="brand" href={distribution.url} download rel="noopener">
          {t('live.csvLabel')}
        </ChakraLink>
      </Stack>
    </Box>
  );
}

/** The responsive, horizontally-scrollable table of downloadable monthly archives. */
function ArchiveTable({
  archives,
  locale,
}: {
  archives: ArchiveDistribution[];
  locale: string;
}) {
  const { t } = useTranslation('archive');
  // Month + year label, e.g. "March 2025" / "březen 2025", derived from the period start.
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });

  function periodLabel(archive: ArchiveDistribution): string {
    const start = archive.period?.start;
    if (start == null) return t('table.sizeUnknown');
    const date = new Date(start);
    return Number.isNaN(date.getTime()) ? start : monthFmt.format(date);
  }

  function formatLabel(archive: ArchiveDistribution): string {
    const media = archive.mediaType === 'text/csv' ? 'CSV' : (archive.mediaType ?? '');
    const compress = archive.compressFormat === 'application/zip' ? 'ZIP' : undefined;
    return compress ? `${media} · ${compress}` : media;
  }

  return (
    <Table.ScrollArea borderWidth="1px" rounded="md" maxW="full" w="full">
      <Table.Root size="sm">
        <Table.Caption srOnly>{t('table.caption')}</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('table.colPeriod')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('table.colFormat')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('table.colSize')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('table.colDownload')}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {archives.map((archive) => {
            const period = periodLabel(archive);
            const size = formatByteSize(archive.byteSize) ?? t('table.sizeUnknown');
            return (
              <Table.Row key={archive.downloadUrl}>
                <Table.Cell>{period}</Table.Cell>
                <Table.Cell>{formatLabel(archive)}</Table.Cell>
                <Table.Cell color="fg.muted">{size}</Table.Cell>
                <Table.Cell>
                  <ChakraLink
                    colorPalette="brand"
                    href={archive.downloadUrl}
                    download
                    rel="noopener"
                    aria-label={t('table.downloadLabel', { period })}
                  >
                    <HStack gap="1">
                      <Text as="span">{t('table.download')}</Text>
                    </HStack>
                  </ChakraLink>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
