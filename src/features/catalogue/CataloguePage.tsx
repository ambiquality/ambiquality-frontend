import {
  Alert,
  Badge,
  Box,
  Button,
  Link as ChakraLink,
  Code,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
  Wrap,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useCatalog } from '@/api/public/catalog-hooks';
import type { LiveDistribution, ParsedCatalog } from '@/api/public/catalog-types';
import { DATA_LICENSE } from '@/lib/constants';

/**
 * F16 — the human-readable rendering of the open-data DCAT-AP catalogue metadata. It reads the
 * single `/v1/catalog` endpoint (Public.Api) via the shared {@link useCatalog} hook (same source as
 * the Archive tab) and presents the descriptive metadata plus the *live* API access points. The
 * downloadable monthly archives are intentionally NOT shown here — they live on the Archive tab.
 *
 * States mirror the map/Archive UC18 contract: a spinner while loading; a friendly degradation
 * banner with retry when the catalogue can't be loaded. The parser never throws on a sparse
 * document, so each section renders only when it has data (graceful empty fallback).
 */
export function CataloguePage() {
  const { t, i18n } = useTranslation('catalog');
  const { data, isLoading, isError, refetch } = useCatalog();

  const locale = i18n.resolvedLanguage ?? i18n.language;
  const title = data?.catalog.title ?? t('fallbackTitle');
  const description = data?.catalog.description;

  return (
    <VStack gap="8" align="start" maxW="3xl">
      <VStack gap="3" align="start">
        <Heading size="2xl" as="h1">
          {title}
        </Heading>
        <Text color="fg.muted">{description ?? t('intro')}</Text>
      </VStack>

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

      {!isLoading && !isError && data && (
        <>
          <DatasetSection catalog={data} />
          <CoverageSection catalog={data} locale={locale} />
          <DistributionsSection distributions={data.liveDistributions} />
          <DataDocumentationSection />
        </>
      )}
    </VStack>
  );
}

/** A label/value definition row used across the metadata sections. */
function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text as="dt" fontWeight="medium" color="fg.muted" mb="1">
        {label}
      </Text>
      <Box as="dd">{children}</Box>
    </Box>
  );
}

/** Dataset-level descriptive metadata: title, description, publisher, license, theme, etc. */
function DatasetSection({ catalog }: { catalog: ParsedCatalog }) {
  const { t } = useTranslation('catalog');
  const { dataset } = catalog;

  return (
    <VStack gap="4" align="start" w="full">
      <Heading size="lg" as="h2">
        {t('dataset.heading')}
      </Heading>

      {dataset.title && (
        <Heading size="md" as="h3">
          {dataset.title}
        </Heading>
      )}
      {dataset.description && <Text color="fg.muted">{dataset.description}</Text>}

      <SimpleGrid as="dl" columns={{ base: 1, sm: 2 }} gap="4" w="full">
        {dataset.publisher && (
          <MetaRow label={t('dataset.publisherLabel')}>
            <Text>{dataset.publisher}</Text>
          </MetaRow>
        )}

        {dataset.licenseUrl && (
          <MetaRow label={t('dataset.licenseLabel')}>
            <LicenseLink url={dataset.licenseUrl} />
          </MetaRow>
        )}

        {dataset.themeUri && (
          <MetaRow label={t('dataset.themeLabel')}>
            <VocabularyLink uri={dataset.themeUri} kind="theme" />
          </MetaRow>
        )}

        {dataset.accrualPeriodicityUri && (
          <MetaRow label={t('dataset.periodicityLabel')}>
            <VocabularyLink uri={dataset.accrualPeriodicityUri} kind="periodicity" />
          </MetaRow>
        )}

        {(dataset.contact.name || dataset.contact.email) && (
          <MetaRow label={t('dataset.contactLabel')}>
            <Stack gap="0.5">
              {dataset.contact.name && <Text>{dataset.contact.name}</Text>}
              {dataset.contact.email && (
                <ChakraLink colorPalette="brand" href={`mailto:${dataset.contact.email}`}>
                  {dataset.contact.email}
                </ChakraLink>
              )}
            </Stack>
          </MetaRow>
        )}
      </SimpleGrid>

      {dataset.keywords.length > 0 && (
        <Box w="full">
          <Text fontWeight="medium" color="fg.muted" mb="2">
            {t('dataset.keywordsLabel')}
          </Text>
          <Wrap gap="2">
            {dataset.keywords.map((keyword) => (
              <Badge key={keyword} colorPalette="brand" variant="subtle">
                {keyword}
              </Badge>
            ))}
          </Wrap>
        </Box>
      )}
    </VStack>
  );
}

