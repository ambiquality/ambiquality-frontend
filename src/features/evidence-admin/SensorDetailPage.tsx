import { useState } from 'react';
import {
  Box,
  Heading,
  Input,
  SimpleGrid,
  Spinner,
  VStack,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormField, ProblemError, Breadcrumb } from '@/components';
import { ProblemError as ProblemErrorObject } from '@/api/middleware/problem-details';
import { useSensor, useRooms, type SensorSnapshot } from './queries';
import {
  useChangeSensorIdentity,
  useChangeSensorStatus,
  useChangeSensorPlacement,
  useAddMeasuredParameter,
  useRemoveMeasuredParameter,
} from './attribute-mutations';
import { AttributeEditForm, AsOfViewer, CollectionEditor, SelectField } from './components';
import { useCodelistOptions, usePropertyOptions } from './codelists';

/**
 * F08 sensor detail + F09 lifecycle. Reads the sensor at the chosen `asOf` (NO `apiKey` — that
 * is shown once at registration and is unrecoverable). Renders:
 *   - identity edit (manufacturer / model / serial) — F08 temporal attribute,
 *   - status (active / maintenance / decommissioned) — F09 lifecycle, a temporal attribute,
 *   - placement (relocate to another room) — F09, a temporal PUT carrying the new room id,
 *   - measured-parameters collection (add = POST validFrom, remove = soft-close PUT validTo).
 */
export function SensorDetailPage() {
  const { t } = useTranslation('evidence');
  const { buildingId = '', roomId = '', sensorId = '' } = useParams();
  const [asOf, setAsOf] = useState<string | null>(null);
  const sensor = useSensor(buildingId, roomId, sensorId, asOf);

  return (
    <Box maxW="3xl" mx="auto">
      <Breadcrumb
        items={[
          { label: t('building.listTitle'), to: '/admin' },
          { label: t('building.detailTitle'), to: `/admin/buildings/${buildingId}` },
          { label: t('room.detailTitle'), to: `/admin/buildings/${buildingId}/rooms/${roomId}` },
          {
            label: sensor.data
              ? `${sensor.data.manufacturer} ${sensor.data.model}`
              : t('sensor.detailTitle'),
          },
        ]}
      />
      <Heading size="2xl" mb="6">
        {sensor.data ? `${sensor.data.manufacturer} ${sensor.data.model}` : t('sensor.detailTitle')}
      </Heading>

      <AsOfViewer value={asOf} onChange={setAsOf} />

      {sensor.isLoading && <Spinner aria-label={t('common.loading')} mt="6" />}
      {sensor.error instanceof ProblemErrorObject && (
        <Box mt="6">
          <ProblemError error={sensor.error} />
        </Box>
      )}

      {sensor.data && (
        <VStack gap="10" align="stretch" mt="8">
          <SensorAttributeForms
            buildingId={buildingId}
            roomId={roomId}
            sensorId={sensorId}
            snapshot={sensor.data}
          />
          <MeasuredParametersSection
            buildingId={buildingId}
            roomId={roomId}
            sensorId={sensorId}
            codes={sensor.data.measuredParameters.map((p) => p.code)}
          />
        </VStack>
      )}
    </Box>
  );
}

function SensorAttributeForms({
  buildingId,
  roomId,
  sensorId,
  snapshot,
}: {
  buildingId: string;
  roomId: string;
  sensorId: string;
  snapshot: SensorSnapshot;
}) {
  const { t } = useTranslation('evidence');

  const statusCodes = useCodelistOptions('sensor-status');
  // Sibling rooms in the same building are the relocate targets — exclude the current room.
  const rooms = useRooms(buildingId);
  const roomOptions = (rooms.data ?? [])
    .filter((room) => room.id !== roomId)
    .map((room) => ({ value: room.id, label: room.name }));

  const changeIdentity = useChangeSensorIdentity(buildingId, roomId, sensorId);
  const changeStatus = useChangeSensorStatus(buildingId, roomId, sensorId);
  const changePlacement = useChangeSensorPlacement(buildingId, roomId, sensorId);

  const [manufacturer, setManufacturer] = useState(snapshot.manufacturer);
  const [model, setModel] = useState(snapshot.model);
  const [serialNumber, setSerialNumber] = useState(snapshot.serialNumber);
  const [statusCode, setStatusCode] = useState(snapshot.statusCode);
  const [newRoomId, setNewRoomId] = useState('');

  return (
    <Box>
      <Heading size="lg" mb="6">
        {t('sensor.detailTitle')}
      </Heading>
      <VStack gap="10" align="stretch">
        <AttributeEditForm
          title={t('sensor.identityTitle')}
          buildBody={(validFrom) => ({ manufacturer, model, serialNumber, validFrom })}
          mutateAsync={changeIdentity.mutateAsync}
        >
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
            <FormField label={t('fields.manufacturer')} required>
              <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
            </FormField>
            <FormField label={t('fields.model')} required>
              <Input value={model} onChange={(e) => setModel(e.target.value)} />
            </FormField>
            <FormField label={t('fields.serialNumber')} required>
              <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            </FormField>
          </SimpleGrid>
        </AttributeEditForm>

        <AttributeEditForm
          title={t('sensor.statusTitle')}
          buildBody={(validFrom) => ({ newStatusCode: statusCode, validFrom })}
          mutateAsync={changeStatus.mutateAsync}
        >
          <FormField label={t('fields.status')} required>
            <SelectField
              value={statusCode}
              onChange={setStatusCode}
              options={statusCodes.options}
              disabled={statusCodes.isLoading}
              placeholder={statusCodes.isLoading ? t('select.loading') : t('select.placeholder')}
            />
          </FormField>
        </AttributeEditForm>

        <AttributeEditForm
          title={t('sensor.relocateTitle')}
          buildBody={(validFrom) => ({ newRoomId, validFrom })}
          mutateAsync={changePlacement.mutateAsync}
        >
          <FormField label={t('fields.newRoom')} required>
            <SelectField
              value={newRoomId}
              onChange={setNewRoomId}
              options={roomOptions}
              disabled={rooms.isLoading}
              placeholder={rooms.isLoading ? t('select.loading') : t('select.roomPlaceholder')}
            />
          </FormField>
        </AttributeEditForm>
      </VStack>
    </Box>
  );
}

function MeasuredParametersSection({
  buildingId,
  roomId,
  sensorId,
  codes,
}: {
  buildingId: string;
  roomId: string;
  sensorId: string;
  codes: string[];
}) {
  const { t } = useTranslation('evidence');
  const properties = usePropertyOptions();
  const add = useAddMeasuredParameter(buildingId, roomId, sensorId);
  const remove = useRemoveMeasuredParameter(buildingId, roomId, sensorId);

  return (
    <CollectionEditor
      title={t('sensor.measuredParametersTitle')}
      codes={codes}
      options={properties.options}
      renderLabel={properties.label}
      onAdd={(parameterCode, validFrom) => add.mutateAsync({ parameterCode, validFrom })}
      onRemove={(parameterCode, validTo) =>
        remove.mutateAsync({ parameterCode, body: { validTo } })
      }
    />
  );
}
