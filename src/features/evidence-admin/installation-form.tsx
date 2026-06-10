import { Input, SimpleGrid } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FormField } from '@/components';
import type { components } from '@/api/evidence/schema';
import { optionalPositiveInt, optionalPositiveNumber } from './validation';

type Schemas = components['schemas'];

/**
 * The seven optional F08 installation fields as raw form strings — shared by the register
 * form (SensorNewPage, nested `installation` object) and the temporal edit form
 * (SensorEditPage, `PUT .../installation`). Blank means "not supplied" and maps to `null`.
 */
export interface InstallationFormState {
  positionNote: string;
  distanceWindowM: string;
  distanceDoorM: string;
  distanceSourceM: string;
  measurementFrequencySeconds: string;
  installedOn: string;
  lastCalibratedOn: string;
}

/** Initial form state, optionally prefilled from a snapshot's installation projection. */
export function installationFormState(
  current?: Schemas['SensorInstallationResponse'] | null,
): InstallationFormState {
  return {
    positionNote: current?.positionNote ?? '',
    distanceWindowM: current?.distanceWindowM != null ? String(current.distanceWindowM) : '',
    distanceDoorM: current?.distanceDoorM != null ? String(current.distanceDoorM) : '',
    distanceSourceM: current?.distanceSourceM != null ? String(current.distanceSourceM) : '',
    measurementFrequencySeconds:
      current?.measurementFrequencySeconds != null
        ? String(current.measurementFrequencySeconds)
        : '',
    installedOn: current?.installedOn ?? '',
    lastCalibratedOn: current?.lastCalibratedOn ?? '',
  };
}

/** Maps the form strings to the wire shape; blank fields become `null`. */
export function toInstallationValues(
  state: InstallationFormState,
): Schemas['SensorInstallationRequest'] {
  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  return {
    positionNote: state.positionNote.trim() === '' ? null : state.positionNote.trim(),
    distanceWindowM: num(state.distanceWindowM),
    distanceDoorM: num(state.distanceDoorM),
    distanceSourceM: num(state.distanceSourceM),
    measurementFrequencySeconds: num(state.measurementFrequencySeconds),
    installedOn: state.installedOn === '' ? null : state.installedOn,
    lastCalibratedOn: state.lastCalibratedOn === '' ? null : state.lastCalibratedOn,
  };
}

/** True when at least one field carries a value — register only nests `installation` then. */
export function hasAnyInstallationValue(values: Schemas['SensorInstallationRequest']): boolean {
  return Object.values(values).some((value) => value !== null);
}

/**
 * The seven F08 installation `FormField`s (all optional, each with its DOK-03 hint).
 * Layout: position note full-width, then the three distances, then frequency + the two dates.
 */
export function InstallationFields({
  state,
  onChange,
}: {
  state: InstallationFormState;
  onChange: (patch: Partial<InstallationFormState>) => void;
}) {
  const { t } = useTranslation('evidence');
  const { t: tf } = useTranslation('forms');

  return (
    <>
      <FormField label={t('fields.positionNote')} labelHint={t('fields.positionNoteHint')}>
        <Input
          value={state.positionNote}
          onChange={(e) => onChange({ positionNote: e.target.value })}
        />
      </FormField>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
        <FormField
          label={t('fields.distanceWindowM')}
          labelHint={t('fields.distanceWindowMHint')}
          validate={optionalPositiveNumber(tf('validation.positive'))}
        >
          <Input
            value={state.distanceWindowM}
            onChange={(e) => onChange({ distanceWindowM: e.target.value })}
          />
        </FormField>
        <FormField
          label={t('fields.distanceDoorM')}
          labelHint={t('fields.distanceDoorMHint')}
          validate={optionalPositiveNumber(tf('validation.positive'))}
        >
          <Input
            value={state.distanceDoorM}
            onChange={(e) => onChange({ distanceDoorM: e.target.value })}
          />
        </FormField>
        <FormField
          label={t('fields.distanceSourceM')}
          labelHint={t('fields.distanceSourceMHint')}
          validate={optionalPositiveNumber(tf('validation.positive'))}
        >
          <Input
            value={state.distanceSourceM}
            onChange={(e) => onChange({ distanceSourceM: e.target.value })}
          />
        </FormField>
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
        <FormField
          label={t('fields.measurementFrequencySeconds')}
          labelHint={t('fields.measurementFrequencySecondsHint')}
          validate={optionalPositiveInt(tf('validation.positive'))}
        >
          <Input
            value={state.measurementFrequencySeconds}
            onChange={(e) => onChange({ measurementFrequencySeconds: e.target.value })}
          />
        </FormField>
        <FormField label={t('fields.installedOn')} labelHint={t('fields.installedOnHint')}>
          <Input
            type="date"
            value={state.installedOn}
            onChange={(e) => onChange({ installedOn: e.target.value })}
          />
        </FormField>
        <FormField
          label={t('fields.lastCalibratedOn')}
          labelHint={t('fields.lastCalibratedOnHint')}
        >
          <Input
            type="date"
            value={state.lastCalibratedOn}
            onChange={(e) => onChange({ lastCalibratedOn: e.target.value })}
          />
        </FormField>
      </SimpleGrid>
    </>
  );
}
