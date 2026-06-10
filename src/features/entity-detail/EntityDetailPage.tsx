import { useParams } from 'react-router-dom';
import { BuildingDetail } from './BuildingDetail';
import { RoomDetail } from './RoomDetail';
import { SensorDetail } from './SensorDetail';

/**
 * Public per-entity detail page (UC18 click-through target: map dialog → building,
 * then drill-down building → rooms → sensors). The `:id` URL segment is the
 * backend-issued GUID — the same persistent identifier the Public.Api catalog and
 * linked-data IRIs use, so detail URLs are stable and shareable (SYS-03).
 */
export function EntityDetailPage({ kind }: { kind: 'building' | 'room' | 'sensor' }) {
  const { id } = useParams<{ id: string }>();

  switch (kind) {
    case 'building':
      return <BuildingDetail id={id} />;
    case 'room':
      return <RoomDetail id={id} />;
    case 'sensor':
      return <SensorDetail id={id} />;
  }
}
