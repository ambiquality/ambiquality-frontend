import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { Link as RouterLink, isRouteErrorResponse, useRouteError } from 'react-router-dom';

/**
 * Route-level `errorElement` for the data router. Phase 9 (RFC 9457 handling) will
 * enrich this to render ProblemDetails bodies; for now it gives a graceful fallback
 * for thrown route errors and 404s.
 */
export function ErrorPage() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let detail = 'An unexpected error occurred.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    detail = error.status === 404 ? 'This page could not be found.' : detail;
  } else if (error instanceof Error) {
    detail = error.message;
  }

  return (
    <Box py="16">
      <VStack gap="4" align="start">
        <Heading size="xl">{title}</Heading>
        <Text color="fg.muted">{detail}</Text>
        <Button asChild colorPalette="brand">
          <RouterLink to="/">Back to the map</RouterLink>
        </Button>
      </VStack>
    </Box>
  );
}