/** Temporal + spatial coverage of the dataset. */
function CoverageSection({ catalog, locale }: { catalog: ParsedCatalog; locale: string }) {
  const { t } = useTranslation('catalog');
  const { dataset } = catalog;
  const { issued, temporal, spatialBboxWkt } = dataset;

  // Nothing to show — skip the whole section.
  if (!issued && !temporal && !spatialBboxWkt) return null;

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const formatDate = (value: string | undefined): string | undefined => {
    if (value == null) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : dateFmt.format(date);
  };

  const issuedLabel = formatDate(issued);
  const start = formatDate(temporal?.start);
  const end = formatDate(temporal?.end);
  const bbox = parseBboxWkt(spatialBboxWkt);

  return (
    <VStack gap="4" align="start" w="full">
      <Heading size="lg" as="h2">
        {t('coverage.heading')}
      </Heading>

      <SimpleGrid as="dl" columns={{ base: 1, sm: 2 }} gap="4" w="full">
        {issuedLabel && (
          <MetaRow label={t('coverage.issuedLabel')}>
            <Text>{issuedLabel}</Text>
          </MetaRow>
        )}

        {(start || end) && (
          <MetaRow label={t('coverage.temporalLabel')}>
            <Text>
              {start && end
                ? t('coverage.temporalRange', { start, end })
                : (start ?? end)}
            </Text>
          </MetaRow>
        )}

        {spatialBboxWkt && (
          <MetaRow label={t('coverage.spatialLabel')}>
            {bbox ? (
              <Text>
                {t('coverage.bboxLabel', {
                  minLon: formatCoord(bbox.minLon),
                  maxLon: formatCoord(bbox.maxLon),
                  minLat: formatCoord(bbox.minLat),
                  maxLat: formatCoord(bbox.maxLat),
                })}
              </Text>
            ) : (
              <Code>{spatialBboxWkt}</Code>
            )}
          </MetaRow>
        )}
      </SimpleGrid>
    </VStack>
  );
}

