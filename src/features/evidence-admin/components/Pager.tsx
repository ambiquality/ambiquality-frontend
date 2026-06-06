import { Button, HStack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export interface PagerProps {
  /** Current 1-based page. */
  page: number;
  /** Total number of pages (>= 1). */
  pageCount: number;
  /** Request a new 1-based page. */
  onChange: (page: number) => void;
}

/**
 * Client-side pagination control. Evidence.Api returns rooms/sensors as plain arrays (no paging
 * params), so the nested lists page through the in-memory array. Renders Previous/Next (disabled
 * at the ends) and an accessible "Page X of Y" status. Hidden when there is only one page.
 */
export function Pager({ page, pageCount, onChange }: PagerProps) {
  const { t } = useTranslation('evidence');
  if (pageCount <= 1) return null;

  return (
    <HStack justify="space-between" mt="4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        {t('pager.previous')}
      </Button>
      <Text fontSize="sm" color="fg.muted" role="status">
        {t('pager.status', { page: String(page), total: String(pageCount) })}
      </Text>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
      >
        {t('pager.next')}
      </Button>
    </HStack>
  );
}
