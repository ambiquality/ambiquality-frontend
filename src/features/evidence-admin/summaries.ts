import { useTranslation } from 'react-i18next';
import type { SummaryRow } from './components';
import { useCodelistOptions, usePropertyOptions } from './codelists';
import type { BuildingSnapshot, RoomSnapshot, SensorSnapshot } from './queries';

/**
 * Shared snapshot→{@link SummaryRow}[] builders so the read-only detail card and the history
 * projection card render identical fields (coded values resolved to their localized codelist
 * label, falling back to the raw code). Keeping these here prevents the two screens drifting.
 */

export function useBuildingSummaryRows(snapshot: BuildingSnapshot): SummaryRow[] {
  const { t } = useTranslation('evidence');
  const buildingTypes = useCodelistOptions('building-type');

  const anonymization = snapshot.anonymizationLevel
    ? t(`anonymizationLevels.${snapshot.anonymizationLevel}`, {
        defaultValue: snapshot.anonymizationLevel,
      })
    : null;

  return [
    { label: t('fields.name'), value: snapshot.name },
    {
      label: t('building.addressTitle'),
      value: `${snapshot.street}, ${snapshot.postcode} ${snapshot.city}, ${snapshot.country}`,
    },
    { label: t('fields.buildingType'), value: buildingTypes.label(snapshot.buildingTypeCode) },
    {
      label: t('building.locationTitle'),
      value:
        snapshot.latitude != null && snapshot.longitude != null
          ? `${snapshot.latitude}, ${snapshot.longitude}`
          : null,
    },
    { label: t('fields.anonymizationLevel'), value: anonymization },
    { label: t('fields.yearBuilt'), value: snapshot.yearBuilt },
    { label: t('fields.yearRenovated'), value: snapshot.yearRenovated },
  ];
}

export function useRoomSummaryRows(snapshot: RoomSnapshot): SummaryRow[] {
  const { t } = useTranslation('evidence');
  const functions = useCodelistOptions('room-function');
  const exposures = useCodelistOptions('exposure');
  const ventilations = useCodelistOptions('ventilation-type');
  const pollutionSources = useCodelistOptions('pollution-source');

  const sources = (snapshot.pollutionSources ?? []).map((code) => pollutionSources.label(code));

  return [
    { label: t('fields.name'), value: snapshot.name },
    { label: t('fields.floor'), value: snapshot.floor },
    {
      label: t('fields.function'),
      value: snapshot.functionCode ? functions.label(snapshot.functionCode) : null,
    },
    {
      label: t('fields.exposure'),
      value: snapshot.exposureCode ? exposures.label(snapshot.exposureCode) : null,
    },
    { label: t('fields.areaM2'), value: snapshot.areaM2 },
    { label: t('fields.ceilingHeightM'), value: snapshot.ceilingHeightM },
    {
      label: t('fields.ventilation'),
      value: snapshot.ventilationType ? ventilations.label(snapshot.ventilationType) : null,
    },
    {
      label: t('room.pollutionSourcesTitle'),
      value: sources.length > 0 ? sources.join(', ') : null,
    },
  ];
}

export function useSensorSummaryRows(snapshot: SensorSnapshot): SummaryRow[] {
  const { t } = useTranslation('evidence');
  const statuses = useCodelistOptions('sensor-status');
  const properties = usePropertyOptions();

  const measured = (snapshot.measuredParameters ?? []).map((p) => properties.label(p.code));

  return [
    { label: t('fields.manufacturer'), value: snapshot.manufacturer },
    { label: t('fields.model'), value: snapshot.model },
    { label: t('fields.serialNumber'), value: snapshot.serialNumber },
    { label: t('fields.status'), value: statuses.label(snapshot.statusCode) },
    {
      label: t('sensor.measuredParametersTitle'),
      value: measured.length > 0 ? measured.join(', ') : null,
    },
  ];
}
