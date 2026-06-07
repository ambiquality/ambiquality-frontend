import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Image,
  Link as ChakraLink,
  Spacer,
} from '@chakra-ui/react';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useAuth } from '@/auth/useAuth';
import logoUrl from '@/assets/ambiquality-full.svg';

/**
 * Top-level shell shared by every route: skip link, header with the brand logo + primary nav,
 * and an `<Outlet />` for the active route. The Phase-3 language switch lives in the header;
 * the auth-aware account menu (Phase 4) sits beside it. All chrome strings are i18n-driven
 * (cs/en).
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
          {/* Wraps on narrow screens (≤360 px): the account + language group drops to a second
              line instead of overflowing the viewport. The two HStacks stay intact as wrap units. */}
          <Flex align="center" gap={{ base: '3', sm: '6' }} rowGap="3" wrap="wrap">
            <HStack gap={{ base: '4', sm: '6' }}>
              <ChakraLink asChild>
                <RouterLink to="/">
                  <Image src={logoUrl} alt={t('appName')} h="8" w="auto" />
                </RouterLink>
              </ChakraLink>
              <HStack as="nav" gap="4" aria-label={t('nav.primary')}>
                <ChakraLink asChild>
                  <RouterLink to="/">{t('nav.map')}</RouterLink>
                </ChakraLink>
                <ChakraLink asChild>
                  <RouterLink to="/operator">{t('nav.operator')}</RouterLink>
                </ChakraLink>
                <ChakraLink asChild>
                  <RouterLink to="/about">{t('nav.about')}</RouterLink>
                </ChakraLink>
              </HStack>
            </HStack>
            <Spacer />
            <HStack gap="3">
              <AccountNav />
              <LanguageSwitch />
            </HStack>
          </Flex>
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

/**
 * Auth-aware account affordance in the header (Phase 4): a "sign in" link when anonymous; an
 * account link + "sign out" button when authenticated. Hidden entirely while the boot session
 * restore is still resolving so the header doesn't flicker login→account.
 */
function AccountNav() {
  const { t } = useTranslation('account');
  const { isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <ChakraLink asChild>
        <RouterLink to="/login">{t('nav.login')}</RouterLink>
      </ChakraLink>
    );
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <HStack gap="3">
      <ChakraLink asChild>
        <RouterLink to="/operator/account">{t('nav.account')}</RouterLink>
      </ChakraLink>
      <Button size="sm" variant="ghost" onClick={handleLogout}>
        {t('nav.logout')}
      </Button>
    </HStack>
  );
}
