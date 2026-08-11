import { type ReactNode } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  Link as ChakraLink,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaGithub } from 'react-icons/fa';
import {
  CONTACT_EMAIL,
  COPYRIGHT_HOLDER,
  DATA_LICENSE,
  GITHUB_ORG_URL,
  SOURCE_LICENSE,
} from '@/lib/constants';
import { env } from '@/lib/env';

/**
 * Site-wide footer. Rendered by `RootLayout` after the `<main>` box so it sticks to the bottom
 * of the viewport (the shell is a column flex with `minH="100dvh"` and a flexed main).
 *
 * Resource links are grouped into labelled columns for scannability (issue #26):
 *  - **Explore**   — the visitor routes (Map, Browse, Catalog, Archive, About);
 *  - **Open data** — Public API reference + data-model spec + open-data licence;
 *  - **Developers** — Ingestion API reference, sending-measurements guide, GitHub (issue #25);
 *  - **Contact**   — privacy policy + contact address.
 *
 * The licence + copyright notices stay as standalone lines below the grouped links. Everything
 * collapses to a single column at 360 px and uses theme tokens only (no raw hex).
 * Strings live under `common.footer.*`.
 */
export function Footer() {
  const { t } = useTranslation('common');

  return (
    <Box as="footer" borderTopWidth="1px" px="4" py="6" color="fg.muted">
      <Container maxW="6xl" px="0">
        <Flex
          as="nav"
          aria-label={t('footer.label')}
          direction="column"
          gap="6"
        >
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={{ base: '6', sm: '8' }}>
            <LinkGroup title={t('footer.group.explore')}>
              <FooterRouterLink to="/">{t('nav.map')}</FooterRouterLink>
              <FooterRouterLink to="/browse">{t('nav.browse')}</FooterRouterLink>
              <FooterRouterLink to="/catalog">{t('nav.catalog')}</FooterRouterLink>
              <FooterRouterLink to="/archive">{t('nav.archive')}</FooterRouterLink>
              <FooterRouterLink to="/about">{t('nav.about')}</FooterRouterLink>
            </LinkGroup>

            <LinkGroup title={t('footer.group.openData')}>
              {/* F15: surface the machine-readable API description (OpenAPI + Scalar reference). */}
              <FooterExternalLink href={`${env.publicApiBase}/scalar/v1`}>
                {t('footer.apiDocs')}
              </FooterExternalLink>
              {/* OFN-conformant formal specification of the open-data conceptual model (ReSpec). */}
              <FooterExternalLink href={`${env.publicApiBase}/docs/`}>
                {t('footer.dataModelSpec')}
              </FooterExternalLink>
              <FooterExternalLink href={DATA_LICENSE.url}>{DATA_LICENSE.name}</FooterExternalLink>
            </LinkGroup>

            <LinkGroup title={t('footer.group.developers')}>
              {/* F08 support: the read-only Ingestion API reference (Scalar). */}
              <FooterExternalLink href={`${env.ingestionApiBase}/scalar`}>
                {t('footer.ingestionApiDocs')}
              </FooterExternalLink>
              {/* The wiki guide on wiring a sensor to the Ingestion API. */}
              <FooterExternalLink href={`${env.docsBase}/sending-measurements.html`}>
                {t('footer.sendingGuide')}
              </FooterExternalLink>
              <FooterExternalLink href={GITHUB_ORG_URL} ariaLabel={t('footer.github')}>
                <Icon as={FaGithub} boxSize="5" />
                {t('footer.github')}
              </FooterExternalLink>
            </LinkGroup>

            <LinkGroup title={t('footer.group.contact')}>
              <FooterRouterLink to="/privacy">{t('footer.privacy')}</FooterRouterLink>
              <FooterExternalLink href={`mailto:${CONTACT_EMAIL}`}>
                {t('footer.contact')}
              </FooterExternalLink>
            </LinkGroup>
          </SimpleGrid>
        </Flex>

        <Text mt="6" fontSize="sm">
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

        <Text mt="1" fontSize="sm">
          {/* Copyright notice: year + author, with the source-code licence rendered as a link.
              Same sentinel-split trick as the open-data licence line above. */}
          {(() => {
            const SENTINEL = '\u0000';
            const [before, after] = t('footer.copyright', {
              year: String(new Date().getFullYear()),
              holder: COPYRIGHT_HOLDER,
              license: SENTINEL,
            }).split(SENTINEL);
            return (
              <>
                {before}
                <ChakraLink
                  colorPalette="brand"
                  href={SOURCE_LICENSE.url}
                  target="_blank"
                  rel="noopener"
                >
                  {SOURCE_LICENSE.name}
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

/** A labelled footer link column: a small heading + a vertical list of links. */
function LinkGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Heading as="h2" size="sm" color="fg" mb="2">
        {title}
      </Heading>
      <Flex direction="column" gap="1.5" align="start">
        {children}
      </Flex>
    </Box>
  );
}

/** In-app route link in a footer column. */
function FooterRouterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <ChakraLink asChild colorPalette="brand">
      <RouterLink to={to}>{children}</RouterLink>
    </ChakraLink>
  );
}

/** External link in a footer column (opens in a new tab unless it is a `mailto:`). */
function FooterExternalLink({
  href,
  ariaLabel,
  children,
}: {
  href: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const external = href.startsWith('http');
  return (
    <ChakraLink
      colorPalette="brand"
      href={href}
      aria-label={ariaLabel}
      {...(external ? { target: '_blank', rel: 'noopener' } : {})}
    >
      {children}
    </ChakraLink>
  );
}
