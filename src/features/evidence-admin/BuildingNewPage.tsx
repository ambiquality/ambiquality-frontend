import { useMemo, useState, type FormEvent } from 'react';
import { Box, Button, Heading, Input, SimpleGrid, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormField, FormActions, ProblemError } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useRegisterBuilding } from './queries';
import { SelectField } from './components';
import { useCodelistOptions } from './codelists';
import { useCountryOptions } from './countries';
import { requiredValidator, optionalIntInRange, optionalNumber } from './validation';

/** Coordinate-precision levels — the fixed backend `AnonymizationLevel` enum (not a codelist). */
const ANONYMIZATION_LEVELS = ['precise', 'street', 'municipality'] as const;

/**
 * F05 register a building (`POST /v1/buildings`). A single registration form (initial state);
 * subsequent changes happen attribute-by-attribute on the detail screen (F07). Building type is
 * picked from the `building-type` SKOS codelist (cs/en prefLabels from Public.Api); coordinate
 * precision from the fixed anonymization enum; country from ISO 3166-1 — so operators choose
 * valid values rather than typing raw codes. Evidence.Api still validates server-side and an
 * `unknown-codelist-code` is surfaced via `ProblemError`. On `201` we route to the new building.
 */
export function BuildingNewPage() {
  const { t } = useTranslation('evidence');
  const { t: tf } = useTranslation('forms');
  const navigate = useNavigate();
  const register = useRegisterBuilding();

  const countryOptions = useCountryOptions();
  const buildingTypes = useCodelistOptions('building-type');
  const anonymizationOptions = useMemo(
    () => ANONYMIZATION_LEVELS.map((value) => ({ value, label: t(`anonymizationLevels.${value}`) })),
    [t],
  );

  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('');
  const [buildingTypeCode, setBuildingTypeCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [anonymizationLevel, setAnonymizationLevel] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [yearRenovated, setYearRenovated] = useState('');
  const [problem, setProblem] = useState<ProblemErrorObject | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setProblem(null);
    try {
      const result = await register.mutateAsync({
        name,
        street,
        city,
        postcode,
        country,
        buildingTypeCode,
        latitude: latitude.trim() === '' ? null : Number(latitude),
        longitude: longitude.trim() === '' ? null : Number(longitude),
        anonymizationLevel,
        yearBuilt: yearBuilt.trim() === '' ? null : Number(yearBuilt),
        yearRenovated: yearRenovated.trim() === '' ? null : Number(yearRenovated),
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

          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <FormField label={t('fields.street')} required validate={requiredValidator(tf('validation.required'))}>
              <Input value={street} onChange={(e) => setStreet(e.target.value)} />
            </FormField>
            <FormField label={t('fields.city')} required validate={requiredValidator(tf('validation.required'))}>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </FormField>
            <FormField label={t('fields.postcode')} required validate={requiredValidator(tf('validation.required'))}>
              <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} />
            </FormField>
            <FormField label={t('fields.country')} required validate={requiredValidator(tf('validation.required'))}>
              <SelectField
                value={country}
                onChange={setCountry}
                options={countryOptions}
                placeholder={t('select.placeholder')}
              />
            </FormField>
          </SimpleGrid>

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
            <FormField label={t('fields.latitude')} validate={optionalNumber(tf('validation.invalid'))}>
              <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            </FormField>
            <FormField label={t('fields.longitude')} validate={optionalNumber(tf('validation.invalid'))}>
              <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </FormField>
          </SimpleGrid>

          <FormField
            label={t('fields.anonymizationLevel')}
            required
            validate={requiredValidator(tf('validation.required'))}
          >
            <SelectField
              value={anonymizationLevel}
              onChange={setAnonymizationLevel}
              options={anonymizationOptions}
              placeholder={t('select.placeholder')}
            />
          </FormField>

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
