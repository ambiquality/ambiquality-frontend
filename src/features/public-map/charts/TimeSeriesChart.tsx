import { useMemo } from 'react';
import { chakra } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { scaleLinear, scaleTime } from 'd3-scale';
import { area, curveMonotoneX, line } from 'd3-shape';
import { max as d3max, min as d3min } from 'd3-array';
import { timeFormat } from 'd3-time-format';
import { convert } from '@/units';
import type { AggregateBucket } from '@/api/public/map-types';

const WIDTH = 600;
const HEIGHT = 260;
const MARGIN = { top: 12, right: 14, bottom: 28, left: 48 } as const;
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;

const TWO_DAYS_MS = 2 * 24 * 3_600_000;
const SIXTY_DAYS_MS = 60 * 24 * 3_600_000;

export interface TimeSeriesChartProps {
  buckets: ReadonlyArray<AggregateBucket>;
  /** Canonical unit of the bucket values, as returned by the API. */
  unit: string;
  /** Preferred display unit (PER). When it differs and is convertible, values are shown in it. */
  displayUnit?: string;
}

/**
 * Trend line of the bucketed average over time, with the min–max range shaded behind it. d3 owns
 * the scales/paths; React renders the SVG (via the `chakra` factory so axes/marks use theme tokens
 * instead of raw hex). The chart scales to its container through a fixed `viewBox`; it's exposed as
 * a single labelled `img` to assistive tech (the dialog's numeric summary is the textual detail).
 *
 * PER: values are mapped through the canonical→`displayUnit` conversion for display only (the
 * `buckets` data is never mutated); the axis label follows the shown unit.
 */
export function TimeSeriesChart({ buckets, unit, displayUnit }: TimeSeriesChartProps) {
  const { t, i18n } = useTranslation('map');
  const locale = i18n.resolvedLanguage ?? i18n.language;

  // Only convert when a different, known display unit is requested; otherwise stay canonical.
  const canConvert = displayUnit != null && displayUnit !== unit && convert(0, unit, displayUnit) != null;
  const shownUnit = canConvert ? displayUnit! : unit;

  const model = useMemo(() => {
    if (buckets.length === 0) return null;
    const cv = (v: number) => (canConvert ? convert(v, unit, displayUnit!)! : v);
    const times = buckets.map((b) => new Date(b.t));
    const x = scaleTime()
      .domain([times[0], times[times.length - 1]])
      .range([0, INNER_W]);

    const lo = cv(d3min(buckets, (b) => b.min) ?? 0);
    const hi = cv(d3max(buckets, (b) => b.max) ?? 0);
    const y = scaleLinear().domain([lo, hi]).nice().range([INNER_H, 0]);

    const points = buckets.map((b, i) => ({ ...b, date: times[i] }));
    const bandPath =
      area<(typeof points)[number]>()
        .x((d) => x(d.date))
        .y0((d) => y(cv(d.min)))
        .y1((d) => y(cv(d.max)))
        .curve(curveMonotoneX)(points) ?? '';
    const linePath =
      line<(typeof points)[number]>()
        .x((d) => x(d.date))
        .y((d) => y(cv(d.avg)))
        .curve(curveMonotoneX)(points) ?? '';

    const spanMs = times[times.length - 1].getTime() - times[0].getTime();
    const fmt = timeFormat(spanMs <= TWO_DAYS_MS ? '%H:%M' : spanMs <= SIXTY_DAYS_MS ? '%d %b' : '%b %Y');
    const numberFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

    const xTicks = x.ticks(5).map((d) => ({ x: x(d), label: fmt(d) }));
    const yTicks = y.ticks(5).map((v) => ({ y: y(v), label: numberFmt.format(v) }));

    return { bandPath, linePath, xTicks, yTicks };
  }, [buckets, locale, canConvert, unit, displayUnit]);

  if (!model) return null;

  return (
    <chakra.svg
      width="100%"
      height="auto"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={t('chart.timeSeriesDesc')}
      color="border"
    >
      <chakra.g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Horizontal gridlines + y tick labels. */}
        {model.yTicks.map((tick, i) => (
          <chakra.g key={`y-${i}`} transform={`translate(0,${tick.y})`}>
            <chakra.line x1={0} x2={INNER_W} stroke="currentColor" strokeOpacity={0.25} />
            <chakra.text x={-8} dy="0.32em" textAnchor="end" fontSize="10px" fill="fg.muted">
              {tick.label}
            </chakra.text>
          </chakra.g>
        ))}

        {/* x tick labels. */}
        {model.xTicks.map((tick, i) => (
          <chakra.text
            key={`x-${i}`}
            x={tick.x}
            y={INNER_H + 18}
            textAnchor="middle"
            fontSize="10px"
            fill="fg.muted"
          >
            {tick.label}
          </chakra.text>
        ))}

        {/* Min–max band + average line. */}
        <chakra.path d={model.bandPath} fill="teal.solid" fillOpacity={0.16} />
        <chakra.path d={model.linePath} fill="none" stroke="teal.solid" strokeWidth={2} />

        {/* Axis value label. */}
        <chakra.text
          transform={`translate(${-MARGIN.left + 12},${INNER_H / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="10px"
          fill="fg.muted"
        >
          {t('chart.axisValue', { unit: shownUnit })}
        </chakra.text>
      </chakra.g>
    </chakra.svg>
  );
}
