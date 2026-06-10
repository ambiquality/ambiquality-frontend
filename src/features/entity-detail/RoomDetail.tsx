import { useTranslation } from 'react-i18next';
import { useBuildingDetail, useRoomDetail, useRoomSensors } from '@/api/public/entity-hooks';
import { useCodelistScheme } from '@/api/public/hooks';
import { useCodelistLabel } from '@/i18n/codelist-labels';
import { AttributeList, ChildList, DetailShell, DetailStatus } from './components';

/** Public room detail: function, exposure, geometry, ventilation, pollution sources, sensors. */
export function RoomDetail({ id }: { id: string | undefined }) {
  const { t } = useTranslation('entity');
  const room = useRoomDetail(id);
  const building = useBuildingDetail(room.data?.buildingId);
  const sensors = useRoomSensors(id);
  const functionLabel = useCodelistLabel(useCodelistScheme('room-function').data);
  const exposureLabel = useCodelistLabel(useCodelistScheme('exposure').data);
  const ventilationLabel = useCodelistLabel(useCodelistScheme('ventilation-type').data);
  const pollutionLabel = useCodelistLabel(useCodelistScheme('pollution-source').data);

  if (!room.data)
    return (
      <DetailShell breadcrumb={[{ label: t('common.map'), to: '/' }]} title={t('room.title')}>
        <DetailStatus isLoading={room.isLoading} isError={room.isError} />
      </DetailShell>
    );

  const data = room.data;
  const title = data.name ?? t('room.fallbackName', { floor: String(data.floor) });

  return (
    <DetailShell
      breadcrumb={[
        { label: t('common.map'), to: '/' },
        {
          label: building.data?.name ?? t('building.title'),
          to: `/buildings/${data.buildingId}`,
        },
        { label: title },
      ]}
      title={title}
      subtitle={functionLabel(data.functionCode)}
    >
      <AttributeList
        rows={[
          { label: t('room.floor'), value: data.floor },
          { label: t('room.function'), value: functionLabel(data.functionCode) },
          { label: t('room.exposure'), value: exposureLabel(data.exposureCode) },
          { label: t('room.area'), value: data.areaM2 != null ? `${data.areaM2} m²` : null },
          {
            label: t('room.ceilingHeight'),
            value: data.ceilingHeightM != null ? `${data.ceilingHeightM} m` : null,
          },
          { label: t('room.ventilation'), value: ventilationLabel(data.ventilationType) },
          {
            label: t('room.pollutionSources'),
            value: data.pollutionSources.length
              ? data.pollutionSources.map((code) => pollutionLabel(code)).join(', ')
              : null,
          },
        ]}
      />

      <ChildList
        title={t('room.sensorsTitle')}
        emptyText={sensors.isLoading ? t('common.loading') : t('room.noSensors')}
        items={(sensors.data?.items ?? []).map((sensor) => ({
          id: sensor.id,
          to: `/sensors/${sensor.id}`,
          label:
            [sensor.manufacturer, sensor.model].filter(Boolean).join(' ') || t('sensor.title'),
          meta: sensor.measuredParameters.map((p) => p.code).join(', '),
        }))}
      />
    </DetailShell>
  );
}
