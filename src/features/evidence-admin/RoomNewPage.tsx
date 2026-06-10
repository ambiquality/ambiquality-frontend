import { useState, type FormEvent } from 'react';
import { Box, Button, Heading, Input, SimpleGrid, VStack } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormField, FormActions, ProblemError, Breadcrumb } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useRegisterRoom } from './queries';
import { SelectField } from './components';
import { useCodelistOptions } from './codelists';
import { requiredValidator, optionalIntInRange, optionalNumber } from './validation';

/**
 * F06 register a room under a building (`POST /v1/buildings/{buildingId}/rooms`). Optional
 * codelist fields (function / exposure / ventilation) are entered as codes (validated server
 * side). Pollution sources are an initial code list; they are later managed as a collection on
 * the room detail screen. On `201` we route to the room detail/edit screen.
 */
export function RoomNewPage() {
  const { t } = useTranslation('evidence');
  const { t: tf } = useTranslation('forms');
  const navigate = useNavigate();
  const { buildingId = '' } = useParams();
  const register = useRegisterRoom(buildingId);

  const functionCodes = useCodelistOptions('room-function');
  const exposureCodes = useCodelistOptions('exposure');
  const ventilationTypes = useCodelistOptions('ventilation-type');

  const [name, setName] = useState('');
  const [floor, setFloor] = useState('');
  const [functionCode, setFunctionCode] = useState('');
  const [exposureCode, setExposureCode] = useState('');
  const [areaM2, setAreaM2] = useState('');
  const [ceilingHeightM, setCeilingHeightM] = useState('');
  const [ventilationType, setVentilationType] = useState('');
  const [problem, setProblem] = useState<ProblemErrorObject | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setProblem(null);
    try {
      const room = await register.mutateAsync({
        name,
        floor: floor.trim() === '' ? 0 : Number(floor),
        functionCode: functionCode.trim() === '' ? null : functionCode,
        exposureCode: exposureCode.trim() === '' ? null : exposureCode,
        areaM2: areaM2.trim() === '' ? null : Number(areaM2),
        ceilingHeightM: ceilingHeightM.trim() === '' ? null : Number(ceilingHeightM),
        ventilationType: ventilationType.trim() === '' ? null : ventilationType,
        pollutionSources: [],
      });
      navigate(`/operator/buildings/${buildingId}/rooms/${room.id}`);
    } catch (error) {
      if (error instanceof ProblemErrorObject) setProblem(error);
    }
  }

  return (
    <Box maxW="2xl" mx="auto">
      <Breadcrumb
        items={[
          { label: t('building.listTitle'), to: '/operator' },
          { label: t('building.detailTitle'), to: `/operator/buildings/${buildingId}` },
          { label: t('room.registerTitle') },
        ]}
      />
      <Heading size="2xl" mb="6">
        {t('room.registerTitle')}
      </Heading>
      <form onSubmit={handleSubmit} noValidate>
        <VStack gap="4" align="stretch">
          <ProblemError error={problem} />

          <FormField label={t('fields.name')} labelHint={t('fields.roomNameHint')} required validate={requiredValidator(tf('validation.required'))}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>

          <FormField
            label={t('fields.floor')} labelHint={t('fields.floorHint')}
            required
            validate={optionalIntInRange(0, 255, {
              invalid: tf('validation.invalid'),
              range: tf('validation.invalid'),
            })}
          >
            <Input value={floor} onChange={(e) => setFloor(e.target.value)} />
          </FormField>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <FormField label={t('fields.function')} labelHint={t('fields.functionHint')}>
              <SelectField
                value={functionCode}
                onChange={setFunctionCode}
                options={functionCodes.options}
                disabled={functionCodes.isLoading}
                placeholder={functionCodes.isLoading ? t('select.loading') : t('select.placeholder')}
              />
            </FormField>
            <FormField label={t('fields.exposure')} labelHint={t('fields.exposureHint')}>
              <SelectField
                value={exposureCode}
                onChange={setExposureCode}
                options={exposureCodes.options}
                disabled={exposureCodes.isLoading}
                placeholder={exposureCodes.isLoading ? t('select.loading') : t('select.placeholder')}
              />
            </FormField>
            <FormField label={t('fields.areaM2')} labelHint={t('fields.areaM2Hint')} validate={optionalNumber(tf('validation.invalid'))}>
              <Input value={areaM2} onChange={(e) => setAreaM2(e.target.value)} />
            </FormField>
            <FormField
              label={t('fields.ceilingHeightM')} labelHint={t('fields.ceilingHeightMHint')}
              validate={optionalNumber(tf('validation.invalid'))}
            >
              <Input value={ceilingHeightM} onChange={(e) => setCeilingHeightM(e.target.value)} />
            </FormField>
          </SimpleGrid>

          <FormField label={t('fields.ventilation')} labelHint={t('fields.ventilationHint')}>
            <SelectField
              value={ventilationType}
              onChange={setVentilationType}
              options={ventilationTypes.options}
              disabled={ventilationTypes.isLoading}
              placeholder={
                ventilationTypes.isLoading ? t('select.loading') : t('select.placeholder')
              }
            />
          </FormField>

          <FormActions>
            <Button type="submit" colorPalette="brand" loading={register.isPending}>
              {t('room.registerSubmit')}
            </Button>
          </FormActions>
        </VStack>
      </form>
    </Box>
  );
}
