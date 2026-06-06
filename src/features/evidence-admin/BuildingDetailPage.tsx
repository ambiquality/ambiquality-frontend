import { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Link as ChakraLink,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormField, ProblemError, Breadcrumb } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useBuilding, useRooms, type BuildingSnapshot } from './queries';
import {
  useChangeBuildingName,
  useChangeBuildingAddress,
  useChangeBuildingType,
  useChangeBuildingLocation,
  useChangeBuildingYears,
} from './attribute-mutations';
import { AttributeEditForm, AsOfViewer } from './components';

/**
 * F05 building detail + F07 temporal edits. The screen reads the building snapshot at the
 * chosen `asOf` (the history viewer projects past state) and renders one self-contained
 * {@link AttributeEditForm} per attribute (name / address / type / location / years) — there is
 * deliberately no single "save building" form. Each form fires its own attribute `PUT`
 * (`204` → close+open a history row) and surfaces `409 overlapping-validity-range` on its
 * `validFrom` field. A rooms list links into F06.
 */
export function BuildingDetailPage() {
  const { t } = useTranslation('evidence');
  const { buildingId = '' } = useParams();
  const [asOf, setAsOf] = useState<string | null>(null);
  const building = useBuilding(buildingId, asOf);

  return (
    <Box maxW="3xl" mx="auto">
      <Breadcrumb
        items={[
          { label: t('building.listTitle'), to: '/admin' },
          { label: building.data?.name ?? t('building.detailTitle') },
        ]}
      />
      <Heading size="2xl" mb="6">
        {building.data?.name ?? t('building.detailTitle')}
      </Heading>

      <AsOfViewer value={asOf} onChange={setAsOf} />

      {building.isLoading && <Spinner aria-label={t('common.loading')} mt="6" />}
      {building.error instanceof ProblemErrorObject && (
        <Box mt="6">
          <ProblemError error={building.error} />
        </Box>
      )}

      {building.data && (
        <VStack gap="10" align="stretch" mt="8">
          <BuildingAttributeForms buildingId={buildingId} snapshot={building.data} />
          <RoomsSection buildingId={buildingId} />
        </VStack>
      )}
    </Box>
  );
}

