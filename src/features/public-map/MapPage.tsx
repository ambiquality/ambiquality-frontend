import { Heading, Text, VStack } from '@chakra-ui/react';

/**
 * F18 — public interactive map (visitor interface). Placeholder for Phase 7, where
 * MapLibre GL + a d3 indicator overlay, the parameter filter, click-through to entity
 * detail, and the UC18 degradation banner land. Reads from Public.Api.
 */
export function MapPage() {
  return (
    <VStack gap="3" align="start">
      <Heading size="2xl">Interactive map</Heading>
      <Text color="fg.muted">
        The public map of registered buildings and their latest sensor values lands in
        Phase 7 (MapLibre GL + d3 overlay).
      </Text>
    </VStack>
  );
}
