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
import { useRoom, type RoomSnapshot } from './queries';
import {
  useChangeRoomTextAttribute,
  useChangeRoomFloor,
  useChangeRoomGeometry,
  useAddPollutionSource,
  useRemovePollutionSource,
} from './attribute-mutations';
import { AttributeEditForm, CollectionEditor, SelectField } from './components';
import { useCodelistOptions } from './codelists';

/**
 * F07 room temporal edits + the pollution-sources collection. Each attribute (name / floor /
 * function / exposure / geometry / ventilation) is its own {@link AttributeEditForm} firing a
 * per-attribute `PUT` carrying a `validFrom`; pollution sources are a {@link CollectionEditor}
 * (add = POST validFrom, remove = soft-close PUT validTo). Read-only summary + history live on
 * the sibling routes.
 */
export function RoomEditPage() {
  const { t } = useTranslation('evidence');
  const { buildingId = '', roomId = '' } = useParams();
  const room = useRoom(buildingId, roomId);

  return (
    <Box maxW="3xl" mx="auto">
      <Breadcrumb
        items={[
          { label: t('building.listTitle'), to: '/operator' },
          { label: t('building.detailTitle'), to: `/operator/buildings/${buildingId}` },
          {
            label: room.data?.name ?? t('room.detailTitle'),
            to: `/operator/buildings/${buildingId}/rooms/${roomId}`,
          },
          { label: t('nav.edit') },
        ]}
      />

      {room.isLoading && <Spinner aria-label={t('common.loading')} mt="6" />}
      {room.error instanceof ProblemErrorObject && (
        <Box mt="6">
          <ProblemError error={room.error} />
        </Box>
      )}

      {room.data && (
        <VStack gap="10" align="stretch">
          <RoomAttributeForms buildingId={buildingId} roomId={roomId} snapshot={room.data} />
          <PollutionSourcesSection
            buildingId={buildingId}
            roomId={roomId}
            codes={room.data.pollutionSources}
          />
        </VStack>
      )}

      <ChakraLink asChild mt="8" display="inline-block">
        <RouterLink to={`/operator/buildings/${buildingId}/rooms/${roomId}`}>
          <Button variant="ghost">{t('nav.back')}</Button>
        </RouterLink>
      </ChakraLink>
    </Box>
  );
}

