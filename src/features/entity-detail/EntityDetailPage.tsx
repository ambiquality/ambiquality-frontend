import { Code, Heading, Text, VStack } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';

/**
 * Visitor entity detail (building / room / sensor) with breadcrumb + d3 time-series
 * chart. Placeholder for Phase 6. The `slug` is the backend-issued stable id
 * (`bld-…` / `rm-…` / `sns-…`) so detail URLs are shareable.
 */
export function EntityDetailPage({ kind }: { kind: 'building' | 'room' | 'sensor' }) {
  const { slug } = useParams<{ slug: string }>();
  return (
    <VStack gap="3" align="start">
      <Heading size="2xl">{kind} detail</Heading>
      <Text color="fg.muted">
        Detail view with breadcrumb and time-series chart arrives in Phase 6.
      </Text>
      <Text color="fg.muted">
        slug: <Code>{slug}</Code>
      </Text>
    </VStack>
  );
}
