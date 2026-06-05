import {
  Box,
  Container,
  Flex,
  HStack,
  Heading,
  Link as ChakraLink,
  Spacer,
} from '@chakra-ui/react';
import { Link as RouterLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ColorModeButton } from '@/theme';
import { LanguageSwitch } from '@/components/LanguageSwitch';

/**
 * Top-level shell shared by every route: skip link, header with primary nav, and an
 * `<Outlet />` for the active route. The Phase-3 language switch lives in the header next to
 * the color-mode toggle; the auth-aware account menu (Phase 4) slots in later. All chrome
 * strings are i18n-driven (cs/en).
 */
export function RootLayout() {
  const { t } = useTranslation('common');
  return (
    <Flex direction="column" minH="100dvh">
      <ChakraLink
        href="#main-content"
        position="absolute"
        left="2"
        top="2"
        bg="brand.solid"
        color="brand.contrast"
        px="3"
        py="2"
        rounded="md"
        transform="translateY(-150%)"
        _focusVisible={{ transform: 'translateY(0)' }}
        zIndex="banner"
      >
        {t('actions.skipToContent')}
      </ChakraLink>

      <Box as="header" borderBottomWidth="1px" px="4" py="3">
        <Container maxW="6xl" px="0">
          <HStack gap="6">
            <Heading size="md" color="brand.fg">
              <RouterLink to="/">{t('appName')}</RouterLink>
            </Heading>
            <HStack as="nav" gap="4" aria-label={t('nav.primary')}>
              <ChakraLink asChild>
                <RouterLink to="/">{t('nav.map')}</RouterLink>
              </ChakraLink>
              <ChakraLink asChild>
                <RouterLink to="/admin">{t('nav.operator')}</RouterLink>
              </ChakraLink>
              <ChakraLink asChild>
                <RouterLink to="/about">{t('nav.about')}</RouterLink>
              </ChakraLink>
            </HStack>
            <Spacer />
            <LanguageSwitch />
            <ColorModeButton />
          </HStack>
        </Container>
      </Box>

      <Box as="main" id="main-content" flex="1" px="4" py="6">
        <Container maxW="6xl" px="0">
          <Outlet />
        </Container>
      </Box>
    </Flex>
  );
}
