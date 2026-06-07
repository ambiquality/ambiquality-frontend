import { useMemo, useState } from 'react';
import { Heading, HStack, Stack, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { scaleSequential } from 'd3-scale';
import { interpolateViridis } from 'd3-scale-chromatic';
import { extent } from 'd3-array';
import { useMapProperties, useMapSnapshot } from '@/api/public/map-hooks';
import { MapView, type MapMarker, type MarkerSelection } from './MapView';
import { ParameterFilter } from './ParameterFilter';
import { MapLegend } from './MapLegend';
import { BuildingDialog } from './BuildingDialog';
import { DegradationBanner } from './DegradationBanner';
import { MarkerTableFallback } from './MarkerTableFallback';
import { classify, hasBands, resolveStatusColor } from './color-bands';
import { DisplayUnitControl } from '@/units';

/**
 * F18 — public interactive map (visitor interface, UC18). Reads from Public.Api only.
 *
 * Data flow: pick a quantity (`/v1/properties`) → load that quantity's cached latest-value
 * snapshot (`/v1/map/snapshot`) → render one circle marker per building, coloured by its IEQ band
 * (or a continuous scale for quantities without public thresholds). Clicking a marker selects a
 * building; the trend + boxplot dialog over that selection lands in the next phase.
 */
export function MapPage() {
  const { t } = useTranslation('map');

  const { data: properties = [], isLoading: propertiesLoading } = useMapProperties();
  // The effective quantity is the explicit choice, falling back to the first available one — a
  // derived value (no effect/setState round-trip) so the map has a selection as soon as the
  // catalogue loads.
  const [selectedParam, setSelectedParam] = useState<string | null>(null);
  const parameterCode = selectedParam ?? properties[0]?.code ?? null;

  const { data: snapshot, isError: snapshotError, refetch } = useMapSnapshot(parameterCode);
  const [selected, setSelected] = useState<MarkerSelection | null>(null);

  const banded = parameterCode ? hasBands(parameterCode) : false;
  const items = useMemo(() => snapshot?.items ?? [], [snapshot]);

  // Continuous fallback scale for quantities without discrete bands (domain = observed values).
  const continuousColor = useMemo(() => {
    if (banded || !parameterCode) return null;
    const values = items.filter((i) => !i.stale && i.latestValue != null).map((i) => i.latestValue!);
    const [min, max] = extent(values);
    if (min == null || max == null || min === max) return null;
    return scaleSequential(interpolateViridis).domain([min, max]);
  }, [items, banded, parameterCode]);

  const markers = useMemo<MapMarker[]>(() => {
    const unit = snapshot?.unit ?? '';
    return items.map((item) => {
      const unknown = item.stale || item.latestValue == null;
      let color: string;
      if (unknown) {
        color = resolveStatusColor('unknown');
      } else if (banded) {
        color = resolveStatusColor(classify(parameterCode!, item.latestValue));
      } else {
        color = continuousColor ? continuousColor(item.latestValue!) : resolveStatusColor('unknown');
      }
      const valueText = `${item.latestValue}${unit ? ` ${unit}` : ''}`;
      const label = unknown
        ? t('marker.valueUnavailable', { name: item.name })
        : t('marker.label', { name: item.name, value: valueText });
      return {
        buildingId: item.buildingId,
        slug: item.slug,
        name: item.name,
        lon: item.lon,
        lat: item.lat,
        color,
        label,
      };
    });
  }, [items, banded, parameterCode, continuousColor, snapshot?.unit, t]);

  return (
    <VStack gap="4" align="stretch">
      <VStack gap="1" align="start">
        <Heading size="2xl">{t('title')}</Heading>
        <Text color="fg.muted" maxW="3xl">
          {t('intro')}
        </Text>
      </VStack>

      <Stack
        direction={{ base: 'column', md: 'row' }}
        gap="4"
        align={{ base: 'stretch', md: 'flex-end' }}
        justify="space-between"
      >
        <HStack gap="4" align="flex-end" wrap="wrap">
          <ParameterFilter
            properties={properties}
            value={parameterCode}
            onChange={setSelectedParam}
            isLoading={propertiesLoading}
          />
          <DisplayUnitControl canonicalUnit={snapshot?.unit ?? null} />
        </HStack>
        <MapLegend banded={banded} />
      </Stack>

      {snapshotError && <DegradationBanner onRetry={() => void refetch()} />}

      <MapView markers={markers} onMarkerClick={setSelected} />

      <VStack gap="3" align="stretch">
        <Heading size="md">{t('fallback.title')}</Heading>
        <MarkerTableFallback
          items={items}
          parameterCode={parameterCode}
          unit={snapshot?.unit ?? null}
          onSelect={setSelected}
        />
      </VStack>

      <BuildingDialog
        selection={selected}
        parameterCode={parameterCode}
        unit={snapshot?.unit ?? null}
        onClose={() => setSelected(null)}
      />
    </VStack>
  );
}
