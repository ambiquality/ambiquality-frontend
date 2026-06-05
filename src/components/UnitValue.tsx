import { Text, type TextProps } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

/** Non-breaking space — keeps the value and unit together on wrap, e.g. "21.5 °C". */
const NBSP = ' ';

export interface UnitValueProps extends Omit<TextProps, 'children'> {
  /**
   * The **canonical** numeric value as returned by the API (never mutate this). When `null`/
   * `undefined`, a localized placeholder dash is shown.
   */
  value: number | null | undefined;
  /** The canonical unit symbol for `value`, e.g. `°C`, `ppm`, `%`. */
  unit: string;
  /**
   * PHASE-8 SEAM (PER): the user's preferred display unit, if it differs from `unit`.
   *
   * Phase 3 does NOT convert — it only formats `value` + `unit`. When Phase 8 adds QUDT
   * conversion it will: (a) read the logged-in user's preferred unit, (b) convert the canonical
   * `value`→`displayUnit` using a `/v1/properties applicableUnit` factor table, and (c) render
   * the converted number with `displayUnit`. The prop already exists so call sites written now
   * stay source-compatible. Until then, passing `displayUnit` is a no-op (we still show `unit`).
   */
  displayUnit?: string;
  /** Maximum number of fraction digits for locale formatting. */
  fractionDigits?: number;
}

/**
 * Presentation primitive for a measured value + unit (e.g. `21.5 °C`). Formats the number with
 * locale-aware `Intl.NumberFormat` (cs uses a comma decimal separator, en a dot) and appends the
 * unit with a non-breaking space so the value and unit never wrap apart.
 *
 * Display-unit *conversion* is intentionally out of scope here — see the `displayUnit` seam.
 */
export function UnitValue({
  value,
  unit,
  displayUnit: _displayUnit, // Phase-8 seam; deliberately unused in Phase 3.
  fractionDigits,
  ...rest
}: UnitValueProps) {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  if (value == null || Number.isNaN(value)) {
    return (
      <Text as="span" {...rest}>
        {'—'}
      </Text>
    );
  }

  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: fractionDigits ?? 3,
    minimumFractionDigits: fractionDigits,
  }).format(value);

  return (
    <Text as="span" {...rest}>
      {`${formatted}${NBSP}${unit}`}
    </Text>
  );
}
