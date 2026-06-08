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
import { useHouseNumberTypeOptions } from './house-number-type';
import {
  optionalNumberInRange,
  requiredPositiveInt,
  optionalPositiveInt,
  pscValidator,
} from './validation';

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
  const { t: tf } = useTranslation('forms');

  const buildingTypes = useCodelistOptions('building-type');
  const houseNumberTypeOptions = useHouseNumberTypeOptions();

  const changeName = useChangeBuildingName(buildingId);
  const changeAddress = useChangeBuildingAddress(buildingId);
  const changeType = useChangeBuildingType(buildingId);
  const changeLocation = useChangeBuildingLocation(buildingId);
  const changeYears = useChangeBuildingYears(buildingId);

  // Each attribute's value field(s) are local controlled state seeded from the snapshot. The
  // address is the structured OFN Adresy model (RÚIAN-anchored); nullable fields seed to ''.
  const [name, setName] = useState(snapshot.name);
  const [addressPointCode, setAddressPointCode] = useState(String(snapshot.addressPointCode ?? ''));
  const [streetName, setStreetName] = useState(snapshot.streetName ?? '');
  const [streetCode, setStreetCode] = useState(String(snapshot.streetCode ?? ''));
  const [houseNumber, setHouseNumber] = useState(String(snapshot.houseNumber ?? ''));
  const [houseNumberType, setHouseNumberType] = useState(snapshot.houseNumberType);
  const [orientationNumber, setOrientationNumber] = useState(
    String(snapshot.orientationNumber ?? ''),
  );
  const [orientationNumberLetter, setOrientationNumberLetter] = useState(
    snapshot.orientationNumberLetter ?? '',
  );
  const [municipalityName, setMunicipalityName] = useState(snapshot.municipalityName);
  const [municipalityCode, setMunicipalityCode] = useState(String(snapshot.municipalityCode ?? ''));
  const [municipalityPartName, setMunicipalityPartName] = useState(
    snapshot.municipalityPartName ?? '',
  );
  const [municipalityPartCode, setMunicipalityPartCode] = useState(
    String(snapshot.municipalityPartCode ?? ''),
  );
  const [psc, setPsc] = useState(snapshot.psc);
  const [districtName, setDistrictName] = useState(snapshot.districtName ?? '');
  const [districtCode, setDistrictCode] = useState(String(snapshot.districtCode ?? ''));
  const [regionName, setRegionName] = useState(snapshot.regionName ?? '');
  const [regionCode, setRegionCode] = useState(String(snapshot.regionCode ?? ''));
  const [typeCode, setTypeCode] = useState(snapshot.buildingTypeCode);
  const [latitude, setLatitude] = useState(String(snapshot.latitude ?? ''));
  const [longitude, setLongitude] = useState(String(snapshot.longitude ?? ''));
  const [yearBuilt, setYearBuilt] = useState(String(snapshot.yearBuilt ?? ''));
  const [yearRenovated, setYearRenovated] = useState(String(snapshot.yearRenovated ?? ''));

  const toNum = (v: string) => (v.trim() === '' ? null : Number(v));
  const strOrNull = (v: string) => (v.trim() === '' ? null : v.trim());

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
          buildBody={(validFrom) => ({
            addressPointCode: Number(addressPointCode),
            streetName: strOrNull(streetName),
            streetCode: toNum(streetCode),
            houseNumber: Number(houseNumber),
            houseNumberType,
            orientationNumber: toNum(orientationNumber),
            orientationNumberLetter: strOrNull(orientationNumberLetter),
            municipalityName,
            municipalityCode: toNum(municipalityCode),
            municipalityPartName: strOrNull(municipalityPartName),
            municipalityPartCode: toNum(municipalityPartCode),
            psc,
            districtName: strOrNull(districtName),
            districtCode: toNum(districtCode),
            regionName: strOrNull(regionName),
            regionCode: toNum(regionCode),
            validFrom,
          })}
          mutateAsync={changeAddress.mutateAsync}
        >
          <FormField
            label={t('fields.addressPointCode')}
            labelHint={t('fields.addressPointCodeHint')}
            required
            validate={requiredPositiveInt({
              required: tf('validation.required'),
              invalid: tf('validation.invalid'),
            })}
          >
            <Input
              inputMode="numeric"
              value={addressPointCode}
              onChange={(e) => setAddressPointCode(e.target.value)}
            />
          </FormField>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <FormField label={t('fields.streetName')}>
              <Input value={streetName} onChange={(e) => setStreetName(e.target.value)} />
            </FormField>
            <FormField
              label={t('fields.streetCode')}
              labelHint={t('fields.ruianCodeHint')}
              validate={optionalPositiveInt(tf('validation.invalid'))}
            >
              <Input
                inputMode="numeric"
                value={streetCode}
                onChange={(e) => setStreetCode(e.target.value)}
              />
            </FormField>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <FormField
              label={t('fields.houseNumber')}
              required
              validate={requiredPositiveInt({
                required: tf('validation.required'),
                invalid: tf('validation.invalid'),
              })}
            >
              <Input
                inputMode="numeric"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
              />
            </FormField>
            <FormField label={t('fields.houseNumberType')} required>
              <SelectField
                value={houseNumberType}
                onChange={setHouseNumberType}
                options={houseNumberTypeOptions}
                placeholder={t('select.placeholder')}
              />
            </FormField>
            <FormField
              label={t('fields.orientationNumber')}
              validate={optionalPositiveInt(tf('validation.invalid'))}
            >
              <Input
                inputMode="numeric"
                value={orientationNumber}
                onChange={(e) => setOrientationNumber(e.target.value)}
              />
            </FormField>
            <FormField label={t('fields.orientationNumberLetter')}>
              <Input
                maxLength={1}
                value={orientationNumberLetter}
                onChange={(e) => setOrientationNumberLetter(e.target.value)}
              />
            </FormField>
            <FormField label={t('fields.municipalityName')} required>
              <Input
                value={municipalityName}
                onChange={(e) => setMunicipalityName(e.target.value)}
              />
            </FormField>
            <FormField
              label={t('fields.municipalityCode')}
              validate={optionalPositiveInt(tf('validation.invalid'))}
            >
              <Input
                inputMode="numeric"
                value={municipalityCode}
                onChange={(e) => setMunicipalityCode(e.target.value)}
              />
            </FormField>
            <FormField label={t('fields.municipalityPartName')}>
              <Input
                value={municipalityPartName}
                onChange={(e) => setMunicipalityPartName(e.target.value)}
              />
            </FormField>
            <FormField
              label={t('fields.municipalityPartCode')}
              validate={optionalPositiveInt(tf('validation.invalid'))}
            >
              <Input
                inputMode="numeric"
                value={municipalityPartCode}
                onChange={(e) => setMunicipalityPartCode(e.target.value)}
              />
            </FormField>
            <FormField label={t('fields.districtName')}>
              <Input value={districtName} onChange={(e) => setDistrictName(e.target.value)} />
            </FormField>
            <FormField
              label={t('fields.districtCode')}
              validate={optionalPositiveInt(tf('validation.invalid'))}
            >
              <Input
                inputMode="numeric"
                value={districtCode}
                onChange={(e) => setDistrictCode(e.target.value)}
              />
            </FormField>
            <FormField label={t('fields.regionName')}>
              <Input value={regionName} onChange={(e) => setRegionName(e.target.value)} />
            </FormField>
            <FormField
              label={t('fields.regionCode')}
              validate={optionalPositiveInt(tf('validation.invalid'))}
            >
              <Input
                inputMode="numeric"
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value)}
              />
            </FormField>
          </SimpleGrid>
          <FormField
            label={t('fields.psc')}
            required
            validate={pscValidator({
              required: tf('validation.required'),
              invalid: tf('validation.invalid'),
            })}
          >
            <Input inputMode="numeric" value={psc} onChange={(e) => setPsc(e.target.value)} />
          </FormField>
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
            validFrom,
          })}
          mutateAsync={changeLocation.mutateAsync}
        >
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <FormField
              label={t('fields.latitude')}
              validate={optionalNumberInRange(-90, 90, {
                invalid: tf('validation.invalid'),
                range: tf('validation.range', { min: '-90', max: '90' }),
              })}
            >
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min={-90}
                max={90}
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </FormField>
            <FormField
              label={t('fields.longitude')}
              validate={optionalNumberInRange(-180, 180, {
                invalid: tf('validation.invalid'),
                range: tf('validation.range', { min: '-180', max: '180' }),
              })}
            >
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min={-180}
                max={180}
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </FormField>
          </SimpleGrid>
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
