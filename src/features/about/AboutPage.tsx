import { Heading, Link as ChakraLink, Stack, Text, VStack } from '@chakra-ui/react';

/**
 * About / contact page.
 *
 * PLACEHOLDER (Phase 1): the descriptive copy below is provisional and untranslated —
 * final, accurate wording arrives with i18n (Phase 3), sourced from the thesis glossary
 * in cs + en. The contact details are real and intended to stay.
 */
export function AboutPage() {
  return (
    <VStack gap="6" align="start" maxW="2xl">
      <VStack gap="2" align="start">
        <Heading size="2xl">About Ambiquality</Heading>
        <Text color="fg.muted" fontStyle="italic">
          Placeholder copy — not final and not yet translated (cs/en). Replaced in Phase 3.
        </Text>
        <Text color="fg.muted">
          Ambiquality is a platform for monitoring indoor environmental quality (IEQ). This web
          client is its visitor and operator interface. Developed as a bachelor thesis project at
          the Prague University of Economics and Business (VŠE Prague) and released as open source.
        </Text>
      </VStack>

      <VStack gap="2" align="start">
        <Heading size="lg" as="h2">
          Contact
        </Heading>
        <Stack gap="1" align="start">
          <Text>Vilém Charwot</Text>
          <ChakraLink href="mailto:vilem.charwot@proton.me">vilem.charwot@proton.me</ChakraLink>
        </Stack>
      </VStack>
    </VStack>
  );
}
