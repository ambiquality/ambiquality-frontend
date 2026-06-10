import { SegmentGroup } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { TimeRange } from '@/api/public/map-types';

const TIME_RANGES: TimeRange[] = ['day', 'week', 'month', 'year'];

/**
 * Shared look-back range selector (ROZ-03): the same four-window control everywhere a
 * time chart appears — the map's building dialog, the operator sensor detail and the
 * public sensor detail. Labels come from the shared `map` chart vocabulary so the
 * surfaces stay consistent.
 */
export function RangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) {
  const { t } = useTranslation('map');

  return (
    <SegmentGroup.Root
      value={value}
      onValueChange={(e) => e.value && onChange(e.value as TimeRange)}
      size="sm"
    >
      <SegmentGroup.Indicator />
      {TIME_RANGES.map((range) => (
        <SegmentGroup.Item key={range} value={range}>
          <SegmentGroup.ItemText>{t(`range.${range}`)}</SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      ))}
    </SegmentGroup.Root>
  );
}
