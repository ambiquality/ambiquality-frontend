import { useState, type FormEvent } from 'react';
import { Box, Button, Heading, Input, VStack } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormField, FormActions, ProblemError, Breadcrumb } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useRegisterSensor, type SensorRegistered } from './queries';
import { useCodelistOptions } from './codelists';
import { requiredValidator } from './validation';
import { ApiKeyReveal, SelectField } from './components';

/**
 * F08 register a sensor under a room (`POST .../sensors`). The response carries a one-time
 * `apiKey` (`amq_sk_…`) that is UNRECOVERABLE — on success we do NOT navigate away; instead we
 * render the {@link ApiKeyReveal} panel so the operator can copy + store it. Only after they
 * acknowledge do we route to the sensor detail screen. The key is never refetched or shown
 * again (the detail screen reads `GetSensorById`, which has no `apiKey`).
 */
export function SensorNewPage() {
  const { t } = useTranslation('evidence');
  const { t: tf } = useTranslation('forms');
  const navigate = useNavigate();
  const { buildingId = '', roomId = '' } = useParams();
  const register = useRegisterSensor(buildingId, roomId);

  const statusCodes = useCodelistOptions('sensor-status');

  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [problem, setProblem] = useState<ProblemErrorObject | null>(null);
  const [registered, setRegistered] = useState<SensorRegistered | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setProblem(null);
    try {
      const result = await register.mutateAsync({
        manufacturer,
        model,
        serialNumber,
        statusCode,
        measuredParameters: [],
      });
      setRegistered(result);
    } catch (error) {
      if (error instanceof ProblemErrorObject) setProblem(error);
    }
  }

  // F08: after a successful registration, present the one-time API key and block navigation
  // until the operator confirms they've stored it.
  if (registered) {
    return (
      <Box maxW="2xl" mx="auto">
        <Heading size="2xl" mb="6">
          {t('sensor.registered')}
        </Heading>
        <ApiKeyReveal
          apiKey={registered.apiKey}
          onAcknowledge={() =>
            navigate(`/operator/buildings/${buildingId}/rooms/${roomId}/sensors/${registered.id}`)
          }
        />
      </Box>
    );
  }

  return (
    <Box maxW="2xl" mx="auto">
      <Breadcrumb
        items={[
          { label: t('building.listTitle'), to: '/operator' },
          { label: t('building.detailTitle'), to: `/operator/buildings/${buildingId}` },
          { label: t('room.detailTitle'), to: `/operator/buildings/${buildingId}/rooms/${roomId}` },
          { label: t('sensor.registerTitle') },
        ]}
      />
      <Heading size="2xl" mb="6">
        {t('sensor.registerTitle')}
      </Heading>
      <form onSubmit={handleSubmit} noValidate>
        <VStack gap="4" align="stretch">
          <ProblemError error={problem} />

          <FormField
            label={t('fields.manufacturer')} labelHint={t('fields.manufacturerHint')}
            required
            validate={requiredValidator(tf('validation.required'))}
          >
            <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          </FormField>
          <FormField label={t('fields.model')} labelHint={t('fields.modelHint')} required validate={requiredValidator(tf('validation.required'))}>
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </FormField>
          <FormField
            label={t('fields.serialNumber')} labelHint={t('fields.serialNumberHint')}
            required
            validate={requiredValidator(tf('validation.required'))}
          >
            <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
          </FormField>
          <FormField label={t('fields.status')} labelHint={t('fields.statusHint')} required validate={requiredValidator(tf('validation.required'))}>
            <SelectField
              value={statusCode}
              onChange={setStatusCode}
              options={statusCodes.options}
              disabled={statusCodes.isLoading}
              placeholder={statusCodes.isLoading ? t('select.loading') : t('select.placeholder')}
            />
          </FormField>

          <FormActions>
            <Button type="submit" colorPalette="brand" loading={register.isPending}>
              {t('sensor.registerSubmit')}
            </Button>
          </FormActions>
        </VStack>
      </form>
    </Box>
  );
}
