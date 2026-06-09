import { useState, type FormEvent } from 'react';
import { Box, Button, Heading, Input, SimpleGrid, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormField, FormActions, ProblemError } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useRegisterBuilding } from './queries';
import { SelectField, AddressAutocomplete } from './components';
import type { ResolvedAddress } from './ruian/useAddressLookup';
import { useCodelistOptions } from './codelists';
import { useHouseNumberTypeOptions } from './house-number-type';
import {
  requiredValidator,
  requiredPositiveInt,
  optionalPositiveInt,
  pscValidator,
  optionalIntInRange,
  optionalNumberInRange,
} from './validation';

/**
 * F05 register a building (`POST /v1/buildings`). A single registration form (initial state);
 * subsequent changes happen attribute-by-attribute on the detail screen (F07). The address is the
 * Czech OFN Adresy model (RÚIAN-anchored): the registrar supplies the structured fields — there is
 * no live RÚIAN lookup, so they are entered directly (a CUZK autocomplete is a future enhancement).
 * Building type is picked from the `building-type` SKOS codelist (cs/en prefLabels from Public.Api)
 * and the house-number type from a fixed enum, so operators choose valid values rather than typing
 * raw codes. Evidence.Api still validates server-side and an `unknown-codelist-code` / bad address
 * is surfaced via `ProblemError`. On `201` we route to the new building.
 */
export function BuildingNewPage() {
  const { t } = useTranslation('evidence');
  const { t: tf } = useTranslation('forms');
  const navigate = useNavigate();
  const register = useRegisterBuilding();

  const buildingTypes = useCodelistOptions('building-type');
  const houseNumberTypeOptions = useHouseNumberTypeOptions();

  const [name, setName] = useState('');
  const [addressPointCode, setAddressPointCode] = useState('');
  const [streetName, setStreetName] = useState('');
  const [streetCode, setStreetCode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [houseNumberType, setHouseNumberType] = useState('');
  const [orientationNumber, setOrientationNumber] = useState('');
  const [orientationNumberLetter, setOrientationNumberLetter] = useState('');
  const [municipalityName, setMunicipalityName] = useState('');
  const [municipalityCode, setMunicipalityCode] = useState('');
  const [municipalityPartName, setMunicipalityPartName] = useState('');
  const [municipalityPartCode, setMunicipalityPartCode] = useState('');
  const [psc, setPsc] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [regionName, setRegionName] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [buildingTypeCode, setBuildingTypeCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [yearRenovated, setYearRenovated] = useState('');
  const [problem, setProblem] = useState<ProblemErrorObject | null>(null);

  const trimmedOrNull = (value: string) => (value.trim() === '' ? null : value.trim());
  const numberOrNull = (value: string) => (value.trim() === '' ? null : Number(value));

  /**
   * Fill the address fields from a RÚIAN-resolved address (the autocomplete pick). Values are
   * coerced to the controls' string state; every field stays editable afterward, so the lookup is
   * a convenience, not a lock-in. Evidence.Api re-validates the codes on submit.
   */
  function applyResolvedAddress(a: ResolvedAddress) {
    const str = (value: number | string | null | undefined) =>
      value == null ? '' : String(value);
    setAddressPointCode(str(a.addressPointCode));
    setStreetName(a.streetName ?? '');
    setStreetCode(str(a.streetCode));
    setHouseNumber(str(a.houseNumber));
    setHouseNumberType(a.houseNumberType || 'č.p.');
    setOrientationNumber(str(a.orientationNumber));
    setOrientationNumberLetter(a.orientationNumberLetter ?? '');
    setMunicipalityName(a.municipalityName);
    setMunicipalityCode(str(a.municipalityCode));
    setMunicipalityPartName(a.municipalityPartName ?? '');
    setMunicipalityPartCode(str(a.municipalityPartCode));
    setPsc(a.psc);
    setDistrictName(a.districtName ?? '');
    setDistrictCode(str(a.districtCode));
    setRegionName(a.regionName ?? '');
    setRegionCode(str(a.regionCode));
    setLatitude(str(a.latitude));
    setLongitude(str(a.longitude));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setProblem(null);
    try {
      const result = await register.mutateAsync({
        name,
        addressPointCode: Number(addressPointCode),
        streetName: trimmedOrNull(streetName),
        streetCode: numberOrNull(streetCode),
        houseNumber: Number(houseNumber),
        houseNumberType,
        orientationNumber: numberOrNull(orientationNumber),
        orientationNumberLetter: trimmedOrNull(orientationNumberLetter),
        municipalityName,
        municipalityCode: numberOrNull(municipalityCode),
        municipalityPartName: trimmedOrNull(municipalityPartName),
        municipalityPartCode: numberOrNull(municipalityPartCode),
        psc,
        districtName: trimmedOrNull(districtName),
        districtCode: numberOrNull(districtCode),
        regionName: trimmedOrNull(regionName),
        regionCode: numberOrNull(regionCode),
        buildingTypeCode,
        latitude: numberOrNull(latitude),
        longitude: numberOrNull(longitude),
        yearBuilt: numberOrNull(yearBuilt),
        yearRenovated: numberOrNull(yearRenovated),
      });
      navigate(`/operator/buildings/${result.id}`);
    } catch (error) {
      if (error instanceof ProblemErrorObject) setProblem(error);
    }
  }

  return (
    <Box maxW="2xl" mx="auto">
      <Heading size="2xl" mb="6">
        {t('building.registerTitle')}
      </Heading>
      <form onSubmit={handleSubmit} noValidate>
        <VStack gap="4" align="stretch">
          <ProblemError error={problem} />

          <FormField label={t('fields.name')} required validate={requiredValidator(tf('validation.required'))}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>

          <AddressAutocomplete onResolve={applyResolvedAddress} />

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
            <FormField
              label={t('fields.houseNumberType')}
              required
              validate={requiredValidator(tf('validation.required'))}
            >
              <SelectField
                value={houseNumberType}
                onChange={setHouseNumberType}
                options={houseNumberTypeOptions}
                placeholder={t('select.placeholder')}
              />
            </FormField>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
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
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <FormField
              label={t('fields.municipalityName')}
              required
              validate={requiredValidator(tf('validation.required'))}
            >
              <Input value={municipalityName} onChange={(e) => setMunicipalityName(e.target.value)} />
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

          <FormField label={t('fields.buildingType')} required validate={requiredValidator(tf('validation.required'))}>
            <SelectField
              value={buildingTypeCode}
              onChange={setBuildingTypeCode}
              options={buildingTypes.options}
              disabled={buildingTypes.isLoading}
              placeholder={buildingTypes.isLoading ? t('select.loading') : t('select.placeholder')}
            />
          </FormField>

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

          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <FormField
              label={t('fields.yearBuilt')}
              validate={optionalIntInRange(1000, 2200, {
                invalid: tf('validation.invalid'),
                range: tf('validation.invalid'),
              })}
            >
              <Input value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} />
            </FormField>
            <FormField
              label={t('fields.yearRenovated')}
              validate={optionalIntInRange(1000, 2200, {
                invalid: tf('validation.invalid'),
                range: tf('validation.invalid'),
              })}
            >
              <Input value={yearRenovated} onChange={(e) => setYearRenovated(e.target.value)} />
            </FormField>
          </SimpleGrid>

          <FormActions>
            <Button type="submit" colorPalette="brand" loading={register.isPending}>
              {t('building.registerSubmit')}
            </Button>
          </FormActions>
        </VStack>
      </form>
    </Box>
  );
}