function BuildingAttributeForms({
  buildingId,
  snapshot,
}: {
  buildingId: string;
  snapshot: BuildingSnapshot;
}) {
  const { t } = useTranslation('evidence');

  const changeName = useChangeBuildingName(buildingId);
  const changeAddress = useChangeBuildingAddress(buildingId);
  const changeType = useChangeBuildingType(buildingId);
  const changeLocation = useChangeBuildingLocation(buildingId);
  const changeYears = useChangeBuildingYears(buildingId);

  // Each attribute's value field(s) are local controlled state seeded from the snapshot.
  const [name, setName] = useState(snapshot.name);
  const [street, setStreet] = useState(snapshot.street);
  const [city, setCity] = useState(snapshot.city);
  const [postcode, setPostcode] = useState(snapshot.postcode);
  const [country, setCountry] = useState(snapshot.country);
  const [typeCode, setTypeCode] = useState(snapshot.buildingTypeCode);
  const [latitude, setLatitude] = useState(String(snapshot.latitude ?? ''));
  const [longitude, setLongitude] = useState(String(snapshot.longitude ?? ''));
  const [anonymizationLevel, setAnonymizationLevel] = useState(snapshot.anonymizationLevel);
  const [yearBuilt, setYearBuilt] = useState(String(snapshot.yearBuilt ?? ''));
  const [yearRenovated, setYearRenovated] = useState(String(snapshot.yearRenovated ?? ''));

  const toNum = (v: string) => (v.trim() === '' ? null : Number(v));

  return (
    <Box>
      <Heading size="lg" mb="6">
        {t('building.editTitle')}
      </Heading>
      <VStack gap="10" align="stretch">
        <AttributeEditForm
          title={t('fields.name')}
          buildBody={(validFrom) => ({ newName: name, validFrom })}
          mutateAsync={changeName.mutateAsync}
        >
          <FormField label={t('fields.name')} required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
        </AttributeEditForm>

        <AttributeEditForm
          title={t('building.addressTitle')}
          buildBody={(validFrom) => ({ street, city, postcode, country, validFrom })}
          mutateAsync={changeAddress.mutateAsync}
        >
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <FormField label={t('fields.street')} required>
              <Input value={street} onChange={(e) => setStreet(e.target.value)} />
            </FormField>
            <FormField label={t('fields.city')} required>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </FormField>
            <FormField label={t('fields.postcode')} required>
              <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} />
            </FormField>
            <FormField label={t('fields.country')} required>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </FormField>
          </SimpleGrid>
        </AttributeEditForm>

        <AttributeEditForm
          title={t('fields.buildingType')}
          buildBody={(validFrom) => ({ newTypeCode: typeCode, validFrom })}
          mutateAsync={changeType.mutateAsync}
        >
          <FormField label={t('fields.buildingType')} required>
            <Input value={typeCode} onChange={(e) => setTypeCode(e.target.value)} />
          </FormField>
        </AttributeEditForm>

        <AttributeEditForm
          title={t('building.locationTitle')}
          buildBody={(validFrom) => ({
            latitude: toNum(latitude),
            longitude: toNum(longitude),
            anonymizationLevel,
            validFrom,
          })}
          mutateAsync={changeLocation.mutateAsync}
        >
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <FormField label={t('fields.latitude')}>
              <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            </FormField>
            <FormField label={t('fields.longitude')}>
              <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </FormField>
          </SimpleGrid>
          <FormField label={t('fields.anonymizationLevel')} required>
            <Input
              value={anonymizationLevel}
              onChange={(e) => setAnonymizationLevel(e.target.value)}
            />
          </FormField>
        </AttributeEditForm>

        <AttributeEditForm
          title={t('building.yearsTitle')}
          buildBody={(validFrom) => ({
            yearBuilt: toNum(yearBuilt),
            yearRenovated: toNum(yearRenovated),
            validFrom,
          })}
          mutateAsync={changeYears.mutateAsync}
        >
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <FormField label={t('fields.yearBuilt')}>
              <Input value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} />
            </FormField>
            <FormField label={t('fields.yearRenovated')}>
              <Input value={yearRenovated} onChange={(e) => setYearRenovated(e.target.value)} />
            </FormField>
          </SimpleGrid>
        </AttributeEditForm>
      </VStack>
    </Box>
  );
}

function RoomsSection({ buildingId }: { buildingId: string }) {
  const { t } = useTranslation('evidence');
  const rooms = useRooms(buildingId);

  return (
    <Box as="section" aria-labelledby="rooms-heading">
      <HStack justify="space-between" mb="4" align="center">
        <Heading id="rooms-heading" size="lg">
          {t('room.listTitle')}
        </Heading>
        <ChakraLink asChild>
          <RouterLink to={`/admin/buildings/${buildingId}/rooms/new`}>
            <Button variant="outline">{t('nav.newRoom')}</Button>
          </RouterLink>
        </ChakraLink>
      </HStack>

      {rooms.isLoading && <Spinner aria-label={t('common.loading')} />}
      {rooms.data && rooms.data.length === 0 && <Text color="fg.muted">{t('common.empty')}</Text>}
      {rooms.data && rooms.data.length > 0 && (
        <Stack as="ul" gap="2" listStyleType="none">
          {rooms.data.map((r) => (
            <Box as="li" key={r.id} borderWidth="1px" rounded="md" p="3">
              <ChakraLink asChild fontWeight="medium">
                <RouterLink to={`/admin/buildings/${buildingId}/rooms/${r.id}`}>
                  {r.name}
                </RouterLink>
              </ChakraLink>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
