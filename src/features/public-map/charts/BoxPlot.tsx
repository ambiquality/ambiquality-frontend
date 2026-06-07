import { useMemo } from 'react';
import { chakra } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { scaleLinear } from 'd3-scale';
import type { AggregateStats } from '@/api/public/map-types';

const WIDTH = 220;
const HEIGHT = 260;
const MARGIN = { top: 12, right: 16, bottom: 16, left: 52 } as const;
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const BOX_HALF = 34;

export interface BoxPlotProps {
  stats: AggregateStats;
  unit: string;
}

/**
 * Vertical box-and-whisker plot of the distribution: box = 25th–75th percentile, line = median,
 * whiskers = 5th–95th percentile, dots = min/max. d3 supplies the scale; React renders the SVG
 * (via the `chakra` factory for themed colours). Labelled as one `img`; the dialog's numeric
 * summary carries the exact five-number values for assistive tech.
 */
export function BoxPlot({ stats, unit }: BoxPlotProps) {
  const { t, i18n } = useTranslation('map');
  const locale = i18n.resolvedLanguage ?? i18n.language;

  const model = useMemo(() => {
    const y = scaleLinear().domain([stats.min, stats.max]).nice().range([INNER_H, 0]);
    const numberFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const cx = INNER_W / 2;
    return {
      cx,
      y,
      yTicks: y.ticks(5).map((v) => ({ y: y(v), label: numberFmt.format(v) })),
      yp05: y(stats.p05),
      yp25: y(stats.p25),
      yp50: y(stats.p50),
      yp75: y(stats.p75),
      yp95: y(stats.p95),
      ymin: y(stats.min),
      ymax: y(stats.max),
      fmt: numberFmt,
    };
  }, [stats, locale]);

  const ariaLabel = `${t('chart.boxplotDesc')} ${t('boxplot.median')} ${model.fmt.format(
    stats.p50,
  )} ${unit}, ${t('boxplot.p25')} ${model.fmt.format(stats.p25)}, ${t('boxplot.p75')} ${model.fmt.format(
    stats.p75,
  )}, ${t('boxplot.min')} ${model.fmt.format(stats.min)}, ${t('boxplot.max')} ${model.fmt.format(stats.max)}.`;

  const { cx } = model;

  return (
    <chakra.svg
      width="100%"
      height="auto"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
      color="border"
      maxW="14rem"
    >
      <chakra.g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* y axis ticks + gridlines. */}
        {model.yTicks.map((tick, i) => (
          <chakra.g key={`y-${i}`} transform={`translate(0,${tick.y})`}>
            <chakra.line x1={0} x2={INNER_W} stroke="currentColor" strokeOpacity={0.2} />
            <chakra.text x={-8} dy="0.32em" textAnchor="end" fontSize="10px" fill="fg.muted">
              {tick.label}
            </chakra.text>
          </chakra.g>
        ))}

        {/* Whisker (p05–p95) with caps. */}
        <chakra.line x1={cx} x2={cx} y1={model.yp95} y2={model.yp75} stroke="fg.muted" />
        <chakra.line x1={cx} x2={cx} y1={model.yp25} y2={model.yp05} stroke="fg.muted" />
        <chakra.line x1={cx - 14} x2={cx + 14} y1={model.yp95} y2={model.yp95} stroke="fg.muted" />
        <chakra.line x1={cx - 14} x2={cx + 14} y1={model.yp05} y2={model.yp05} stroke="fg.muted" />

        {/* Inter-quartile box (p25–p75). */}
        <chakra.rect
          x={cx - BOX_HALF}
          y={model.yp75}
          width={BOX_HALF * 2}
          height={Math.max(0, model.yp25 - model.yp75)}
          fill="teal.solid"
          fillOpacity={0.18}
          stroke="teal.solid"
        />
        {/* Median. */}
        <chakra.line
          x1={cx - BOX_HALF}
          x2={cx + BOX_HALF}
          y1={model.yp50}
          y2={model.yp50}
          stroke="teal.solid"
          strokeWidth={2}
        />

        {/* Min / max as outer dots. */}
        <chakra.circle cx={cx} cy={model.ymin} r={2.5} fill="fg.muted" />
        <chakra.circle cx={cx} cy={model.ymax} r={2.5} fill="fg.muted" />
      </chakra.g>
    </chakra.svg>
  );
}
