import { Link, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { env } from '@/lib/env';

/**
 * Links that tell an operator how to make a sensor submit measurements: the step-by-step
 * wiki guide and the read-only Ingestion API reference (Scalar). Shown at the one-time
 * API-key reveal and, permanently, on the sensor detail page (the key is shown only once,
 * so these must be findable later too). Both targets are external; URLs come from `env`.
 */
export function SensorDocsLinks() {
  const { t } = useTranslation('evidence');

  const guideUrl = `${env.docsBase}/sending-measurements.html`;
  const referenceUrl = `${env.ingestionApiBase}/scalar`;

  return (
    <Stack gap="1">
      <Text fontWeight="medium">{t('apiKey.nextStepsTitle')}</Text>
      <Text color="fg.muted">{t('docs.intro')}</Text>
      <Link href={guideUrl} target="_blank" rel="noopener noreferrer" colorPalette="brand">
        {t('docs.sendingGuide')}
      </Link>
      <Link href={referenceUrl} target="_blank" rel="noopener noreferrer" colorPalette="brand">
        {t('docs.apiReference')}
      </Link>
    </Stack>
  );
}
