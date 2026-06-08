import { Heading, Link as ChakraLink, List, Stack, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { CONTACT_EMAIL, DATA_LICENSE, GITHUB_ORG_URL } from '@/lib/constants';

/**
 * Open-source dependency attribution.
 *
 * Listed are the shipped runtime dependencies whose licenses ask for notice retention, plus the
 * basemap/data providers credited on the map. Names, URLs and SPDX license identifiers are
 * proper nouns and stay untranslated; only the surrounding prose comes from i18n. Reconciled
 * against `package.json` `dependencies` (every entry below is actually shipped).
 */
const ACKNOWLEDGEMENTS: ReadonlyArray<{ name: string; url: string; license: string }> = [
  { name: 'MapLibre GL JS', url: 'https://maplibre.org/', license: 'BSD-3-Clause' },
  { name: 'React', url: 'https://react.dev/', license: 'MIT' },
  { name: 'Chakra UI', url: 'https://chakra-ui.com/', license: 'MIT' },
  { name: 'TanStack Query', url: 'https://tanstack.com/query', license: 'MIT' },
  { name: 'react-i18next', url: 'https://react.i18next.com/', license: 'MIT' },
  { name: 'D3', url: 'https://d3js.org/', license: 'ISC' },
];

/**
 * About / contact page (visitor-facing). Describes the platform, credits the author, links to the
 * source and the open-data licence, and attributes the open-source software it is built on. No
 * personal email is shown — the public contact address comes from `@/lib/constants`.
 */
export function AboutPage() {
  const { t } = useTranslation('about');

  return (
    <VStack gap="8" align="start" maxW="2xl">
      <VStack gap="3" align="start">
        <Heading size="2xl" as="h1">
          {t('title')}
        </Heading>
        <Text color="fg.muted">{t('intro.lead')}</Text>
        <Text color="fg.muted">{t('intro.app')}</Text>
        <Text color="fg.muted">{t('intro.thesis')}</Text>
      </VStack>

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          {t('contact.heading')}
        </Heading>
        <Stack gap="1" align="start">
          <Text>
            {t('contact.authorLabel')}: {t('contact.authorName')}
          </Text>
          <Text>
            {t('contact.emailLabel')}:{' '}
            <ChakraLink colorPalette="brand" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </ChakraLink>
          </Text>
        </Stack>
      </VStack>

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          {t('source.heading')}
        </Heading>
        <Text color="fg.muted">{t('source.description')}</Text>
        <ChakraLink
          colorPalette="brand"
          href={GITHUB_ORG_URL}
          target="_blank"
          rel="noopener"
        >
          {t('source.linkLabel')}
        </ChakraLink>
      </VStack>

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          {t('data.heading')}
        </Heading>
        <Text color="fg.muted">
          {t('data.description')}{' '}
          <ChakraLink
            colorPalette="brand"
            href={DATA_LICENSE.url}
            target="_blank"
            rel="noopener"
          >
            {DATA_LICENSE.name}
          </ChakraLink>
        </Text>
      </VStack>

      <VStack gap="3" align="start">
        <Heading size="lg" as="h2">
          {t('acknowledgements.heading')}
        </Heading>
        <Text color="fg.muted">{t('acknowledgements.description')}</Text>
        <List.Root gap="1">
          {ACKNOWLEDGEMENTS.map((dep) => (
            <List.Item key={dep.name} listStyleType="none">
              <ChakraLink
                colorPalette="brand"
                href={dep.url}
                target="_blank"
                rel="noopener"
              >
                {dep.name}
              </ChakraLink>{' '}
              <Text as="span" color="fg.muted">
                — {t('acknowledgements.licenseLabel', { license: dep.license })}
              </Text>
            </List.Item>
          ))}
        </List.Root>
        <Text color="fg.muted">{t('acknowledgements.basemapNote')}</Text>
      </VStack>
    </VStack>
  );
}
