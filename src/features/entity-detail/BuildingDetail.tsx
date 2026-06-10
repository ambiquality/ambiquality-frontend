import { useTranslation } from 'react-i18next';
import {
  formatPublicAddress,
  useBuildingDetail,
  useBuildingRooms,
} from '@/api/public/entity-hooks';
import { useCodelistScheme } from '@/api/public/hooks';
import { useCodelistLabel } from '@/i18n/codelist-labels';
import { AttributeList, ChildList, DetailShell, DetailStatus } from './components';

/** Public building detail: OFN address, typology, coordinates, years, and its rooms. */
export function BuildingDetail({ id }: { id: string | undefined }) {
  const { t } = useTranslation('entity');
  const building = useBuildingDetail(id);
  const rooms = useBuildingRooms(id);
  const buildingTypes = useCodelistScheme('building-type');
  const roomFunctions = useCodelistScheme('room-function');
  const typeLabel = useCodelistLabel(buildingTypes.data);
  const functionLabel = useCodelistLabel(roomFunctions.data);

  if (!building.data)
    return (
      <DetailShell breadcrumb={[{ label: t('common.map'), to: '/' }]} title={t('building.title')}>
        <DetailStatus isLoading={building.isLoading} isError={building.isError} />
      </DetailShell>
    );

  const data = building.data;
  const title = data.name ?? t('building.title');
  const coordinates =
    data.latitude != null && data.longitude != null
      ? `${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}`
      : null;

  return (
    <DetailShell
      breadcrumb={[{ label: t('common.map'), to: '/' }, { label: title }]}
      title={title}
      subtitle={typeLabel(data.buildingTypeCode)}
    >
      <AttributeList
        rows={[
          { label: t('building.type'), value: typeLabel(data.buildingTypeCode) },
          { label: t('building.address'), value: formatPublicAddress(data.address) },
          { label: t('building.coordinates'), value: coordinates },
          { label: t('building.yearBuilt'), value: data.yearBuilt },
          { label: t('building.yearRenovated'), value: data.yearRenovated },
        ]}
      />

      <ChildList
        title={t('building.roomsTitle')}
        emptyText={rooms.isLoading ? t('common.loading') : t('building.noRooms')}
        items={(rooms.data?.items ?? []).map((room) => ({
          id: room.id,
          to: `/rooms/${room.id}`,
          label: room.name ?? t('room.fallbackName', { floor: String(room.floor) }),
          meta: functionLabel(room.functionCode),
        }))}
      />
    </DetailShell>
  );
}
