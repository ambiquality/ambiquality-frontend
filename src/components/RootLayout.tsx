import { Box, Container, Flex, HStack, Heading, Link as ChakraLink, Spacer } from '@chakra-ui/react';
import { Link as RouterLink, Outlet } from 'react-router-dom';
import { ColorModeButton } from '@/theme';

/**
 * Top-level shell shared by every route: skip link, header with primary nav, and an
 * `<Outlet />` for the active route. Kept deliberately thin in Phase 1; the language
 * switch (Phase 3) and auth-aware account menu (Phase 4) slot into the header later.
 */
export function RootLayout() {
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
        Skip to content
      </ChakraLink>

      <Box as="header" borderBottomWidth="1px" px="4" py="3">
        <Container maxW="6xl" px="0">
          <HStack gap="6">
            <Heading size="md" color="brand.fg">
              <RouterLink to="/">Ambiquality</RouterLink>
            </Heading>
            <HStack as="nav" gap="4" aria-label="Primary">
              <ChakraLink asChild>
                <RouterLink to="/">Map</RouterLink>
              </ChakraLink>
              <ChakraLink asChild>
                <RouterLink to="/admin">Operator</RouterLink>
              </ChakraLink>
              <ChakraLink asChild>
                <RouterLink to="/about">About</RouterLink>
              </ChakraLink>
            </HStack>
            <Spacer />
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
