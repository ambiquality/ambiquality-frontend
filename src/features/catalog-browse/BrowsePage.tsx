import { useState } from 'react';
import {
  Box,
  Button,
  Field,
  Container,
  Flex,
  Heading,
  HStack,
  Link as ChakraLink,
  NativeSelect,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPublicAddress, useBuildingList } from '@/api/public/entity-hooks';
import { useCodelistScheme } from '@/api/public/hooks';
import { useCodelistLabel } from '@/i18n/codelist-labels';
import { DetailStatus } from '@/features/entity-detail/components';

const PAGE_SIZE = 20;

/**
 * Visitor catalog browse (UC11/UC14 web surface): list registered buildings with the
 * F14 building-type filter and offset pagination, each linking to its public detail
 * page — from where rooms and sensors drill down. Reads only Public.Api.
 */
export function BrowsePage() {
  const { t } = useTranslation('browse');
  const [page, setPage] = useState(1);
  const [buildingType, setBuildingType] = useState('');

  const buildings = useBuildingList({
    page,
    pageSize: PAGE_SIZE,
    buildingType: buildingType || undefined,
  });
  const buildingTypes = useCodelistScheme('building-type');
  const typeLabel = useCodelistLabel(buildingTypes.data);

  const total = buildings.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Container maxW="4xl" py="8">
      <Stack gap="6">
        <Box>
          <Heading size="xl">{t('title')}</Heading>
          <Text color="fg.muted" mt="1">
            {t('subtitle')}
          </Text>
        </Box>

        <Flex gap="4" align="end" wrap="wrap">
          <Field.Root maxW="16rem">
            <Field.Label>{t('filter.buildingType')}</Field.Label>
            <NativeSelect.Root size="sm">
              <NativeSelect.Field
                id="browse-building-type"
                value={buildingType}
                onChange={(e) => {
                  setBuildingType(e.currentTarget.value);
                  setPage(1);
                }}
              >
                <option value="">{t('filter.allTypes')}</option>
                {Object.values(buildingTypes.data ?? {}).map((concept) => (
                  <option key={concept.code} value={concept.code}>
                    {typeLabel(concept.code)}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          {buildings.data && (
            <Text color="fg.muted" fontSize="sm" pb="1">
              {t('resultCount', { count: total })}
            </Text>
          )}
        </Flex>

        <DetailStatus isLoading={buildings.isLoading} isError={buildings.isError} />

        {buildings.data && buildings.data.items.length === 0 && (
          <Text color="fg.muted">{t('empty')}</Text>
        )}

        {buildings.data && buildings.data.items.length > 0 && (
          <Stack
            as="ul"
            gap="0"
            listStyleType="none"
            borderWidth="1px"
            borderColor="border"
            rounded="md"
          >
            {buildings.data.items.map((building) => (
              <Flex
                as="li"
                key={building.id}
                direction={{ base: 'column', sm: 'row' }}
                justify="space-between"
                gap={{ base: '1', sm: '4' }}
                px="4"
                py="3"
                borderBottomWidth="1px"
                _last={{ borderBottomWidth: 0 }}
              >
                <Box>
                  <ChakraLink asChild colorPalette="brand" fontWeight="medium">
                    <RouterLink to={`/buildings/${building.id}`}>
                      {building.name ?? t('unnamedBuilding')}
                    </RouterLink>
                  </ChakraLink>
                  <Text color="fg.muted" fontSize="sm">
                    {formatPublicAddress(building.address) ?? '—'}
                  </Text>
                </Box>
                <Text color="fg.muted" fontSize="sm" flexShrink={0}>
                  {typeLabel(building.buildingTypeCode)}
                </Text>
              </Flex>
            ))}
          </Stack>
        )}

        {buildings.data && pageCount > 1 && (
          <HStack justify="center" gap="4">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t('pagination.previous')}
            </Button>
            <Text fontSize="sm" color="fg.muted">
              {t('pagination.pageOf', { page: String(page), pageCount: String(pageCount) })}
            </Text>
            <Button
              size="sm"
              variant="outline"
              disabled={!buildings.data.next}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('pagination.next')}
            </Button>
          </HStack>
        )}
      </Stack>
    </Container>
  );
}
