import { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Input,
  Link as ChakraLink,
  SimpleGrid,
  Spinner,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormField, ProblemError, Breadcrumb } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useBuilding, type BuildingSnapshot } from './queries';
import {
  useChangeBuildingName,
  useChangeBuildingAddress,
  useChangeBuildingType,
  useChangeBuildingLocation,
  useChangeBuildingYears,
} from './attribute-mutations';
import { AttributeEditForm, SelectField } from './components';
import { useCodelistOptions } from './codelists';

/**
 * F07 building temporal edits. Each attribute (name / address / type / location / years) is its
 * own self-contained {@link AttributeEditForm} firing a per-attribute `PUT` carrying a `validFrom`
 * (`204` → the server closes the open history row and opens a new one) — there is deliberately no
 * single "save building" form. The read-only summary + history live on the sibling routes.
 */
export function BuildingEditPage() {
  const { t } = useTranslation('evidence');
  const { buildingId = '' } = useParams();
  const building = useBuilding(buildingId);

  return (
    <Box maxW="3xl" mx="auto">
      <Breadcrumb
        items={[
          { label: t('building.listTitle'), to: '/operator' },
          {
            label: building.data?.name ?? t('building.detailTitle'),
            to: `/operator/buildings/${buildingId}`,
          },
          { label: t('nav.edit') },
        ]}
      />

      {building.isLoading && <Spinner aria-label={t('common.loading')} mt="6" />}
      {building.error instanceof ProblemErrorObject && (
        <Box mt="6">
          <ProblemError error={building.error} />
        </Box>
      )}

      {building.data && (
        <BuildingAttributeForms buildingId={buildingId} snapshot={building.data} />
      )}

      <ChakraLink asChild mt="8" display="inline-block">
        <RouterLink to={`/operator/buildings/${buildingId}`}>
          <Button variant="ghost">{t('nav.back')}</Button>
        </RouterLink>
      </ChakraLink>
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

  const buildingTypes = useCodelistOptions('building-type');

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
            <SelectField
              value={typeCode}
              onChange={setTypeCode}
              options={buildingTypes.options}
              disabled={buildingTypes.isLoading}
              placeholder={buildingTypes.isLoading ? t('select.loading') : t('select.placeholder')}
            />
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
