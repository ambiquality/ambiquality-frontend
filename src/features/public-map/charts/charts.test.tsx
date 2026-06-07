import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { TimeSeriesChart } from './TimeSeriesChart';
import { BoxPlot } from './BoxPlot';
import type { AggregateBucket, AggregateStats } from '@/api/public/map-types';

const buckets: AggregateBucket[] = Array.from({ length: 6 }, (_, i) => ({
  t: new Date(Date.UTC(2026, 5, 1, i * 4)).toISOString(),
  count: 12,
  min: 700 + i * 5,
  max: 900 + i * 5,
  avg: 800 + i * 5,
  p25: 760 + i * 5,
  p50: 800 + i * 5,
  p75: 860 + i * 5,
}));

const stats: AggregateStats = {
  count: 288,
  min: 690,
  max: 940,
  avg: 812,
  p05: 705,
  p25: 760,
  p50: 808,
  p75: 870,
  p95: 925,
};

describe('TimeSeriesChart', () => {
  it('renders a labelled chart with band + line paths', () => {
    const { container } = renderWithProviders(<TimeSeriesChart buckets={buckets} unit="ppm" />);
    expect(screen.getByRole('img', { name: /average value over time/i })).toBeInTheDocument();
    // The min–max band and the average line are two distinct, non-empty paths.
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
    paths.forEach((p) => expect(p.getAttribute('d')).toBeTruthy());
  });

  it('renders nothing when there are no buckets', () => {
    const { container } = renderWithProviders(<TimeSeriesChart buckets={[]} unit="ppm" />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('places the y-axis title in a rotated group (not at the plot origin over the top tick)', () => {
    // Regression: a `transform` set on the chakra <text> wasn't applied, so the "Value (unit)"
    // title rendered at the inner origin and overprinted the top tick. The transform must live on
    // a wrapping <g> that carries the rotation.
    renderWithProviders(<TimeSeriesChart buckets={buckets} unit="ppm" />);
    const title = screen.getByText('Value (ppm)');
    expect(title.tagName.toLowerCase()).toBe('text');
    // The title itself must NOT carry the (ineffective) transform...
    expect(title.getAttribute('transform')).toBeNull();
    // ...its wrapping group must, and it must rotate the label.
    const group = title.closest('g');
    expect(group?.getAttribute('transform')).toMatch(/rotate\(-90\)/);
  });
});

describe('BoxPlot', () => {
  it('renders a labelled boxplot describing the five-number summary', () => {
    renderWithProviders(<BoxPlot stats={stats} unit="ppm" />);
    const img = screen.getByRole('img', { name: /spread of values/i });
    // The accessible label carries the exact median / min / max so the SVG isn't opaque.
    expect(img.getAttribute('aria-label')).toMatch(/808/);
    expect(img.getAttribute('aria-label')).toMatch(/690/);
    expect(img.getAttribute('aria-label')).toMatch(/940/);
  });

  it('draws the inter-quartile box as a rect', () => {
    const { container } = renderWithProviders(<BoxPlot stats={stats} unit="ppm" />);
    expect(container.querySelector('rect')).not.toBeNull();
  });
});
