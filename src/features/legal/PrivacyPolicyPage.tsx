import { Heading, Link as ChakraLink, List, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { CONTACT_EMAIL } from '@/lib/constants';

/**
 * Public Privacy Policy page (GDPR/EU framing). A full data-protection notice rendered from i18n
 * keys (cs+en) with semantic headings (`h1` title, `h2` sections) — no raw HTML and no
 * `dangerouslySetInnerHTML` (the refresh token lives in `localStorage`, so the app stays
 * XSS-clean). The contact address comes from `@/lib/constants`.
 *
 * The notice is provisional: Ambiquality is a student bachelor-thesis project at VŠE Praha and
 * the text awaits the author's legal review (see the closing "status" section).
 */
export function PrivacyPolicyPage() {
  const { t } = useTranslation('legal');

  const contactLink = (
    <ChakraLink colorPalette="brand" href={`mailto:${CONTACT_EMAIL}`}>
      {CONTACT_EMAIL}
    </ChakraLink>
  );

  return (
    <VStack gap="8" align="start" maxW="2xl">
      <VStack gap="3" align="start">
        <Heading size="2xl" as="h1">
          {t('privacy.title')}
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          {t('privacy.lastUpdated')}
        </Text>
        <Text color="fg.muted">{t('privacy.intro')}</Text>
      </VStack>

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          {t('privacy.controller.heading')}
        </Heading>
        <Text color="fg.muted">{t('privacy.controller.body')}</Text>
        <Text>
          {t('privacy.controller.contactLabel')}: {contactLink}
        </Text>
      </VStack>

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          {t('privacy.data.heading')}
        </Heading>
        <Text color="fg.muted">{t('privacy.data.intro')}</Text>
        <List.Root color="fg.muted" gap="2">
          <List.Item>{t('privacy.data.accountEmail')}</List.Item>
          <List.Item>{t('privacy.data.addressData')}</List.Item>
          <List.Item>{t('privacy.data.technical')}</List.Item>
        </List.Root>
      </VStack>

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          {t('privacy.purpose.heading')}
        </Heading>
        <Text color="fg.muted">{t('privacy.purpose.intro')}</Text>
        <List.Root color="fg.muted" gap="2">
          <List.Item>{t('privacy.purpose.contract')}</List.Item>
          <List.Item>{t('privacy.purpose.legitimate')}</List.Item>
          <List.Item>{t('privacy.purpose.openData')}</List.Item>
        </List.Root>
      </VStack>

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          {t('privacy.retention.heading')}
        </Heading>
        <Text color="fg.muted">{t('privacy.retention.body')}</Text>
      </VStack>

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          {t('privacy.recipients.heading')}
        </Heading>
        <Text color="fg.muted">{t('privacy.recipients.body')}</Text>
      </VStack>

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          {t('privacy.rights.heading')}
        </Heading>
        <Text color="fg.muted">{t('privacy.rights.intro')}</Text>
        <List.Root color="fg.muted" gap="2">
          <List.Item>{t('privacy.rights.access')}</List.Item>
          <List.Item>{t('privacy.rights.rectification')}</List.Item>
          <List.Item>{t('privacy.rights.erasure')}</List.Item>
          <List.Item>{t('privacy.rights.restriction')}</List.Item>
          <List.Item>{t('privacy.rights.objection')}</List.Item>
          <List.Item>{t('privacy.rights.portability')}</List.Item>
        </List.Root>
        <Text color="fg.muted">{t('privacy.rights.complaint')}</Text>
      </VStack>

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          {t('privacy.contact.heading')}
        </Heading>
        <Text color="fg.muted">{t('privacy.contact.body')}</Text>
        <Text>{contactLink}</Text>
      </VStack>

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          {t('privacy.disclaimer.heading')}
        </Heading>
        <Text color="fg.muted">{t('privacy.disclaimer.body')}</Text>
      </VStack>
    </VStack>
  );
}
