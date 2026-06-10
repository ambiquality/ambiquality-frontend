import { Heading, Link as ChakraLink, Text, VStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { env } from '@/lib/env';

/**
 * DOK-03 — the summary HTML help reachable from the main navigation: how to read the map,
 * browse and download the open data, what operators can register, and how the platform
 * treats units and history. Per-field contextual help lives on the registration forms
 * themselves (the ⓘ hints); this page is the connected overview.
 */
export function HelpPage() {
  const { t } = useTranslation('help');

  const sections = [
    { key: 'map', paragraphs: ['p1', 'p2'] },
    { key: 'browse', paragraphs: ['p1', 'p2'] },
    { key: 'download', paragraphs: ['p1', 'p2'] },
    { key: 'operators', paragraphs: ['p1', 'p2', 'p3'] },
    { key: 'preferences', paragraphs: ['p1'] },
  ] as const;

  return (
    <VStack gap="8" align="start" maxW="2xl">
      <VStack gap="3" align="start">
        <Heading size="2xl" as="h1">
          {t('title')}
        </Heading>
        <Text color="fg.muted">{t('intro')}</Text>
      </VStack>

      {sections.map((section) => (
        <VStack key={section.key} gap="2" align="start">
          <Heading size="lg" as="h2">
            {t(`${section.key}.heading`)}
          </Heading>
          {section.paragraphs.map((p) => (
            <Text key={p} color="fg.muted">
              {t(`${section.key}.${p}` as never)}
            </Text>
          ))}
        </VStack>
      ))}

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          {t('api.heading')}
        </Heading>
        <Text color="fg.muted">{t('api.p1')}</Text>
        <Text color="fg.muted">
          <ChakraLink colorPalette="brand" href={`${env.publicApiBase}/scalar/v1`} target="_blank" rel="noopener">
            {t('api.referenceLink')}
          </ChakraLink>{' '}
          ·{' '}
          <ChakraLink asChild colorPalette="brand">
            <RouterLink to="/catalog">{t('api.catalogLink')}</RouterLink>
          </ChakraLink>{' '}
          ·{' '}
          <ChakraLink asChild colorPalette="brand">
            <RouterLink to="/archive">{t('api.archiveLink')}</RouterLink>
          </ChakraLink>
        </Text>
      </VStack>
    </VStack>
  );
}
