import { Box, HStack, Text, Wrap, WrapItem } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { LEGEND_STATUSES } from './color-bands';

export interface MapLegendProps {
  /** True when the selected quantity has discrete good/moderate/poor bands. */
  banded: boolean;
}

/**
 * Map colour legend. For a banded quantity it lists the good/moderate/poor/unknown swatches
 * (coloured straight from the `ieq.*` theme tokens — no raw hex); for an unbanded quantity it
 * explains the continuous value scale instead.
 */
export function MapLegend({ banded }: MapLegendProps) {
  const { t } = useTranslation('map');

  if (!banded) {
    return (
      <Text fontSize="sm" color="fg.muted">
        {t('legend.continuous')}
      </Text>
    );
  }

  return (
    <Wrap gap="4" aria-label={t('legend.title')}>
      {LEGEND_STATUSES.map((status) => (
        <WrapItem key={status}>
          <HStack gap="2">
            <Box
              boxSize="3"
              rounded="full"
              bg={`ieq.${status}`}
              borderWidth="1px"
              borderColor="border"
              aria-hidden
            />
            <Text fontSize="sm">{t(`legend.${status}`)}</Text>
          </HStack>
        </WrapItem>
      ))}
    </Wrap>
  );
}
