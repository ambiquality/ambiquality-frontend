import { Heading, Text, VStack } from '@chakra-ui/react';

/**
 * F01–F04 account entry point. Placeholder for Phase 4 (register / login / logout /
 * credential & email change). `ProtectedRoute` redirects here when the operator area
 * is hit while unauthenticated. Consumes Auth.Api.
 */
export function LoginPage() {
  return (
    <VStack gap="3" align="start">
      <Heading size="2xl">Sign in</Heading>
      <Text color="fg.muted">
        Authentication (register / login / account management) lands in Phase 4.
      </Text>
    </VStack>
  );
}