function RoomAttributeForms({
  buildingId,
  roomId,
  snapshot,
}: {
  buildingId: string;
  roomId: string;
  snapshot: RoomSnapshot;
}) {
  const { t } = useTranslation('evidence');

  const functionCodes = useCodelistOptions('room-function');
  const exposureCodes = useCodelistOptions('exposure');
  const ventilationTypes = useCodelistOptions('ventilation-type');

  const changeName = useChangeRoomTextAttribute(buildingId, roomId, 'name');
  const changeFunction = useChangeRoomTextAttribute(buildingId, roomId, 'function');
  const changeExposure = useChangeRoomTextAttribute(buildingId, roomId, 'exposure');
  const changeVentilation = useChangeRoomTextAttribute(buildingId, roomId, 'ventilation');
  const changeFloor = useChangeRoomFloor(buildingId, roomId);
  const changeGeometry = useChangeRoomGeometry(buildingId, roomId);

  const [name, setName] = useState(snapshot.name);
  const [floor, setFloor] = useState(String(snapshot.floor));
  const [functionCode, setFunctionCode] = useState(snapshot.functionCode ?? '');
  const [exposureCode, setExposureCode] = useState(snapshot.exposureCode ?? '');
  const [ventilation, setVentilation] = useState(snapshot.ventilationType ?? '');
  const [areaM2, setAreaM2] = useState(String(snapshot.areaM2 ?? ''));
  const [ceilingHeightM, setCeilingHeightM] = useState(String(snapshot.ceilingHeightM ?? ''));

  const toNum = (v: string) => (v.trim() === '' ? null : Number(v));

  return (
    <Box>
      <Heading size="lg" mb="6">
        {t('room.editTitle')}
      </Heading>
      <VStack gap="10" align="stretch">
        <AttributeEditForm
          title={t('fields.name')}
          buildBody={(validFrom) => ({ newValue: name, validFrom })}
          mutateAsync={changeName.mutateAsync}
        >
          <FormField label={t('fields.name')} required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
        </AttributeEditForm>

        <AttributeEditForm
          title={t('fields.floor')}
          buildBody={(validFrom) => ({ floor: Number(floor), validFrom })}
          mutateAsync={changeFloor.mutateAsync}
        >
          <FormField label={t('fields.floor')} required>
            <Input value={floor} onChange={(e) => setFloor(e.target.value)} />
          </FormField>
        </AttributeEditForm>

        <AttributeEditForm
          title={t('fields.function')}
          buildBody={(validFrom) => ({ newValue: functionCode, validFrom })}
          mutateAsync={changeFunction.mutateAsync}
        >
          <FormField label={t('fields.function')}>
            <SelectField
              value={functionCode}
              onChange={setFunctionCode}
              options={functionCodes.options}
              disabled={functionCodes.isLoading}
              placeholder={functionCodes.isLoading ? t('select.loading') : t('select.placeholder')}
            />
          </FormField>
        </AttributeEditForm>

        <AttributeEditForm
          title={t('fields.exposure')}
          buildBody={(validFrom) => ({ newValue: exposureCode, validFrom })}
          mutateAsync={changeExposure.mutateAsync}
        >
          <FormField label={t('fields.exposure')}>
            <SelectField
              value={exposureCode}
              onChange={setExposureCode}
              options={exposureCodes.options}
              disabled={exposureCodes.isLoading}
              placeholder={exposureCodes.isLoading ? t('select.loading') : t('select.placeholder')}
            />
          </FormField>
        </AttributeEditForm>

        <AttributeEditForm
          title={t('room.geometryTitle')}
          buildBody={(validFrom) => ({
            areaM2: toNum(areaM2),
            ceilingHeightM: toNum(ceilingHeightM),
            validFrom,
          })}
          mutateAsync={changeGeometry.mutateAsync}
        >
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <FormField label={t('fields.areaM2')}>
              <Input value={areaM2} onChange={(e) => setAreaM2(e.target.value)} />
            </FormField>
            <FormField label={t('fields.ceilingHeightM')}>
              <Input value={ceilingHeightM} onChange={(e) => setCeilingHeightM(e.target.value)} />
            </FormField>
          </SimpleGrid>
        </AttributeEditForm>

        <AttributeEditForm
          title={t('fields.ventilation')}
          buildBody={(validFrom) => ({ newValue: ventilation, validFrom })}
          mutateAsync={changeVentilation.mutateAsync}
        >
          <FormField label={t('fields.ventilation')}>
            <SelectField
              value={ventilation}
              onChange={setVentilation}
              options={ventilationTypes.options}
              disabled={ventilationTypes.isLoading}
              placeholder={
                ventilationTypes.isLoading ? t('select.loading') : t('select.placeholder')
              }
            />
          </FormField>
        </AttributeEditForm>
      </VStack>
    </Box>
  );
}

function PollutionSourcesSection({
  buildingId,
  roomId,
  codes,
}: {
  buildingId: string;
  roomId: string;
  codes: string[];
}) {
  const { t } = useTranslation('evidence');
  const sources = useCodelistOptions('pollution-source');
  const add = useAddPollutionSource(buildingId, roomId);
  const remove = useRemovePollutionSource(buildingId, roomId);

  return (
    <CollectionEditor
      title={t('room.pollutionSourcesTitle')}
      codes={codes}
      options={sources.options}
      renderLabel={sources.label}
      onAdd={(sourceCode, validFrom) => add.mutateAsync({ sourceCode, validFrom })}
      onRemove={(sourceCode, validTo) => remove.mutateAsync({ sourceCode, body: { validTo } })}
    />
  );
}
