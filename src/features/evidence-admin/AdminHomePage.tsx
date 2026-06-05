import { Heading, Text, VStack } from '@chakra-ui/react';

/**
 * F05–F09 operator evidence admin landing. Placeholder for Phase 5 (building / room /
 * sensor registration, per-attribute temporal edits + asOf history, sensor lifecycle,
 * one-time API key). Behind `ProtectedRoute`. Consumes Evidence.Api.
 */
export function AdminHomePage() {
  return (
    <VStack gap="3" align="start">
      <Heading size="2xl">Operator dashboard</Heading>
      <Text color="fg.muted">
        Evidence administration (buildings, rooms, sensors with temporal versioning)
        lands in Phase 5.
      </Text>
    </VStack>
  );
}
