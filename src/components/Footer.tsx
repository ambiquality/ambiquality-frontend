import { Box, Container, Flex, Link as ChakraLink, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CONTACT_EMAIL, DATA_LICENSE, GITHUB_ORG_URL } from '@/lib/constants';
import { env } from '@/lib/env';

/**
 * Site-wide footer. Rendered by `RootLayout` after the `<main>` box so it sticks to the bottom
 * of the viewport (the shell is a column flex with `minH="100dvh"` and a flexed main).
 *
 * Links: the Privacy Policy (internal route), the project's GitHub organisation, a contact
 * `mailto:`, and a short open-data licence line. Everything wraps cleanly at 360 px and uses
 * theme tokens only (no raw hex). Strings live under `common.footer.*`.
 */
export function Footer() {
  const { t } = useTranslation('common');

  return (
    <Box as="footer" borderTopWidth="1px" px="4" py="4" color="fg.muted">
      <Container maxW="6xl" px="0">
        <Flex
          as="nav"
          aria-label={t('footer.label')}
          align="center"
          gap={{ base: '3', sm: '6' }}
          rowGap="2"
          wrap="wrap"
        >
          <ChakraLink asChild colorPalette="brand">
            <RouterLink to="/privacy">{t('footer.privacy')}</RouterLink>
          </ChakraLink>
          <ChakraLink colorPalette="brand" href={GITHUB_ORG_URL} target="_blank" rel="noopener">
            {t('footer.github')}
          </ChakraLink>
          <ChakraLink colorPalette="brand" href={`mailto:${CONTACT_EMAIL}`}>
            {t('footer.contact')}
          </ChakraLink>
          {/* F15: surface the machine-readable API description (OpenAPI + Scalar reference). */}
          <ChakraLink
            colorPalette="brand"
            href={`${env.publicApiBase}/scalar/v1`}
            target="_blank"
            rel="noopener"
          >
            {t('footer.apiDocs')}
          </ChakraLink>
        </Flex>

        <Text mt="2" fontSize="sm">
          {/* Split the i18n sentence on the interpolated licence slot (a sentinel) and render
              the licence name as a link to the licence text. */}
          {(() => {
            const SENTINEL = '\u0000';
            const [before, after] = t('footer.dataLicense', { license: SENTINEL }).split(
              SENTINEL,
            );
            return (
              <>
                {before}
                <ChakraLink
                  colorPalette="brand"
                  href={DATA_LICENSE.url}
                  target="_blank"
                  rel="noopener"
                >
                  {DATA_LICENSE.name}
                </ChakraLink>
                {after}
              </>
            );
          })()}
        </Text>
      </Container>
    </Box>
  );
}
