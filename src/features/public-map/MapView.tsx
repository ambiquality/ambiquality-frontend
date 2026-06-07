import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type {
  GeoJSONSource,
  MapGeoJSONFeature,
  MapLayerMouseEvent,
  StyleSpecification,
} from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { env } from '@/lib/env';

/** Default viewport: Prague (VŠE / the thesis pilot area) until the data bounds are known. */
const DEFAULT_CENTER: [number, number] = [14.4378, 50.0755];
const DEFAULT_ZOOM = 11;
const SOURCE_ID = 'buildings';
const LAYER_ID = 'buildings-circles';

/** A single building marker, with its colour already resolved by the caller (per IEQ band). */
export interface MapMarker {
  buildingId: string;
  slug: string;
  name: string;
  lon: number;
  lat: number;
  /** Concrete colour string for the marker fill (good/moderate/poor/unknown). */
  color: string;
  /** Accessible/hover label, e.g. "Rajská budova: 812 ppm". */
  label: string;
}

/** What a marker click hands back (enough to open the building dialog / navigate). */
export interface MarkerSelection {
  buildingId: string;
  slug: string;
  name: string;
}

export interface MapViewProps {
  markers: ReadonlyArray<MapMarker>;
  onMarkerClick?: (selection: MarkerSelection) => void;
}

function toFeatureCollection(markers: ReadonlyArray<MapMarker>): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: markers.map((m) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [m.lon, m.lat] },
      properties: {
        buildingId: m.buildingId,
        slug: m.slug,
        name: m.name,
        color: m.color,
        label: m.label,
      },
    })),
  };
}

/**
 * MapLibre GL wrapper that renders the building markers as a single data-driven circle layer
 * (one GeoJSON source updated in place — far lighter than N DOM markers). The style URL and
 * attribution come from env; no tile provider is hard-coded. Colour is carried per-feature so the
 * layer paints straight from `['get', 'color']`. Markers are not keyboard-focusable by design —
 * the accessible table fallback (added in a later phase) is the WCAG-operable equivalent.
 */
export function MapView({ markers, onMarkerClick }: MapViewProps) {
  const { t } = useTranslation('map');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const markersRef = useRef(markers);
  const onMarkerClickRef = useRef(onMarkerClick);

  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // Create the map once. The marker source/layer is added on first style load, then fed from
  // `markersRef` so later data changes don't recreate the map.
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: env.mapStyleUrl as string | StyleSpecification,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new maplibregl.AttributionControl({ compact: true, customAttribution: env.mapAttribution }),
    );

    map.on('load', () => {
      map.addSource(SOURCE_ID, { type: 'geojson', data: toFeatureCollection(markersRef.current) });
      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, 14, 11],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
      readyRef.current = true;

      const handleClick = (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
        if (!feature) return;
        const props = feature.properties as Record<string, string>;
        onMarkerClickRef.current?.({
          buildingId: props.buildingId,
          slug: props.slug,
          name: props.name,
        });
      };
      map.on('click', LAYER_ID, handleClick);
      map.on('mouseenter', LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', LAYER_ID, () => {
        map.getCanvas().style.cursor = '';
      });
    });

    return () => {
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Push marker changes into the existing source (no map re-init).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(toFeatureCollection(markers));
  }, [markers]);

  return (
    <Box
      ref={containerRef}
      role="application"
      aria-label={t('mapRegionLabel')}
      h={{ base: '60vh', md: '70vh' }}
      minH="20rem"
      w="full"
      rounded="md"
      overflow="hidden"
      borderWidth="1px"
    />
  );
}
