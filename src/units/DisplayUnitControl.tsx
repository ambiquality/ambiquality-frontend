import { Field, SegmentGroup } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { displayUnitOptions, isConvertible } from './conversions';
import { useUnitPreference } from './useUnitPreference';

export interface DisplayUnitControlProps {
  /** The canonical unit to offer display alternatives for (e.g. `°C`). `null` renders nothing. */
  canonicalUnit: string | null;
}

/**
 * Display-unit chooser (PER): a small segmented control letting the user pick how a quantity's
 * values are shown (e.g. °C vs °F). The choice persists per canonical unit and is applied wherever
 * `UnitValue` renders that unit. Conversion is display-only — the underlying canonical data is never
 * changed. Renders nothing for units with no alternatives, so it only appears when it's useful.
 */
export function DisplayUnitControl({ canonicalUnit }: DisplayUnitControlProps) {
  const { t } = useTranslation('map');
  const { displayUnitFor, setDisplayUnit } = useUnitPreference();

  if (!canonicalUnit || !isConvertible(canonicalUnit)) return null;

  const options = displayUnitOptions(canonicalUnit);
  const current = displayUnitFor(canonicalUnit);

  return (
    <Field.Root maxW="3xs">
      <Field.Label>{t('units.label')}</Field.Label>
      <SegmentGroup.Root
        size="sm"
        value={current}
        onValueChange={(e) => e.value && setDisplayUnit(canonicalUnit, e.value)}
        aria-label={t('units.ariaLabel')}
      >
        <SegmentGroup.Indicator />
        {options.map((unit) => (
          <SegmentGroup.Item key={unit} value={unit}>
            <SegmentGroup.ItemText>{unit}</SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
        ))}
      </SegmentGroup.Root>
    </Field.Root>
  );
}
