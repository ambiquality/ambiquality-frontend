import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Link as ChakraLink,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, type BreadcrumbItem } from '@/components/Breadcrumb';

/** Page chrome shared by the three public entity details: breadcrumb, title, body. */
export function DetailShell({
  breadcrumb,
  title,
  subtitle,
  children,
}: {
  breadcrumb: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Container maxW="4xl" py="8">
      <Stack gap="6">
        <Breadcrumb items={breadcrumb} />
        <Box>
          <Heading size="xl">{title}</Heading>
          {subtitle && (
            <Text color="fg.muted" mt="1">
              {subtitle}
            </Text>
          )}
        </Box>
        {children}
      </Stack>
    </Container>
  );
}

/** Centred spinner / error alert for a detail page's initial load. */
export function DetailStatus({ isLoading, isError }: { isLoading: boolean; isError: boolean }) {
  const { t } = useTranslation('entity');

  if (isLoading)
    return (
      <HStack gap="3" color="fg.muted" py="10" justify="center">
        <Spinner size="sm" />
        <Text>{t('common.loading')}</Text>
      </HStack>
    );

  if (isError)
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>{t('common.error')}</Alert.Title>
      </Alert.Root>
    );

  return null;
}

/** Definition list of entity attributes; rows with empty values are skipped. */
export function AttributeList({
  rows,
}: {
  rows: Array<{ label: string; value: ReactNode | null | undefined }>;
}) {
  const visible = rows.filter((row) => row.value !== null && row.value !== undefined && row.value !== '');
  return (
    <Box as="dl" borderWidth="1px" borderColor="border" rounded="md" px="4" py="1">
      {visible.map((row) => (
        <Flex
          key={row.label}
          justify="space-between"
          gap="4"
          py="2"
          borderBottomWidth="1px"
          _last={{ borderBottomWidth: 0 }}
          wrap="wrap"
        >
          <Text as="dt" color="fg.muted">
            {row.label}
          </Text>
          <Box as="dd" fontWeight="medium" textAlign="right">
            {row.value}
          </Box>
        </Flex>
      ))}
    </Box>
  );
}

/** Titled list of links to child entities (building → rooms, room → sensors). */
export function ChildList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: Array<{ id: string; to: string; label: string; meta?: string }>;
}) {
  return (
    <Box>
      <Heading size="md" mb="3">
        {title}
      </Heading>
      {items.length === 0 ? (
        <Text color="fg.muted">{emptyText}</Text>
      ) : (
        <Stack as="ul" gap="0" listStyleType="none" borderWidth="1px" borderColor="border" rounded="md">
          {items.map((item) => (
            <Flex
              as="li"
              key={item.id}
              justify="space-between"
              align="center"
              gap="4"
              px="4"
              py="3"
              borderBottomWidth="1px"
              _last={{ borderBottomWidth: 0 }}
            >
              <ChakraLink asChild colorPalette="brand" fontWeight="medium">
                <RouterLink to={item.to}>{item.label}</RouterLink>
              </ChakraLink>
              {item.meta && (
                <Text color="fg.muted" fontSize="sm">
                  {item.meta}
                </Text>
              )}
            </Flex>
          ))}
        </Stack>
      )}
    </Box>
  );
}
