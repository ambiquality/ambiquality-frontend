import { Field, NativeSelect } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { MapProperty } from '@/api/public/map-types';

export interface ParameterFilterProps {
  properties: ReadonlyArray<MapProperty>;
  value: string | null;
  onChange: (parameterCode: string) => void;
  isLoading?: boolean;
}

/**
 * Quantity selector that drives the whole map (which quantity's latest values colour the markers).
 * Presentational + controlled: `MapPage` owns the selected code and supplies the catalogue (from
 * `/v1/properties`), so the property list is fetched once. A native `<select>` keeps it fully
 * keyboard- and screen-reader-operable (WCAG) with no extra wiring.
 */
export function ParameterFilter({ properties, value, onChange, isLoading }: ParameterFilterProps) {
  const { t } = useTranslation('map');

  return (
    <Field.Root maxW="sm">
      <Field.Label>{t('filter.label')}</Field.Label>
      <NativeSelect.Root disabled={isLoading}>
        <NativeSelect.Field
          value={value ?? ''}
          aria-label={t('filter.label')}
          onChange={(event) => onChange(event.currentTarget.value)}
        >
          <option value="" disabled>
            {isLoading ? t('filter.loading') : t('filter.placeholder')}
          </option>
          {properties.map((property) => (
            <option key={property.code} value={property.code}>
              {property.label ?? property.code}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  );
}
