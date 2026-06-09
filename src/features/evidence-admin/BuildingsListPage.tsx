import {
  Box,
  Button,
  Heading,
  HStack,
  Link as ChakraLink,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProblemError } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useBuildings } from './queries';
import { composeAddressShort } from './address';

/**
 * F05–F09 operator evidence admin landing: the catalog of buildings the operator owns, plus the
 * entry point to register a new one. Buildings read via Evidence.Api (owner-precise; the visitor
 * map reads Public.Api instead — two read sources). Each row links to the building detail screen
 * (clickable name + an explicit "Details" button), which leads on to the temporal edits, history,
 * rooms and sensors.
 */
export function BuildingsListPage() {
  const { t } = useTranslation('evidence');
  const buildings = useBuildings();

  return (
    <Box>
      <HStack justify="space-between" mb="6" align="center">
        <Heading size="2xl">{t('building.listTitle')}</Heading>
        <ChakraLink asChild>
          <RouterLink to="/operator/buildings/new">
            <Button colorPalette="brand">{t('nav.newBuilding')}</Button>
          </RouterLink>
        </ChakraLink>
      </HStack>

      {buildings.isLoading && <Spinner aria-label={t('common.loading')} />}
      {buildings.error instanceof ProblemErrorObject && <ProblemError error={buildings.error} />}

      {buildings.data && buildings.data.length === 0 && (
        <Text color="fg.muted">{t('common.empty')}</Text>
      )}

      {buildings.data && buildings.data.length > 0 && (
        <Stack as="ul" gap="2" listStyleType="none">
          {buildings.data.map((b) => (
            <HStack
              as="li"
              key={b.id}
              borderWidth="1px"
              borderColor="border"
              rounded="md"
              p="4"
              justify="space-between"
              align="center"
              gap="4"
            >
              <Box>
                <ChakraLink asChild fontWeight="medium">
                  <RouterLink to={`/operator/buildings/${b.id}`}>{b.name}</RouterLink>
                </ChakraLink>
                <Text color="fg.muted" fontSize="sm">
                  {composeAddressShort(b)}
                </Text>
              </Box>
              <ChakraLink asChild>
                <RouterLink to={`/operator/buildings/${b.id}`}>
                  <Button variant="outline" size="sm">
                    {t('nav.details')}
                  </Button>
                </RouterLink>
              </ChakraLink>
            </HStack>
          ))}
        </Stack>
      )}
    </Box>
  );
}