/** The live API access points (entries with a `dcat:accessURL`) as outbound links + media badges. */
function DistributionsSection({ distributions }: { distributions: LiveDistribution[] }) {
  const { t } = useTranslation('catalog');
  if (distributions.length === 0) return null;

  return (
    <VStack gap="3" align="start" w="full">
      <Heading size="lg" as="h2">
        {t('distributions.heading')}
      </Heading>
      <Text color="fg.muted">{t('distributions.intro')}</Text>
      <Stack as="ul" gap="3" align="start" w="full" listStyleType="none">
        {distributions.map((dist) => (
          <HStack as="li" key={dist.url} gap="3">
            <ChakraLink
              colorPalette="brand"
              href={dist.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {dist.title}
            </ChakraLink>
            {dist.mediaType && (
              <Badge variant="outline">{mediaTypeLabel(dist.mediaType)}</Badge>
            )}
          </HStack>
        ))}
      </Stack>
    </VStack>
  );
}

/**
 * Render a license URL as a link; when the URL is the platform's data license, show its human label
 * (`CC BY 4.0`) from `@/lib/constants`, otherwise fall back to the raw URL text.
 */
function LicenseLink({ url }: { url: string }) {
  const label = url === DATA_LICENSE.url ? DATA_LICENSE.name : url;
  return (
    <ChakraLink colorPalette="brand" href={url} target="_blank" rel="noopener noreferrer">
      {label}
    </ChakraLink>
  );
}

/**
 * Render an EU controlled-vocabulary URI (`dcat:theme` / `dcterms:accrualPeriodicity`) as a
 * friendly, localized label linked to the dereferenceable URI. The label is keyed off the URI's
 * trailing path segment (e.g. `ENVI`, `CONT`); unmapped codes fall back to the raw URI text.
 */
function VocabularyLink({ uri, kind }: { uri: string; kind: 'theme' | 'periodicity' }) {
  const { t } = useTranslation('catalog');
  // Trailing path segment, e.g. ".../data-theme/ENVI" → "ENVI".
  const code = uri.split('/').filter(Boolean).pop() ?? uri;
  const key = `${kind}.${code}`;
  const mapped = t(key, { defaultValue: '' });
  const label = mapped !== '' ? mapped : uri;

  return (
    <ChakraLink colorPalette="brand" href={uri} target="_blank" rel="noopener noreferrer">
      {label}
    </ChakraLink>
  );
}

/** Format a bbox coordinate as a short string (up to 4 decimals, trailing zeros trimmed). */
function formatCoord(value: number): string {
  return String(Math.round(value * 1e4) / 1e4);
}

/** Short, friendly badge text for the common open-data media types (else the raw type). */
function mediaTypeLabel(mediaType: string): string {
  if (mediaType === 'text/csv') return 'CSV';
  if (mediaType === 'application/ld+json') return 'JSON-LD';
  if (mediaType === 'application/json') return 'JSON';
  return mediaType;
}

/**
 * Parse a WKT `POLYGON((lon lat, …))` bounding box into its min/max lon/lat. DCAT `dcat:bbox`
 * literals are `lon lat` ordered. Returns `undefined` if the string can't be parsed (caller then
 * falls back to showing the raw WKT in a `<Code>` block).
 */
function parseBboxWkt(
  wkt: string | undefined,
): { minLon: number; maxLon: number; minLat: number; maxLat: number } | undefined {
  if (wkt == null) return undefined;
  const match = wkt.match(/\(\(([^()]+)\)\)/);
  if (match == null) return undefined;

  const lons: number[] = [];
  const lats: number[] = [];
  for (const pair of match[1].split(',')) {
    const [lonText, latText] = pair.trim().split(/\s+/);
    const lon = Number(lonText);
    const lat = Number(latText);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    lons.push(lon);
    lats.push(lat);
  }
  if (lons.length === 0 || lats.length === 0) return undefined;

  return {
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
}
/**
 * DOK-01 — per-dataset HTML documentation: the structure and meaning of each published
 * observation field, the update cadence, and the terms of use. Lives on the catalogue page
 * so the dataset's metadata (above) and its field semantics share one cohesive web page;
 * print styling comes from the browser's CSS print path, not a PDF.
 */
function DataDocumentationSection() {
  const { t } = useTranslation('catalog');

  const FIELD_KEYS = [
    'id',
    'sensorId',
    'parameterCode',
    'value',
    'unit',
    'observedAt',
    'receivedAt',
    'isInvalid',
  ] as const;

  return (
    <VStack gap="4" align="start" w="full">
      <Heading size="lg" as="h2">
        {t('docs.heading')}
      </Heading>
      <Text color="fg.muted">{t('docs.intro')}</Text>

      <Heading size="md" as="h3">
        {t('docs.fieldsHeading')}
      </Heading>
      <Box as="dl" w="full" borderWidth="1px" borderColor="border" rounded="md" px="4" py="1">
        {FIELD_KEYS.map((key) => (
          <Box key={key} py="2" borderBottomWidth="1px" _last={{ borderBottomWidth: 0 }}>
            <Code as="dt">{t(`docs.fields.${key}.name`)}</Code>
            <Text as="dd" color="fg.muted" mt="1">
              {t(`docs.fields.${key}.meaning`)}
            </Text>
          </Box>
        ))}
      </Box>

      <Heading size="md" as="h3">
        {t('docs.updatesHeading')}
      </Heading>
      <Text color="fg.muted">{t('docs.updatesBody')}</Text>

      <Heading size="md" as="h3">
        {t('docs.termsHeading')}
      </Heading>
      <Text color="fg.muted">
        {t('docs.termsBody')}{' '}
        <ChakraLink colorPalette="brand" href={DATA_LICENSE.url} target="_blank" rel="noopener">
          {DATA_LICENSE.name}
        </ChakraLink>
        .
      </Text>
      <Text color="fg.muted">{t('docs.termsQuality')}</Text>
    </VStack>
  );
}
