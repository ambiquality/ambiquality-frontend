import { Alert, Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export interface DegradationBannerProps {
  onRetry?: () => void;
}

/**
 * UC18 degradation notice: shown when the latest-value snapshot can't be loaded (Public.Api down
 * or erroring). The map still renders — just without value indicators — and this banner explains
 * the situation and points to the table below, which stays usable. A retry re-runs the snapshot
 * query.
 */
export function DegradationBanner({ onRetry }: DegradationBannerProps) {
  const { t } = useTranslation('map');

  return (
    <Alert.Root status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t('degradation.title')}</Alert.Title>
        <Alert.Description>{t('degradation.body')}</Alert.Description>
      </Alert.Content>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} alignSelf="center">
          {t('degradation.retry')}
        </Button>
      )}
    </Alert.Root>
  );
}
